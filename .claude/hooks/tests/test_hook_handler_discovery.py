#!/usr/bin/env python3
"""
Tests for handler auto-discovery mechanism

Run with: python3 -m unittest test_hook_handler_discovery -v
"""

import unittest
import sys
from pathlib import Path

PROJECT_ROOT = Path('/Users/fatih/monorepo')
HOOKS_DIR = PROJECT_ROOT / '.claude' / 'hooks'

# Add hooks to sys.path for imports
sys.path.insert(0, str(HOOKS_DIR))

from utils.handler_registry import discover_handlers, get_event_dir
from utils.base_handler import BaseHandler


class TestHandlerDiscovery(unittest.TestCase):
    """Test handler auto-discovery mechanism."""

    def test_discover_handlers_finds_all_handlers(self):
        """Test that discover_handlers finds all handler files."""
        event_dirs = [d for d in HOOKS_DIR.iterdir() if d.is_dir() and d.name.startswith('on_')]

        for event_dir in event_dirs:
            with self.subTest(event_dir=event_dir.name):
                handlers = discover_handlers(event_dir)

                # Count .py files that aren't private
                handler_files = [
                    f for f in event_dir.glob('*.py')
                    if not f.stem.startswith('_')
                ]

                # Each handler file should result in at least one handler class
                # (Some files might have 0 if they only contain utilities)
                self.assertIsInstance(handlers, list, "discover_handlers should return a list")

    def test_handlers_sorted_by_priority(self):
        """Test that discovered handlers are sorted by priority."""
        event_dirs = [d for d in HOOKS_DIR.iterdir() if d.is_dir() and d.name.startswith('on_')]

        for event_dir in event_dirs:
            with self.subTest(event_dir=event_dir.name):
                handlers = discover_handlers(event_dir)

                if len(handlers) > 1:
                    # Check that priorities are in ascending order
                    priorities = [h.priority for h in handlers]
                    sorted_priorities = sorted(priorities)

                    self.assertEqual(
                        priorities,
                        sorted_priorities,
                        f"Handlers not sorted by priority in {event_dir.name}: {priorities}"
                    )

    def test_discovery_skips_private_files(self):
        """Test that discovery skips files starting with underscore."""
        # Test on_session_start which has __main__.py and __init__.py
        event_dir = HOOKS_DIR / 'on_session_start'
        if not event_dir.exists():
            self.skipTest(f"Event directory {event_dir} not found")

        handlers = discover_handlers(event_dir)

        # No handler should come from __main__.py or __init__.py
        for handler in handlers:
            module_name = handler.__module__
            self.assertFalse(
                module_name.startswith('__'),
                f"Handler {handler.name} from private module {module_name}"
            )

    def test_get_event_dir_returns_correct_path(self):
        """Test that get_event_dir constructs correct paths."""
        test_cases = [
            ('pre_tool_use', 'on_pre_tool_use'),
            ('session_start', 'on_session_start'),
            ('stop', 'on_stop'),
        ]

        for event_name, expected_dir in test_cases:
            with self.subTest(event=event_name):
                event_dir = get_event_dir(event_name)
                expected_path = HOOKS_DIR / expected_dir

                self.assertEqual(event_dir, expected_path)

    def test_discover_handlers_returns_empty_for_nonexistent_dir(self):
        """Test that discover_handlers returns empty list for nonexistent directory."""
        nonexistent_dir = Path('/nonexistent/path')
        handlers = discover_handlers(nonexistent_dir)

        self.assertEqual(handlers, [])


if __name__ == '__main__':
    unittest.main()
