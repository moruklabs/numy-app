---
description: Explore repo, update gitignore, and commit changes in logical chunks
---

You are orchestrating a comprehensive repository cleanup workflow. This command handles three phases: exploration, gitignore management, and intelligent chunked commits.

## Phase 1: Repository Exploration

First, get a quick overview of the repository state:

1. **Run git status** to see:
   - Current branch
   - Staged vs unstaged changes
   - Untracked files
   - Files pending deletion

2. **Analyze the file types** in untracked and modified files:
   - Look for patterns (build artifacts, cache files, IDE configs, logs)
   - Identify files that should likely be gitignored
   - Note files that represent actual work to be committed

3. **Check for sensitive files** that should never be committed:
   - .env files, credentials, API keys
   - Private keys, certificates
   - Local configuration with secrets

## Phase 2: Gitignore Update

If you identified files that should be gitignored:

1. Launch the **gitignorer** agent (Worker tier, haiku) using the Task tool with `subagent_type: "gitignorer"` and `model: "haiku"`:

```
Analyze this repository and update .gitignore based on:

1. Current untracked files that appear to be:
   - Build artifacts or compiled output
   - Cache directories
   - IDE/editor configuration
   - OS-specific files
   - Log files
   - Dependency directories
   - Environment/secret files

2. The detected technology stack

Please:
- Update or create .gitignore with appropriate patterns
- Organize with clear section comments
- Report any currently tracked files that should be ignored (with untrack commands)
```

2. After gitignore updates, run `git status` again to see the cleaned-up state

## Phase 3: Intelligent Chunked Commits

Now analyze the remaining changes for logical commit groupings:

1. **Categorize changes** by examining `git diff --stat` and file paths:
   - **Documentation**: README, CLAUDE.md, docs/, \*.md
   - **Configuration**: package.json, tsconfig.json, wrangler.toml, config files
   - **Source code by feature/module**: Group related source files
   - **Tests**: test/, **tests**/, _.test._, _.spec._
   - **Styling**: CSS, SCSS, Tailwind, theme files
   - **Infrastructure**: Docker, CI/CD, deployment configs
   - **Dependencies**: package-lock.json, yarn.lock, requirements.txt changes
   - **Cleanup/Refactor**: Deletions, renames, reformatting

2. **Propose commit groups** following these principles:
   - Each commit should be atomic and self-contained
   - Related changes belong together
   - Order commits logically (e.g., types before implementation)
   - Keep commits focused - split large changes

3. **For each proposed commit**:
   - List the files to include
   - Suggest a conventional commit message:
     ```
     <type>(<scope>): <description>
     ```
   - Types: feat, fix, docs, style, refactor, test, chore, perf
   - Ask user to confirm or adjust before executing

4. **Execute commits** after user approval:
   - Stage only the files for that specific commit
   - Create the commit with the agreed message
   - Verify with `git log -1 --oneline`
   - Proceed to next commit group

## Workflow Summary

Present your analysis to the user in this format:

```
## Repository Status

**Branch**: [current branch]
**Changes Overview**:
- Modified: X files
- Deleted: X files
- Untracked: X files

## Gitignore Recommendations
[List files that should be ignored, if any]

## Proposed Commits

### Commit 1: [type]([scope]): [message]
Files:
- path/to/file1
- path/to/file2

### Commit 2: [type]([scope]): [message]
Files:
- path/to/file3
- path/to/file4

[Continue for all logical groups]

---
Ready to proceed? I'll:
1. Update .gitignore (if needed)
2. Execute commits in order (with your approval for each)
```

## Important Guidelines

- **Always show the plan first** before making any changes
- **Ask for confirmation** before each commit
- **Handle deletions carefully** - confirm the user intended to delete files
- **Watch for uncommitted local changes** that might be lost
- **Never commit sensitive files** - flag and exclude them
- **Suggest meaningful commit messages** that explain the "why" not just the "what"

## Core Principles

### Parallelization (CRITICAL for Speed)

When gathering repository state, execute ALL in parallel:

```
git status
git diff --stat
git log --oneline -10
```

All three in ONE message with multiple Bash calls.

### Depth-First Strategy (DFS over BFS)

When committing, go DEEP into one commit group before moving to the next:

- Complete one logical commit fully (stage, commit, verify) before starting another
- Finish categorizing all files for one commit before moving to the next

### Architecture Principles

**DRY & OPEN-CLOSED:**

- Follow existing commit message conventions from git log
- Reuse established commit patterns in the repository

## Quality Checks

Before proceeding with commits:

1. Verify no sensitive files are staged
2. Ensure each commit compiles/works independently (when feasible)
3. Confirm all gitignored files are excluded
4. Double-check file deletions are intentional
