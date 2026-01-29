#!/usr/bin/env python3
"""
Security Validators Module

Provides security validation strategies for pre-tool-use hooks.
Following Open-Closed Principle: add new validators without modifying existing code.
"""

import re
from abc import ABC, abstractmethod
from pathlib import Path
from typing import Any

from .path_utils import get_git_root

try:
    import pathspec
except ImportError:
    pathspec = None


class SecurityValidator(ABC):
    """
    Abstract base for security validators.

    Implement new validators by extending this class.
    """

    @abstractmethod
    def validate(self, tool_name: str, tool_input: dict[str, Any]) -> tuple[bool, str | None]:
        """
        Validate a tool use.

        Args:
            tool_name: Name of the tool being used
            tool_input: Input parameters for the tool

        Returns:
            Tuple of (is_allowed, error_message_if_blocked)
        """
        ...


class EnvFileValidator(SecurityValidator):
    """Blocks access to .env files containing sensitive data."""

    APPLICABLE_TOOLS = {'Read', 'Edit', 'MultiEdit', 'Write', 'Bash'}
    FILE_TOOLS = {'Read', 'Edit', 'MultiEdit', 'Write'}

    ENV_BASH_PATTERNS = [
        r'\b\.env\b(?!\.sample)',
        r'cat\s+.*\.env\b(?!\.sample)',
        r'echo\s+.*>\s*\.env\b(?!\.sample)',
        r'touch\s+.*\.env\b(?!\.sample)',
        r'cp\s+.*\.env\b(?!\.sample)',
        r'mv\s+.*\.env\b(?!\.sample)',
    ]

    def validate(self, tool_name: str, tool_input: dict[str, Any]) -> tuple[bool, str | None]:
        if tool_name not in self.APPLICABLE_TOOLS:
            return True, None

        # Check file-based tools
        if tool_name in self.FILE_TOOLS:
            file_path = tool_input.get('file_path', '')
            if '.env' in file_path and not file_path.endswith('.sample'):
                return False, 'Access to .env files containing sensitive data is prohibited. Use .env.sample for template files instead.'

        # Check Bash commands
        if tool_name == 'Bash':
            command = tool_input.get('command', '')
            for pattern in self.ENV_BASH_PATTERNS:
                if re.search(pattern, command):
                    return False, 'Access to .env files containing sensitive data is prohibited. Use .env.sample for template files instead.'

        return True, None


class DangerousRmValidator(SecurityValidator):
    """Blocks dangerous rm commands that could cause data loss."""

    # Patterns for dangerous rm commands
    RM_RF_PATTERNS = [
        r'\brm\s+.*-[a-z]*r[a-z]*f',
        r'\brm\s+.*-[a-z]*f[a-z]*r',
        r'\brm\s+--recursive\s+--force',
        r'\brm\s+--force\s+--recursive',
        r'\brm\s+-r\s+.*-f',
        r'\brm\s+-f\s+.*-r',
    ]

    # Dangerous path patterns (always blocked)
    DANGEROUS_PATHS = [
        r'\s+/$',       # root
        r'\s+/\*',      # root with wildcard
        r'\s+~$',       # home directory alone
        r'\s+~/',       # home directory path
        r'\s+\$HOME',   # $HOME variable
        r'\s+\.\.$',    # parent directory alone
        r'\s+\.\.\s+',  # parent directory with more args
        r'\s+\.\.\/',   # parent directory path
        r'\s+\*$',      # wildcard alone
        r'\s+\.$',      # current directory alone
    ]

    def __init__(self):
        self._gitignore_spec = None
        self._spec_loaded = False

    def validate(self, tool_name: str, tool_input: dict[str, Any]) -> tuple[bool, str | None]:
        if tool_name != 'Bash':
            return True, None

        command = tool_input.get('command', '')
        if not self._is_dangerous_rm_command(command):
            return True, None

        return False, 'Dangerous rm command detected and prevented'

    def _is_dangerous_rm_command(self, command: str) -> bool:
        """Check if an rm command is dangerous."""
        normalized = ' '.join(command.lower().split())

        # Check for rm -rf patterns
        has_rm_rf = any(re.search(p, normalized) for p in self.RM_RF_PATTERNS)

        if not has_rm_rf:
            # Check for rm -r without -f on dangerous paths
            if re.search(r'\brm\s+.*-[a-z]*r', normalized):
                if any(re.search(p, normalized) for p in self.DANGEROUS_PATHS):
                    return True
            return False

        # Always block dangerous paths regardless of gitignore
        if any(re.search(p, normalized) for p in self.DANGEROUS_PATHS):
            return True

        # Extract targets and check gitignore
        targets = self._extract_rm_targets(command)
        if not targets:
            return True  # No targets found, be safe

        # Load gitignore spec
        spec = self._load_gitignore_spec()

        # If all targets are gitignored, allow
        if all(self._is_gitignored(t, spec) for t in targets):
            return False

        return True

    def _extract_rm_targets(self, command: str) -> list[str]:
        """Extract target paths from an rm command."""
        parts = command.split()
        targets = []

        for i, part in enumerate(parts):
            if i == 0 and part == 'rm':
                continue
            if part.startswith('-'):
                continue
            targets.append(part)

        return targets

    def _load_gitignore_spec(self) -> Any:
        """Load gitignore patterns from repository root."""
        if self._spec_loaded:
            return self._gitignore_spec

        self._spec_loaded = True

        if pathspec is None:
            return None

        # Use centralized git root detection
        repo_root = get_git_root()

        gitignore_path = repo_root / '.gitignore'
        if not gitignore_path.exists():
            return None

        try:
            with gitignore_path.open('r') as f:
                patterns = f.read().splitlines()
            self._gitignore_spec = pathspec.PathSpec.from_lines('gitwildmatch', patterns)
            return self._gitignore_spec
        except Exception:
            return None

    def _is_gitignored(self, path: str, spec: Any) -> bool:
        """Check if a path is gitignored."""
        if spec is None:
            return False

        try:
            normalized = path[2:] if path.startswith('./') else path
            return spec.match_file(normalized)
        except Exception:
            return False


class ValidatorChain:
    """
    Chain of security validators.

    Following Open-Closed: add validators without modifying chain logic.
    """

    def __init__(self):
        self._validators: list[SecurityValidator] = []

    def add(self, validator: SecurityValidator) -> 'ValidatorChain':
        """Add a validator to the chain."""
        self._validators.append(validator)
        return self

    def validate(self, tool_name: str, tool_input: dict[str, Any]) -> tuple[bool, str | None]:
        """
        Run all validators.

        Returns:
            Tuple of (is_allowed, error_message_if_blocked)
        """
        for validator in self._validators:
            is_allowed, error = validator.validate(tool_name, tool_input)
            if not is_allowed:
                return False, error
        return True, None


def create_default_validator_chain() -> ValidatorChain:
    """
    Create the default validator chain with standard security rules.

    Extend this by adding new validators to the chain.
    """
    return (
        ValidatorChain()
        .add(EnvFileValidator())
        .add(DangerousRmValidator())
    )
