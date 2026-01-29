#!/usr/bin/env python3
"""
Cache Lookup Hook for Claude Code

Reads tool input from stdin, checks cache, returns cached result if found.
This is the command-line entry point that Claude Code invokes.

Protocol:
- Input: JSON from stdin with tool_name, tool_input, cwd
- Output: JSON to stdout with permissionDecision
- Exit 0: Normal (parses JSON)
- Exit 2: Block tool (uses stderr)
"""

import json
import sys
import os

# Suppress warnings
os.environ["TOKENIZERS_PARALLELISM"] = "false"

def main():
    try:
        # Read input from stdin
        input_data = json.load(sys.stdin)

        tool_name = input_data.get("tool_name", "")
        tool_input = input_data.get("tool_input", {})
        cwd = input_data.get("cwd", os.getcwd())

        # Only handle WebFetch and WebSearch
        if tool_name not in ("WebFetch", "WebSearch"):
            # Allow other tools to proceed
            output = {
                "hookSpecificOutput": {
                    "hookEventName": "PreToolUse",
                    "permissionDecision": "allow",
                    "permissionDecisionReason": "Not a cacheable tool"
                }
            }
            print(json.dumps(output))
            return

        # Add hooks directory to path
        hooks_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        sys.path.insert(0, hooks_dir)

        from utils.cache_manager import get_cache_manager

        manager = get_cache_manager()
        result = manager.lookup(tool_name, tool_input, cwd)

        if result.hit:
            # Cache HIT - deny the tool and provide cached result
            cache_info = f"Cache {result.cache_type} via {result.provider}"
            if result.similarity < 1.0:
                cache_info += f" (similarity: {result.similarity:.2f})"

            # Format the cached data as the tool would return it
            cached_response = {
                "cached": True,
                "cache_type": result.cache_type,
                "provider": result.provider,
                "similarity": result.similarity,
                "age_seconds": result.age_seconds,
                "data": result.data
            }

            output = {
                "hookSpecificOutput": {
                    "hookEventName": "PreToolUse",
                    "permissionDecision": "deny",
                    "permissionDecisionReason": f"{cache_info}. Cached result: {json.dumps(cached_response)}"
                }
            }

            # Log to stderr for observability
            sys.stderr.write(f"[Cache] HIT {tool_name} via {result.provider}\n")

        else:
            # Cache MISS - allow tool to proceed
            output = {
                "hookSpecificOutput": {
                    "hookEventName": "PreToolUse",
                    "permissionDecision": "allow",
                    "permissionDecisionReason": "Cache miss - executing tool"
                }
            }
            sys.stderr.write(f"[Cache] MISS {tool_name}\n")

        print(json.dumps(output))

    except Exception as e:
        # On error, allow tool to proceed (fail open)
        sys.stderr.write(f"[Cache] Error: {e}\n")
        output = {
            "hookSpecificOutput": {
                "hookEventName": "PreToolUse",
                "permissionDecision": "allow",
                "permissionDecisionReason": f"Cache error: {e}"
            }
        }
        print(json.dumps(output))


if __name__ == "__main__":
    main()
