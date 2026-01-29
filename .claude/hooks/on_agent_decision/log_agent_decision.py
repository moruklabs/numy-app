#!/usr/bin/env python3
"""
Log Agent Decision Handler

Logs when agentic tools make decisions via Claude.
Observer-level priority (800) - doesn't block, just observes.
"""

import sys
import os
import json

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils.base_handler import BaseHandler, HandlerContext, HandlerResult
from utils.safe_decorator import Safe
from datetime import datetime


@Safe
class LogAgentDecisionHandler(BaseHandler):
    """Handler that logs agent decision events."""

    name = "log_agent_decision"
    description = "Logs when agentic tools make decisions via Claude"
    priority = 800  # Observer level

    def should_run(self, context: HandlerContext) -> bool:
        """Always run for agent decision events."""
        return context.event_name == "agent_decision"

    def run(self, context: HandlerContext) -> HandlerResult:
        """Log the agent decision event."""
        event_data = context.event_data

        tool_name = event_data.get("tool_name", "unknown")
        action = event_data.get("action", "unknown")
        reasoning = event_data.get("reasoning", "")[:200]
        confidence = event_data.get("confidence", 0)
        prompt_preview = event_data.get("prompt", "")[:100]

        timestamp = datetime.now().isoformat()

        log_message = (
            f"[{timestamp}] AGENT_DECISION: {tool_name}\n"
            f"  Action: {action}\n"
            f"  Confidence: {confidence:.2f}\n"
            f"  Reasoning: {reasoning}...\n"
            f"  Prompt: {prompt_preview}..."
        )

        # Log to file
        log_dir = os.path.join(os.path.dirname(__file__), "..", "logs")
        os.makedirs(log_dir, exist_ok=True)
        log_file = os.path.join(log_dir, "agent_decisions.log")

        with open(log_file, "a") as f:
            f.write(log_message + "\n\n")

        # Also log to JSON for structured analysis
        json_log_file = os.path.join(log_dir, "agent_decisions.jsonl")
        with open(json_log_file, "a") as f:
            json.dump({
                "timestamp": timestamp,
                "tool_name": tool_name,
                "action": action,
                "confidence": confidence,
                "reasoning": reasoning,
            }, f)
            f.write("\n")

        return HandlerResult(success=True)


# Export handler class for auto-discovery
handler_class = LogAgentDecisionHandler
