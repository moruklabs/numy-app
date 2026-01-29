#!/usr/bin/env python3
"""
Rate Limiter Handler

Enforces rate limits on Claude invocations from agentic tools.
Blocker-level priority (50) - can block operations if rate limit exceeded.
"""

import sys
import os
import json
import time
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils.base_handler import BaseHandler, HandlerContext, HandlerResult
from utils.safe_decorator import Safe


@Safe
class RateLimiterHandler(BaseHandler):
    """Handler that enforces rate limits on Claude invocations."""

    name = "rate_limiter"
    description = "Enforces rate limits on Claude invocations from agentic tools"
    priority = 50  # Blocker level - runs early

    # Rate limit configuration
    MAX_REQUESTS_PER_MINUTE = 30
    MAX_REQUESTS_PER_HOUR = 500
    STATE_FILE = "rate_limit_state.json"

    def should_run(self, context: HandlerContext) -> bool:
        """Run for agent decision events that involve Claude invocation."""
        if context.event_name != "agent_decision":
            return False
        # Only rate limit if this is a pre-decision check
        return context.event_data.get("phase") == "pre_invoke"

    def run(self, context: HandlerContext) -> HandlerResult:
        """Check and enforce rate limits."""
        state = self._load_state()
        now = time.time()

        # Clean up old entries
        minute_ago = now - 60
        hour_ago = now - 3600

        state["minute_requests"] = [
            ts for ts in state.get("minute_requests", [])
            if ts > minute_ago
        ]
        state["hour_requests"] = [
            ts for ts in state.get("hour_requests", [])
            if ts > hour_ago
        ]

        # Check rate limits
        minute_count = len(state["minute_requests"])
        hour_count = len(state["hour_requests"])

        if minute_count >= self.MAX_REQUESTS_PER_MINUTE:
            wait_time = 60 - (now - state["minute_requests"][0])
            return HandlerResult(
                success=False,
                block=True,
                message=f"Rate limit exceeded ({minute_count}/{self.MAX_REQUESTS_PER_MINUTE} per minute). "
                        f"Wait {wait_time:.0f} seconds."
            )

        if hour_count >= self.MAX_REQUESTS_PER_HOUR:
            wait_time = 3600 - (now - state["hour_requests"][0])
            return HandlerResult(
                success=False,
                block=True,
                message=f"Rate limit exceeded ({hour_count}/{self.MAX_REQUESTS_PER_HOUR} per hour). "
                        f"Wait {wait_time:.0f} seconds."
            )

        # Record this request
        state["minute_requests"].append(now)
        state["hour_requests"].append(now)
        self._save_state(state)

        return HandlerResult(
            success=True,
            message=f"Rate limit OK: {minute_count + 1}/{self.MAX_REQUESTS_PER_MINUTE} minute, "
                    f"{hour_count + 1}/{self.MAX_REQUESTS_PER_HOUR} hour"
        )

    def _get_state_path(self) -> Path:
        """Get path to state file."""
        state_dir = Path(__file__).parent.parent / "logs"
        state_dir.mkdir(exist_ok=True)
        return state_dir / self.STATE_FILE

    def _load_state(self) -> dict:
        """Load rate limit state from file."""
        state_path = self._get_state_path()
        try:
            if state_path.exists():
                with open(state_path, "r") as f:
                    return json.load(f)
        except (json.JSONDecodeError, IOError):
            pass
        return {"minute_requests": [], "hour_requests": []}

    def _save_state(self, state: dict) -> None:
        """Save rate limit state to file."""
        state_path = self._get_state_path()
        try:
            with open(state_path, "w") as f:
                json.dump(state, f)
        except IOError:
            pass


# Export handler class for auto-discovery
handler_class = RateLimiterHandler
