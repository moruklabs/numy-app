#!/usr/bin/env python3
"""
Tests for __main__.py entry points in hook event directories

Run with: python3 -m unittest test_hook_entry_points -v
"""

import unittest
import re
import os
from pathlib import Path

PROJECT_ROOT = Path('/Users/fatih/monorepo')
HOOKS_DIR = PROJECT_ROOT / '.claude' / 'hooks'


class TestHookEntryPoints(unittest.TestCase):
    """Test __main__.py entry points for all hook events."""

    @classmethod
    def setUpClass(cls):
        """Discover all __main__.py files in hook directories."""
        cls.entry_points = []
        for event_dir in HOOKS_DIR.iterdir():
            if event_dir.is_dir() and event_dir.name.startswith('on_'):
                main_file = event_dir / '__main__.py'
                if main_file.exists():
                    cls.entry_points.append({
                        'event_dir': event_dir,
                        'main_file': main_file,
                        'event_name': event_dir.name.removeprefix('on_')
                    })

    def test_all_entry_points_have_uv_shebang(self):
        """Test all __main__.py files have correct uv run shebang."""
        expected_shebang = '#!/usr/bin/env -S uv run --script'

        for entry in self.entry_points:
            with self.subTest(event=entry['event_name']):
                content = entry['main_file'].read_text()
                first_line = content.split('\n')[0]

                self.assertEqual(
                    first_line,
                    expected_shebang,
                    f"{entry['main_file']}: Expected shebang '{expected_shebang}'"
                )

    def test_all_entry_points_have_inline_dependencies(self):
        """Test all __main__.py files have inline dependency declaration."""
        for entry in self.entry_points:
            with self.subTest(event=entry['event_name']):
                content = entry['main_file'].read_text()

                self.assertIn(
                    '# /// script',
                    content,
                    f"{entry['main_file']}: Missing inline script metadata"
                )
                self.assertIn(
                    '# requires-python',
                    content,
                    f"{entry['main_file']}: Missing requires-python"
                )
                self.assertIn(
                    '# dependencies',
                    content,
                    f"{entry['main_file']}: Missing dependencies declaration"
                )

    def test_all_entry_points_import_from_utils(self):
        """Test all __main__.py files import from utils."""
        for entry in self.entry_points:
            with self.subTest(event=entry['event_name']):
                content = entry['main_file'].read_text()

                self.assertIn(
                    'from utils import run_event',
                    content,
                    f"{entry['main_file']}: Should import run_event from utils"
                )

    def test_all_entry_points_call_run_event(self):
        """Test all __main__.py files call run_event with correct event name."""
        for entry in self.entry_points:
            with self.subTest(event=entry['event_name']):
                content = entry['main_file'].read_text()
                event_name = entry['event_name']

                # Check for: sys.exit(run_event('event_name'))
                pattern = rf"run_event\(['\"]({event_name})['\"\)]"
                match = re.search(pattern, content)

                self.assertIsNotNone(
                    match,
                    f"{entry['main_file']}: Should call run_event('{event_name}')"
                )

    def test_all_entry_points_setup_sys_path(self):
        """Test all __main__.py files setup sys.path correctly."""
        for entry in self.entry_points:
            with self.subTest(event=entry['event_name']):
                content = entry['main_file'].read_text()

                self.assertIn(
                    'sys.path.insert(0,',
                    content,
                    f"{entry['main_file']}: Should setup sys.path for utils import"
                )

    def test_all_entry_points_are_executable(self):
        """Test all __main__.py files have executable permissions."""
        for entry in self.entry_points:
            with self.subTest(event=entry['event_name']):
                # Check if file is executable
                is_executable = os.access(entry['main_file'], os.X_OK)

                self.assertTrue(
                    is_executable,
                    f"{entry['main_file']}: Should have executable permissions"
                )


if __name__ == '__main__':
    unittest.main()
