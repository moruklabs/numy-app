#!/usr/bin/env python3
"""
Settings Updater Module

Thread-safe, atomic updates to Claude Code settings.json.
Uses file locking to prevent corruption from concurrent writes.
"""

import fcntl
import json
import logging
import os
from pathlib import Path
from typing import Any, Dict, Optional

logger = logging.getLogger(__name__)


class SettingsUpdater:
    """
    Thread-safe settings.json updater.

    Features:
    - File locking prevents corruption from concurrent writes
    - Atomic write (truncate + write + flush)
    - Idempotent - safe to run multiple times
    - Creates parent directories if missing
    - Preserves existing settings
    - Error resilient - never blocks on failure
    """

    # Default cache configuration to add
    DEFAULT_CACHE_CONFIG = {
        "enabled": True,
        "backend": "hybrid",
        "redis": {
            "host": "localhost",
            "port": 6379
        },
        "qdrant": {
            "host": "localhost",
            "port": 6333
        },
        "observability": {
            "log_hits": True,
            "log_misses": True,
            "log_provider": True
        }
    }

    def __init__(self, settings_path: Optional[Path] = None):
        """
        Initialize settings updater.

        Args:
            settings_path: Path to settings.json (default: ~/.claude/settings.json)
        """
        if settings_path is None:
            self.settings_path = Path.home() / ".claude" / "settings.json"
        else:
            self.settings_path = Path(settings_path)

    def read_settings(self) -> Dict[str, Any]:
        """
        Read current settings from file.

        Returns:
            Settings dictionary (empty dict if file doesn't exist)
        """
        if not self.settings_path.exists():
            return {}

        try:
            with open(self.settings_path, 'r') as f:
                return json.load(f)
        except (json.JSONDecodeError, IOError) as e:
            logger.warning(f"Failed to read settings.json: {e}")
            return {}

    def update_cache_settings(
        self,
        config: Optional[Dict[str, Any]] = None,
        force: bool = False
    ) -> bool:
        """
        Update settings.json to enable cache.

        Args:
            config: Cache configuration to set (uses default if not provided)
            force: Force update even if cache is already configured

        Returns:
            bool: True if updated, False if already set or error
        """
        if config is None:
            config = self.DEFAULT_CACHE_CONFIG.copy()

        try:
            # Ensure parent directory exists
            self.settings_path.parent.mkdir(parents=True, exist_ok=True)

            # Create file if it doesn't exist
            if not self.settings_path.exists():
                self.settings_path.write_text('{}')

            # Atomic read-modify-write with file lock
            with open(self.settings_path, 'r+') as f:
                # Acquire exclusive lock
                fcntl.flock(f.fileno(), fcntl.LOCK_EX)

                try:
                    # Read current settings
                    f.seek(0)
                    try:
                        settings = json.load(f)
                    except json.JSONDecodeError:
                        settings = {}

                    # Check if cache already configured
                    if not force and 'cache' in settings and settings['cache'].get('enabled'):
                        return False  # Already enabled

                    # Update cache settings
                    settings['cache'] = config

                    # Write back atomically
                    f.seek(0)
                    f.truncate()
                    json.dump(settings, f, indent=2)
                    f.flush()
                    os.fsync(f.fileno())  # Ensure write to disk

                    return True

                finally:
                    # Release lock
                    fcntl.flock(f.fileno(), fcntl.LOCK_UN)

        except Exception as e:
            logger.error(f"Failed to update settings.json: {e}")
            return False

    def update_setting(self, key: str, value: Any, force: bool = False) -> bool:
        """
        Update a specific setting.

        Args:
            key: Setting key (supports dot notation: "cache.enabled")
            value: Value to set
            force: Force update even if key exists

        Returns:
            bool: True if updated, False otherwise
        """
        try:
            # Ensure parent directory exists
            self.settings_path.parent.mkdir(parents=True, exist_ok=True)

            # Create file if it doesn't exist
            if not self.settings_path.exists():
                self.settings_path.write_text('{}')

            # Atomic read-modify-write with file lock
            with open(self.settings_path, 'r+') as f:
                fcntl.flock(f.fileno(), fcntl.LOCK_EX)

                try:
                    f.seek(0)
                    try:
                        settings = json.load(f)
                    except json.JSONDecodeError:
                        settings = {}

                    # Handle dot notation
                    keys = key.split('.')
                    current = settings
                    for k in keys[:-1]:
                        if k not in current:
                            current[k] = {}
                        current = current[k]

                    # Check if already set
                    final_key = keys[-1]
                    if not force and final_key in current:
                        return False

                    # Update value
                    current[final_key] = value

                    # Write back
                    f.seek(0)
                    f.truncate()
                    json.dump(settings, f, indent=2)
                    f.flush()
                    os.fsync(f.fileno())

                    return True

                finally:
                    fcntl.flock(f.fileno(), fcntl.LOCK_UN)

        except Exception as e:
            logger.error(f"Failed to update setting {key}: {e}")
            return False

    def remove_setting(self, key: str) -> bool:
        """
        Remove a setting.

        Args:
            key: Setting key (supports dot notation)

        Returns:
            bool: True if removed, False otherwise
        """
        try:
            if not self.settings_path.exists():
                return False

            with open(self.settings_path, 'r+') as f:
                fcntl.flock(f.fileno(), fcntl.LOCK_EX)

                try:
                    f.seek(0)
                    settings = json.load(f)

                    # Handle dot notation
                    keys = key.split('.')
                    current = settings
                    for k in keys[:-1]:
                        if k not in current:
                            return False
                        current = current[k]

                    # Remove key
                    final_key = keys[-1]
                    if final_key not in current:
                        return False

                    del current[final_key]

                    # Write back
                    f.seek(0)
                    f.truncate()
                    json.dump(settings, f, indent=2)
                    f.flush()
                    os.fsync(f.fileno())

                    return True

                finally:
                    fcntl.flock(f.fileno(), fcntl.LOCK_UN)

        except Exception as e:
            logger.error(f"Failed to remove setting {key}: {e}")
            return False

    def add_hook(
        self,
        event: str,
        matcher: str,
        command: str,
        timeout: int = 60
    ) -> bool:
        """
        Add a hook configuration.

        Args:
            event: Hook event type (e.g., "Notification", "PreToolUse")
            matcher: Matcher pattern (empty string matches all)
            command: Command to execute
            timeout: Command timeout in seconds

        Returns:
            bool: True if added, False otherwise
        """
        try:
            settings = self.read_settings()

            # Initialize hooks if not present
            if 'hooks' not in settings:
                settings['hooks'] = {}

            if event not in settings['hooks']:
                settings['hooks'][event] = []

            # Check if hook already exists
            hook_config = {
                "matcher": matcher,
                "hooks": [{
                    "type": "command",
                    "command": command,
                    "timeout": timeout
                }]
            }

            # Avoid duplicates
            for existing in settings['hooks'][event]:
                if (existing.get('matcher') == matcher and
                    any(h.get('command') == command for h in existing.get('hooks', []))):
                    return False  # Already exists

            settings['hooks'][event].append(hook_config)

            # Write back atomically
            return self._write_settings(settings)

        except Exception as e:
            logger.error(f"Failed to add hook: {e}")
            return False

    def _write_settings(self, settings: Dict[str, Any]) -> bool:
        """Write settings atomically with file locking."""
        try:
            self.settings_path.parent.mkdir(parents=True, exist_ok=True)

            # Use a temp file for atomic write
            temp_path = self.settings_path.with_suffix('.tmp')

            with open(temp_path, 'w') as f:
                json.dump(settings, f, indent=2)
                f.flush()
                os.fsync(f.fileno())

            # Atomic rename
            temp_path.rename(self.settings_path)
            return True

        except Exception as e:
            logger.error(f"Failed to write settings: {e}")
            # Clean up temp file if it exists
            if temp_path.exists():
                temp_path.unlink()
            return False


def enable_cache(
    redis_host: str = "localhost",
    redis_port: int = 6379,
    qdrant_host: str = "localhost",
    qdrant_port: int = 6333
) -> bool:
    """
    Convenience function to enable cache with custom settings.

    Args:
        redis_host: Redis host
        redis_port: Redis port
        qdrant_host: Qdrant host
        qdrant_port: Qdrant port

    Returns:
        bool: True if enabled successfully
    """
    config = {
        "enabled": True,
        "backend": "hybrid",
        "redis": {
            "host": redis_host,
            "port": redis_port
        },
        "qdrant": {
            "host": qdrant_host,
            "port": qdrant_port
        },
        "observability": {
            "log_hits": True,
            "log_misses": True,
            "log_provider": True
        }
    }

    updater = SettingsUpdater()
    return updater.update_cache_settings(config)


def disable_cache() -> bool:
    """
    Disable cache in settings.

    Returns:
        bool: True if disabled successfully
    """
    updater = SettingsUpdater()
    return updater.update_setting("cache.enabled", False, force=True)
