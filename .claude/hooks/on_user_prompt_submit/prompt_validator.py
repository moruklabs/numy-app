#!/usr/bin/env python3
"""
Prompt Validator Handler

Validates user prompts for security or policy violations.
"""

import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from utils import BaseHandler, HandlerContext, HandlerResult, Safe


@Safe
class PromptValidator(BaseHandler):
    """Validates user prompts."""

    name = "prompt_validator"
    description = "Validates user prompts"
    priority = 50

    def configure_args(self, parser: argparse.ArgumentParser) -> None:
        parser.add_argument(
            '--validate',
            action='store_true',
            help='Enable prompt validation'
        )
        parser.add_argument(
            '--log-only',
            action='store_true',
            help='Only log prompts, no validation'
        )

    def should_run(self, context: HandlerContext) -> bool:
        validate = getattr(context.args, 'validate', False)
        log_only = getattr(context.args, 'log_only', False)
        return validate and not log_only

    def run(self, context: HandlerContext) -> HandlerResult:
        prompt = context.event_data.get('prompt', '')
        is_valid, reason = self._validate_prompt(prompt)

        if not is_valid:
            return HandlerResult(
                success=False,
                block=True,
                message=f'Prompt blocked: {reason}',
            )

        return HandlerResult(success=True)

    def _validate_prompt(self, prompt: str) -> tuple[bool, str | None]:
        """
        Validate the prompt.

        Extend this method to add validation logic.
        """
        return True, None
