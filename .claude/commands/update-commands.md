---
description: Batch update Claude Code slash commands based on natural language instructions
argument-hint: "<change-description>"
---

# Update Commands

Use the **multiple-commands-updater** agent to batch-update one or more Claude Code slash commands based on your natural language instructions.

## Instructions

Invoke the Task tool with:

```
subagent_type: multiple-commands-updater
prompt: $ARGUMENTS
```

The agent will:

1. Parse your change description to understand what updates you want
2. Discover matching commands in `.claude/commands/`
3. Show a change plan with affected commands
4. Apply the changes (or preview in dry-run mode)
5. Report results with verification

## Variables

- `$ARGUMENTS` - Your natural language description of what to change

## Examples

**Add argument hints:**

```
/update-commands Add argument-hint to all commands that use $ARGUMENTS but don't have hints
```

**Standardize sections:**

```
/update-commands Replace "## Workflow" with "## Instructions" in all commands
```

**Update patterns:**

```
/update-commands Replace 'subagent_type=' with 'agent=' in all FSD commands
```

**Add quality checklists:**

```
/update-commands Add quality checklist section to all commands that invoke agents
```

**Dry-run preview:**

```
/update-commands Preview: Add error handling section to all create-* commands
```

## Core Principles

### Parallelization (CRITICAL for Speed)

When updating multiple commands, execute ALL operations in parallel:

- Multiple command reads -> ONE message with multiple Read calls
- Multiple command writes -> ONE message with multiple Edit calls

### Depth-First Strategy (DFS over BFS)

When planning updates, go DEEP into each command before moving to the next:

- Complete analysis of one command fully before analyzing another
- Finish all changes for one command before moving to the next

### Architecture Principles

**FSD over DDD:** Ensure command workflows follow Feature-Sliced Design patterns.

**TDD First:** Include validation in updated workflows.

**DRY & OPEN-CLOSED:**

- Check existing commands for patterns to reuse
- Design updates for extension without breaking existing functionality

## Tips

- Use "preview:" or "dry-run:" prefix to see changes before applying
- Be specific about which commands to target (by name, pattern, or content)
- The agent will show before/after diffs for each change
