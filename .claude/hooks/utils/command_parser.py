#!/usr/bin/env python3
"""
Command Parser Utility

Provides functionality to parse and analyze bash commands for pattern detection.
"""

import re
from typing import Dict, Optional


class CommandParser:
    """Utility class for parsing and analyzing bash commands."""

    # Common cargo build patterns to detect
    CARGO_PATTERNS = [
        r'\(\s*cd\s+[^)]+\s*&&\s*cargo\s+build\s+--release[^)]*\)',  # (cd path && cargo build --release)
        r'cd\s+[^;]+;\s*cargo\s+build\s+--release',                   # cd path; cargo build --release
        r'cargo\s+build\s+--release',                                 # Direct cargo build --release
    ]

    # Release script patterns (allowed)
    ALLOWED_PATTERNS = [
        r'\.\/release\.sh',                    # ./release.sh
        r'\.\/cli-tools\/release\.sh',         # ././release.sh
        r'bash\s+.*release\.sh',               # bash something/release.sh
        r'sh\s+.*release\.sh',                 # sh something/release.sh
    ]

    def __init__(self):
        self.cargo_regex = [re.compile(pattern, re.IGNORECASE) for pattern in self.CARGO_PATTERNS]
        self.allowed_regex = [re.compile(pattern, re.IGNORECASE) for pattern in self.ALLOWED_PATTERNS]

    def contains_direct_cargo_build(self, command: str) -> bool:
        """
        Check if command contains direct cargo build --release patterns.

        Args:
            command: The bash command to analyze

        Returns:
            True if command contains blocked cargo patterns
        """
        # First check if it's an allowed pattern (release scripts)
        if self.is_allowed_cargo_usage(command):
            return False

        # Check for blocked patterns
        for pattern in self.cargo_regex:
            if pattern.search(command):
                return True
        return False

    def is_allowed_cargo_usage(self, command: str) -> bool:
        """
        Check if the cargo usage is through an allowed release script.

        Args:
            command: The bash command to analyze

        Returns:
            True if cargo usage is allowed (via release script)
        """
        for pattern in self.allowed_regex:
            if pattern.search(command):
                return True
        return False

    def extract_cargo_pattern(self, command: str) -> Optional[str]:
        """
        Extract the specific cargo pattern that was detected.

        Args:
            command: The bash command to analyze

        Returns:
            The matched cargo pattern or None if no pattern found
        """
        for pattern in self.cargo_regex:
            match = pattern.search(command)
            if match:
                return match.group(0)
        return None

    def extract_tool_name_from_cd(self, command: str) -> Optional[str]:
        """
        Extract tool name from cd command patterns like (cd ./mh && ...).

        Args:
            command: The bash command to analyze

        Returns:
            The tool name or None if not found
        """
        # Pattern to match (cd ./TOOLNAME && ...)
        pattern = r'\(\s*cd\s+./([^/\s)]+)'
        match = re.search(pattern, command)
        if match:
            return match.group(1)

        # Pattern to match cd ./TOOLNAME; ...
        pattern = r'cd\s+./([^/\s;]+)'
        match = re.search(pattern, command)
        if match:
            return match.group(1)

        return None

    def is_bash_tool_command(self, tool_name: str, command: str) -> bool:
        """
        Check if this is a Bash tool command from Claude Code.

        Args:
            tool_name: The tool name being used
            command: The command being executed

        Returns:
            True if this appears to be a Claude Code Bash tool command
        """
        return tool_name == "Bash" and isinstance(command, str)

    def get_command_summary(self, command: str) -> Dict[str, any]:
        """
        Get a summary analysis of the command.

        Args:
            command: The bash command to analyze

        Returns:
            Dictionary with analysis results
        """
        return {
            'has_direct_cargo': self.contains_direct_cargo_build(command),
            'is_allowed': self.is_allowed_cargo_usage(command),
            'cargo_pattern': self.extract_cargo_pattern(command),
            'tool_name': self.extract_tool_name_from_cd(command),
            'command_length': len(command),
            'command_preview': command[:100] + '...' if len(command) > 100 else command
        }
