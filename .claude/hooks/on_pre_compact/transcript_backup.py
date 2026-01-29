#!/usr/bin/env python3
"""
Transcript Backup Handler

Creates a backup of the transcript before compaction.
"""

import argparse
import shutil
import sys
from datetime import datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from utils import BaseHandler, HandlerContext, HandlerResult, LogManager, Safe


@Safe
class TranscriptBackup(BaseHandler):
    """Creates transcript backup before compaction."""

    name = "transcript_backup"
    description = "Backs up transcript before compaction"
    priority = 100

    def __init__(self):
        self._log_manager = LogManager()

    def configure_args(self, parser: argparse.ArgumentParser) -> None:
        parser.add_argument(
            '--backup',
            action='store_true',
            help='Create backup of transcript before compaction'
        )
        parser.add_argument(
            '--verbose',
            action='store_true',
            help='Print verbose output'
        )

    def should_run(self, context: HandlerContext) -> bool:
        return getattr(context.args, 'backup', False)

    def run(self, context: HandlerContext) -> HandlerResult:
        transcript_path = context.event_data.get('transcript_path', '')
        trigger = context.event_data.get('trigger', 'unknown')

        if not transcript_path:
            return HandlerResult(success=True)

        backup_path = self._backup_transcript(transcript_path, trigger)

        # Store in shared state for other handlers
        context.shared_state['backup_path'] = backup_path

        verbose = getattr(context.args, 'verbose', False)
        if verbose and backup_path:
            return HandlerResult(
                success=True,
                message=f'Transcript backed up to: {backup_path}'
            )

        return HandlerResult(success=True)

    def _backup_transcript(self, transcript_path: str, trigger: str) -> str | None:
        """Create a backup of the transcript."""
        try:
            source = Path(transcript_path)
            if not source.exists():
                return None

            # Create backup directory in logs
            backup_dir = self._log_manager.log_dir / 'transcript_backups'
            backup_dir.mkdir(parents=True, exist_ok=True)

            # Generate backup filename
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            session_name = source.stem
            backup_name = f'{session_name}_pre_compact_{trigger}_{timestamp}.jsonl'
            backup_path = backup_dir / backup_name

            shutil.copy2(source, backup_path)
            return str(backup_path)

        except Exception as e:
            print(f'Error backing up transcript: {e}', file=sys.stderr)
            return None
