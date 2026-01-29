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
Cache Store Handler

Stores tool results in hybrid cache after execution.
Works with cache_lookup.py to provide full caching lifecycle.

Backend Routing:
- WebFetch/WebSearch → Redis (exact) + Qdrant (semantic)
- Read/Grep/Glob/Bash → File backend
- Task (research agents) → File + Qdrant

Priority: 150 (standard) - runs after core processing.
"""

import sys
import os
import json
import time

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils.base_handler import BaseHandler, HandlerContext, HandlerResult
from utils.safe_decorator import Safe


@Safe
class CacheStoreHandler(BaseHandler):
    """
    Handler that stores tool results in hybrid cache.

    Backend Routing:
    - WebFetch/WebSearch → Redis (exact) + Qdrant (semantic)
    - Read/Grep/Glob/Bash → File backend
    - Task (research agents) → File + Qdrant
    """

    name = "cache_store"
    description = "Stores tool results in hybrid cache (Redis+Qdrant+File)"
    priority = 150  # Standard level - after core processing

    # Configuration
    CACHE_ENABLED_VAR = "ENABLE_TOOL_CACHE"
    MAX_OUTPUT_SIZE = 500_000  # Don't cache outputs larger than 500KB

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
        if tool_name == "Bash" and not self._is_cacheable_bash(tool_input.get("command", "")):
            return False

        return True

    def run(self, context: HandlerContext) -> HandlerResult:
        """Store tool result in cache."""
        tool_name = context.event_data.get("tool_name", "")
        tool_input = context.event_data.get("tool_input", {})
        tool_output = context.event_data.get("tool_output", "")
        cwd = context.event_data.get("cwd")

        # Check if output is too large to cache
        output_size = len(str(tool_output)) if tool_output else 0
        if output_size > self.MAX_OUTPUT_SIZE:
            return HandlerResult(
                success=True,
                message=f"Output too large to cache: {output_size} bytes"
            )

        try:
            from utils.cache_manager import get_cache_manager

            cache_manager = get_cache_manager()
            cache_key = cache_manager.store(
                tool_name=tool_name,
                tool_input=tool_input,
                tool_output=tool_output,
                success=True,
                cwd=cwd
            )

            if cache_key:
                return HandlerResult(
                    success=True,
                    message=f"Cached {tool_name} result: {cache_key[:16]}..."
                )
            else:
                return HandlerResult(success=True)

        except ImportError:
            # Dependencies not installed - fall back to exact caching only
            return self._fallback_exact_store(tool_name, tool_input, tool_output)

        except Exception as e:
            # Don't let cache errors break processing
            return HandlerResult(
                success=True,
                message=f"Cache store error: {e}"
            )

    def _fallback_exact_store(
        self,
        tool_name: str,
        tool_input: dict,
        tool_output: str
    ) -> HandlerResult:
        """Fallback to exact-only caching when semantic dependencies unavailable."""
        import hashlib
        from pathlib import Path

        try:
            from utils.path_utils import get_logs_dir

            cache_dir = get_logs_dir() / "tool_cache" / "exact"
            cache_dir.mkdir(parents=True, exist_ok=True)

            # Generate cache key
            key = self._generate_exact_key(tool_name, tool_input)
            if not key:
                return HandlerResult(success=True)

            # Build cache entry
            entry = {
                "tool_name": tool_name,
                "input": tool_input,
                "output": tool_output,
                "timestamp": time.time(),
                "invalidation_data": self._get_invalidation_data(tool_name, tool_input)
            }

            # Enforce cache size limit
            self._enforce_cache_limit(cache_dir)

            # Store
            cache_file = cache_dir / f"{key}.json"
            with open(cache_file, "w") as f:
                json.dump(entry, f)

            return HandlerResult(
                success=True,
                message=f"Cached (exact) {tool_name}: {key[:16]}..."
            )

        except Exception as e:
            return HandlerResult(
                success=True,
                message=f"Fallback cache error: {e}"
            )

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

    def _get_invalidation_data(
        self,
        tool_name: str,
        tool_input: dict
    ) -> dict:
        """Get invalidation metadata for cache entry."""
        data = {}

        if tool_name == "Read":
            file_path = tool_input.get("file_path", "")
            if file_path and os.path.exists(file_path):
                data["file_mtime"] = os.path.getmtime(file_path)

        elif tool_name in ("Grep", "Bash"):
            data["git_sha"] = self._get_git_sha()

        elif tool_name == "Glob":
            path = tool_input.get("path", ".")
            if os.path.isdir(path):
                data["dir_mtime"] = os.path.getmtime(path)

        elif tool_name in ("WebFetch", "WebSearch"):
            # Time-based invalidation for web content (30-min buckets)
            data["time_bucket"] = int(time.time() / 1800)

        elif tool_name == "Task":
            # Time-based invalidation for agent results (1-hour buckets)
            data["time_bucket"] = int(time.time() / 3600)

        return data

    def _enforce_cache_limit(self, cache_dir, max_size_mb: int = 100) -> None:
        """Remove old cache entries if size limit exceeded."""
        from pathlib import Path

        total_size = 0
        files_with_times = []

        for cache_file in Path(cache_dir).glob("*.json"):
            try:
                size = cache_file.stat().st_size
                mtime = cache_file.stat().st_mtime
                total_size += size
                files_with_times.append((mtime, size, cache_file))
            except OSError:
                continue

        total_size_mb = total_size / (1024 * 1024)

        if total_size_mb > max_size_mb:
            files_with_times.sort()  # Oldest first
            for mtime, size, cache_file in files_with_times:
                if total_size_mb <= max_size_mb * 0.8:
                    break
                try:
                    cache_file.unlink()
                    total_size_mb -= size / (1024 * 1024)
                except OSError:
                    continue

    def _is_cacheable_bash(self, command: str) -> bool:
        """Check if bash command is safe to cache."""
        command = command.strip()
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


# Export handler class for auto-discovery
handler_class = CacheStoreHandler
