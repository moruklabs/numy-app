#!/usr/bin/env python3
"""
Base Handler Module

Defines the contract for all event handlers following Open-Closed Principle.
Handlers extend BaseHandler without modifying it.
"""

from __future__ import annotations

import argparse
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from functools import cached_property
from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    from .types import HookEvent


@dataclass
class HandlerContext:
    """
    Context passed to all handlers during event processing.

    Attributes:
        event_name: Name of the event (e.g., 'pre_tool_use')
        event_data: JSON data from stdin (untyped, for backward compatibility)
        args: Parsed command line arguments
        shared_state: Mutable dict for handler-to-handler communication

    Properties:
        typed_event: Strongly-typed Pydantic model of the event (lazy-loaded)
    """

    event_name: str
    event_data: dict[str, Any]
    args: argparse.Namespace
    shared_state: dict[str, Any] = field(default_factory=dict)

    # Cache for typed event (not a dataclass field)
    _typed_event: "HookEvent | None" = field(default=None, repr=False, compare=False)

    @cached_property
    def typed_event(self) -> "HookEvent | None":
        """
        Get the event data as a strongly-typed Pydantic model.

        Returns:
            Typed hook event model with runtime validation, or None if pydantic unavailable

        Raises:
            ValueError: If hook_event_name is missing or unknown
            ValidationError: If data doesn't match expected schema

        Example:
            >>> if isinstance(context.typed_event, PreToolUseEvent):
            ...     tool = context.typed_event.tool_name
            ...     if context.typed_event.tool_name == "Bash":
            ...         cmd = context.typed_event.get_typed_input()
        """
        try:
            from .types import parse_hook_event
            return parse_hook_event(self.event_data)
        except ImportError:
            # pydantic not available
            return None

    def get_tool_name(self) -> str | None:
        """Convenience method to get tool_name for tool-related events."""
        return self.event_data.get("tool_name")

    def get_tool_input(self) -> dict[str, Any]:
        """Convenience method to get tool_input for tool-related events."""
        return self.event_data.get("tool_input", {})

    def get_session_id(self) -> str | None:
        """Convenience method to get session_id."""
        return self.event_data.get("session_id")

    def get_cwd(self) -> str:
        """Convenience method to get current working directory."""
        return self.event_data.get("cwd", "")


@dataclass
class HandlerResult:
    """
    Result returned from handler execution.

    Attributes:
        success: Whether the handler executed successfully
        block: If True, blocks the operation (exit code 2)
        error: If True, indicates an error (exit code 1)
        message: Message to print to stderr
        stdout: Output to print to stdout (for hook-specific output)
    """

    success: bool = True
    block: bool = False
    error: bool = False
    message: str | None = None
    stdout: str | None = None


class BaseHandler(ABC):
    """
    Abstract base class defining the handler contract.

    All handlers must implement:
    - should_run(): Decide if handler should execute
    - run(): Execute the handler logic

    Handlers are auto-discovered and sorted by priority.
    Lower priority number = runs first.
    """

    # Metadata - override in subclasses
    name: str = "unnamed"
    description: str = ""
    priority: int = 100  # 0-99: blockers, 100-199: standard, 800-899: observers, 900-999: cleanup

    @abstractmethod
    def should_run(self, context: HandlerContext) -> bool:
        """
        Determine if this handler should run for the given event.

        Args:
            context: Event context with data, args, and shared state

        Returns:
            True if handler should execute, False to skip
        """
        ...

    @abstractmethod
    def run(self, context: HandlerContext) -> HandlerResult:
        """
        Execute the handler logic.

        Args:
            context: Event context with data, args, and shared state

        Returns:
            HandlerResult indicating success/failure/block
        """
        ...

    def configure_args(self, parser: argparse.ArgumentParser) -> None:
        """
        Optional: Add handler-specific CLI arguments.

        Override this method to add arguments that control handler behavior.

        Args:
            parser: ArgumentParser to add arguments to
        """
        pass
