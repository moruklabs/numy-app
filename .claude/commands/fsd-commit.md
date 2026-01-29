---
description: "Create semantic commit for completed FSD task with changelog integration"
argument-hint: "[optional-message-override]"
---

# FSD Commit Command

Create a semantic commit for the completed FSD task, clear CURRENT_TASK.md, and update the backlog.

**Arguments:** $ARGUMENTS

## Invocation

Use the Task tool to invoke the `fsd-commit` agent:

```
Task(
  subagent_type: "fsd-commit",
  prompt: "
    Create commit for completed FSD task.

    Message Override: $ARGUMENTS

    Workflow:
    1. Run pre-commit validation (just validate)
    2. If validation fails, STOP and report errors
    3. Read CURRENT_TASK.md and SPEC.md for context
    4. Analyze staged changes (files, layers, test count)
    5. Generate semantic commit message
    6. Create commit with proper formatting
    7. Clear CURRENT_TASK.md
    8. Mark backlog item as complete
    9. Notify @fsd-orchestrator for changelog

    If message override provided:
    - Use it as the commit subject
    - Still generate proper body and footer

    Commit Format:
    <type>(<scope>): <description>

    [body explaining what and why]

    FSD Layer: <layer>
    Tests: <count> added

    Generated with [Claude Code](https://claude.com/claude-code)
    Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
  "
)
```

## Usage

```bash
# Standard commit (auto-generates message from context)
/fsd-commit

# With custom subject line
/fsd-commit "add dark mode toggle"

# After completing a feature
/fsd-commit

# Push after commit
/fsd-commit && git push
```

## Workflow Integration

```
REFACTOR phase complete
    |
    v
@fsd-validate passes
    |
    v
/fsd-commit (this command)
    |
    ├── Create semantic commit
    ├── Clear CURRENT_TASK.md
    ├── Mark backlog complete
    └── Notify changelog update
        |
        v
Ready for next task (/auto-fsd)
```

## Commit Message Components

| Component | Source                                      |
| --------- | ------------------------------------------- |
| Type      | Detected from changes (feat, fix, refactor) |
| Scope     | FSD layer (features, entities, shared)      |
| Subject   | From SPEC.md or CURRENT_TASK.md             |
| Body      | Acceptance criteria and changes             |
| Footer    | Layer, test count, task reference           |

## Post-Commit Actions

1. **CURRENT_TASK.md** - Cleared to "No active task."
2. **Backlog** - Item marked as complete
3. **Changelog** - Entry prepared for @fsd-orchestrator

## Examples

```bash
# After completing toggle-favorite feature
/fsd-commit
# Creates: feat(features): add toggle-favorite functionality

# With explicit message
/fsd-commit "fix session expiry handling"
# Creates: fix(entities): fix session expiry handling

# Multi-layer feature
/fsd-commit
# Creates: feat: add workout sharing with deep links
```

## Error Handling

### Validation Fails

```
Commit Blocked: Validation failed
Fix errors before committing.
Run: just validate
```

### Nothing to Commit

```
No Changes to Commit
Check: git status
```

### Not in Git Repo

```
Error: Not a git repository
Initialize with: git init
```

## Core Principles

### Parallelization (CRITICAL for Speed)

When gathering context for commit, execute ALL in parallel:

- Read CURRENT_TASK.md + SPEC.md + git status -> ONE message
- Multiple file analyses -> ONE message with multiple Read calls

### Depth-First Strategy (DFS over BFS)

When analyzing changes, go DEEP into one aspect before moving to the next:

- Complete change categorization fully before generating message
- Finish all FSD layer analysis before summarizing

### Architecture Principles

**FSD Architecture:** Include FSD layer metadata in commit footer.

**DRY & OPEN-CLOSED:**

- Follow existing commit message conventions
- Reuse established commit patterns in the repository

## Notes

- Always runs validation before committing
- Never commits failing code
- Uses Conventional Commits format
- Includes FSD metadata in footer
- Cleans up task state automatically
- Does NOT push to remote (use `git push` separately)
