#!/usr/bin/env python3
"""
Cache Store Hook for Claude Code

Reads tool output from stdin, stores in cache for future lookups.
This is the command-line entry point that Claude Code invokes.

Protocol:
- Input: JSON from stdin with tool_name, tool_input, tool_response, cwd
- Output: JSON to stdout (optional)
- Exit 0: Normal
"""

import json
import sys
import os

# Suppress warnings
os.environ["TOKENIZERS_PARALLELISM"] = "false"

# Max size to cache (500KB)
MAX_OUTPUT_SIZE = 500_000


def main():
    try:
        # Read input from stdin
        input_data = json.load(sys.stdin)

        tool_name = input_data.get("tool_name", "")
        tool_input = input_data.get("tool_input", {})
        tool_response = input_data.get("tool_response", {})
        cwd = input_data.get("cwd", os.getcwd())

        # Only handle WebFetch and WebSearch
        if tool_name not in ("WebFetch", "WebSearch"):
            print(json.dumps({}))
            return

        # Check output size
        output_size = len(json.dumps(tool_response))
        if output_size > MAX_OUTPUT_SIZE:
            sys.stderr.write(f"[Cache] Skip {tool_name}: output too large ({output_size} bytes)\n")
            print(json.dumps({}))
            return

        # Add hooks directory to path
        hooks_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        sys.path.insert(0, hooks_dir)

        from utils.cache_manager import get_cache_manager

        manager = get_cache_manager()
        key = manager.store(tool_name, tool_input, tool_response, True, cwd)

        if key:
            sys.stderr.write(f"[Cache] Stored {tool_name}: {key[:16]}...\n")
        else:
            sys.stderr.write(f"[Cache] Failed to store {tool_name}\n")

        # Return empty output (no modification needed)
        print(json.dumps({}))

    except Exception as e:
        # On error, just log and continue (fail open)
        sys.stderr.write(f"[Cache] Store error: {e}\n")
        print(json.dumps({}))


if __name__ == "__main__":
    main()
