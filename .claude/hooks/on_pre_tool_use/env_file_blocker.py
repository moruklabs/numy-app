#!/usr/bin/env python3
"""
Env File Blocker Handler

Blocks access to .env files containing sensitive data.
"""

import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from utils import BaseHandler, HandlerContext, HandlerResult, Safe


@Safe
class EnvFileBlocker(BaseHandler):
    """Blocks access to .env files containing sensitive data."""

    name = "env_file_blocker"
    description = "Prevents access to .env files"
    priority = 10  # Run early - security critical

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

    def should_run(self, context: HandlerContext) -> bool:
        tool_name = context.event_data.get('tool_name', '')
        return tool_name in self.APPLICABLE_TOOLS

    def run(self, context: HandlerContext) -> HandlerResult:
        tool_name = context.event_data.get('tool_name', '')
        tool_input = context.event_data.get('tool_input', {})

        if self._is_env_access(tool_name, tool_input):
            return HandlerResult(
                success=False,
                block=True,
                message='BLOCKED: Access to .env files containing sensitive data is prohibited. Use .env.sample for template files instead.',
            )

        return HandlerResult(success=True)

    def _is_env_access(self, tool_name: str, tool_input: dict) -> bool:
        """Check if the tool use involves .env file access."""
        # Check file-based tools
        if tool_name in self.FILE_TOOLS:
            file_path = tool_input.get('file_path', '')
            if '.env' in file_path and not file_path.endswith('.sample'):
                return True

        # Check Bash commands
        if tool_name == 'Bash':
            command = tool_input.get('command', '')
            for pattern in self.ENV_BASH_PATTERNS:
                if re.search(pattern, command):
                    return True

        return False
