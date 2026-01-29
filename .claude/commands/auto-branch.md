# Auto-Branch Command

Automatically organize your repository changes into logical branches with semantic commits and PRs.

## Usage

```
/auto-branch [options]
```

## Options

- `--dry-run` - Preview what branches would be created without making changes
- `--no-pr` - Create branches and commits but skip PR creation
- `--base <branch>` - Specify base branch (default: main/master)

## Examples

```bash
# Organize all pending changes into branches and PRs
/auto-branch

# Preview the branch organization plan
/auto-branch --dry-run

# Create branches without PRs
/auto-branch --no-pr

# Use a specific base branch
/auto-branch --base develop
```

---

Use the auto-brancher agent to analyze the repository and automatically organize changes.

$ARGUMENTS

@auto-brancher Analyze the repository state and organize all pending changes (staged, unstaged, untracked) into logical branches with semantic commits. Follow your workflow phases:

1. **Repository State Analysis** - Gather complete state in parallel
2. **Change Categorization** - Group files by type (feat, fix, docs, refactor, test, chore, style, perf)
3. **Dependency Analysis** - Determine optimal creation order and PR base branches
4. **Branch Creation** - Create semantic branches with proper commits
5. **PR Creation with Smart Base Branch Selection** - Create PRs with correct base branches
6. **Summary Report** - Provide complete summary with merge order

## CRITICAL: Smart PR Base Branch Selection

When creating PRs, you MUST intelligently select the base branch:

1. **Independent changes** (no dependencies) -> base on `main`/`master`
2. **Dependent changes** -> base on the dependency's branch, NOT main

### Example Dependency Chain:

```
chore/update-deps      -> base: main
feat/new-feature       -> base: chore/update-deps (if it depends on new deps)
docs/feature-docs      -> base: feat/new-feature (documents the feature)
```

### PR Creation Commands:

```bash
# Independent PR
gh pr create --base main --title "..."

# Dependent PR (bases on another feature branch)
gh pr create --base feat/new-feature --title "docs: add feature documentation"
```

This ensures:

- PRs can be reviewed in isolation with correct diffs
- Merge conflicts are minimized
- PRs merge cleanly in dependency order
- Each PR shows only its own changes, not accumulated changes from dependencies

In the summary report, clearly show the dependency graph and recommended merge order.

---

If `--dry-run` is specified, only perform analysis and report what WOULD be done without making any changes.

## Core Principles

### Parallelization (CRITICAL for Speed)

Execute ALL analysis commands in parallel:

```
git status
git diff --stat
git log --oneline -20
git branch -a
```

All four in ONE message with multiple Bash calls.

### Depth-First Strategy (DFS over BFS)

When creating branches, go DEEP into one branch before moving to the next:

- Complete one branch fully (create, commit, push) before starting another
- Finish all commits for one branch before moving to the next

### Architecture Principles

**DRY & OPEN-CLOSED:**

- Follow existing branch naming conventions
- Reuse established commit patterns in the repository

Follow all safety rules - never force push, never skip hooks, never commit sensitive files.
