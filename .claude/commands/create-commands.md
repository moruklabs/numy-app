---
description: "Create multiple Claude Code slash commands from a single natural language description"
argument-hint: "<command descriptions, e.g., 'commands for git workflow: commit, push, sync'>"
---

# Create Commands Command

Use the Task tool with `subagent_type="multiple-commands-creator"` to create multiple Claude Code slash commands from a single natural language description.

## Invocation Context

This command supports two modes:

### Interactive Mode (No arguments)

If `$ARGUMENTS` is empty or contains only whitespace, the multiple-commands-creator agent should:

1. Use AskUserQuestion to gather requirements through discovery questions:
   - What domain or workflow are these commands for?
   - How many commands do you need?
   - What should each command do?
2. Parse responses and design the command set
3. Present the plan for confirmation
4. Generate all command files

### Non-Interactive Mode (With arguments)

If `$ARGUMENTS` contains command descriptions, the multiple-commands-creator agent should:

1. Parse the natural language input to extract command definitions
2. Determine structure and agent invocations for each
3. Present the creation plan
4. Generate all command files in parallel

## Command Descriptions

$ARGUMENTS

## Description Formats Supported

The agent accepts various formats for defining multiple commands:

| Pattern           | Example                                                 |
| ----------------- | ------------------------------------------------------- |
| Comma-separated   | "commit, push, and sync for git workflow"               |
| Numbered lists    | "(1) migrate, (2) seed, (3) reset for database"         |
| Colon definitions | "plan: create a plan, code: implement, test: run tests" |
| "For X" pattern   | "commands for FSD workflow: planning, coding, testing"  |
| Domain prefix     | "git commands: commit, push, pull, sync"                |

## Output Location

All commands are saved to: `.claude/commands/` (project-specific, version controlled)

If the `.claude/commands/` directory doesn't exist, create it.

## Execution Instructions

1. **Determine Mode**
   - Empty `$ARGUMENTS` → Interactive mode with discovery questions
   - Provided `$ARGUMENTS` → Non-interactive parsing and generation

2. **Parse Command Definitions**
   - Extract name, purpose, and domain for each command
   - Handle all supported description formats
   - If unclear, ask clarifying questions

3. **Research Existing Patterns**
   - Check for existing commands with similar names
   - Read 2-3 similar commands for style consistency
   - Identify if commands should invoke agents

4. **Design Each Command**
   - Determine if command invokes an agent or is direct workflow
   - Define argument-hint if command uses `$ARGUMENTS`
   - Ensure clear, actionable instructions
   - Group related commands with common prefix

5. **Present Plan for Confirmation**
   - Show table with: Name, Description, Type (agent/direct)
   - Allow modifications before proceeding
   - Check for conflicts with existing commands

6. **Generate Command Files (PARALLEL)**
   - Create all command files in a SINGLE message using multiple Write calls
   - Validate YAML frontmatter for each command
   - Include usage examples for each command

7. **Report Summary**
   - List all created command files
   - Provide usage examples for each command
   - Show workflow order if commands are related

## Quality Checks

Before completing, verify:

- [ ] All command names are unique and kebab-cased
- [ ] Each command has clear, non-overlapping purpose
- [ ] Descriptions start with verbs and are under 80 chars
- [ ] Argument-hints use `<required>` and `[optional]` format
- [ ] All files have valid YAML frontmatter
- [ ] All commands have at least one usage example

## Examples

### Example 1: Create Git Workflow Commands

```
/create-commands git workflow: commit, push, sync, and status
```

Creates 4 commands:

- `git-commit.md` - Commit changes with smart message
- `git-push.md` - Push to remote
- `git-sync.md` - Pull and push in one action
- `git-status.md` - Show repository status

### Example 2: Create Database Commands

```
/create-commands commands for database operations: migrate, seed, reset, backup
```

Creates 4 database operation commands.

### Example 3: Create FSD Workflow Commands

```
/create-commands FSD workflow: planning, coding, testing, and committing
```

Creates 4 FSD-prefixed commands for the development lifecycle.

### Example 4: Interactive Mode

```
/create-commands
```

Prompts for command requirements through discovery questions.
