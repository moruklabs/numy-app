---
description: Create symlinks GEMINI.md, AGENTS.md, and WARP.md pointing to CLAUDE.md in git root
---

Create symlinks for GEMINI.md, AGENTS.md, and WARP.md that point to CLAUDE.md in the git repository root.

## Requirements

- Must be executed from within a git repository
- CLAUDE.md must exist in the git root directory

## Steps

1. **Verify Prerequisites**
   - Check if we're in a git repository: `git rev-parse --show-toplevel`
   - If not in a git repo, inform the user and exit
   - Get the git root directory path: `git rev-parse --show-toplevel`
   - Verify CLAUDE.md exists in git root: `test -f "$(git rev-parse --show-toplevel)/CLAUDE.md"`

2. **Create Symlinks**
   - Get the git root: `GIT_ROOT=$(git rev-parse --show-toplevel)`
   - For each symlink (GEMINI.md, AGENTS.md, WARP.md):
     - Check if the file already exists
     - If it exists and is NOT a symlink, ask user if they want to replace it
     - If it exists and IS a symlink pointing to CLAUDE.md, skip it (already correct)
     - If it exists and IS a symlink pointing elsewhere, ask user if they want to replace it
     - Create the symlink: `ln -sf "$GIT_ROOT/CLAUDE.md" "$GIT_ROOT/<SYMLINK_NAME>.md"`
     - Use `-sf` flags: `-s` for symbolic link, `-f` to force (overwrite existing symlinks)

3. **Verify Symlinks**
   - After creating each symlink, verify it points to CLAUDE.md:
     - `readlink -f "$GIT_ROOT/<SYMLINK_NAME>.md"` should resolve to `$GIT_ROOT/CLAUDE.md`
   - Display confirmation for each successfully created symlink

4. **Summary**
   - Report which symlinks were created
   - Report which symlinks already existed and were skipped
   - Report any errors encountered

## Error Handling

- If not in a git repository, display error: "Error: Not in a git repository. Please run this command from within a git repository."
- If CLAUDE.md doesn't exist in git root, display error: "Error: CLAUDE.md not found in git root ($GIT_ROOT). Please create it first."
- If a target file exists and is not a symlink, ask user before overwriting
- If symlink creation fails, report the specific error

## Example Execution

```bash
# Get git root
GIT_ROOT=$(git rev-parse --show-toplevel)

# Create symlinks
ln -sf "$GIT_ROOT/CLAUDE.md" "$GIT_ROOT/GEMINI.md"
ln -sf "$GIT_ROOT/CLAUDE.md" "$GIT_ROOT/AGENTS.md"
ln -sf "$GIT_ROOT/CLAUDE.md" "$GIT_ROOT/WARP.md"

# Verify
ls -la "$GIT_ROOT" | grep -E "(GEMINI|AGENTS|WARP)\.md"
```

## Expected Behavior

- Creates three symlinks in the git root directory
- All symlinks point to CLAUDE.md
- Handles existing files gracefully
- Provides clear feedback on what was created or skipped
