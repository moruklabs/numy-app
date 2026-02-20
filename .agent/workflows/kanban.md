---
description: View current kanban board status — backlog, todo, doing, done
---

# /kanban Workflow

When the USER invokes this workflow, you must execute the following steps to interact with the active board.

1. Execute the kanban script.
   // turbo

```bash
just board
```

2. Using the output, give the user a highly concise summary of the specific Kanban board (Platform or App) related to the current working directory.
3. Ask the user if they'd like to pick up the top `TODO` priority or adjust the board.
