#!/usr/bin/env python3
"""
Cache Result Handler

Provides cache integration point for tool results.
Standard priority (150) - runs after core processing.
"""

import sys
import os
import json
import hashlib
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils.base_handler import BaseHandler, HandlerContext, HandlerResult
from utils.safe_decorator import Safe


@Safe
class CacheResultHandler(BaseHandler):
    """Handler that provides cache integration for tool results."""

    name = "cache_result"
    description = "Provides cache integration point for tool results"
    priority = 150  # Standard level

    # Cache configuration
    CACHE_DIR = "result_cache"
    CACHE_ENABLED = True  # Can be controlled via env var
    MAX_CACHE_SIZE_MB = 100

    def should_run(self, context: HandlerContext) -> bool:
        """Run for successful tool completions that are cacheable."""
        if context.event_name != "tool_complete":
            return False

        # Only cache successful results
        if context.event_data.get("status") != "success":
            return False

        # Check if caching is enabled
        if not os.environ.get("ENABLE_TOOL_CACHE", "true").lower() in ("true", "1", "yes"):
            return False

        # Check if tool marked as cacheable
        return context.event_data.get("cacheable", True)

    def run(self, context: HandlerContext) -> HandlerResult:
        """Cache the tool result."""
        event_data = context.event_data

        tool_name = event_data.get("tool_name", "unknown")
        input_data = event_data.get("input", {})
        output_data = event_data.get("output", {})

        # Generate cache key from tool name and input
        cache_key = self._generate_cache_key(tool_name, input_data)

        # Store in cache
        cache_entry = {
            "tool_name": tool_name,
            "input": input_data,
            "output": output_data,
            "timestamp": event_data.get("timestamp", ""),
            "duration": event_data.get("duration", 0),
        }

        try:
            self._store_cache(cache_key, cache_entry)
            return HandlerResult(
                success=True,
                message=f"Result cached: {cache_key[:16]}..."
            )
        except Exception as e:
            return HandlerResult(
                success=True,  # Don't fail on cache error
                message=f"Cache store failed: {e}"
            )

    def _get_cache_dir(self) -> Path:
        """Get cache directory path."""
        cache_dir = Path(__file__).parent.parent / "logs" / self.CACHE_DIR
        cache_dir.mkdir(parents=True, exist_ok=True)
        return cache_dir

    def _generate_cache_key(self, tool_name: str, input_data: dict) -> str:
        """Generate a cache key from tool name and input."""
        content = f"{tool_name}:{json.dumps(input_data, sort_keys=True)}"
        return hashlib.sha256(content.encode()).hexdigest()

    def _store_cache(self, key: str, entry: dict) -> None:
        """Store entry in cache."""
        cache_dir = self._get_cache_dir()
        cache_file = cache_dir / f"{key}.json"

        # Check cache size limit
        self._enforce_cache_limit()

        with open(cache_file, "w") as f:
            json.dump(entry, f, indent=2)

    def _enforce_cache_limit(self) -> None:
        """Remove old cache entries if size limit exceeded."""
        cache_dir = self._get_cache_dir()
        total_size = 0
        files_with_times = []

        for cache_file in cache_dir.glob("*.json"):
            size = cache_file.stat().st_size
            mtime = cache_file.stat().st_mtime
            total_size += size
            files_with_times.append((mtime, size, cache_file))

        # Convert to MB
        total_size_mb = total_size / (1024 * 1024)

        if total_size_mb > self.MAX_CACHE_SIZE_MB:
            # Remove oldest files until under limit
            files_with_times.sort()  # Oldest first
            for mtime, size, cache_file in files_with_times:
                if total_size_mb <= self.MAX_CACHE_SIZE_MB * 0.8:
                    break
                cache_file.unlink()
                total_size_mb -= size / (1024 * 1024)


# Export handler class for auto-discovery
handler_class = CacheResultHandler
