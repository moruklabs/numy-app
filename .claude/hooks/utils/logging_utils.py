#!/usr/bin/env python3
"""
Logging Utilities Module

Provides DRY logging functionality for all hooks.
"""

import json
from pathlib import Path
from typing import Any

from .path_utils import get_logs_dir


class LogManager:
    """
    Centralized log management for hooks.

    Uses git repository root for log storage,
    ensuring consistent behavior regardless of cwd.
    """

    def __init__(self, log_dir_name: str = 'logs'):
        self._log_dir_name = log_dir_name

    @property
    def log_dir(self) -> Path:
        """Get the logs directory path (creates if needed)."""
        return get_logs_dir()

    def get_log_path(self, filename: str) -> Path:
        """
        Get full path for a log file.

        Args:
            filename: Name of the log file

        Returns:
            Full path to the log file
        """
        return self.log_dir / filename

    def read_entries(self, filename: str) -> list[dict[str, Any]]:
        """
        Read entries from a JSON log file.

        Args:
            filename: Name of the log file

        Returns:
            List of log entries or empty list
        """
        log_path = self.get_log_path(filename)

        if not log_path.exists():
            return []

        try:
            with log_path.open('r') as handle:
                return json.load(handle)
        except (json.JSONDecodeError, ValueError):
            return []

    def write_entries(self, filename: str, entries: list[dict[str, Any]]) -> None:
        """
        Write entries to a JSON log file.

        Args:
            filename: Name of the log file
            entries: List of entries to write
        """
        log_path = self.get_log_path(filename)

        with log_path.open('w') as handle:
            json.dump(entries, handle, indent=2)

    def append_entry(self, filename: str, entry: dict[str, Any]) -> None:
        """
        Append a single entry to a log file.

        Uses JSONL format (one JSON object per line) for true atomic appends.
        This avoids race conditions when multiple hooks run in parallel.

        Args:
            filename: Name of the log file
            entry: Entry to append
        """
        # Use .jsonl extension for line-based format
        if filename.endswith('.json'):
            filename = filename[:-5] + '.jsonl'

        log_path = self.get_log_path(filename)

        # Atomic append - no read-modify-write race condition
        with log_path.open('a') as handle:
            handle.write(json.dumps(entry) + '\n')

    def read_jsonl(self, filepath: Path) -> list[dict[str, Any]]:
        """
        Read entries from a JSONL file (like transcripts).

        Args:
            filepath: Path to the JSONL file

        Returns:
            List of parsed entries
        """
        if not filepath.exists():
            return []

        entries = []
        try:
            with filepath.open('r') as handle:
                for line in handle:
                    if not line.strip():
                        continue
                    try:
                        entries.append(json.loads(line))
                    except json.JSONDecodeError:
                        continue
        except Exception:
            return []

        return entries

    def read_log_entries(self, filename: str) -> list[dict[str, Any]]:
        """
        Read entries from a log file (supports both JSON and JSONL).

        Args:
            filename: Name of the log file (with or without extension)

        Returns:
            List of log entries
        """
        # Try JSONL first (preferred format for append_entry)
        jsonl_name = filename.replace('.json', '.jsonl') if filename.endswith('.json') else filename
        if not jsonl_name.endswith('.jsonl'):
            jsonl_name += '.jsonl'

        jsonl_path = self.get_log_path(jsonl_name)
        if jsonl_path.exists():
            return self.read_jsonl(jsonl_path)

        # Fall back to JSON format
        return self.read_entries(filename)

    def save_chat(self, transcript_path: Path) -> None:
        """
        Save a transcript as chat.json in logs.

        Args:
            transcript_path: Path to the transcript file
        """
        if not transcript_path.is_file():
            return

        entries = self.read_jsonl(transcript_path)
        if entries:
            self.write_entries('chat.json', entries)
