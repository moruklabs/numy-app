#!/usr/bin/env python3
"""
Base Cache Backend Abstractions

Defines the contract for all cache backends (file, Redis, Qdrant).
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any, Dict, Optional
from pathlib import Path


@dataclass
class CacheResult:
    """Result from cache lookup operation."""
    hit: bool
    key: str
    data: Optional[Dict[str, Any]] = None
    similarity: float = 1.0
    cache_type: str = "miss"  # "exact", "semantic", or "miss"
    provider: str = "none"  # "redis", "qdrant", "file", "fallback"
    age_seconds: float = 0.0
    compressed: bool = False
    compression_ratio: float = 0.0


@dataclass
class CacheConfig:
    """Cache configuration settings."""
    # Global settings
    enabled: bool = True

    # Exact cache settings
    enable_exact: bool = True
    exact_ttl_seconds: int = 36000  # 10 hours

    # Semantic cache settings
    enable_semantic: bool = True
    semantic_ttl_seconds: int = 18000  # 5 hours
    semantic_threshold: float = 0.85

    # Web content settings
    web_ttl_seconds: int = 1800  # 30 minutes

    # Agent settings
    agent_ttl_seconds: int = 36000  # 10 hours

    # Size limits
    max_cache_size_mb: int = 1000000  # 1GB
    max_output_size_kb: int = 500  # 500KB per entry

    # Compression settings
    compression_enabled: bool = True
    compression_level: int = 6  # gzip level 1-9
    compression_min_size_bytes: int = 1024  # Only compress if > 1KB

    # Backend settings
    fallback_to_file: bool = True  # Auto-fallback on errors

    # Redis settings
    redis_host: str = "localhost"
    redis_port: int = 6379
    redis_db: int = 0
    redis_password: Optional[str] = None
    redis_timeout: int = 5

    # Qdrant settings
    qdrant_host: str = "localhost"
    qdrant_port: int = 6333
    qdrant_grpc_port: int = 6334
    qdrant_collection: str = "claude_cache_semantic"
    qdrant_timeout: int = 10

    # Observability settings
    log_hits: bool = True
    log_misses: bool = True
    log_provider: bool = True


class AbstractCacheBackend(ABC):
    """
    Abstract base class for cache backends.

    All backends must implement:
    - lookup(): Check if entry exists in cache
    - store(): Store entry in cache
    - invalidate(): Remove entry from cache
    - stats(): Return cache statistics
    """

    def __init__(self, config: CacheConfig):
        """Initialize backend with configuration."""
        self.config = config

    @abstractmethod
    def lookup(
        self,
        tool_name: str,
        tool_input: Dict[str, Any],
        cwd: Optional[str] = None
    ) -> CacheResult:
        """
        Look up cached result for tool invocation.

        Args:
            tool_name: Name of the tool (e.g., "WebFetch")
            tool_input: Tool input parameters
            cwd: Current working directory (for project-aware caching)

        Returns:
            CacheResult with hit=True if found, hit=False otherwise
        """
        pass

    @abstractmethod
    def store(
        self,
        tool_name: str,
        tool_input: Dict[str, Any],
        tool_output: Any,
        success: bool = True,
        cwd: Optional[str] = None
    ) -> str:
        """
        Store tool result in cache.

        Args:
            tool_name: Name of the tool
            tool_input: Tool input parameters
            tool_output: Tool output to cache
            success: Whether tool execution succeeded
            cwd: Current working directory

        Returns:
            Cache key that was used for storage
        """
        pass

    @abstractmethod
    def invalidate(self, key: str) -> bool:
        """
        Invalidate (remove) specific cache entry.

        Args:
            key: Cache key to invalidate

        Returns:
            True if entry was removed, False if not found
        """
        pass

    @abstractmethod
    def stats(self) -> Dict[str, Any]:
        """
        Return cache statistics.

        Returns:
            Dictionary with cache metrics (hits, misses, size, etc.)
        """
        pass

    def cleanup(self) -> int:
        """
        Clean up expired entries (optional).

        Returns:
            Number of entries removed
        """
        return 0
