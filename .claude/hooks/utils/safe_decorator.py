#!/usr/bin/env python3
"""
Safe Decorator Module

Provides a universal @Safe decorator for automatic error handling.
Wraps functions, methods, and classes to catch exceptions,
log them, and prevent crashes.
"""

import functools
import sys
import traceback
from datetime import datetime
from pathlib import Path
from typing import Any, Callable, TypeVar

# Type variables for generic typing
F = TypeVar('F', bound=Callable[..., Any])
T = TypeVar('T')


def _get_error_log_path() -> Path:
    """Get the error log path."""
    hook_logs_dir = Path.home() / '.claude' / 'logs'
    hook_logs_dir.mkdir(parents=True, exist_ok=True)
    return hook_logs_dir / 'hook_errors.log'


def _log_error(
    context: str,
    error: Exception,
    *,
    announce: bool = True,
) -> None:
    """
    Log an error to file.

    Args:
        context: Description of where the error occurred
        error: The exception that was caught
        announce: Whether to print to stderr
    """
    error_log_path = _get_error_log_path()
    timestamp = datetime.now().isoformat()
    error_trace = traceback.format_exc()

    log_entry = (
        f"\n{'='*60}\n"
        f"[{timestamp}] Safe Error: {context}\n"
        f"Error: {type(error).__name__}: {error}\n"
        f"Traceback:\n{error_trace}"
        f"{'='*60}\n"
    )

    # Write to error log
    try:
        with error_log_path.open('a') as f:
            f.write(log_entry)
    except Exception:
        pass

    # Print to stderr
    if announce:
        print(
            f"⚠️  Safe caught error in {context}: {error}\n"
            f"📄 Error log: {error_log_path}",
            file=sys.stderr
        )


class Safe:
    """
    Universal decorator for automatic error handling.

    Can be used on:
    - Functions
    - Methods
    - Classes (wraps all public methods)

    Usage:
        @Safe
        def risky_function():
            ...

        @Safe(default=None, silent=True)
        def another_function():
            ...

        @Safe
        class RiskyHandler:
            def method(self):
                ...

    Args:
        default: Default value to return on error (default: None)
        reraise: Whether to re-raise the exception after logging (default: False)
        silent: Whether to suppress stderr output (default: False)
        context: Custom context string for error messages (default: auto-detected)
    """

    def __new__(
        cls,
        _func_or_class: Callable | type | None = None,
        *,
        default: Any = None,
        reraise: bool = False,
        silent: bool = False,
        context: str | None = None,
    ):
        """
        Handle both @Safe and @Safe(...) syntax.

        When used as @Safe (without parens), _func_or_class is the decorated item.
        When used as @Safe(...), _func_or_class is None and we return an instance.
        """
        instance = super().__new__(cls)
        instance._default = default
        instance._reraise = reraise
        instance._silent = silent
        instance._context = context

        # @Safe without parentheses - directly wrap and return
        if _func_or_class is not None:
            if isinstance(_func_or_class, type):
                return instance._wrap_class(_func_or_class)
            else:
                return instance._wrap_function(_func_or_class)

        # @Safe(...) with parentheses - return instance for second call
        return instance

    def __init__(
        self,
        _func_or_class: Callable | type | None = None,
        *,
        default: Any = None,
        reraise: bool = False,
        silent: bool = False,
        context: str | None = None,
    ):
        # All initialization done in __new__
        pass

    def __call__(self, func_or_class: Callable | type) -> Callable | type:
        """Called when using @Safe(...) with parentheses."""
        if isinstance(func_or_class, type):
            return self._wrap_class(func_or_class)
        else:
            return self._wrap_function(func_or_class)

    def _get_context(self, func: Callable) -> str:
        """Get context string for error messages."""
        if self._context:
            return self._context
        module = getattr(func, '__module__', '<unknown>')
        name = getattr(func, '__qualname__', getattr(func, '__name__', '<unknown>'))
        return f"{module}.{name}"

    def _call_wrapped(self, func: Callable, *args, **kwargs) -> Any:
        """Call a wrapped function with error handling."""
        try:
            return func(*args, **kwargs)
        except Exception as e:
            _log_error(
                self._get_context(func),
                e,
                announce=not self._silent,
            )
            if self._reraise:
                raise
            return self._default

    def _wrap_function(self, func: Callable[..., T]) -> Callable[..., T]:
        """Wrap a function with error handling."""
        @functools.wraps(func)
        def wrapper(*args, **kwargs) -> T:
            return self._call_wrapped(func, *args, **kwargs)
        return wrapper

    def _wrap_class(self, cls: type) -> type:
        """Wrap all public methods of a class with error handling."""
        for name in dir(cls):
            # Skip private/magic methods except __init__ and __call__
            if name.startswith('_') and name not in ('__init__', '__call__'):
                continue

            attr = getattr(cls, name, None)
            if attr is None:
                continue

            # Wrap callable attributes (methods)
            if callable(attr) and not isinstance(attr, type):
                # Create a new Safe instance for each method
                safe_wrapper = Safe(
                    default=self._default,
                    reraise=self._reraise,
                    silent=self._silent,
                    context=f"{cls.__module__}.{cls.__name__}.{name}",
                )
                wrapped = safe_wrapper._wrap_function(attr)
                setattr(cls, name, wrapped)

        return cls


# Convenience function for wrapping arbitrary code blocks
def safe_call(
    func: Callable[..., T],
    *args,
    default: T = None,
    context: str | None = None,
    **kwargs,
) -> T:
    """
    Safely call a function with error handling.

    Useful for one-off safe calls without decorating.

    Usage:
        result = safe_call(risky_function, arg1, arg2, default="fallback")

    Args:
        func: Function to call
        *args: Positional arguments for the function
        default: Default value on error
        context: Custom context for error messages
        **kwargs: Keyword arguments for the function

    Returns:
        Function result or default value on error
    """
    try:
        return func(*args, **kwargs)
    except Exception as e:
        ctx = context or f"{func.__module__}.{func.__name__}"
        _log_error(ctx, e)
        return default


# Export for convenience
__all__ = ['Safe', 'safe_call']
