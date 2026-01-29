"""
Cache Backend Modules

Provides pluggable cache backends with decorator-based cross-cutting concerns.
"""

from .base import AbstractCacheBackend, CacheResult, CacheConfig
from .compression import GzipCompressor
from .decorators import (
    with_compression,
    with_observability,
    with_error_resilience,
    with_timing,
    with_retry,
    cache_operation,
)
from .observer import (
    CacheObserver,
    CacheEvent,
    CacheStatus,
    CacheProvider,
    get_observer,
    configure_observer,
)
from .path_resolver import (
    PathResolver,
    get_resolver,
    get_cache_dir,
    get_project_id,
    generate_cache_key,
    generate_redis_key,
)
from .file_backend import FileCacheBackend
from .redis_backend import RedisBackend, REDIS_AVAILABLE
from .qdrant_backend import QdrantBackend, QDRANT_AVAILABLE

__all__ = [
    # Base abstractions
    "AbstractCacheBackend",
    "CacheResult",
    "CacheConfig",
    # Compression
    "GzipCompressor",
    # Decorators
    "with_compression",
    "with_observability",
    "with_error_resilience",
    "with_timing",
    "with_retry",
    "cache_operation",
    # Observability
    "CacheObserver",
    "CacheEvent",
    "CacheStatus",
    "CacheProvider",
    "get_observer",
    "configure_observer",
    # Path resolution
    "PathResolver",
    "get_resolver",
    "get_cache_dir",
    "get_project_id",
    "generate_cache_key",
    "generate_redis_key",
    # File backend
    "FileCacheBackend",
    # Redis backend
    "RedisBackend",
    "REDIS_AVAILABLE",
    # Qdrant backend
    "QdrantBackend",
    "QDRANT_AVAILABLE",
]
