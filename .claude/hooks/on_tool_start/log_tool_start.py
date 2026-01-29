#!/usr/bin/env python3
"""
Log Tool Start Handler

Logs when agentic tools start execution.
Observer-level priority (800) - doesn't block, just observes.
"""

import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils.base_handler import BaseHandler, HandlerContext, HandlerResult
from utils.safe_decorator import Safe
from datetime import datetime


@Safe
class LogToolStartHandler(BaseHandler):
    """Handler that logs tool start events."""

    name = "log_tool_start"
    description = "Logs when agentic tools start execution"
    priority = 800  # Observer level

    def should_run(self, context: HandlerContext) -> bool:
        """Always run for tool start events."""
        return context.event_name == "tool_start"

    def run(self, context: HandlerContext) -> HandlerResult:
        """Log the tool start event."""
        event_data = context.event_data

        tool_name = event_data.get("tool_name", "unknown")
        execution_id = event_data.get("execution_id", "")
        input_summary = str(event_data.get("input", {}))[:100]

        timestamp = datetime.now().isoformat()

        log_message = (
            f"[{timestamp}] TOOL_START: {tool_name}\n"
            f"  Execution ID: {execution_id}\n"
            f"  Input: {input_summary}..."
        )

        # Log to file
        log_dir = os.path.join(os.path.dirname(__file__), "..", "logs")
        os.makedirs(log_dir, exist_ok=True)
        log_file = os.path.join(log_dir, "tool_events.log")

        with open(log_file, "a") as f:
            f.write(log_message + "\n\n")

        return HandlerResult(success=True)


# Export handler class for auto-discovery
handler_class = LogToolStartHandler
