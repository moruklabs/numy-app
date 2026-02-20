---
description: Start a new session
---

# /session-start Workflow

When the USER invokes this workflow, you must execute the following steps to formally begin a session.

1. Read `CURRENT_TASK.md` in the current directory to understand what was previously in progress. If it does not exist, ignore this step.
2. Check the local Kanban board.
   // turbo

```bash
just board
```

3. Based on the `just board` output:
   - If there is an item in `DOING`, that is your target. Read that `P[N]-*.md` file from `.product-management/kanban/doing/`.
   - If `DOING` is empty, read the top priority ticket from `.product-management/kanban/todo/` and move it into `.product-management/kanban/doing/`. Then read the ticket.
4. Read recent changelogs to get context on what has changed recently.
   // turbo

```bash
cat docs/changelog/*/CHANGELOG.md | tail -n 20
```

5. Update `CURRENT_TASK.md` status to 🟡 In Progress, representing the ticket you just loaded.
6. Using the `notify_user` tool, summarize your findings, state the objective derived from the Kanban board, and confirm that you are ready to begin execution using TDD.
