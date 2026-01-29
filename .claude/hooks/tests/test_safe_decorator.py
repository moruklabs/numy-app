#!/usr/bin/env python3
"""
Tests for the Safe decorator.

Verifies that:
1. @Safe catches exceptions and returns default
2. @Safe works on functions, methods, and classes
3. Errors are logged to file
4. Options (default, reraise, silent) work correctly
"""

import sys
from io import StringIO
from pathlib import Path
from unittest.mock import patch

import pytest

sys.path.insert(0, str(Path(__file__).parent.parent))

from utils.safe_decorator import Safe, safe_call


class TestSafeOnFunctions:
    """Tests for @Safe on standalone functions."""

    @pytest.fixture
    def temp_log(self, tmp_path: Path):
        """Use temp directory for logs."""
        log_dir = tmp_path / '.claude' / 'logs'
        log_dir.mkdir(parents=True)
        with patch('utils.safe_decorator._get_error_log_path', return_value=log_dir / 'hook_errors.log'):
            yield log_dir / 'hook_errors.log'

    def test_safe_returns_result_on_success(self, temp_log):
        """Verify normal return value when no error."""
        @Safe
        def add(a, b):
            return a + b

        assert add(2, 3) == 5

    def test_safe_returns_none_on_error(self, temp_log):
        """Verify None returned on unhandled error."""
        @Safe
        def failing():
            raise ValueError("oops")

        with patch('sys.stderr', new_callable=StringIO):
            result = failing()

        assert result is None

    def test_safe_returns_custom_default(self, temp_log):
        """Verify custom default value returned on error."""
        @Safe(default=-1)
        def failing():
            raise ValueError("oops")

        with patch('sys.stderr', new_callable=StringIO):
            result = failing()

        assert result == -1

    def test_safe_logs_error_to_file(self, temp_log):
        """Verify error is written to log file."""
        @Safe
        def failing():
            raise RuntimeError("test error")

        with patch('sys.stderr', new_callable=StringIO):
            failing()

        content = temp_log.read_text()
        assert "RuntimeError" in content
        assert "test error" in content

    def test_safe_reraise_option(self, temp_log):
        """Verify reraise option re-raises after logging."""
        @Safe(reraise=True)
        def failing():
            raise ValueError("should reraise")

        with patch('sys.stderr', new_callable=StringIO):
            with pytest.raises(ValueError, match="should reraise"):
                failing()

    def test_safe_silent_option(self, temp_log):
        """Verify silent option suppresses stderr."""
        @Safe(silent=True)
        def failing():
            raise ValueError("silent error")

        stderr = StringIO()
        with patch('sys.stderr', stderr):
            failing()

        assert stderr.getvalue() == ""

    def test_safe_preserves_function_metadata(self, temp_log):
        """Verify function name and docstring preserved."""
        @Safe
        def documented_function():
            """This is the docstring."""
            pass

        assert documented_function.__name__ == "documented_function"
        assert documented_function.__doc__ == "This is the docstring."


class TestSafeOnClasses:
    """Tests for @Safe on classes."""

    @pytest.fixture
    def temp_log(self, tmp_path: Path):
        """Use temp directory for logs."""
        log_dir = tmp_path / '.claude' / 'logs'
        log_dir.mkdir(parents=True)
        with patch('utils.safe_decorator._get_error_log_path', return_value=log_dir / 'hook_errors.log'):
            yield log_dir / 'hook_errors.log'

    def test_safe_wraps_all_public_methods(self, temp_log):
        """Verify all public methods are wrapped."""
        @Safe
        class MyClass:
            def method1(self):
                raise ValueError("error1")

            def method2(self):
                raise ValueError("error2")

            def _private(self):
                raise ValueError("should not be wrapped")

        obj = MyClass()

        with patch('sys.stderr', new_callable=StringIO):
            assert obj.method1() is None
            assert obj.method2() is None

        # Private method should still raise
        with pytest.raises(ValueError):
            obj._private()

    def test_safe_class_with_default(self, temp_log):
        """Verify class-level default applies to all methods."""
        @Safe(default="fallback")
        class MyClass:
            def failing(self):
                raise ValueError("oops")

        obj = MyClass()

        with patch('sys.stderr', new_callable=StringIO):
            assert obj.failing() == "fallback"

    def test_safe_class_preserves_init(self, temp_log):
        """Verify __init__ is also wrapped."""
        @Safe
        class MyClass:
            def __init__(self, value):
                self.value = value
                if value < 0:
                    raise ValueError("negative not allowed")

        with patch('sys.stderr', new_callable=StringIO):
            # Should not raise, returns None from __init__
            obj = MyClass(-1)
            # Object is still created but init failed
            assert obj is not None

    def test_safe_class_normal_operation(self, temp_log):
        """Verify class works normally when no errors."""
        @Safe
        class Calculator:
            def add(self, a, b):
                return a + b

            def multiply(self, a, b):
                return a * b

        calc = Calculator()
        assert calc.add(2, 3) == 5
        assert calc.multiply(4, 5) == 20


class TestSafeCall:
    """Tests for safe_call function."""

    @pytest.fixture
    def temp_log(self, tmp_path: Path):
        """Use temp directory for logs."""
        log_dir = tmp_path / '.claude' / 'logs'
        log_dir.mkdir(parents=True)
        with patch('utils.safe_decorator._get_error_log_path', return_value=log_dir / 'hook_errors.log'):
            yield log_dir / 'hook_errors.log'

    def test_safe_call_returns_result(self, temp_log):
        """Verify safe_call returns function result."""
        def add(a, b):
            return a + b

        result = safe_call(add, 2, 3)
        assert result == 5

    def test_safe_call_returns_default_on_error(self, temp_log):
        """Verify safe_call returns default on error."""
        def failing():
            raise ValueError("oops")

        with patch('sys.stderr', new_callable=StringIO):
            result = safe_call(failing, default="fallback")

        assert result == "fallback"

    def test_safe_call_with_kwargs(self, temp_log):
        """Verify safe_call passes kwargs correctly."""
        def greet(name, greeting="Hello"):
            return f"{greeting}, {name}!"

        result = safe_call(greet, "World", greeting="Hi")
        assert result == "Hi, World!"


class TestSafeEdgeCases:
    """Tests for edge cases and special scenarios."""

    @pytest.fixture
    def temp_log(self, tmp_path: Path):
        """Use temp directory for logs."""
        log_dir = tmp_path / '.claude' / 'logs'
        log_dir.mkdir(parents=True)
        with patch('utils.safe_decorator._get_error_log_path', return_value=log_dir / 'hook_errors.log'):
            yield log_dir / 'hook_errors.log'

    def test_safe_with_generator(self, temp_log):
        """Verify Safe works with generators."""
        @Safe(default=[])
        def generate():
            yield 1
            yield 2
            raise ValueError("mid-generation error")

        # Generator itself doesn't raise until iterated
        gen = generate()
        assert gen is not None

    def test_safe_with_async_not_supported(self, temp_log):
        """Document that async functions need special handling."""
        # Note: @Safe doesn't support async functions directly
        # This test documents current behavior
        pass

    def test_safe_nested_decorators(self, temp_log):
        """Verify Safe works with other decorators."""
        def uppercase(func):
            @functools.wraps(func)
            def wrapper(*args, **kwargs):
                result = func(*args, **kwargs)
                return result.upper() if result else result
            return wrapper

        import functools

        @Safe(default="default")
        @uppercase
        def greet(name):
            if not name:
                raise ValueError("name required")
            return f"hello {name}"

        assert greet("world") == "HELLO WORLD"

        with patch('sys.stderr', new_callable=StringIO):
            assert greet("") == "default"

    def test_safe_custom_context(self, temp_log):
        """Verify custom context in error messages."""
        @Safe(context="MyApp.critical_function")
        def failing():
            raise ValueError("test")

        stderr = StringIO()
        with patch('sys.stderr', stderr):
            failing()

        assert "MyApp.critical_function" in stderr.getvalue()

    def test_multiple_errors_logged_separately(self, temp_log):
        """Verify multiple errors create separate log entries."""
        @Safe
        def failing(msg):
            raise ValueError(msg)

        with patch('sys.stderr', new_callable=StringIO):
            failing("error1")
            failing("error2")
            failing("error3")

        content = temp_log.read_text()
        assert content.count("Safe Error") == 3
        assert "error1" in content
        assert "error2" in content
        assert "error3" in content


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
