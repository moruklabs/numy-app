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
Hybrid Cache Manager Module (Refactored)

Routes caching operations to appropriate backends:
- WebFetch/WebSearch → Redis (exact) + Qdrant (semantic)
- Read/Grep/Glob/Bash → File backend (unchanged)
- Task (research agents) → File + Qdrant

This module maintains backward compatibility while using the new
backend abstraction layer for better separation of concerns.
"""

import os
import sys
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Dict, List, Optional, Union

from .cache_backends import (
    AbstractCacheBackend,
    CacheResult,
    CacheConfig,
    FileCacheBackend,
    RedisBackend,
    QdrantBackend,
    REDIS_AVAILABLE,
    QDRANT_AVAILABLE,
    get_observer,
    get_cache_dir,
    get_project_id,
)


@dataclass
class HybridCacheConfig:
    """Configuration for hybrid cache manager."""

    # Backend enablement
    enable_file_cache: bool = True
    enable_redis_cache: bool = True
    enable_qdrant_cache: bool = True
    fallback_to_file: bool = True  # Fall back to file on remote errors

    # TTL settings (seconds)
    exact_ttl_seconds: int = 36000  # 10 hours
    semantic_ttl_seconds: int = 18000  # 5 hours
    web_ttl_seconds: int = 1800  # 30 minutes
    agent_ttl_seconds: int = 36000  # 10 hours

    # Semantic settings
    semantic_threshold: float = 0.85

    # Size limits
    max_cache_size_mb: int = 1000  # 1GB

    # Compression
    compression_enabled: bool = True
    compression_level: int = 6
    compression_min_size_bytes: int = 1024


class HybridCacheManager:
    """
    Hybrid cache manager that routes to appropriate backends.

    Routing:
    - WebFetch/WebSearch → Redis (exact) + Qdrant (semantic)
    - Read/Grep/Glob/Bash → File backend
    - Task (cacheable agents) → File + Qdrant

    Maintains backward-compatible API with the old cache_manager.
    """

    # Tools routed to remote (Redis + Qdrant)
    REMOTE_TOOLS = {"WebFetch", "WebSearch"}

    # Tools routed to file backend
    FILE_TOOLS = {"Read", "Grep", "Glob", "Bash"}

    # Task agents that benefit from caching
    CACHEABLE_AGENT_TYPES = {
        "deep-researcher",
        "cli-docs-explorer",
        "claude-code-guide",
        "searcher",
    }

    def __init__(
        self,
        cache_dir: Optional[Path] = None,
        config: Optional[HybridCacheConfig] = None
    ):
        """
        Initialize hybrid cache manager.

        Args:
            cache_dir: Base directory for file cache
            config: Cache configuration
        """
        self.config = config or HybridCacheConfig()
        self.observer = get_observer()

        # Resolve cache directory
        if cache_dir is None:
            cache_dir = get_cache_dir()
        self.cache_dir = Path(cache_dir)

        # Initialize backends (lazy)
        self._file_backend: Optional[FileCacheBackend] = None
        self._redis_backend: Optional[RedisBackend] = None
        self._qdrant_backend: Optional[QdrantBackend] = None

    # === Backend Properties (Lazy Initialization) ===

    @property
    def file_backend(self) -> Optional[FileCacheBackend]:
        """Get file cache backend (lazy init)."""
        if self._file_backend is None and self.config.enable_file_cache:
            backend_config = CacheConfig(
                exact_ttl_seconds=self.config.exact_ttl_seconds,
                semantic_ttl_seconds=self.config.semantic_ttl_seconds,
                compression_enabled=self.config.compression_enabled,
                compression_level=self.config.compression_level,
                compression_min_size_bytes=self.config.compression_min_size_bytes,
                max_cache_size_mb=self.config.max_cache_size_mb,
            )
            self._file_backend = FileCacheBackend(
                config=backend_config,
                cache_dir=self.cache_dir,
                observer=self.observer
            )
        return self._file_backend

    @property
    def redis_backend(self) -> Optional[RedisBackend]:
        """Get Redis backend (lazy init)."""
        if self._redis_backend is None and self.config.enable_redis_cache and REDIS_AVAILABLE:
            backend_config = CacheConfig(
                exact_ttl_seconds=self.config.exact_ttl_seconds,
                web_ttl_seconds=self.config.web_ttl_seconds,
                compression_enabled=self.config.compression_enabled,
                compression_level=self.config.compression_level,
                compression_min_size_bytes=self.config.compression_min_size_bytes,
            )
            self._redis_backend = RedisBackend(
                config=backend_config,
                observer=self.observer
            )
        return self._redis_backend

    @property
    def qdrant_backend(self) -> Optional[QdrantBackend]:
        """Get Qdrant backend (lazy init)."""
        if self._qdrant_backend is None and self.config.enable_qdrant_cache and QDRANT_AVAILABLE:
            backend_config = CacheConfig(
                semantic_ttl_seconds=self.config.semantic_ttl_seconds,
                semantic_threshold=self.config.semantic_threshold,
                compression_enabled=self.config.compression_enabled,
                compression_level=self.config.compression_level,
                compression_min_size_bytes=self.config.compression_min_size_bytes,
            )
            self._qdrant_backend = QdrantBackend(
                config=backend_config,
                similarity_threshold=self.config.semantic_threshold,
                observer=self.observer
            )
        return self._qdrant_backend

    # === Public API (Backward Compatible) ===

    def lookup(
        self,
        tool_name: str,
        tool_input: Dict[str, Any],
        cwd: Optional[str] = None
    ) -> CacheResult:
        """
        Look up cached result for a tool call.

        Routing:
        - WebFetch/WebSearch → Try Redis (exact), then Qdrant (semantic)
        - Read/Grep/Glob/Bash → File backend
        - Task (cacheable) → Try File, then Qdrant

        Args:
            tool_name: Name of the tool
            tool_input: Tool input parameters
            cwd: Current working directory (for project isolation)

        Returns:
            CacheResult with hit status and cached data
        """
        # Route to appropriate backend(s)
        if tool_name in self.REMOTE_TOOLS:
            return self._lookup_remote(tool_name, tool_input, cwd)
        elif tool_name in self.FILE_TOOLS:
            return self._lookup_file(tool_name, tool_input, cwd)
        elif tool_name == "Task":
            return self._lookup_task(tool_name, tool_input, cwd)
        else:
            return CacheResult(hit=False, key="", provider="none")

    def store(
        self,
        tool_name: str,
        tool_input: Dict[str, Any],
        tool_output: Any,
        success: bool = True,
        cwd: Optional[str] = None
    ) -> str:
        """
        Store a tool result in cache.

        Routing follows same logic as lookup.

        Args:
            tool_name: Name of the tool
            tool_input: Tool input parameters
            tool_output: Tool output to cache
            success: Whether the tool execution was successful
            cwd: Current working directory

        Returns:
            Cache key used for storage
        """
        if not success:
            return ""

        # Route to appropriate backend(s)
        if tool_name in self.REMOTE_TOOLS:
            return self._store_remote(tool_name, tool_input, tool_output, cwd)
        elif tool_name in self.FILE_TOOLS:
            return self._store_file(tool_name, tool_input, tool_output, cwd)
        elif tool_name == "Task":
            return self._store_task(tool_name, tool_input, tool_output, cwd)
        else:
            return ""

    def invalidate(self, tool_name: str, tool_input: Dict[str, Any]) -> bool:
        """Invalidate cache entry (delegates to appropriate backend)."""
        if tool_name in self.REMOTE_TOOLS:
            # Invalidate in Redis
            if self.redis_backend and self.redis_backend.is_available:
                key = self.redis_backend._generate_key(tool_name, tool_input)
                return self.redis_backend.invalidate(key)
        elif tool_name in self.FILE_TOOLS:
            if self.file_backend:
                key = self.file_backend._generate_key(tool_name, tool_input)
                if key:
                    return self.file_backend.invalidate(key)
        return False

    def clear(self) -> int:
        """Clear all caches. Returns number of entries removed."""
        count = 0

        # Clear file backend
        if self.file_backend:
            count += self.file_backend.cleanup()

        # Clear Redis (project-specific keys)
        if self.redis_backend and self.redis_backend.is_available:
            count += self.redis_backend.clear_project_cache()

        # Clear Qdrant (project-specific entries)
        if self.qdrant_backend and self.qdrant_backend.is_available:
            count += self.qdrant_backend.clear_project_cache()

        return count

    def stats(self) -> Dict[str, Any]:
        """Get cache statistics from all backends."""
        stats = {
            "project_id": get_project_id(),
            "cache_dir": str(self.cache_dir),
            "backends": {}
        }

        if self.file_backend:
            stats["backends"]["file"] = self.file_backend.stats()

        if self.redis_backend:
            stats["backends"]["redis"] = self.redis_backend.stats()

        if self.qdrant_backend:
            stats["backends"]["qdrant"] = self.qdrant_backend.stats()

        stats["config"] = {
            "file_enabled": self.config.enable_file_cache,
            "redis_enabled": self.config.enable_redis_cache and REDIS_AVAILABLE,
            "qdrant_enabled": self.config.enable_qdrant_cache and QDRANT_AVAILABLE,
            "fallback_to_file": self.config.fallback_to_file,
            "semantic_threshold": self.config.semantic_threshold,
        }

        return stats

    # === Private Routing Methods ===

    def _lookup_remote(
        self,
        tool_name: str,
        tool_input: Dict[str, Any],
        cwd: Optional[str] = None
    ) -> CacheResult:
        """Lookup for remote tools (WebFetch/WebSearch)."""
        # Try Redis exact match first
        if self.redis_backend and self.redis_backend.is_available:
            result = self.redis_backend.lookup(tool_name, tool_input, cwd)
            if result.hit:
                return result

        # Try Qdrant semantic match
        if self.qdrant_backend and self.qdrant_backend.is_available:
            result = self.qdrant_backend.lookup(tool_name, tool_input, cwd)
            if result.hit:
                return result

        # Fallback to file cache if remote unavailable
        if self.config.fallback_to_file and self.file_backend:
            if not (self.redis_backend and self.redis_backend.is_available):
                result = self.file_backend.lookup(tool_name, tool_input, cwd)
                if result.hit:
                    result.provider = "file_fallback"
                    return result

        return CacheResult(hit=False, key="", provider="miss")

    def _lookup_file(
        self,
        tool_name: str,
        tool_input: Dict[str, Any],
        cwd: Optional[str] = None
    ) -> CacheResult:
        """Lookup for file-based tools (Read/Grep/Glob/Bash)."""
        if self.file_backend:
            return self.file_backend.lookup(tool_name, tool_input, cwd)
        return CacheResult(hit=False, key="", provider="miss")

    def _lookup_task(
        self,
        tool_name: str,
        tool_input: Dict[str, Any],
        cwd: Optional[str] = None
    ) -> CacheResult:
        """Lookup for Task tool (research agents only)."""
        subagent_type = tool_input.get("subagent_type", "")
        if subagent_type not in self.CACHEABLE_AGENT_TYPES:
            return CacheResult(hit=False, key="", provider="skip")

        # Try Qdrant semantic match first (agent prompts are semantic)
        if self.qdrant_backend and self.qdrant_backend.is_available:
            result = self.qdrant_backend.lookup(tool_name, tool_input, cwd)
            if result.hit:
                return result

        # Fallback to file backend
        if self.file_backend:
            return self.file_backend.lookup(tool_name, tool_input, cwd)

        return CacheResult(hit=False, key="", provider="miss")

    def _store_remote(
        self,
        tool_name: str,
        tool_input: Dict[str, Any],
        tool_output: Any,
        cwd: Optional[str] = None
    ) -> str:
        """Store for remote tools (WebFetch/WebSearch)."""
        keys = []

        # Store in Redis (exact)
        if self.redis_backend and self.redis_backend.is_available:
            key = self.redis_backend.store(tool_name, tool_input, tool_output, True, cwd)
            if key:
                keys.append(key)

        # Store in Qdrant (semantic)
        if self.qdrant_backend and self.qdrant_backend.is_available:
            key = self.qdrant_backend.store(tool_name, tool_input, tool_output, True, cwd)
            if key:
                keys.append(key)

        # Fallback to file cache if remote unavailable
        if not keys and self.config.fallback_to_file and self.file_backend:
            key = self.file_backend.store(tool_name, tool_input, tool_output, True, cwd)
            if key:
                keys.append(key)

        return keys[0] if keys else ""

    def _store_file(
        self,
        tool_name: str,
        tool_input: Dict[str, Any],
        tool_output: Any,
        cwd: Optional[str] = None
    ) -> str:
        """Store for file-based tools (Read/Grep/Glob/Bash)."""
        if self.file_backend:
            return self.file_backend.store(tool_name, tool_input, tool_output, True, cwd)
        return ""

    def _store_task(
        self,
        tool_name: str,
        tool_input: Dict[str, Any],
        tool_output: Any,
        cwd: Optional[str] = None
    ) -> str:
        """Store for Task tool (research agents only)."""
        subagent_type = tool_input.get("subagent_type", "")
        if subagent_type not in self.CACHEABLE_AGENT_TYPES:
            return ""

        keys = []

        # Store in Qdrant (semantic)
        if self.qdrant_backend and self.qdrant_backend.is_available:
            key = self.qdrant_backend.store(tool_name, tool_input, tool_output, True, cwd)
            if key:
                keys.append(key)

        # Also store in file backend
        if self.file_backend:
            key = self.file_backend.store(tool_name, tool_input, tool_output, True, cwd)
            if key:
                keys.append(key)

        return keys[0] if keys else ""

    def close(self) -> None:
        """Close all backend connections."""
        if self._redis_backend:
            self._redis_backend.close()
        if self._qdrant_backend:
            self._qdrant_backend.close()


# === Singleton Pattern ===

_cache_manager: Optional[HybridCacheManager] = None


def get_cache_manager() -> HybridCacheManager:
    """Get or create the singleton cache manager."""
    global _cache_manager
    if _cache_manager is None:
        _cache_manager = HybridCacheManager()
    return _cache_manager


def reset_cache_manager() -> None:
    """Reset the singleton (useful for testing)."""
    global _cache_manager
    if _cache_manager is not None:
        _cache_manager.close()
        _cache_manager = None
