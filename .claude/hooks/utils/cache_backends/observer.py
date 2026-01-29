#!/usr/bin/env python3
"""
Cache Observer Module

Provides structured observability for cache operations.
Emits HIT/MISS/provider logs to stderr in JSON format.
"""

import json
import sys
import time
from dataclasses import dataclass, asdict
from typing import Any, Optional
from enum import Enum


class CacheStatus(Enum):
    """Cache operation status."""
    HIT = "HIT"
    MISS = "MISS"
    STALE = "STALE"
    ERROR = "ERROR"


class CacheProvider(Enum):
    """Cache provider types."""
    REDIS = "redis"
    QDRANT = "qdrant"
    FILE = "file"
    FALLBACK = "fallback"
    NONE = "none"


@dataclass
class CacheEvent:
    """Structured cache event for logging."""
    event: str  # "cache_lookup", "cache_store", "cache_invalidate"
    tool: str
    status: str  # HIT, MISS, STALE, ERROR
    provider: str  # redis, qdrant, file, fallback, none
    cache_type: str  # "exact", "semantic", "miss"
    latency_ms: float
    similarity: float = 1.0
    age_seconds: float = 0.0
    compressed: bool = False
    compression_ratio: float = 0.0
    key: str = ""
    error: Optional[str] = None
    timestamp: str = ""

    def __post_init__(self):
        if not self.timestamp:
            self.timestamp = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())

    def to_dict(self) -> dict:
        """Convert to dictionary, excluding None values."""
        result = asdict(self)
        return {k: v for k, v in result.items() if v is not None}

    def to_json(self) -> str:
        """Convert to JSON string."""
        return json.dumps(self.to_dict(), separators=(',', ':'))


class CacheObserver:
    """
    Observes and logs cache operations.

    Emits structured JSON logs to stderr for debugging and monitoring.
    Integrates with decorators for automatic observability.
    """

    def __init__(
        self,
        log_hits: bool = True,
        log_misses: bool = True,
        log_provider: bool = True,
        enabled: bool = True
    ):
        """
        Initialize observer.

        Args:
            log_hits: Log cache hits
            log_misses: Log cache misses
            log_provider: Include provider in logs
            enabled: Enable/disable logging
        """
        self.log_hits = log_hits
        self.log_misses = log_misses
        self.log_provider = log_provider
        self.enabled = enabled

        # Metrics tracking
        self._hits = 0
        self._misses = 0
        self._errors = 0
        self._total_latency_ms = 0.0

    def log(
        self,
        operation: str,
        result: Any = None,
        latency_ms: float = 0.0,
        error: Optional[Exception] = None,
        tool_name: str = "",
        **kwargs
    ) -> None:
        """
        Log a cache operation.

        Args:
            operation: Operation name (lookup, store, invalidate)
            result: CacheResult or similar object with cache info
            latency_ms: Operation latency in milliseconds
            error: Exception if operation failed
            tool_name: Name of the tool being cached
            **kwargs: Additional fields to include
        """
        if not self.enabled:
            return

        # Extract info from result object
        status = CacheStatus.ERROR.value if error else CacheStatus.MISS.value
        provider = CacheProvider.NONE.value
        cache_type = "miss"
        similarity = 1.0
        age_seconds = 0.0
        compressed = False
        compression_ratio = 0.0
        key = ""

        if result is not None:
            # Check for hit/miss
            if hasattr(result, 'hit') and result.hit:
                status = CacheStatus.HIT.value
                self._hits += 1
            else:
                status = CacheStatus.MISS.value
                self._misses += 1

            # Extract provider
            if hasattr(result, 'provider'):
                provider = result.provider

            # Extract cache type
            if hasattr(result, 'cache_type'):
                cache_type = result.cache_type

            # Extract similarity score
            if hasattr(result, 'similarity'):
                similarity = result.similarity

            # Extract age
            if hasattr(result, 'age_seconds'):
                age_seconds = result.age_seconds

            # Extract compression info
            if hasattr(result, 'compressed'):
                compressed = result.compressed
            if hasattr(result, 'compression_ratio'):
                compression_ratio = result.compression_ratio

            # Extract key
            if hasattr(result, 'key'):
                key = result.key

        if error:
            self._errors += 1
            status = CacheStatus.ERROR.value

        # Track latency
        self._total_latency_ms += latency_ms

        # Check if we should log this event
        if status == CacheStatus.HIT.value and not self.log_hits:
            return
        if status == CacheStatus.MISS.value and not self.log_misses:
            return

        # Build event
        event = CacheEvent(
            event=f"cache_{operation}",
            tool=tool_name or kwargs.get('tool', 'unknown'),
            status=status,
            provider=provider if self.log_provider else "hidden",
            cache_type=cache_type,
            latency_ms=round(latency_ms, 2),
            similarity=round(similarity, 4),
            age_seconds=round(age_seconds, 2),
            compressed=compressed,
            compression_ratio=round(compression_ratio, 4),
            key=key[:16] + "..." if len(key) > 16 else key,
            error=str(error)[:100] if error else None
        )

        # Emit to stderr
        self._emit(event)

    def _emit(self, event: CacheEvent) -> None:
        """Emit event to stderr."""
        try:
            sys.stderr.write(f"[Cache] {event.to_json()}\n")
            sys.stderr.flush()
        except Exception:
            # Never let logging errors propagate
            pass

    def log_hit(
        self,
        tool_name: str,
        provider: str,
        cache_type: str,
        latency_ms: float,
        similarity: float = 1.0,
        key: str = ""
    ) -> None:
        """Convenience method to log a cache hit."""
        if not self.enabled or not self.log_hits:
            return

        self._hits += 1
        self._total_latency_ms += latency_ms

        event = CacheEvent(
            event="cache_lookup",
            tool=tool_name,
            status=CacheStatus.HIT.value,
            provider=provider,
            cache_type=cache_type,
            latency_ms=round(latency_ms, 2),
            similarity=round(similarity, 4),
            key=key[:16] + "..." if len(key) > 16 else key
        )
        self._emit(event)

    def log_miss(
        self,
        tool_name: str,
        latency_ms: float,
        key: str = ""
    ) -> None:
        """Convenience method to log a cache miss."""
        if not self.enabled or not self.log_misses:
            return

        self._misses += 1
        self._total_latency_ms += latency_ms

        event = CacheEvent(
            event="cache_lookup",
            tool=tool_name,
            status=CacheStatus.MISS.value,
            provider=CacheProvider.NONE.value,
            cache_type="miss",
            latency_ms=round(latency_ms, 2),
            key=key[:16] + "..." if len(key) > 16 else key
        )
        self._emit(event)

    def log_store(
        self,
        tool_name: str,
        provider: str,
        latency_ms: float,
        compressed: bool = False,
        compression_ratio: float = 0.0,
        key: str = ""
    ) -> None:
        """Log a cache store operation."""
        if not self.enabled:
            return

        self._total_latency_ms += latency_ms

        event = CacheEvent(
            event="cache_store",
            tool=tool_name,
            status="STORED",
            provider=provider,
            cache_type="exact",
            latency_ms=round(latency_ms, 2),
            compressed=compressed,
            compression_ratio=round(compression_ratio, 4),
            key=key[:16] + "..." if len(key) > 16 else key
        )
        self._emit(event)

    def log_error(
        self,
        operation: str,
        tool_name: str,
        error: Exception,
        latency_ms: float = 0.0
    ) -> None:
        """Log a cache error."""
        if not self.enabled:
            return

        self._errors += 1
        self._total_latency_ms += latency_ms

        event = CacheEvent(
            event=f"cache_{operation}",
            tool=tool_name,
            status=CacheStatus.ERROR.value,
            provider=CacheProvider.FALLBACK.value,
            cache_type="error",
            latency_ms=round(latency_ms, 2),
            error=str(error)[:100]
        )
        self._emit(event)

    @property
    def stats(self) -> dict:
        """Get observer statistics."""
        total = self._hits + self._misses
        hit_rate = (self._hits / total * 100) if total > 0 else 0.0
        avg_latency = (self._total_latency_ms / total) if total > 0 else 0.0

        return {
            "hits": self._hits,
            "misses": self._misses,
            "errors": self._errors,
            "total": total,
            "hit_rate_percent": round(hit_rate, 2),
            "avg_latency_ms": round(avg_latency, 2),
            "total_latency_ms": round(self._total_latency_ms, 2)
        }

    def reset_stats(self) -> None:
        """Reset all statistics."""
        self._hits = 0
        self._misses = 0
        self._errors = 0
        self._total_latency_ms = 0.0


# Singleton instance
_observer: Optional[CacheObserver] = None


def get_observer(
    log_hits: bool = True,
    log_misses: bool = True,
    log_provider: bool = True,
    enabled: bool = True
) -> CacheObserver:
    """Get or create the singleton observer instance."""
    global _observer
    if _observer is None:
        _observer = CacheObserver(
            log_hits=log_hits,
            log_misses=log_misses,
            log_provider=log_provider,
            enabled=enabled
        )
    return _observer


def configure_observer(
    log_hits: bool = True,
    log_misses: bool = True,
    log_provider: bool = True,
    enabled: bool = True
) -> CacheObserver:
    """Configure and return the singleton observer."""
    global _observer
    _observer = CacheObserver(
        log_hits=log_hits,
        log_misses=log_misses,
        log_provider=log_provider,
        enabled=enabled
    )
    return _observer
