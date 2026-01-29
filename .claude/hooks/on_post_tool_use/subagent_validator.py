#!/usr/bin/env python3
"""
Subagent Validator Handler

Validates sub-agent configuration files after edits.
Triggers on Edit, MultiEdit, and Write tools when targeting agent files.

Reference: https://code.claude.com/docs/en/sub-agents
"""

import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from utils import BaseHandler, HandlerContext, HandlerResult, Safe

# Import agent validator
try:
    from utils.agent_validator import (
        validate_agent_file,
        format_validation_result,
        is_agent_file,
    )
    VALIDATOR_AVAILABLE = True
except ImportError:
    VALIDATOR_AVAILABLE = False


@Safe
class SubagentValidatorHandler(BaseHandler):
    """Validates sub-agent configuration files after edits."""

    name = "subagent_validator"
    description = "Validates agent file configurations after edit/write operations"
    priority = 100  # Standard priority - runs after operation completes

    def should_run(self, context: HandlerContext) -> bool:
        """Run when Edit, MultiEdit, or Write tools modify agent files."""
        if not VALIDATOR_AVAILABLE:
            return False

        tool_name = context.event_data.get('tool_name', '')
        if tool_name not in {'Edit', 'MultiEdit', 'Write'}:
            return False

        # Check if the file is an agent file
        tool_input = context.event_data.get('tool_input', {})
        file_path = tool_input.get('file_path', '')

        return is_agent_file(file_path)

    def run(self, context: HandlerContext) -> HandlerResult:
        """Validate the agent file after modification."""
        tool_input = context.event_data.get('tool_input', {})
        file_path = tool_input.get('file_path', '')

        if not file_path or not os.path.exists(file_path):
            return HandlerResult(success=True)

        # Validate the agent file
        result = validate_agent_file(file_path)

        if result.is_valid:
            # Success - optionally show warnings
            if result.warnings:
                warning_text = "\n".join(f"  ⚠ {w}" for w in result.warnings)
                return HandlerResult(
                    success=True,
                    message=f"✓ Agent valid with warnings:\n{warning_text}"
                )
            return HandlerResult(success=True)

        # Validation failed - show errors
        error_text = format_validation_result(result)
        return HandlerResult(
            success=True,  # Don't block, just warn
            message=f"⚠️ AGENT VALIDATION ISSUES:\n{error_text}\n\n"
                    f"Reference: https://code.claude.com/docs/en/sub-agents"
        )


# Export handler class for auto-discovery
handler_class = SubagentValidatorHandler
