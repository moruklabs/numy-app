#!/usr/bin/env python3
"""
GitHub Token Cleaner Handler

Unsets conflicting GitHub tokens that cause authentication issues.
"""

import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from utils import BaseHandler, HandlerContext, HandlerResult, Safe


@Safe
class GitHubTokenCleaner(BaseHandler):
    """Unsets conflicting GitHub tokens."""

    name = "github_token_cleaner"
    description = "Cleans up conflicting GitHub tokens"
    priority = 10  # Run early

    def should_run(self, context: HandlerContext) -> bool:
        # Always run on session start
        return True

    def run(self, context: HandlerContext) -> HandlerResult:
        os.environ.pop('GITHUB_TOKEN', None)
        os.environ.pop('GITHUB_TOKEN_1', None)
        return HandlerResult(success=True)
