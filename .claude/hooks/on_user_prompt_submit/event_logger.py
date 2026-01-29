#!/usr/bin/env python3
"""
Event Logger Handler

Logs all user_prompt_submit events to the logs directory.
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from utils import BaseHandler, HandlerContext, HandlerResult, LogManager, Safe


@Safe
class EventLogger(BaseHandler):
    """Logs all events to the logs directory."""

    name = "event_logger"
    description = "Logs user_prompt_submit events"
    priority = 900

    def __init__(self):
        self._log_manager = LogManager()

    def should_run(self, context: HandlerContext) -> bool:
        return True

    def run(self, context: HandlerContext) -> HandlerResult:
        self._log_manager.append_entry(
            'user_prompt_submit.json',
            context.event_data
        )
        return HandlerResult(success=True)
