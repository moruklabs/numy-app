#!/usr/bin/env python3
"""
Base Hook Module

Provides abstract base class for all Claude Code hooks following
Open-Closed Principle. Hooks extend this class without modifying it.
"""

import argparse
import json
import sys
from abc import ABC, abstractmethod
from pathlib import Path
from typing import Any

from .logging_utils import LogManager
from .path_utils import get_git_root, get_hooks_dir


class BaseHook(ABC):
    """
    Abstract base class for Claude Code hooks.

    Implements Template Method pattern for consistent hook execution.
    Subclasses implement specific behavior via abstract methods.
    """

    def __init__(self):
        self._log_manager = LogManager()
        self._input_data: dict[str, Any] = {}
        self._args: argparse.Namespace | None = None

    @property
    def repo_root(self) -> Path:
        """Git repository root directory."""
        return get_git_root()

    @property
    def hooks_dir(self) -> Path:
        """Directory containing all hooks."""
        return get_hooks_dir()

    @property
    def utils_dir(self) -> Path:
        """Directory containing utility modules."""
        return self.hooks_dir / 'utils'

    @property
    def input_data(self) -> dict[str, Any]:
        """Parsed JSON input from stdin."""
        return self._input_data

    @property
    def args(self) -> argparse.Namespace | None:
        """Parsed command line arguments."""
        return self._args

    @property
    @abstractmethod
    def log_filename(self) -> str:
        """Return the log filename for this hook (e.g., 'pre_tool_use.json')."""
        ...

    def configure_parser(self, parser: argparse.ArgumentParser) -> None:
        """
        Override to add hook-specific arguments.

        Args:
            parser: ArgumentParser to configure
        """
        pass

    @abstractmethod
    def process(self) -> int:
        """
        Main processing logic for the hook.

        Returns:
            Exit code (0=success, 1=error, 2=block)
        """
        ...

    def parse_stdin(self) -> dict[str, Any]:
        """
        Parse JSON input from stdin.

        Returns:
            Parsed JSON data or empty dict on error
        """
        try:
            return json.load(sys.stdin)
        except (json.JSONDecodeError, ValueError):
            return {}

    def log_event(self, data: dict[str, Any] | None = None) -> None:
        """
        Log event data to the hook's log file.

        Args:
            data: Data to log (defaults to input_data)
        """
        self._log_manager.append_entry(
            self.log_filename,
            data if data is not None else self._input_data
        )

    def run(self) -> int:
        """
        Execute the hook using Template Method pattern.

        Returns:
            Exit code for the hook
        """
        try:
            # Parse arguments
            parser = argparse.ArgumentParser()
            self.configure_parser(parser)
            self._args = parser.parse_args()

            # Parse stdin
            self._input_data = self.parse_stdin()

            # Execute hook logic
            return self.process()

        except json.JSONDecodeError:
            return 0
        except Exception:
            return 0


def run_hook(hook_class: type[BaseHook]) -> None:
    """
    Entry point helper to run a hook class.

    Args:
        hook_class: The hook class to instantiate and run
    """
    try:
        hook = hook_class()
        sys.exit(hook.run())
    except Exception:
        sys.exit(0)
