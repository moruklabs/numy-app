#!/usr/bin/env python3
"""
Chat Saver Handler

Saves chat transcript to logs directory.
"""

import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from utils import BaseHandler, HandlerContext, HandlerResult, LogManager, Safe


@Safe
class ChatSaver(BaseHandler):
    """Saves chat transcript to logs."""

    name = "chat_saver"
    description = "Saves chat transcript"
    priority = 100

    def __init__(self):
        self._log_manager = LogManager()

    def configure_args(self, parser: argparse.ArgumentParser) -> None:
        parser.add_argument(
            '--chat',
            action='store_true',
            help='Copy transcript to chat.json'
        )

    def should_run(self, context: HandlerContext) -> bool:
        return getattr(context.args, 'chat', False)

    def run(self, context: HandlerContext) -> HandlerResult:
        transcript_path = context.event_data.get('transcript_path', '')

        if transcript_path:
            self._log_manager.save_chat(Path(transcript_path))

        return HandlerResult(success=True)
