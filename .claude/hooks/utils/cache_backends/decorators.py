#!/usr/bin/env python3
"""
Cache Decorators for DRY Code

Provides reusable decorators for cross-cutting concerns:
- Compression/decompression
- Observability (logging)
- Error resilience (never block execution)
- Timing/performance monitoring
- Retry logic for transient failures

These decorators dramatically reduce code duplication across backends.
"""

import time
import logging
from functools import wraps
from typing import Any, Callable, Optional, TypeVar, cast
import sys

logger = logging.getLogger(__name__)

# Type variable for generic decorators
F = TypeVar('F', bound=Callable[..., Any])


def with_compression(func: F) -> F:
    """
    Decorator: Automatically compress output and decompress input.

    Expects self to have a 'compressor' attribute (GzipCompressor instance).

    Usage:
        @with_compression
        def store(self, data):
            # data is automatically compressed before storage
            pass
    """
    @wraps(func)
    def wrapper(self, *args, **kwargs):
        # Execute the function
        result = func(self, *args, **kwargs)

        # If result has compressed data that needs decompression
        if hasattr(result, 'data') and isinstance(result.data, bytes):
            try:
                if hasattr(self, 'compressor'):
                    result.data = self.compressor.decompress(result.data)
            except Exception as e:
                logger.warning(f"Decompression failed in {func.__name__}: {e}")

        return result

    return cast(F, wrapper)


def with_observability(operation: str):
    """
    Decorator: Log cache operations with HIT/MISS/provider info to stderr.

    Args:
        operation: Operation name (e.g., "lookup", "store")

    Expects self to have an 'observer' attribute (CacheObserver instance).

    Usage:
        @with_observability("lookup")
        def lookup(self, tool_name, tool_input):
            # Operation is automatically logged with metrics
            pass
    """
    def decorator(func: F) -> F:
        @wraps(func)
        def wrapper(self, *args, **kwargs):
            start_time = time.time()
            error = None
            result = None

            try:
                result = func(self, *args, **kwargs)
                return result
            except Exception as e:
                error = e
                raise
            finally:
                # Calculate latency
                latency_ms = (time.time() - start_time) * 1000

                # Log via observer if available
                if hasattr(self, 'observer'):
                    try:
                        self.observer.log(
                            operation=operation,
                            result=result,
                            latency_ms=latency_ms,
                            error=error
                        )
                    except Exception as log_error:
                        # Never let logging errors break functionality
                        logger.error(f"Observer logging failed: {log_error}")

        return cast(F, wrapper)
    return decorator


def with_error_resilience(fallback_value: Any = None):
    """
    Decorator: Catch all errors and return fallback value - never block execution.

    Args:
        fallback_value: Value to return if function raises exception

    Critical: Hooks must NEVER block tool execution, even on errors.

    Usage:
        @with_error_resilience(fallback_value=CacheResult(hit=False, key=""))
        def lookup(self, tool_name, tool_input):
            # Any exception returns fallback instead of crashing
            pass
    """
    def decorator(func: F) -> F:
        @wraps(func)
        def wrapper(*args, **kwargs):
            try:
                return func(*args, **kwargs)
            except Exception as e:
                # Log the error with full traceback
                logger.error(
                    f"Error in {func.__name__} (returning fallback): {e}",
                    exc_info=True
                )

                # Emit to stderr for visibility
                sys.stderr.write(
                    f"[Cache Error - Non-blocking] {func.__name__}: {str(e)[:100]}\n"
                )

                # Return fallback value - never block execution
                return fallback_value

        return cast(F, wrapper)
    return decorator


def with_timing(threshold_ms: float = 100):
    """
    Decorator: Log slow operations exceeding threshold.

    Args:
        threshold_ms: Log warning if operation exceeds this duration

    Usage:
        @with_timing(threshold_ms=50)
        def lookup(self, tool_name, tool_input):
            # Automatically warns if takes > 50ms
            pass
    """
    def decorator(func: F) -> F:
        @wraps(func)
        def wrapper(*args, **kwargs):
            start = time.time()
            result = func(*args, **kwargs)
            duration_ms = (time.time() - start) * 1000

            if duration_ms > threshold_ms:
                logger.warning(
                    f"{func.__name__} took {duration_ms:.2f}ms "
                    f"(threshold: {threshold_ms}ms)"
                )

            return result

        return cast(F, wrapper)
    return decorator


def with_retry(max_attempts: int = 3, backoff_ms: float = 100, exceptions: tuple = (Exception,)):
    """
    Decorator: Retry operation on transient failures with exponential backoff.

    Args:
        max_attempts: Maximum number of retry attempts
        backoff_ms: Initial backoff duration in milliseconds (doubles each retry)
        exceptions: Tuple of exception types to catch and retry

    Usage:
        @with_retry(max_attempts=3, backoff_ms=50, exceptions=(ConnectionError, TimeoutError))
        def connect_to_redis(self):
            # Automatically retries on connection errors
            pass
    """
    def decorator(func: F) -> F:
        @wraps(func)
        def wrapper(*args, **kwargs):
            last_exception = None

            for attempt in range(max_attempts):
                try:
                    return func(*args, **kwargs)
                except exceptions as e:
                    last_exception = e

                    # Don't sleep on last attempt
                    if attempt < max_attempts - 1:
                        # Exponential backoff
                        sleep_ms = backoff_ms * (2 ** attempt)
                        logger.debug(
                            f"Retry {attempt + 1}/{max_attempts} for {func.__name__} "
                            f"after {sleep_ms}ms (error: {e})"
                        )
                        time.sleep(sleep_ms / 1000)

            # All retries failed
            logger.error(
                f"{func.__name__} failed after {max_attempts} attempts: "
                f"{last_exception}"
            )
            raise last_exception

        return cast(F, wrapper)
    return decorator


def safe_method(fallback_value: Any = None):
    """
    Decorator: Class-level decorator to wrap all methods with error resilience.

    Args:
        fallback_value: Default value to return on errors

    Usage:
        @safe_method(fallback_value=None)
        class MyBackend:
            # All methods automatically error-resilient
            pass
    """
    def class_decorator(cls):
        # Wrap all public methods
        for attr_name in dir(cls):
            if attr_name.startswith('_'):
                continue

            attr = getattr(cls, attr_name)
            if callable(attr):
                wrapped = with_error_resilience(fallback_value)(attr)
                setattr(cls, attr_name, wrapped)

        return cls

    return class_decorator


# Convenience: Stack multiple decorators in correct order
def cache_operation(
    operation: str,
    fallback: Any = None,
    timing_threshold_ms: float = 100,
    retry_attempts: int = 0,
    retry_exceptions: tuple = (Exception,)
):
    """
    Meta-decorator: Apply multiple cache decorators in correct order.

    Args:
        operation: Operation name for observability
        fallback: Fallback value for error resilience
        timing_threshold_ms: Threshold for slow operation warnings
        retry_attempts: Number of retry attempts (0 = no retry)
        retry_exceptions: Exceptions to retry on

    Correct stacking order (innermost to outermost):
    1. Timing (measure everything)
    2. Retry (retry on failures)
    3. Observability (log final result)
    4. Error resilience (catch all errors as last resort)

    Usage:
        @cache_operation("lookup", fallback=CacheResult(hit=False, key=""), timing_threshold_ms=50)
        def lookup(self, tool_name, tool_input):
            # All decorators applied automatically in correct order
            pass
    """
    def decorator(func: F) -> F:
        # Apply decorators in reverse order (innermost first)
        decorated = func

        # 1. Timing (innermost - measures everything)
        decorated = with_timing(timing_threshold_ms)(decorated)

        # 2. Retry (if configured)
        if retry_attempts > 0:
            decorated = with_retry(retry_attempts, exceptions=retry_exceptions)(decorated)

        # 3. Observability (logs final result)
        decorated = with_observability(operation)(decorated)

        # 4. Error resilience (outermost - catches all errors)
        decorated = with_error_resilience(fallback)(decorated)

        return decorated

    return decorator
