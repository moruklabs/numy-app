#!/usr/bin/env python3
"""
Tests for hook error logging functionality.

Verifies that hook errors are:
1. Logged to ~/.claude/logs/hook_errors.log
2. Printed to stderr with log location
"""

import sys
import tempfile
from datetime import datetime, timedelta
from io import StringIO
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest

sys.path.insert(0, str(Path(__file__).parent.parent))

from utils.event_runner import log_and_announce_error


class TestLogAndAnnounceError:
    """Tests for the log_and_announce_error function."""

    @pytest.fixture
    def temp_log_dir(self, tmp_path: Path):
        """Create a temporary log directory."""
        log_dir = tmp_path / '.claude' / 'logs'
        log_dir.mkdir(parents=True)
        return log_dir

    @pytest.fixture
    def mock_home(self, temp_log_dir: Path):
        """Mock Path.home() to use temp directory."""
        with patch('pathlib.Path.home') as mock:
            mock.return_value = temp_log_dir.parent.parent
            yield mock

    def test_error_logged_to_file(self, mock_home, temp_log_dir: Path):
        """Verify error is written to hook_errors.log."""
        # Given
        error = ValueError("Test error message")
        event_name = "pre_tool_use"
        handler_name = "test_handler"

        # When
        with patch('sys.stderr', new_callable=StringIO):
            try:
                raise error
            except ValueError as e:
                log_and_announce_error(event_name, handler_name, e)

        # Then
        log_file = temp_log_dir / 'hook_errors.log'
        assert log_file.exists(), "Log file should be created"

        content = log_file.read_text()
        assert "Hook Error: pre_tool_use" in content
        assert "(handler: test_handler)" in content
        assert "Test error message" in content
        assert "ValueError" in content

    def test_error_logged_without_handler_name(self, mock_home, temp_log_dir: Path):
        """Verify error is logged when handler_name is None."""
        # Given
        error = RuntimeError("Top-level error")
        event_name = "post_tool_use"

        # When
        with patch('sys.stderr', new_callable=StringIO):
            try:
                raise error
            except RuntimeError as e:
                log_and_announce_error(event_name, None, e)

        # Then
        log_file = temp_log_dir / 'hook_errors.log'
        content = log_file.read_text()
        assert "Hook Error: post_tool_use" in content
        assert "(handler:" not in content
        assert "Top-level error" in content

    def test_stderr_output_contains_error_and_path(self, mock_home, temp_log_dir: Path):
        """Verify stderr output shows error message and log path."""
        # Given
        error = KeyError("missing_key")
        event_name = "session_start"
        stderr_capture = StringIO()

        # When
        with patch('sys.stderr', stderr_capture):
            log_and_announce_error(event_name, "handler", error)

        # Then
        output = stderr_capture.getvalue()
        assert "Hook error:" in output
        assert "missing_key" in output
        assert "hook_errors.log" in output

    def test_log_contains_timestamp(self, mock_home, temp_log_dir: Path):
        """Verify log entry includes ISO timestamp."""
        # Given
        error = Exception("Timestamped error")
        before = datetime.now().replace(microsecond=0)

        # When
        with patch('sys.stderr', new_callable=StringIO):
            log_and_announce_error("test_event", None, error)

        after = datetime.now().replace(microsecond=0) + timedelta(seconds=1)

        # Then
        log_file = temp_log_dir / 'hook_errors.log'
        content = log_file.read_text()

        # Extract timestamp from log (format: [2025-12-03T10:30:45.123456])
        import re
        match = re.search(r'\[(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})', content)
        assert match, "Log should contain ISO timestamp"

        logged_time = datetime.fromisoformat(match.group(1))
        assert before <= logged_time <= after

    def test_log_contains_traceback(self, mock_home, temp_log_dir: Path):
        """Verify log entry includes full traceback."""
        # Given
        def inner_function():
            raise TypeError("Type mismatch")

        def outer_function():
            inner_function()

        # When
        with patch('sys.stderr', new_callable=StringIO):
            try:
                outer_function()
            except TypeError as e:
                log_and_announce_error("test_event", "handler", e)

        # Then
        log_file = temp_log_dir / 'hook_errors.log'
        content = log_file.read_text()
        assert "Traceback" in content
        assert "inner_function" in content
        assert "outer_function" in content
        assert "TypeError" in content

    def test_multiple_errors_appended(self, mock_home, temp_log_dir: Path):
        """Verify multiple errors are appended to same log file."""
        # When
        with patch('sys.stderr', new_callable=StringIO):
            log_and_announce_error("event1", "handler1", Exception("First error"))
            log_and_announce_error("event2", "handler2", Exception("Second error"))
            log_and_announce_error("event3", None, Exception("Third error"))

        # Then
        log_file = temp_log_dir / 'hook_errors.log'
        content = log_file.read_text()
        assert "First error" in content
        assert "Second error" in content
        assert "Third error" in content
        assert content.count("Hook Error:") == 3

    def test_log_entry_separator(self, mock_home, temp_log_dir: Path):
        """Verify log entries are separated by delimiter."""
        # When
        with patch('sys.stderr', new_callable=StringIO):
            log_and_announce_error("event", "handler", Exception("Error"))

        # Then
        log_file = temp_log_dir / 'hook_errors.log'
        content = log_file.read_text()
        assert "=" * 60 in content


class TestLogFileLocation:
    """Tests for log file location consistency."""

    def test_log_directory_created_if_missing(self, tmp_path: Path):
        """Verify log directory is created if it doesn't exist."""
        # Given
        non_existent_home = tmp_path / 'new_home'

        with patch('pathlib.Path.home', return_value=non_existent_home):
            # When
            with patch('sys.stderr', new_callable=StringIO):
                log_and_announce_error("event", None, Exception("Error"))

            # Then
            log_dir = non_existent_home / '.claude' / 'logs'
            assert log_dir.exists()
            assert (log_dir / 'hook_errors.log').exists()

    def test_log_path_is_consistent(self):
        """Verify log path is always ~/.claude/logs/hook_errors.log."""
        from pathlib import Path as RealPath

        expected_path = RealPath.home() / '.claude' / 'logs' / 'hook_errors.log'

        stderr_capture = StringIO()
        with patch('sys.stderr', stderr_capture):
            log_and_announce_error("event", None, Exception("Test"))

        output = stderr_capture.getvalue()
        assert str(expected_path) in output


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
