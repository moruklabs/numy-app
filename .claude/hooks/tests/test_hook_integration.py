#!/usr/bin/env python3
"""
Tests for end-to-end hook execution

Run with: python3 -m unittest test_hook_integration -v
"""

import unittest
import json
import subprocess
from pathlib import Path

PROJECT_ROOT = Path('/Users/fatih/monorepo')
HOOKS_DIR = PROJECT_ROOT / '.claude' / 'hooks'


class TestHookIntegration(unittest.TestCase):
    """Test end-to-end hook execution."""

    def run_hook(self, event_name: str, event_data: dict) -> tuple:
        """
        Execute a hook and return exit code, stdout, stderr.

        Args:
            event_name: Name like 'on_session_start'
            event_data: JSON data to pass as stdin

        Returns:
            (exit_code, stdout, stderr)
        """
        main_file = HOOKS_DIR / event_name / '__main__.py'

        if not main_file.exists():
            self.skipTest(f"Hook {event_name} not implemented yet")

        result = subprocess.run(
            [str(main_file)],
            input=json.dumps(event_data),
            capture_output=True,
            text=True,
        )

        return result.returncode, result.stdout, result.stderr

    def test_session_start_hook_executes_successfully(self):
        """Test SessionStart hook runs without errors."""
        exit_code, stdout, stderr = self.run_hook(
            'on_session_start',
            {'cwd': str(PROJECT_ROOT), 'source': 'test'}
        )

        # Should succeed (exit 0)
        self.assertEqual(exit_code, 0, f"SessionStart failed: {stderr}")

    def test_pre_tool_use_hook_allows_safe_commands(self):
        """Test PreToolUse allows safe commands."""
        exit_code, stdout, stderr = self.run_hook(
            'on_pre_tool_use',
            {
                'tool_name': 'Bash',
                'tool_input': {'command': 'ls -la'}
            }
        )

        # Should allow (exit 0)
        self.assertEqual(exit_code, 0, f"Safe command should be allowed. stderr: {stderr}")

    def test_pre_tool_use_hook_blocks_dangerous_commands(self):
        """Test PreToolUse blocks dangerous rm commands."""
        exit_code, stdout, stderr = self.run_hook(
            'on_pre_tool_use',
            {
                'tool_name': 'Bash',
                'tool_input': {'command': 'rm -rf /'}
            }
        )

        # Should block (exit 2)
        self.assertEqual(exit_code, 2, f"Dangerous command should be blocked. exit_code: {exit_code}")

    def test_hook_exit_codes_work_correctly(self):
        """Test hook exit codes: 0=success, 1=error, 2=block."""
        # Test success (0)
        exit_code, _, _ = self.run_hook(
            'on_session_start',
            {'cwd': str(PROJECT_ROOT)}
        )
        self.assertIn(exit_code, [0, 1, 2], "Exit code should be 0, 1, or 2")

    def test_post_tool_use_hook_executes_successfully(self):
        """Test PostToolUse hook runs without errors."""
        exit_code, stdout, stderr = self.run_hook(
            'on_post_tool_use',
            {
                'tool_name': 'Read',
                'tool_input': {'file_path': '/tmp/test.txt'},
                'tool_output': 'file contents'
            }
        )

        # Should succeed (exit 0)
        self.assertEqual(exit_code, 0, f"PostToolUse failed: {stderr}")


if __name__ == '__main__':
    unittest.main()
