#!/usr/bin/env python3
"""
Handler Registry Module

Provides auto-discovery and registration of handlers in event folders.
"""

import importlib.util
import inspect
import sys
from pathlib import Path
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .base_handler import BaseHandler


def import_module_from_path(file_path: Path) -> object:
    """
    Import a Python module from a file path.

    Args:
        file_path: Path to the .py file

    Returns:
        The imported module
    """
    module_name = file_path.stem
    spec = importlib.util.spec_from_file_location(module_name, file_path)

    if spec is None or spec.loader is None:
        raise ImportError(f"Cannot load module from {file_path}")

    module = importlib.util.module_from_spec(spec)
    sys.modules[module_name] = module
    spec.loader.exec_module(module)

    return module


def discover_handlers(event_dir: Path) -> list[type['BaseHandler']]:
    """
    Auto-discover handler classes in an event directory.

    Scans all .py files (except those starting with _),
    imports them, and finds BaseHandler subclasses.

    Args:
        event_dir: Path to the on_* event directory

    Returns:
        List of handler classes sorted by priority (ascending)
    """
    # Import here to avoid circular imports
    from .base_handler import BaseHandler

    handlers: list[type[BaseHandler]] = []

    if not event_dir.is_dir():
        return handlers

    for py_file in event_dir.glob("*.py"):
        # Skip __init__.py, __main__.py, and other private files
        if py_file.stem.startswith("_"):
            continue

        try:
            module = import_module_from_path(py_file)

            # Find all classes that inherit from BaseHandler
            for name, obj in inspect.getmembers(module, inspect.isclass):
                if (
                    issubclass(obj, BaseHandler)
                    and obj is not BaseHandler
                    and obj.__module__ == module.__name__
                ):
                    handlers.append(obj)

        except Exception as e:
            # Log but don't fail on import errors
            print(f"Warning: Failed to import {py_file}: {e}", file=sys.stderr)
            continue

    # Sort by priority (lower runs first)
    return sorted(handlers, key=lambda h: h.priority)


def get_event_dir(event_name: str) -> Path:
    """
    Get the directory for an event.

    Args:
        event_name: Name of the event (e.g., 'pre_tool_use')

    Returns:
        Path to the on_{event_name}/ directory
    """
    from .path_utils import get_hooks_dir

    return get_hooks_dir() / f"on_{event_name}"
