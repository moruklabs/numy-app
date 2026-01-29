#!/usr/bin/env python3
# /// script
# requires-python = ">=3.11"
# dependencies = [
#     "sentence-transformers>=2.2.0",
#     "numpy>=1.24.0",
#     "redis>=5.0.0",
#     "qdrant-client>=1.12.0",
# ]
# ///
"""
Cache Lookup Handler

Checks hybrid cache (exact + semantic) before tool execution.
Returns cached results to avoid redundant tool calls and save tokens.

Backend Routing:
- WebFetch/WebSearch → Redis (exact) + Qdrant (semantic)
- Read/Grep/Glob/Bash → File backend
- Task (research agents) → File + Qdrant

Priority: 5 (very early) - runs before other handlers to short-circuit operations.
"""

import sys
import os
import json

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils.base_handler import BaseHandler, HandlerContext, HandlerResult
from utils.safe_decorator import Safe


@Safe
class CacheLookupHandler(BaseHandler):
    """
    Handler that checks cache before tool execution.

    Uses hybrid caching with backend routing:
    - WebFetch/WebSearch → Redis (exact) + Qdrant (semantic)
    - Read/Grep/Glob/Bash → File backend
    - Task (research agents) → File + Qdrant
    """

    name = "cache_lookup"
    description = "Checks hybrid cache (Redis+Qdrant+File) to avoid redundant tool calls"
    priority = 5  # Very early - short-circuit before other processing

    # Configuration via environment variables
    CACHE_ENABLED_VAR = "ENABLE_TOOL_CACHE"

    # Tools that support caching
    CACHEABLE_TOOLS = {"WebFetch", "WebSearch", "Read", "Grep", "Glob", "Bash", "Task"}

    # Only documentation/research agents should be cached
    CACHEABLE_AGENT_TYPES = {
        "deep-researcher",
        "cli-docs-explorer",
        "claude-code-guide",
        "searcher",
    }

    def should_run(self, context: HandlerContext) -> bool:
        """Run for cacheable tools when caching is enabled."""
        # Check if caching is enabled
        if not self._is_cache_enabled():
            return False

        tool_name = context.event_data.get("tool_name", "")
        tool_input = context.event_data.get("tool_input", {})

        # Check if tool is cacheable
        if tool_name not in self.CACHEABLE_TOOLS:
            return False

        # For Task, only cache documentation/research agents
        if tool_name == "Task":
            subagent_type = tool_input.get("subagent_type", "")
            return subagent_type in self.CACHEABLE_AGENT_TYPES

        # For Bash, only cache read-only commands
        if tool_name == "Bash" and not self._is_cacheable_bash(tool_input):
            return False

        return True

    def run(self, context: HandlerContext) -> HandlerResult:
        """Check cache and return cached result if available."""
        tool_name = context.event_data.get("tool_name", "")
        tool_input = context.event_data.get("tool_input", {})
        cwd = context.event_data.get("cwd")

        try:
            from utils.cache_manager import get_cache_manager

            cache_manager = get_cache_manager()
            result = cache_manager.lookup(tool_name, tool_input, cwd)

            if not result.hit:
                # Cache miss - let tool execute normally
                # Store tool info for PostToolUse to cache the result
                context.shared_state["cache_key"] = result.key
                context.shared_state["should_cache"] = True
                return HandlerResult(success=True)

            # Cache HIT! Return cached result
            output = {
                "cached": True,
                "cache_type": result.cache_type,
                "provider": result.provider,
                "similarity": result.similarity,
                "age_seconds": result.age_seconds,
                "tool_name": tool_name,
                "result": result.data
            }

            # Log cache hit
            provider_info = f" via {result.provider}" if result.provider else ""
            hit_type = "exact" if result.cache_type == "exact" else f"semantic ({result.similarity:.2f})"
            message = f"Cache {hit_type}{provider_info} for {tool_name} (age: {result.age_seconds:.1f}s)"

            return HandlerResult(
                success=True,
                block=True,  # CRITICAL: Prevent actual tool execution
                message=message,
                stdout=json.dumps(output)  # Return cached result to Claude
            )

        except ImportError as e:
            # Dependencies not installed - fall back to exact caching only
            return self._fallback_exact_lookup(tool_name, tool_input)

        except Exception as e:
            # Don't let cache errors break tool execution
            return HandlerResult(
                success=True,
                message=f"Cache lookup error: {e}"
            )

    def _fallback_exact_lookup(
        self,
        tool_name: str,
        tool_input: dict
    ) -> HandlerResult:
        """Fallback to exact-only cache lookup when semantic dependencies unavailable."""
        import hashlib
        import time
        from pathlib import Path

        try:
            from utils.path_utils import get_logs_dir

            cache_dir = get_logs_dir() / "tool_cache" / "exact"

            # Generate exact cache key
            key = self._generate_exact_key(tool_name, tool_input)
            if not key:
                return HandlerResult(success=True)

            cache_file = cache_dir / f"{key}.json"
            if not cache_file.exists():
                return HandlerResult(success=True)

            with open(cache_file, "r") as f:
                entry = json.load(f)

            # Check TTL (1 hour)
            age = time.time() - entry.get("timestamp", 0)
            if age > 3600:
                cache_file.unlink()
                return HandlerResult(success=True)

            # Validate freshness
            if not self._is_cache_fresh(tool_name, tool_input, entry):
                cache_file.unlink()
                return HandlerResult(success=True)

            # Cache hit
            output = {
                "cached": True,
                "cache_type": "exact",
                "similarity": 1.0,
                "age_seconds": age,
                "tool_name": tool_name,
                "result": entry.get("output")
            }

            return HandlerResult(
                success=True,
                block=True,
                message=f"Cache hit (exact) for {tool_name} (age: {age:.1f}s)",
                stdout=json.dumps(output)
            )

        except Exception:
            return HandlerResult(success=True)

    def _generate_exact_key(self, tool_name: str, tool_input: dict) -> str:
        """Generate exact cache key."""
        import hashlib
        import subprocess

        try:
            if tool_name == "Read":
                file_path = tool_input.get("file_path", "")
                if not file_path or not os.path.exists(file_path):
                    return ""
                mtime = os.path.getmtime(file_path)
                offset = tool_input.get("offset", "")
                limit = tool_input.get("limit", "")
                key_data = f"Read:{file_path}:{mtime}:{offset}:{limit}"

            elif tool_name == "Glob":
                pattern = tool_input.get("pattern", "")
                path = tool_input.get("path", ".")
                if os.path.isdir(path):
                    dir_mtime = os.path.getmtime(path)
                else:
                    return ""
                key_data = f"Glob:{pattern}:{path}:{dir_mtime}"

            elif tool_name == "Bash":
                command = tool_input.get("command", "")
                if command.strip().startswith("git"):
                    git_sha = self._get_git_sha()
                    key_data = f"Bash:{command}:{git_sha}"
                else:
                    key_data = f"Bash:{command}:{int(time.time() / 60)}"

            elif tool_name == "Grep":
                pattern = tool_input.get("pattern", "")
                path = tool_input.get("path", ".")
                git_sha = self._get_git_sha()
                key_data = f"Grep:{json.dumps(tool_input, sort_keys=True)}:{git_sha}"

            elif tool_name == "WebFetch":
                url = tool_input.get("url", "")
                prompt = tool_input.get("prompt", "")
                if not url:
                    return ""
                time_bucket = int(time.time() / 1800)  # 30-min buckets
                key_data = f"WebFetch:{url}:{prompt}:{time_bucket}"

            elif tool_name == "WebSearch":
                query = tool_input.get("query", "")
                if not query:
                    return ""
                time_bucket = int(time.time() / 1800)
                domains = str(tool_input.get("allowed_domains", []))
                key_data = f"WebSearch:{query}:{domains}:{time_bucket}"

            elif tool_name == "Task":
                subagent_type = tool_input.get("subagent_type", "")
                if subagent_type not in self.CACHEABLE_AGENT_TYPES:
                    return ""
                prompt = tool_input.get("prompt", "")
                description = tool_input.get("description", "")
                key_data = f"Task:{subagent_type}:{prompt}:{description}"

            else:
                return ""

            return hashlib.sha256(key_data.encode()).hexdigest()

        except Exception:
            return ""

    def _get_git_sha(self) -> str:
        """Get current git HEAD SHA."""
        import subprocess
        try:
            result = subprocess.run(
                ["git", "rev-parse", "HEAD"],
                capture_output=True,
                text=True,
                timeout=2
            )
            if result.returncode == 0:
                return result.stdout.strip()[:12]
        except Exception:
            pass
        return str(int(time.time() / 60))

    def _is_cache_fresh(
        self,
        tool_name: str,
        tool_input: dict,
        entry: dict
    ) -> bool:
        """Check if cache entry is still valid."""
        invalidation_data = entry.get("invalidation_data", {})

        if tool_name == "Read":
            file_path = tool_input.get("file_path", "")
            if not file_path or not os.path.exists(file_path):
                return False
            current_mtime = os.path.getmtime(file_path)
            cached_mtime = invalidation_data.get("file_mtime")
            return current_mtime == cached_mtime

        elif tool_name in ("Grep", "Bash"):
            current_sha = self._get_git_sha()
            cached_sha = invalidation_data.get("git_sha")
            return current_sha == cached_sha

        elif tool_name == "Glob":
            path = tool_input.get("path", ".")
            if not os.path.isdir(path):
                return False
            current_mtime = os.path.getmtime(path)
            cached_mtime = invalidation_data.get("dir_mtime")
            return current_mtime == cached_mtime

        elif tool_name in ("WebFetch", "WebSearch"):
            # Check time bucket (30-min windows)
            current_bucket = int(time.time() / 1800)
            cached_bucket = invalidation_data.get("time_bucket", 0)
            return current_bucket == cached_bucket

        elif tool_name == "Task":
            # Check time bucket (1-hour windows)
            current_bucket = int(time.time() / 3600)
            cached_bucket = invalidation_data.get("time_bucket", 0)
            return current_bucket == cached_bucket

        return True

    def _is_cacheable_bash(self, tool_input: dict) -> bool:
        """Check if bash command is safe to cache."""
        command = tool_input.get("command", "").strip()
        cacheable_patterns = [
            "git log", "git diff", "git status", "git show", "git branch",
            "git rev-parse", "git describe", "git tag",
            "ls ", "cat ", "head ", "tail ", "find ", "which ", "type ",
            "wc ", "stat ", "file ", "du ", "df ",
            "echo ", "printf ", "date ", "pwd", "env", "printenv",
            "npm list", "pip list", "uv pip list",
        ]
        return any(command.startswith(p) for p in cacheable_patterns)

    def _is_cache_enabled(self) -> bool:
        """Check if caching is enabled via environment."""
        return os.environ.get(
            self.CACHE_ENABLED_VAR, "true"
        ).lower() in ("true", "1", "yes")


# Required for imports when running standalone
import time

# Export handler class for auto-discovery
handler_class = CacheLookupHandler
