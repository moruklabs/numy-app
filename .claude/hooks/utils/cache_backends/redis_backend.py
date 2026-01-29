#!/usr/bin/env python3
"""
Redis Cache Backend

Redis-based caching for WebFetch/WebSearch tools.
Provides fast key-value exact match caching with TTL support.
"""

import hashlib
import json
import time
from typing import Any, Dict, Optional

from .base import AbstractCacheBackend, CacheResult, CacheConfig
from .compression import GzipCompressor
from .decorators import with_error_resilience, with_timing, with_retry
from .observer import CacheObserver, get_observer
from .path_resolver import get_project_id

# Try to import redis
try:
    import redis
    from redis.exceptions import RedisError, ConnectionError as RedisConnectionError
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False
    redis = None
    RedisError = Exception
    RedisConnectionError = Exception


class RedisBackend(AbstractCacheBackend):
    """
    Redis-based cache backend for web content.

    Features:
    - Fast key-value lookups
    - Native TTL support
    - Connection pooling
    - Gzip compression for large entries
    - Project-aware keys to prevent collisions
    - Automatic fallback on connection errors

    Key format: cache:{project_hash}:exact:{tool}:{input_hash}
    """

    # Tools that this backend handles
    SUPPORTED_TOOLS = {"WebFetch", "WebSearch"}

    def __init__(
        self,
        config: Optional[CacheConfig] = None,
        host: str = "localhost",
        port: int = 6379,
        db: int = 0,
        password: Optional[str] = None,
        timeout: int = 5,
        max_connections: int = 10,
        compressor: Optional[GzipCompressor] = None,
        observer: Optional[CacheObserver] = None
    ):
        """
        Initialize Redis backend.

        Args:
            config: Cache configuration
            host: Redis host
            port: Redis port
            db: Redis database number
            password: Redis password (optional)
            timeout: Connection timeout in seconds
            max_connections: Maximum connections in pool
            compressor: Gzip compressor for large entries
            observer: Cache observer for logging
        """
        super().__init__(config or CacheConfig())

        self.host = host
        self.port = port
        self.db = db
        self.password = password
        self.timeout = timeout
        self.max_connections = max_connections

        # Compression
        self.compressor = compressor or GzipCompressor(
            level=self.config.compression_level,
            min_size=self.config.compression_min_size_bytes
        )

        # Observability
        self.observer = observer or get_observer()

        # Connection pool (lazy-initialized)
        self._pool = None
        self._client = None

    @property
    def client(self) -> Optional['redis.Redis']:
        """Get Redis client (lazy initialization)."""
        if not REDIS_AVAILABLE:
            return None

        if self._client is None:
            try:
                self._pool = redis.ConnectionPool(
                    host=self.host,
                    port=self.port,
                    db=self.db,
                    password=self.password,
                    socket_timeout=self.timeout,
                    socket_connect_timeout=self.timeout,
                    max_connections=self.max_connections,
                    decode_responses=False  # We handle bytes for compression
                )
                self._client = redis.Redis(connection_pool=self._pool)
                # Test connection
                self._client.ping()
            except Exception as e:
                self.observer.log_error("connect", "Redis", e)
                self._client = None
                return None

        return self._client

    @property
    def is_available(self) -> bool:
        """Check if Redis is available."""
        if not REDIS_AVAILABLE:
            return False
        try:
            client = self.client
            return client is not None and client.ping()
        except Exception:
            return False

    @with_error_resilience(fallback_value=CacheResult(hit=False, key="", provider="redis"))
    @with_timing(threshold_ms=50)
    def lookup(
        self,
        tool_name: str,
        tool_input: Dict[str, Any],
        cwd: Optional[str] = None
    ) -> CacheResult:
        """
        Look up cached result in Redis.

        Args:
            tool_name: Name of the tool
            tool_input: Tool input parameters
            cwd: Current working directory

        Returns:
            CacheResult with hit status
        """
        if tool_name not in self.SUPPORTED_TOOLS:
            return CacheResult(hit=False, key="", provider="redis")

        client = self.client
        if client is None:
            return CacheResult(hit=False, key="", provider="redis")

        start_time = time.time()
        key = self._generate_key(tool_name, tool_input, cwd)

        try:
            data = client.get(key)
            latency_ms = (time.time() - start_time) * 1000

            if data is None:
                self.observer.log_miss(tool_name, latency_ms, key)
                return CacheResult(hit=False, key=key, provider="redis")

            # Decompress if needed
            if self.compressor.is_compressed(data):
                entry = self.compressor.decompress(data)
            else:
                entry = json.loads(data.decode('utf-8'))

            # Calculate age
            age = time.time() - entry.get("timestamp", time.time())

            result = CacheResult(
                hit=True,
                key=key,
                data=entry.get("output"),
                similarity=1.0,
                cache_type="exact",
                provider="redis",
                age_seconds=age,
                compressed=self.compressor.is_compressed(data),
                compression_ratio=entry.get("compression_ratio", 0.0)
            )

            self.observer.log_hit(tool_name, "redis", "exact", latency_ms, key=key)
            return result

        except (RedisError, json.JSONDecodeError, ValueError) as e:
            latency_ms = (time.time() - start_time) * 1000
            self.observer.log_error("lookup", tool_name, e, latency_ms)
            return CacheResult(hit=False, key=key, provider="redis")

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
        Store tool result in Redis.

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

        client = self.client
        if client is None:
            return ""

        start_time = time.time()
        key = self._generate_key(tool_name, tool_input, cwd)

        # Determine TTL
        ttl = self._get_ttl(tool_name)

        try:
            entry = {
                "tool_name": tool_name,
                "input": tool_input,
                "output": tool_output,
                "timestamp": time.time(),
                "compression_ratio": 0.0
            }

            # Compress if configured
            compressed = False
            compression_ratio = 0.0

            if self.config.compression_enabled:
                data, compression_ratio = self.compressor.compress(entry)
                compressed = compression_ratio < 1.0
                entry["compression_ratio"] = compression_ratio
                # Re-compress with updated ratio
                if compressed:
                    data, _ = self.compressor.compress(entry)
            else:
                data = json.dumps(entry).encode('utf-8')

            # Store with TTL
            client.setex(key, ttl, data)

            latency_ms = (time.time() - start_time) * 1000
            self.observer.log_store(
                tool_name, "redis", latency_ms,
                compressed=compressed,
                compression_ratio=compression_ratio,
                key=key
            )

            return key

        except RedisError as e:
            latency_ms = (time.time() - start_time) * 1000
            self.observer.log_error("store", tool_name, e, latency_ms)
            return ""

    def invalidate(self, key: str) -> bool:
        """Remove cache entry."""
        client = self.client
        if client is None:
            return False

        try:
            return client.delete(key) > 0
        except RedisError:
            return False

    def stats(self) -> Dict[str, Any]:
        """Get cache statistics."""
        client = self.client
        if client is None:
            return {
                "provider": "redis",
                "available": False,
                "error": "Redis not connected"
            }

        try:
            info = client.info("memory")
            keyspace = client.info("keyspace")

            # Count our cache keys
            project_id = get_project_id()
            pattern = f"cache:{project_id}:*"
            keys = list(client.scan_iter(match=pattern, count=100))

            return {
                "provider": "redis",
                "available": True,
                "host": self.host,
                "port": self.port,
                "db": self.db,
                "cache_keys": len(keys),
                "used_memory_mb": round(info.get("used_memory", 0) / (1024 * 1024), 2),
                "keyspace": keyspace
            }

        except RedisError as e:
            return {
                "provider": "redis",
                "available": False,
                "error": str(e)
            }

    def cleanup(self) -> int:
        """
        Clean up expired entries.

        Note: Redis handles TTL automatically, so this just returns 0.
        Could be extended to clean up orphaned entries.
        """
        return 0

    def clear_project_cache(self, project_id: Optional[str] = None) -> int:
        """
        Clear all cache entries for a project.

        Args:
            project_id: Project ID (auto-detected if not provided)

        Returns:
            Number of entries removed
        """
        client = self.client
        if client is None:
            return 0

        if project_id is None:
            project_id = get_project_id()

        pattern = f"cache:{project_id}:*"
        count = 0

        try:
            for key in client.scan_iter(match=pattern, count=100):
                client.delete(key)
                count += 1
        except RedisError:
            pass

        return count

    # === Private Methods ===

    def _generate_key(
        self,
        tool_name: str,
        tool_input: Dict[str, Any],
        cwd: Optional[str] = None
    ) -> str:
        """Generate Redis cache key."""
        project_id = get_project_id(cwd)

        # Serialize input deterministically
        input_str = json.dumps(tool_input, sort_keys=True, separators=(',', ':'))

        # Include time bucket for freshness (30-minute windows)
        time_bucket = int(time.time() / 1800)

        # Hash the input + time bucket
        key_data = f"{tool_name}:{input_str}:{time_bucket}"
        input_hash = hashlib.sha256(key_data.encode()).hexdigest()[:16]

        return f"cache:{project_id}:exact:{tool_name}:{input_hash}"

    def _get_ttl(self, tool_name: str) -> int:
        """Get TTL for a tool."""
        if tool_name in ("WebFetch", "WebSearch"):
            return self.config.web_ttl_seconds
        return self.config.exact_ttl_seconds

    def close(self) -> None:
        """Close Redis connection."""
        if self._pool is not None:
            self._pool.disconnect()
            self._pool = None
            self._client = None
