#!/usr/bin/env python3
"""
Tests to prevent regression of known critical handlers

Run with: python3 -m unittest test_hook_regression -v
"""

import unittest
import sys
from pathlib import Path

PROJECT_ROOT = Path('/Users/fatih/monorepo')
HOOKS_DIR = PROJECT_ROOT / '.claude' / 'hooks'

sys.path.insert(0, str(HOOKS_DIR))

from utils.handler_registry import discover_handlers


class TestHandlerRegression(unittest.TestCase):
    """Test that known handlers haven't been accidentally removed."""

    KNOWN_HANDLERS = {
        'on_pre_tool_use': [
            'dangerous_rm_blocker',
            'env_file_blocker',
            'event_logger',
        ],
        'on_session_start': [
            'context_loader',
            'event_logger',
        ],
        'on_post_tool_use': [
            'event_logger',
        ],
        'on_stop': [
            'event_logger',
        ],
    }

    def test_known_handlers_still_exist(self):
        """Test that all known handlers are still registered."""
        for event_dir_name, expected_handlers in self.KNOWN_HANDLERS.items():
            event_dir = HOOKS_DIR / event_dir_name

            if not event_dir.exists():
                self.skipTest(f"Event directory {event_dir_name} not found")

            handlers = discover_handlers(event_dir)
            handler_names = [h.name for h in handlers]

            for expected_name in expected_handlers:
                with self.subTest(event=event_dir_name, handler=expected_name):
                    self.assertIn(
                        expected_name,
                        handler_names,
                        f"Known handler '{expected_name}' missing from {event_dir_name}"
                    )

    def test_critical_handlers_have_correct_priorities(self):
        """Test that critical security handlers have blocker priority."""
        critical_handlers = {
            'on_pre_tool_use': {
                'dangerous_rm_blocker': (0, 100),  # Should be blocker priority
                'env_file_blocker': (0, 100),
            }
        }

        for event_dir_name, handlers_priority in critical_handlers.items():
            event_dir = HOOKS_DIR / event_dir_name

            if not event_dir.exists():
                self.skipTest(f"Event directory {event_dir_name} not found")

            handlers = discover_handlers(event_dir)

            for handler in handlers:
                if handler.name in handlers_priority:
                    expected_min, expected_max = handlers_priority[handler.name]

                    with self.subTest(handler=handler.name):
                        self.assertGreaterEqual(
                            handler.priority,
                            expected_min,
                            f"{handler.name} priority too low (security risk)"
                        )
                        self.assertLess(
                            handler.priority,
                            expected_max,
                            f"{handler.name} priority too high"
                        )


if __name__ == '__main__':
    unittest.main()
