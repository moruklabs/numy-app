#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = ["pathspec>=0.12.0"]
# ///

"""Entry point for pre_tool_use event handlers."""

import sys
from pathlib import Path

# Setup path for utils import
sys.path.insert(0, str(Path(__file__).parent.parent))

from utils import run_event

if __name__ == '__main__':
    sys.exit(run_event('pre_tool_use'))
