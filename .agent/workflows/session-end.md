---
description: End the current session — update CURRENT_TASK, move kanban cards, append changelog
---

# /session-end Workflow

When the USER invokes this workflow, you must execute the following steps to formally close a session.

1. Review what you accomplished in this session.
2. If the current task in `CURRENT_TASK.md` was completed:
   - Identify the corresponding `P[N]-*.md` file in `.product-management/kanban/doing/`.
   - Move the file to `.product-management/kanban/done/`.
   - Mark the status in `CURRENT_TASK.md` as 🟢 Completed.
3. If the task was NOT completed:
   - Leave the Kanban ticket in `doing/`.
   - Leave handoff notes in `CURRENT_TASK.md` detailing exactly where the next agent should start.
4. Using the `date` command to get the current timestamp, generate a changelog entry.
5. Create or append to a file in `docs/changelog/` formatted as `YYYY-MM-DD/CHANGELOG.md`.
6. Summarize the end of session for the USER using `notify_user`.
