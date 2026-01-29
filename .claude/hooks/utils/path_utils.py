#!/usr/bin/env python3
"""
Path Utilities Module

Provides consistent path resolution based on git repository root.
Hooks can be invoked from anywhere - this ensures consistent behavior.
"""

import subprocess
from functools import lru_cache
from pathlib import Path


def _get_hooks_dir_from_file() -> Path:
    """Get hooks directory based on this file's location."""
    # utils/ is inside .claude/hooks/
    return Path(__file__).parent.parent.resolve()


@lru_cache(maxsize=1)
def get_project_root() -> Path:
    """
    Get the project root directory (where logs should be stored).

    Always uses the git root of the HOOKS repository, not the current
    working directory. This ensures logs go to the same place regardless
    of where hooks are invoked from.

    Priority:
    1. Git repository root of the hooks directory
    2. Parent of .claude directory (derived from hooks location)

    Returns:
        Path to project root
    """
    hooks_dir = _get_hooks_dir_from_file()

    # Run git from hooks directory to get ITS git root, not cwd's
    try:
        result = subprocess.run(
            ['git', 'rev-parse', '--show-toplevel'],
            capture_output=True,
            text=True,
            timeout=5,
            cwd=hooks_dir,  # Run from hooks dir, not pwd
        )
        if result.returncode == 0:
            return Path(result.stdout.strip())
    except (subprocess.TimeoutExpired, subprocess.SubprocessError, FileNotFoundError):
        pass

    # Fallback: derive from hooks directory location
    # hooks are at <project>/.claude/hooks, so go up two levels
    return hooks_dir.parent.parent


# Alias for backward compatibility
get_git_root = get_project_root


def get_logs_dir() -> Path:
    """
    Get the logs directory path (relative to project root).

    Creates the directory if it doesn't exist.

    Returns:
        Path to logs directory
    """
    logs_dir = get_project_root() / 'logs'
    logs_dir.mkdir(parents=True, exist_ok=True)
    return logs_dir


def get_hooks_dir() -> Path:
    """
    Get the hooks directory path.

    Uses the actual file location, not git root.

    Returns:
        Path to .claude/hooks directory
    """
    return _get_hooks_dir_from_file()


def clear_cache() -> None:
    """Clear the cached project root (useful for testing)."""
    get_project_root.cache_clear()


# Alias for backward compatibility
clear_git_root_cache = clear_cache
