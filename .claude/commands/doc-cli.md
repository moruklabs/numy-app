---
description: Generate comprehensive CLI command documentation by exploring --help and subcommands
argument-hint: "<command-name> (e.g., docker, gh, kubectl)"
---

# CLI Documentation Generator

Generate comprehensive usage documentation for a CLI tool by exploring its help system and capabilities.

## Target Command

**Command to document:** `$ARGUMENTS`

## Instructions

Use the Task tool with `subagent_type="cli-docs-explorer"` and `model="haiku"` (Worker tier) to thoroughly explore the specified CLI command and generate documentation.

### Agent Task

Launch the cli-docs-explorer agent with the following prompt:

```
Explore the CLI tool "$ARGUMENTS" and create comprehensive documentation.

## Exploration Steps

1. Run `$ARGUMENTS --help` (or `-h` if that fails) to get the main help output
2. Identify all available subcommands and options
3. For each major subcommand, run `$ARGUMENTS <subcommand> --help`
4. Document common usage patterns and examples
5. Note any environment variables or configuration options mentioned

## Output Requirements

After exploration, create a file at: `command-docs/$ARGUMENTS_USAGE.md`

The documentation should include:

### Structure
1. **Overview** - Brief description of what the tool does
2. **Installation** - How to install (if discoverable)
3. **Basic Usage** - Core syntax and common examples
4. **Commands Reference** - All subcommands with descriptions
5. **Global Options** - Flags that apply to all commands
6. **Common Workflows** - Practical usage examples
7. **Environment Variables** - Any env vars the tool uses
8. **Tips & Tricks** - Useful shortcuts or lesser-known features

### Formatting
- Use clear markdown with proper headings
- Include code blocks for all command examples
- Add tables for options/flags when appropriate
- Keep examples practical and copy-pasteable

If the command-docs/ directory doesn't exist, create it first.
```

## Core Principles

### Parallelization (CRITICAL for Speed)

When exploring CLI help, run independent commands in parallel where possible:

- Multiple subcommand helps -> consider running in parallel if CLI supports it

### Depth-First Strategy (DFS over BFS)

When documenting, go DEEP into one command before moving to the next:

- Complete documentation for one subcommand fully before starting another
- Explore all options for one command before moving to the next

### Architecture Principles

**DRY & OPEN-CLOSED:**

- Reuse documentation patterns from existing command-docs/
- Structure documentation for easy extension with new commands

## Validation

After the agent completes:

1. Verify the file was created at `command-docs/$ARGUMENTS_USAGE.md`
2. Confirm the documentation covers the main commands and options
3. Report the file location to the user
