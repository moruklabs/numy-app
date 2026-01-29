#!/usr/bin/env python3
"""
Log Tool Complete Handler

Logs when agentic tools complete execution.
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
class LogToolCompleteHandler(BaseHandler):
    """Handler that logs tool completion events."""

    name = "log_tool_complete"
    description = "Logs when agentic tools complete execution"
    priority = 800  # Observer level

    def should_run(self, context: HandlerContext) -> bool:
        """Always run for tool complete events."""
        return context.event_name == "tool_complete"

    def run(self, context: HandlerContext) -> HandlerResult:
        """Log the tool completion event."""
        event_data = context.event_data

        tool_name = event_data.get("tool_name", "unknown")
        execution_id = event_data.get("execution_id", "")
        status = event_data.get("status", "unknown")
        duration = event_data.get("duration", 0)
        output_summary = str(event_data.get("output", {}))[:100]

        timestamp = datetime.now().isoformat()

        log_message = (
            f"[{timestamp}] TOOL_COMPLETE: {tool_name}\n"
            f"  Execution ID: {execution_id}\n"
            f"  Status: {status}\n"
            f"  Duration: {duration}ms\n"
            f"  Output: {output_summary}..."
        )

        # Log to file
        log_dir = os.path.join(os.path.dirname(__file__), "..", "logs")
        os.makedirs(log_dir, exist_ok=True)
        log_file = os.path.join(log_dir, "tool_events.log")

        with open(log_file, "a") as f:
            f.write(log_message + "\n\n")

        return HandlerResult(success=True)


# Export handler class for auto-discovery
handler_class = LogToolCompleteHandler
