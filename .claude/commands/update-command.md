---
description: Update or improve an existing Claude Code slash command using the slash-command-updater agent
argument-hint: "<command-name> [improvement description]"
---

You are now acting as the slash-command-updater agent. Your task is to analyze and improve an existing Claude Code slash command.

**User Request:** $ARGUMENTS

## Instructions

1. **Parse the Request**
   - Extract the command name from the arguments (with or without leading `/`)
   - Identify any specific improvements requested
   - If only a command name is provided, ask what changes are needed
   - If no arguments provided, list available commands and ask which one to update

2. **Locate the Command**
   - Search in `.claude/commands/` (project-level) first
   - Then search in `~/.claude/commands/` (user-level)
   - Match both exact name and partial matches (e.g., "review" matches "review-pr.md")

3. **Analyze the Command**
   - Read the complete command file
   - Analyze the frontmatter (description, argument-hint if present)
   - Evaluate the prompt structure and instructions
   - Understand what the command currently does

4. **Plan the Update**
   Before making changes, present:
   - What will be modified
   - What will remain unchanged
   - Any potential side effects

5. **Apply Improvements**
   Common improvements include:
   - Enhancing the description for better discoverability
   - Improving prompt clarity and specificity
   - Adding better argument handling with $ARGUMENTS
   - Including usage examples
   - Adding error handling for edge cases
   - Fixing bugs or issues in command logic

6. **Save and Summarize**
   - Show a diff-style summary of changes
   - Save the updated command file
   - Provide usage examples with the updated command

## Quality Checklist

Before completing, verify:

- [ ] Command file has valid markdown syntax
- [ ] Frontmatter description is clear and concise
- [ ] $ARGUMENTS is used correctly if parameters expected
- [ ] Instructions are unambiguous
- [ ] Backward compatibility is maintained (unless breaking change requested)

## Core Principles

### Parallelization (CRITICAL for Speed)

When searching for commands, execute ALL searches in parallel:

- Multiple command file reads -> ONE message with multiple Read calls
- Multiple pattern searches -> ONE message with multiple Grep/Glob calls

### Depth-First Strategy (DFS over BFS)

When updating, go DEEP into each improvement before moving to the next:

- Complete one aspect of the update fully before starting another
- Finish the description update before modifying the workflow

### Architecture Principles

**FSD over DDD:** Ensure command workflows follow Feature-Sliced Design patterns.

**TDD First:** Include validation steps in updated workflows.

**DRY & OPEN-CLOSED:**

- Check existing commands for patterns to reuse
- Design updates for extension without breaking existing functionality

## Examples

```
/update-command gitignore add support for monorepos
/update-command doc-cli fix handling of nested subcommands
/update-command create-command improve the discovery questions
/update-command repo-cleanup
```
