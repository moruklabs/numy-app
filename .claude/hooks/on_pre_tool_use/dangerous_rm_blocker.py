#!/usr/bin/env python3
"""
Dangerous RM Blocker Handler

Blocks dangerous rm commands that could cause data loss.
"""

import hashlib
import json
import os
import re
import subprocess
import sys
from pathlib import Path
from typing import Any

sys.path.insert(0, str(Path(__file__).parent.parent))

from utils import BaseHandler, HandlerContext, HandlerResult, Safe
from utils.path_utils import get_project_root

try:
    import pathspec
except ImportError:
    pathspec = None


@Safe
class DangerousRmBlocker(BaseHandler):
    """Handles dangerous rm commands with user confirmation.

    Instead of blocking dangerous rm commands outright, this handler:
    1. Checks persistent preferences for always allow/block patterns
    2. Checks CLAUDE_HOOK_SKIP_CONFIRMATION env var for automation bypass
    3. Shows a macOS osascript dialog for user confirmation with options:
       - Allow (one-time)
       - Always Allow (persist pattern)
       - Block (one-time)
       - Always Block (persist pattern)
    4. Blocks by default if confirmation fails (secure fallback)
    """

    name = "dangerous_rm_blocker"
    description = "Asks for confirmation on dangerous rm -rf commands"
    priority = 20  # Run early - security critical

    CONFIRMATION_TIMEOUT = 30  # seconds
    PREFS_FILE = Path.home() / '.claude' / 'rm_command_prefs.json'

    RM_RF_PATTERNS = [
        r'\brm\s+.*-[a-z]*r[a-z]*f',
        r'\brm\s+.*-[a-z]*f[a-z]*r',
        r'\brm\s+--recursive\s+--force',
        r'\brm\s+--force\s+--recursive',
        r'\brm\s+-r\s+.*-f',
        r'\brm\s+-f\s+.*-r',
    ]

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
        self._prefs = None

    def _load_prefs(self) -> dict:
        """Load persistent preferences for rm commands."""
        if self._prefs is not None:
            return self._prefs

        self._prefs = {'always_allow': [], 'always_block': []}

        if self.PREFS_FILE.exists():
            try:
                with self.PREFS_FILE.open('r') as f:
                    self._prefs = json.load(f)
            except Exception:
                pass  # Use defaults on error

        return self._prefs

    def _save_prefs(self, prefs: dict) -> None:
        """Save preferences to disk."""
        try:
            self.PREFS_FILE.parent.mkdir(parents=True, exist_ok=True)
            with self.PREFS_FILE.open('w') as f:
                json.dump(prefs, f, indent=2)
            self._prefs = prefs
        except Exception:
            pass  # Silently fail on save error

    def _get_command_signature(self, command: str) -> str:
        """Get a signature for the command (based on targets, not full command).

        Uses the rm targets to create a pattern that can be matched later.
        """
        targets = self._extract_rm_targets(command)
        if not targets:
            # Fallback to command hash
            return hashlib.sha256(command.encode()).hexdigest()[:16]

        # Sort targets for consistent signature
        return '|'.join(sorted(targets))

    def _check_prefs(self, command: str) -> str | None:
        """Check if command matches stored preferences.

        Returns 'allow', 'block', or None if no match.
        """
        prefs = self._load_prefs()
        signature = self._get_command_signature(command)
        targets = self._extract_rm_targets(command)

        # Check always_block first (security priority)
        for pattern in prefs.get('always_block', []):
            if pattern == signature:
                return 'block'
            # Also check if any target matches a blocked pattern
            for target in targets:
                if target == pattern or target.startswith(pattern + '/'):
                    return 'block'

        # Check always_allow
        for pattern in prefs.get('always_allow', []):
            if pattern == signature:
                return 'allow'
            # Check if targets match allowed patterns
            for target in targets:
                if target == pattern or target.startswith(pattern + '/'):
                    return 'allow'

        return None

    def _add_pref(self, command: str, pref_type: str) -> None:
        """Add a command pattern to preferences.

        pref_type: 'always_allow' or 'always_block'
        """
        prefs = self._load_prefs()
        signature = self._get_command_signature(command)

        if signature not in prefs.get(pref_type, []):
            prefs.setdefault(pref_type, []).append(signature)

            # If adding to allow, remove from block (and vice versa)
            opposite = 'always_block' if pref_type == 'always_allow' else 'always_allow'
            if signature in prefs.get(opposite, []):
                prefs[opposite].remove(signature)

            self._save_prefs(prefs)

    def _check_env_skip(self) -> bool:
        """Check if confirmation should be skipped via environment variable."""
        return os.environ.get('CLAUDE_HOOK_SKIP_CONFIRMATION', '').lower() == 'true'

    def _ask_via_osascript(self, command: str) -> str:
        """Show macOS osascript dialog for user confirmation.

        Returns one of: 'allow', 'always_allow', 'block', 'always_block'
        """
        # Escape double quotes and backslashes in command for AppleScript
        escaped_cmd = command.replace('\\', '\\\\').replace('"', '\\"')
        # Truncate long commands for display
        display_cmd = escaped_cmd[:100] + '...' if len(escaped_cmd) > 100 else escaped_cmd

        # Use choose from list for 4 options
        script = f'''
        tell application "System Events"
            activate
            set theChoices to {{"Allow (once)", "Always Allow", "Block (once)", "Always Block"}}
            set theResult to choose from list theChoices with prompt "Dangerous rm command detected:\\n\\n{display_cmd}\\n\\nChoose an action:" with title "Confirm Dangerous Command" default items {{"Block (once)"}}
            if theResult is false then
                return "block"
            else
                return item 1 of theResult
            end if
        end tell
        '''
        try:
            result = subprocess.run(
                ['osascript', '-e', script],
                capture_output=True,
                text=True,
                timeout=self.CONFIRMATION_TIMEOUT + 5
            )
            output = result.stdout.strip()

            if 'Always Allow' in output:
                return 'always_allow'
            elif 'Allow' in output:
                return 'allow'
            elif 'Always Block' in output:
                return 'always_block'
            else:
                return 'block'
        except Exception:
            return 'block'  # Secure fallback: block on any error

    def should_run(self, context: HandlerContext) -> bool:
        tool_name = context.event_data.get('tool_name', '')
        return tool_name == 'Bash'

    def run(self, context: HandlerContext) -> HandlerResult:
        tool_input = context.event_data.get('tool_input', {})
        command = tool_input.get('command', '')

        if not self._is_dangerous_rm_command(command):
            return HandlerResult(success=True)

        # Dangerous command detected - check preferences first
        pref_result = self._check_prefs(command)
        if pref_result == 'allow':
            return HandlerResult(
                success=True,
                message='Dangerous rm command allowed via stored preference',
            )
        elif pref_result == 'block':
            return HandlerResult(
                success=False,
                block=True,
                message='Dangerous rm command blocked via stored preference',
            )

        # Check for automation bypass
        if self._check_env_skip():
            return HandlerResult(
                success=True,
                message='Dangerous rm command allowed via CLAUDE_HOOK_SKIP_CONFIRMATION',
            )

        # Show confirmation dialog
        choice = self._ask_via_osascript(command)

        if choice == 'always_allow':
            self._add_pref(command, 'always_allow')
            return HandlerResult(
                success=True,
                message='User allowed dangerous rm command (saved as always allow)',
            )
        elif choice == 'allow':
            return HandlerResult(
                success=True,
                message='User allowed dangerous rm command',
            )
        elif choice == 'always_block':
            self._add_pref(command, 'always_block')
            return HandlerResult(
                success=False,
                block=True,
                message='User blocked dangerous rm command (saved as always block)',
            )
        else:  # 'block' or default
            return HandlerResult(
                success=False,
                block=True,
                message='User denied dangerous rm command or confirmation timed out',
            )

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

        repo_root = get_project_root()
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
