#!/usr/bin/env python3
"""
Tests for logging utilities.

Verifies that:
1. append_entry uses JSONL format for atomic appends
2. Multiple concurrent appends don't overwrite each other
3. read_log_entries works with both JSON and JSONL formats
"""

import json
import sys
import threading
import time
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from unittest.mock import patch

import pytest

sys.path.insert(0, str(Path(__file__).parent.parent))

from utils.logging_utils import LogManager


class TestAppendEntry:
    """Tests for atomic append functionality."""

    @pytest.fixture
    def temp_log_dir(self, tmp_path: Path):
        """Create a temporary log directory."""
        log_dir = tmp_path / 'logs'
        log_dir.mkdir(parents=True)
        return log_dir

    @pytest.fixture
    def log_manager(self, temp_log_dir: Path):
        """Create LogManager with temp directory."""
        with patch('utils.logging_utils.get_logs_dir', return_value=temp_log_dir):
            yield LogManager()

    def test_append_creates_jsonl_file(self, log_manager: LogManager, temp_log_dir: Path):
        """Verify append_entry creates .jsonl file instead of .json."""
        # When
        log_manager.append_entry('test.json', {'key': 'value'})

        # Then
        assert (temp_log_dir / 'test.jsonl').exists()
        assert not (temp_log_dir / 'test.json').exists()

    def test_append_writes_single_line(self, log_manager: LogManager, temp_log_dir: Path):
        """Verify each entry is written as a single line."""
        # When
        log_manager.append_entry('test.json', {'key': 'value1'})
        log_manager.append_entry('test.json', {'key': 'value2'})

        # Then
        content = (temp_log_dir / 'test.jsonl').read_text()
        lines = [l for l in content.strip().split('\n') if l]
        assert len(lines) == 2
        assert json.loads(lines[0]) == {'key': 'value1'}
        assert json.loads(lines[1]) == {'key': 'value2'}

    def test_append_is_atomic(self, log_manager: LogManager, temp_log_dir: Path):
        """Verify concurrent appends don't lose entries."""
        # Given
        num_threads = 10
        entries_per_thread = 100

        def append_entries(thread_id: int):
            for i in range(entries_per_thread):
                log_manager.append_entry('concurrent.json', {
                    'thread': thread_id,
                    'entry': i,
                })

        # When - run concurrent appends
        with ThreadPoolExecutor(max_workers=num_threads) as executor:
            futures = [executor.submit(append_entries, i) for i in range(num_threads)]
            for f in futures:
                f.result()

        # Then - all entries should be present
        content = (temp_log_dir / 'concurrent.jsonl').read_text()
        lines = [l for l in content.strip().split('\n') if l]

        assert len(lines) == num_threads * entries_per_thread, \
            f"Expected {num_threads * entries_per_thread} entries, got {len(lines)}"

        # Verify all entries are valid JSON
        for line in lines:
            entry = json.loads(line)
            assert 'thread' in entry
            assert 'entry' in entry

    def test_append_preserves_order_within_thread(self, log_manager: LogManager, temp_log_dir: Path):
        """Verify entries from same thread are in order."""
        # When
        for i in range(10):
            log_manager.append_entry('order.json', {'index': i})

        # Then
        content = (temp_log_dir / 'order.jsonl').read_text()
        lines = [l for l in content.strip().split('\n') if l]

        for i, line in enumerate(lines):
            entry = json.loads(line)
            assert entry['index'] == i


class TestReadLogEntries:
    """Tests for read_log_entries which supports both formats."""

    @pytest.fixture
    def temp_log_dir(self, tmp_path: Path):
        """Create a temporary log directory."""
        log_dir = tmp_path / 'logs'
        log_dir.mkdir(parents=True)
        return log_dir

    @pytest.fixture
    def log_manager(self, temp_log_dir: Path):
        """Create LogManager with temp directory."""
        with patch('utils.logging_utils.get_logs_dir', return_value=temp_log_dir):
            yield LogManager()

    def test_reads_jsonl_format(self, log_manager: LogManager, temp_log_dir: Path):
        """Verify read_log_entries reads JSONL files."""
        # Given
        jsonl_path = temp_log_dir / 'test.jsonl'
        jsonl_path.write_text('{"a": 1}\n{"b": 2}\n')

        # When
        entries = log_manager.read_log_entries('test.json')

        # Then
        assert len(entries) == 2
        assert entries[0] == {'a': 1}
        assert entries[1] == {'b': 2}

    def test_falls_back_to_json_format(self, log_manager: LogManager, temp_log_dir: Path):
        """Verify read_log_entries falls back to JSON if no JSONL."""
        # Given
        json_path = temp_log_dir / 'legacy.json'
        json_path.write_text('[{"a": 1}, {"b": 2}]')

        # When
        entries = log_manager.read_log_entries('legacy.json')

        # Then
        assert len(entries) == 2
        assert entries[0] == {'a': 1}
        assert entries[1] == {'b': 2}

    def test_prefers_jsonl_over_json(self, log_manager: LogManager, temp_log_dir: Path):
        """Verify JSONL takes precedence if both exist."""
        # Given
        (temp_log_dir / 'both.json').write_text('[{"source": "json"}]')
        (temp_log_dir / 'both.jsonl').write_text('{"source": "jsonl"}\n')

        # When
        entries = log_manager.read_log_entries('both.json')

        # Then
        assert len(entries) == 1
        assert entries[0] == {'source': 'jsonl'}

    def test_returns_empty_for_missing_file(self, log_manager: LogManager):
        """Verify empty list returned for non-existent file."""
        entries = log_manager.read_log_entries('nonexistent.json')
        assert entries == []


class TestReadWriteCompatibility:
    """Tests for compatibility between append and read operations."""

    @pytest.fixture
    def temp_log_dir(self, tmp_path: Path):
        """Create a temporary log directory."""
        log_dir = tmp_path / 'logs'
        log_dir.mkdir(parents=True)
        return log_dir

    @pytest.fixture
    def log_manager(self, temp_log_dir: Path):
        """Create LogManager with temp directory."""
        with patch('utils.logging_utils.get_logs_dir', return_value=temp_log_dir):
            yield LogManager()

    def test_append_then_read(self, log_manager: LogManager):
        """Verify entries written with append_entry can be read back."""
        # Given
        entries_to_write = [
            {'event': 'start', 'timestamp': '2025-01-01'},
            {'event': 'tool_use', 'tool': 'Read'},
            {'event': 'stop', 'status': 'success'},
        ]

        # When
        for entry in entries_to_write:
            log_manager.append_entry('events.json', entry)

        # Then
        read_entries = log_manager.read_log_entries('events.json')
        assert read_entries == entries_to_write

    def test_complex_nested_entries(self, log_manager: LogManager):
        """Verify complex nested structures are preserved."""
        # Given
        complex_entry = {
            'tool_input': {
                'nested': {
                    'deep': [1, 2, {'key': 'value'}]
                }
            },
            'list': [None, True, False, 123.456],
            'unicode': 'émoji 🎉',
        }

        # When
        log_manager.append_entry('complex.json', complex_entry)

        # Then
        entries = log_manager.read_log_entries('complex.json')
        assert len(entries) == 1
        assert entries[0] == complex_entry


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
