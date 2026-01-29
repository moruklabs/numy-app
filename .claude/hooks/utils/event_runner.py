#!/usr/bin/env python3
"""
Event Runner Module

Orchestrates the execution of handlers for an event.
"""

import argparse
import json
import sys
import traceback
from datetime import datetime
from typing import Any

from .base_handler import BaseHandler, HandlerContext, HandlerResult
from .handler_registry import discover_handlers, get_event_dir


def log_and_announce_error(
    event_name: str,
    handler_name: str | None,
    error: Exception,
) -> None:
    """
    Log hook error to file.

    Args:
        event_name: Name of the event that failed
        handler_name: Name of the handler (if applicable)
        error: The exception that occurred
    """
    # Use fixed location for consistent error logs across all projects
    from pathlib import Path
    hook_logs_dir = Path.home() / '.claude' / 'logs'
    hook_logs_dir.mkdir(parents=True, exist_ok=True)
    error_log_path = hook_logs_dir / 'hook_errors.log'
    timestamp = datetime.now().isoformat()
    error_trace = traceback.format_exc()

    # Build log entry
    handler_info = f" (handler: {handler_name})" if handler_name else ""
    log_entry = (
        f"\n{'='*60}\n"
        f"[{timestamp}] Hook Error: {event_name}{handler_info}\n"
        f"Error: {error}\n"
        f"Traceback:\n{error_trace}"
        f"{'='*60}\n"
    )

    # Write to error log
    try:
        with error_log_path.open('a') as f:
            f.write(log_entry)
    except Exception:
        pass  # Don't fail if logging fails

    # Print error location to stderr
    print(
        f"⚠️  Hook error: {error}\n"
        f"📄 Error log: {error_log_path}",
        file=sys.stderr
    )


def parse_stdin() -> dict[str, Any]:
    """
    Parse JSON input from stdin.

    Returns:
        Parsed JSON data or empty dict on error
    """
    try:
        return json.load(sys.stdin)
    except (json.JSONDecodeError, ValueError):
        return {}


def build_argument_parser(
    event_name: str,
    handlers: list[type[BaseHandler]]
) -> argparse.ArgumentParser:
    """
    Build argument parser with all handler arguments.

    Args:
        event_name: Name of the event
        handlers: List of handler classes

    Returns:
        Configured ArgumentParser
    """
    parser = argparse.ArgumentParser(
        description=f"Handler runner for {event_name} event"
    )

    # Let each handler add its arguments
    for handler_class in handlers:
        try:
            handler = handler_class()
            handler.configure_args(parser)
        except Exception:
            # Skip handlers that fail to configure args
            continue

    return parser


def run_event(event_name: str) -> int:
    """
    Run all handlers for an event.

    Execution flow:
    1. Parse stdin JSON → event_data
    2. Discover handlers for this event
    3. Build argument parser with all handler args
    4. Parse CLI args
    5. Create HandlerContext
    6. For each handler (sorted by priority):
       a. Call should_run(context)
       b. If True: call run(context)
       c. If result.block: return 2
       d. If result.error: return 1
    7. Return 0

    Args:
        event_name: Name of the event (e.g., 'pre_tool_use')

    Returns:
        Exit code (0=success, 1=error, 2=block)
    """
    try:
        # Parse input
        event_data = parse_stdin()

        # Discover handlers
        event_dir = get_event_dir(event_name)
        handler_classes = discover_handlers(event_dir)

        if not handler_classes:
            # No handlers, just succeed
            return 0

        # Build parser and parse args
        parser = build_argument_parser(event_name, handler_classes)
        args = parser.parse_args()

        # Create context
        context = HandlerContext(
            event_name=event_name,
            event_data=event_data,
            args=args,
            shared_state={},
        )

        # Run handlers in priority order
        for handler_class in handler_classes:
            try:
                handler = handler_class()

                # Check if handler should run
                if not handler.should_run(context):
                    continue

                # Execute handler
                result = handler.run(context)

                # Handle output
                if result.message:
                    print(result.message, file=sys.stderr)

                if result.stdout:
                    print(result.stdout)

                # Check for blocking/error
                if result.block:
                    return 2

                if result.error:
                    return 1

            except Exception as e:
                # Log and show error log location
                log_and_announce_error(event_name, handler_class.name, e)
                continue

        return 0

    except Exception as e:
        # Log and show error log location for top-level errors
        log_and_announce_error(event_name, None, e)
        return 0  # Fail silently to not break Claude Code


def create_event_main(event_name: str):
    """
    Create a main function for an event's __main__.py.

    Args:
        event_name: Name of the event

    Returns:
        Main function that runs the event handlers
    """
    def main() -> int:
        return run_event(event_name)
    return main
