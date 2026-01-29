#!/usr/bin/env python3
"""
File Cache Backend

File-based caching for tools that don't need remote storage.
Extracted from the original cache_manager.py for the backend abstraction.
"""

import hashlib
import json
import os
import subprocess
import time
from functools import lru_cache
from pathlib import Path
from typing import Any, Dict, Optional

from .base import AbstractCacheBackend, CacheResult, CacheConfig
from .compression import GzipCompressor
from .decorators import with_error_resilience, with_timing
from .observer import CacheObserver, get_observer


class FileCacheBackend(AbstractCacheBackend):
    """
    File-based cache backend.

    Provides exact-match caching using local JSON files.
    Used for Read, Grep, Glob, Bash tools where remote caching is unnecessary.

    Features:
    - File mtime-based invalidation for Read
    - Git SHA-based invalidation for Grep/Bash
    - Directory mtime for Glob
    - Size limit enforcement
    - Compression support for large entries
    """

    # Tools that this backend handles
    SUPPORTED_TOOLS = {"Read", "Grep", "Glob", "Bash"}

    # Bash commands that are safe to cache
    CACHEABLE_BASH_PATTERNS = [
        "git status",
        "git log",
        "git diff",
        "git show",
        "git branch",
        "ls -",
        "cat ",
        "head ",
        "tail ",
        "wc -",
        "du -",
        "df -",
        "pwd",
        "whoami",
        "uname",
        "env",
        "printenv",
    ]

    def __init__(
        self,
        config: Optional[CacheConfig] = None,
        cache_dir: Optional[Path] = None,
        compressor: Optional[GzipCompressor] = None,
        observer: Optional[CacheObserver] = None
    ):
        """
        Initialize file backend.

        Args:
            config: Cache configuration
            cache_dir: Cache directory (auto-resolved if not provided)
            compressor: Gzip compressor for large entries
            observer: Cache observer for logging
        """
        super().__init__(config or CacheConfig())

        # Resolve cache directory
        if cache_dir is None:
            from .path_resolver import get_cache_dir
            cache_dir = get_cache_dir()

        self.cache_dir = Path(cache_dir)
        self.exact_cache_dir = self.cache_dir / "exact"
        self.exact_cache_dir.mkdir(parents=True, exist_ok=True)

        # Compression
        self.compressor = compressor or GzipCompressor(
            level=self.config.compression_level,
            min_size=self.config.compression_min_size_bytes
        )

        # Observability
        self.observer = observer or get_observer()

    @with_error_resilience(fallback_value=CacheResult(hit=False, key="", provider="file"))
    @with_timing(threshold_ms=50)
    def lookup(
        self,
        tool_name: str,
        tool_input: Dict[str, Any],
        cwd: Optional[str] = None
    ) -> CacheResult:
        """
        Look up cached result.

        Args:
            tool_name: Name of the tool
            tool_input: Tool input parameters
            cwd: Current working directory

        Returns:
            CacheResult with hit status
        """
        if tool_name not in self.SUPPORTED_TOOLS:
            return CacheResult(hit=False, key="", provider="file")

        key = self._generate_key(tool_name, tool_input)
        if not key:
            return CacheResult(hit=False, key="", provider="file")

        cache_file = self.exact_cache_dir / f"{key}.json"
        if not cache_file.exists():
            self.observer.log_miss(tool_name, 0, key)
            return CacheResult(hit=False, key=key, provider="file")

        try:
            with open(cache_file, "rb") as f:
                raw_data = f.read()

            # Decompress if needed
            if self.compressor.is_compressed(raw_data):
                entry = self.compressor.decompress(raw_data)
            else:
                entry = json.loads(raw_data.decode('utf-8'))

            # Check TTL
            age = time.time() - entry.get("timestamp", 0)
            if age > self.config.exact_ttl_seconds:
                cache_file.unlink()
                return CacheResult(hit=False, key=key, provider="file")

            # Validate freshness
            if not self._is_fresh(tool_name, tool_input, entry):
                cache_file.unlink()
                return CacheResult(hit=False, key=key, provider="file")

            result = CacheResult(
                hit=True,
                key=key,
                data=entry.get("output"),
                similarity=1.0,
                cache_type="exact",
                provider="file",
                age_seconds=age
            )

            self.observer.log_hit(tool_name, "file", "exact", 0, key=key)
            return result

        except (json.JSONDecodeError, IOError, ValueError):
            return CacheResult(hit=False, key=key, provider="file")

    @with_error_resilience(fallback_value="")
    @with_timing(threshold_ms=100)
    def store(
        self,
        tool_name: str,
        tool_input: Dict[str, Any],
        tool_output: Any,
        success: bool = True,
        cwd: Optional[str] = None
    ) -> str:
        """
        Store tool result.

        Args:
            tool_name: Name of the tool
            tool_input: Tool input parameters
            tool_output: Tool output to cache
            success: Whether execution succeeded
            cwd: Current working directory

        Returns:
            Cache key used
        """
        if not success or tool_name not in self.SUPPORTED_TOOLS:
            return ""

        key = self._generate_key(tool_name, tool_input)
        if not key:
            return ""

        entry = {
            "tool_name": tool_name,
            "input": tool_input,
            "output": tool_output,
            "timestamp": time.time(),
            "invalidation_data": self._get_invalidation_data(tool_name, tool_input)
        }

        cache_file = self.exact_cache_dir / f"{key}.json"

        # Enforce size limit
        self._enforce_size_limit()

        # Compress if configured and above threshold
        compressed = False
        compression_ratio = 0.0

        if self.config.compression_enabled:
            data, compression_ratio = self.compressor.compress(entry)
            compressed = compression_ratio < 1.0
        else:
            data = json.dumps(entry).encode('utf-8')

        with open(cache_file, "wb") as f:
            f.write(data)

        self.observer.log_store(
            tool_name, "file", 0,
            compressed=compressed,
            compression_ratio=compression_ratio,
            key=key
        )

        return key

    def invalidate(self, key: str) -> bool:
        """Remove cache entry."""
        cache_file = self.exact_cache_dir / f"{key}.json"
        if cache_file.exists():
            cache_file.unlink()
            return True
        return False

    def stats(self) -> Dict[str, Any]:
        """Get cache statistics."""
        entries = list(self.exact_cache_dir.glob("*.json"))
        total_size = sum(f.stat().st_size for f in entries)

        return {
            "provider": "file",
            "entries": len(entries),
            "size_bytes": total_size,
            "size_mb": round(total_size / (1024 * 1024), 2),
            "cache_dir": str(self.exact_cache_dir)
        }

    def cleanup(self) -> int:
        """Remove expired entries."""
        count = 0
        now = time.time()

        for cache_file in self.exact_cache_dir.glob("*.json"):
            try:
                with open(cache_file, "rb") as f:
                    raw_data = f.read()

                if self.compressor.is_compressed(raw_data):
                    entry = self.compressor.decompress(raw_data)
                else:
                    entry = json.loads(raw_data.decode('utf-8'))

                age = now - entry.get("timestamp", 0)
                if age > self.config.exact_ttl_seconds:
                    cache_file.unlink()
                    count += 1

            except (json.JSONDecodeError, IOError, ValueError):
                # Remove corrupted entries
                cache_file.unlink()
                count += 1

        return count

    # === Private Methods ===

    def _generate_key(
        self,
        tool_name: str,
        tool_input: Dict[str, Any]
    ) -> Optional[str]:
        """Generate cache key."""
        try:
            if tool_name == "Read":
                file_path = tool_input.get("file_path", "")
                if not file_path or not os.path.exists(file_path):
                    return None
                mtime = os.path.getmtime(file_path)
                offset = tool_input.get("offset", "")
                limit = tool_input.get("limit", "")
                key_data = f"Read:{file_path}:{mtime}:{offset}:{limit}"

            elif tool_name == "Grep":
                pattern = tool_input.get("pattern", "")
                path = tool_input.get("path", ".")
                git_sha = self._get_git_sha()
                key_data = f"Grep:{pattern}:{path}:{git_sha}:{json.dumps(tool_input, sort_keys=True)}"

            elif tool_name == "Glob":
                pattern = tool_input.get("pattern", "")
                path = tool_input.get("path", ".")
                if os.path.isdir(path):
                    dir_mtime = os.path.getmtime(path)
                else:
                    dir_mtime = time.time()
                key_data = f"Glob:{pattern}:{path}:{dir_mtime}"

            elif tool_name == "Bash":
                command = tool_input.get("command", "")
                if not self._is_cacheable_bash(command):
                    return None
                if command.strip().startswith("git"):
                    git_sha = self._get_git_sha()
                    key_data = f"Bash:{command}:{git_sha}"
                else:
                    key_data = f"Bash:{command}:{int(time.time() / 60)}"

            else:
                return None

            return hashlib.sha256(key_data.encode()).hexdigest()

        except Exception:
            return None

    def _is_cacheable_bash(self, command: str) -> bool:
        """Check if bash command is safe to cache."""
        command = command.strip()
        return any(
            command.startswith(pattern)
            for pattern in self.CACHEABLE_BASH_PATTERNS
        )

    def _get_invalidation_data(
        self,
        tool_name: str,
        tool_input: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Get invalidation metadata."""
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

        return data

    def _is_fresh(
        self,
        tool_name: str,
        tool_input: Dict[str, Any],
        entry: Dict[str, Any]
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

        return True

    @lru_cache(maxsize=1)
    def _get_git_sha(self) -> str:
        """Get current git HEAD SHA."""
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

    def _enforce_size_limit(self) -> None:
        """Remove old entries if size limit exceeded."""
        total_size = 0
        files_with_times = []

        for cache_file in self.exact_cache_dir.glob("*.json"):
            try:
                size = cache_file.stat().st_size
                mtime = cache_file.stat().st_mtime
                total_size += size
                files_with_times.append((mtime, size, cache_file))
            except OSError:
                continue

        total_size_mb = total_size / (1024 * 1024)

        if total_size_mb > self.config.max_cache_size_mb:
            files_with_times.sort()  # Oldest first
            for mtime, size, cache_file in files_with_times:
                if total_size_mb <= self.config.max_cache_size_mb * 0.8:
                    break
                try:
                    cache_file.unlink()
                    total_size_mb -= size / (1024 * 1024)
                except OSError:
                    continue
