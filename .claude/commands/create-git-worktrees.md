---
description: Create N git worktrees for parallel development
allowed-tools: Bash, Read
---

# Create Git Worktrees

Create $ARGUMENTS git worktrees in the `.worktrees/` subdirectory, each with a feature branch based on main/master.

## Instructions

1. **Validate input**: Ensure `$ARGUMENTS` is a positive integer (1-10). If not provided or invalid, show usage and exit.

2. **Detect base branch**: Check if `main` or `master` exists and use that as the base branch.

3. **Create worktrees directory**: Create `.worktrees/` if it doesn't exist.

4. **Generate unique names**: Use timestamp-based naming to avoid conflicts:
   - Branch: `feature/wt-{timestamp}-{n}`
   - Directory: `.worktrees/wt-{timestamp}-{n}`

5. **Create each worktree**:

   ```bash
   git worktree add .worktrees/wt-{name} -b feature/wt-{name} {base_branch}
   ```

6. **Report results**: Show a summary table of created worktrees with:
   - Directory path
   - Branch name
   - How to navigate to each

7. **Add to .gitignore**: Ensure `.worktrees/` is in `.gitignore` if not already present.

## Example Output

```
Created 3 worktrees:

| # | Directory              | Branch                    |
|---|------------------------|---------------------------|
| 1 | .worktrees/wt-abc123-1 | feature/wt-abc123-1       |
| 2 | .worktrees/wt-abc123-2 | feature/wt-abc123-2       |
| 3 | .worktrees/wt-abc123-3 | feature/wt-abc123-3       |

To use a worktree:
  cd .worktrees/wt-abc123-1 && claude

To list all worktrees:
  git worktree list

To remove a worktree:
  git worktree remove .worktrees/wt-abc123-1
```

## Core Principles

### Parallelization (CRITICAL for Speed)

When creating worktrees, consider parallel creation if independent:

- Git fetch + base branch detection -> ONE message with multiple Bash calls
- Multiple worktree creations can be sequential (git worktree has locking)

### Depth-First Strategy (DFS over BFS)

When setting up, go DEEP into one worktree before moving to the next:

- Complete one worktree fully (create, verify) before starting another

### Architecture Principles

**DRY & OPEN-CLOSED:**

- Follow existing branch naming conventions
- Design worktree structure for extension

## Error Handling

- If not in a git repository, exit with error
- If worktree creation fails, report which ones failed and continue with others
- If N > 10, warn and cap at 10 to prevent accidents
