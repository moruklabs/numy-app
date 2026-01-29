---
description: Create a robust, portable shell script in ~/.claude/bin/ for terminal-wide access
argument-hint: "[description of what the script should do]"
---

# Script Creator

Create a well-documented, robust shell script that will be installed in `~/.claude/bin/` for terminal-wide access.

## User Request

**Script description:** $ARGUMENTS

## Instructions

Use the Task tool with `subagent_type="script-creator"` to create the requested script.

### Agent Task

Launch the script-creator agent with the following prompt:

```
The user wants to create a shell script with this description:

"$ARGUMENTS"

Follow your script-creator agent expertise:

1. **Ask Clarifying Questions First** - Do NOT generate any code until you've asked:
   - What should the script be called?
   - What shell should it target? (bash/sh/zsh)
   - Where should output go? (-pwd, -git-root, or specific path)
   - Should it require confirmation for destructive actions?
   - What arguments/flags does it need?
   - Any external dependencies?
   - Cross-platform requirements (macOS/Linux)?

2. **After Getting Answers** - Create the script:
   - Follow the script template from your agent definition
   - Include proper error handling with `set -euo pipefail`
   - Add comprehensive --help output
   - Implement --dry-run for risky operations
   - Check all dependencies at startup
   - Make it idempotent where possible

3. **Installation**:
   - Ensure ~/.claude/bin/ exists
   - Write the script to ~/.claude/bin/SCRIPT_NAME
   - Make it executable with chmod +x
   - Verify it works with --help
   - Warn if ~/.claude/bin is not in PATH

4. **Report Back**:
   - Confirm the script location
   - Show usage examples
   - List any dependencies needed
```

## Core Principles

### Parallelization (CRITICAL for Speed)

When creating scripts with dependencies, check ALL prerequisites in parallel:

- Multiple command existence checks -> ONE message with multiple Bash calls

### Depth-First Strategy (DFS over BFS)

When designing, go DEEP into one feature before moving to the next:

- Complete one command/option fully before adding another
- Finish error handling for one scenario before moving to the next

### Architecture Principles

**DRY & OPEN-CLOSED:**

- Check existing scripts in ~/.claude/bin/ for patterns to reuse
- Design scripts for extension with new options
- Extract common patterns into shared utilities

## Quality Expectations

The created script should:

- Have proper shebang and `set -euo pipefail`
- Include comprehensive usage/help documentation
- Check for required dependencies
- Handle errors gracefully with clear messages
- Support `--help`, `--verbose`, and `--dry-run` flags (where appropriate)
- Be portable across macOS and Linux (unless specified otherwise)
- Be idempotent (safe to run multiple times)
