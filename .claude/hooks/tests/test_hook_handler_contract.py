#!/usr/bin/env python3
"""
Tests for handler contract compliance with BaseHandler

Run with: python3 -m unittest test_hook_handler_contract -v
"""

import unittest
import sys
from pathlib import Path

PROJECT_ROOT = Path('/Users/fatih/monorepo')
HOOKS_DIR = PROJECT_ROOT / '.claude' / 'hooks'

sys.path.insert(0, str(HOOKS_DIR))

from utils.handler_registry import discover_handlers
from utils.base_handler import BaseHandler


class TestHandlerContract(unittest.TestCase):
    """Test that all handlers comply with BaseHandler contract."""

    @classmethod
    def setUpClass(cls):
        """Discover all handlers across all events."""
        cls.all_handlers = []
        event_dirs = [d for d in HOOKS_DIR.iterdir() if d.is_dir() and d.name.startswith('on_')]

        for event_dir in event_dirs:
            handlers = discover_handlers(event_dir)
            for handler in handlers:
                cls.all_handlers.append({
                    'class': handler,
                    'event': event_dir.name,
                })

    def test_all_handlers_inherit_from_base_handler(self):
        """Test all handlers inherit from BaseHandler."""
        for handler_info in self.all_handlers:
            handler_class = handler_info['class']
            with self.subTest(handler=handler_class.name):
                self.assertTrue(
                    issubclass(handler_class, BaseHandler),
                    f"{handler_class.__name__} must inherit from BaseHandler"
                )

    def test_all_handlers_implement_should_run(self):
        """Test all handlers implement should_run method."""
        for handler_info in self.all_handlers:
            handler_class = handler_info['class']
            with self.subTest(handler=handler_class.name):
                self.assertTrue(
                    hasattr(handler_class, 'should_run'),
                    f"{handler_class.__name__} must implement should_run()"
                )

                # Check it's actually implemented (not abstract)
                method = getattr(handler_class, 'should_run')
                self.assertFalse(
                    getattr(method, '__isabstractmethod__', False),
                    f"{handler_class.__name__}.should_run() is still abstract"
                )

    def test_all_handlers_implement_run(self):
        """Test all handlers implement run method."""
        for handler_info in self.all_handlers:
            handler_class = handler_info['class']
            with self.subTest(handler=handler_class.name):
                self.assertTrue(
                    hasattr(handler_class, 'run'),
                    f"{handler_class.__name__} must implement run()"
                )

                # Check it's actually implemented (not abstract)
                method = getattr(handler_class, 'run')
                self.assertFalse(
                    getattr(method, '__isabstractmethod__', False),
                    f"{handler_class.__name__}.run() is still abstract"
                )

    def test_all_handlers_have_name_attribute(self):
        """Test all handlers have a name attribute."""
        for handler_info in self.all_handlers:
            handler_class = handler_info['class']
            with self.subTest(handler=handler_class.name):
                self.assertTrue(
                    hasattr(handler_class, 'name'),
                    f"{handler_class.__name__} must have 'name' attribute"
                )
                self.assertIsInstance(
                    handler_class.name,
                    str,
                    f"{handler_class.__name__}.name must be a string"
                )
                self.assertNotEqual(
                    handler_class.name,
                    'unnamed',
                    f"{handler_class.__name__}.name should not be 'unnamed'"
                )

    def test_all_handlers_have_description_attribute(self):
        """Test all handlers have a description attribute."""
        for handler_info in self.all_handlers:
            handler_class = handler_info['class']
            with self.subTest(handler=handler_class.name):
                self.assertTrue(
                    hasattr(handler_class, 'description'),
                    f"{handler_class.__name__} must have 'description' attribute"
                )
                self.assertIsInstance(
                    handler_class.description,
                    str,
                    f"{handler_class.__name__}.description must be a string"
                )

    def test_all_handlers_have_valid_priority(self):
        """Test all handlers have valid priority values."""
        for handler_info in self.all_handlers:
            handler_class = handler_info['class']
            with self.subTest(handler=handler_class.name):
                self.assertTrue(
                    hasattr(handler_class, 'priority'),
                    f"{handler_class.__name__} must have 'priority' attribute"
                )
                self.assertIsInstance(
                    handler_class.priority,
                    int,
                    f"{handler_class.__name__}.priority must be an integer"
                )
                self.assertGreaterEqual(
                    handler_class.priority,
                    0,
                    f"{handler_class.__name__}.priority must be >= 0"
                )
                self.assertLess(
                    handler_class.priority,
                    1000,
                    f"{handler_class.__name__}.priority must be < 1000"
                )

    def test_handler_priorities_follow_conventions(self):
        """Test handler priorities follow documented conventions."""
        priority_ranges = {
            'blocker': (0, 100),      # 0-99: blockers
            'standard': (100, 300),   # 100-299: standard (expanded for flexibility)
            'observer': (800, 900),   # 800-899: observers
            'cleanup': (900, 1000),   # 900-999: cleanup
        }

        for handler_info in self.all_handlers:
            handler_class = handler_info['class']
            priority = handler_class.priority

            # Check priority falls into a valid range
            in_valid_range = any(
                low <= priority < high
                for low, high in priority_ranges.values()
            )

            with self.subTest(handler=handler_class.name):
                self.assertTrue(
                    in_valid_range,
                    f"{handler_class.__name__}.priority={priority} doesn't match conventions "
                    f"(should be in ranges: 0-99, 100-299, 800-899, or 900-999)"
                )

    def test_handlers_can_be_instantiated(self):
        """Test that all handlers can be instantiated without errors."""
        for handler_info in self.all_handlers:
            handler_class = handler_info['class']
            with self.subTest(handler=handler_class.name):
                try:
                    instance = handler_class()
                    self.assertIsInstance(instance, BaseHandler)
                except Exception as e:
                    self.fail(f"Failed to instantiate {handler_class.__name__}: {e}")


if __name__ == '__main__':
    unittest.main()
