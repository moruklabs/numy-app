#!/usr/bin/env python3
"""
Tests for hook registration in .claude/settings.json

Run with: python3 -m unittest test_hook_registration -v
"""

import unittest
import json
from pathlib import Path

PROJECT_ROOT = Path('/Users/fatih/monorepo')
HOOKS_DIR = PROJECT_ROOT / '.claude' / 'hooks'
SETTINGS_PATH = PROJECT_ROOT / '.claude' / 'settings.json'


class TestHookRegistration(unittest.TestCase):
    """Test hook registration in .claude/settings.json"""

    @classmethod
    def setUpClass(cls):
        """Load settings.json once for all tests."""
        with SETTINGS_PATH.open() as f:
            cls.settings = json.load(f)
        cls.hooks_config = cls.settings.get('hooks', {})

    def test_settings_file_exists(self):
        """Test that .claude/settings.json exists."""
        self.assertTrue(
            SETTINGS_PATH.exists(),
            f"Settings file not found at {SETTINGS_PATH}"
        )

    def test_hooks_section_exists(self):
        """Test that 'hooks' section exists in settings."""
        self.assertIn('hooks', self.settings, "Missing 'hooks' section in settings.json")
        self.assertIsInstance(self.hooks_config, dict, "'hooks' must be a dictionary")

    def test_all_registered_events_have_valid_paths(self):
        """Test all registered events point to valid __main__.py files."""
        for event_name, event_config in self.hooks_config.items():
            with self.subTest(event=event_name):
                self.assertIsInstance(event_config, list, f"{event_name} config must be a list")

                for config_item in event_config:
                    hooks_list = config_item.get('hooks', [])
                    self.assertIsInstance(hooks_list, list, f"{event_name} hooks must be a list")

                    for hook in hooks_list:
                        command = hook.get('command', '')

                        # Resolve $CLAUDE_PROJECT_DIR
                        resolved = command.replace('$CLAUDE_PROJECT_DIR', str(PROJECT_ROOT))
                        path = Path(resolved)

                        self.assertTrue(
                            path.exists(),
                            f"Hook command path does not exist: {command} -> {path}"
                        )
                        self.assertTrue(
                            path.is_file(),
                            f"Hook command is not a file: {path}"
                        )
                        self.assertEqual(
                            path.name,
                            '__main__.py',
                            f"Hook command should point to __main__.py: {path}"
                        )

    def test_paths_use_claude_project_dir_variable(self):
        """Test all registered paths use $CLAUDE_PROJECT_DIR variable."""
        for event_name, event_config in self.hooks_config.items():
            with self.subTest(event=event_name):
                for config_item in event_config:
                    for hook in config_item.get('hooks', []):
                        command = hook.get('command', '')
                        self.assertIn(
                            '$CLAUDE_PROJECT_DIR',
                            command,
                            f"Command should use $CLAUDE_PROJECT_DIR: {command}"
                        )

    def test_expected_events_are_registered(self):
        """Test that commonly expected events are registered."""
        expected_events = [
            'PreToolUse',
            'PostToolUse',
            'SessionStart',
            'Stop',
            'SubagentStop',
            'UserPromptSubmit',
        ]

        for event in expected_events:
            with self.subTest(event=event):
                self.assertIn(
                    event,
                    self.hooks_config,
                    f"Expected event '{event}' not registered in settings.json"
                )

    def test_no_duplicate_event_registrations(self):
        """Test that each event is registered only once."""
        event_names = list(self.hooks_config.keys())
        unique_events = set(event_names)

        self.assertEqual(
            len(event_names),
            len(unique_events),
            f"Duplicate event registrations found: {event_names}"
        )

    def test_all_hook_directories_have_registration(self):
        """Test that all on_* directories with __main__.py have corresponding registration."""
        # Map directory names to event names
        dir_to_event = {
            'on_pre_tool_use': 'PreToolUse',
            'on_post_tool_use': 'PostToolUse',
            'on_session_start': 'SessionStart',
            'on_stop': 'Stop',
            'on_subagent_stop': 'SubagentStop',
            'on_user_prompt_submit': 'UserPromptSubmit',
            'on_pre_compact': 'PreCompact',
            'on_notification': 'Notification',
            'on_agent_decision': 'AgentDecision',
            'on_tool_start': 'ToolStart',
            'on_tool_complete': 'ToolComplete',
        }

        event_dirs = [d for d in HOOKS_DIR.iterdir() if d.is_dir() and d.name.startswith('on_')]

        for event_dir in event_dirs:
            # Skip directories without __main__.py (not ready for registration)
            main_file = event_dir / '__main__.py'
            if not main_file.exists():
                continue

            expected_event = dir_to_event.get(event_dir.name)
            if expected_event:
                with self.subTest(directory=event_dir.name):
                    self.assertIn(
                        expected_event,
                        self.hooks_config,
                        f"Directory {event_dir.name} exists with __main__.py but not registered in settings.json"
                    )


if __name__ == '__main__':
    unittest.main()
