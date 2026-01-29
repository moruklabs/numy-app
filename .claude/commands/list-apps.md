---
description: List all apps in the monorepo
---

List all available apps in the monorepo with their bundle IDs and versions.

**Usage:**

```
/list-apps
```

**Output:**

- App name
- Bundle ID
- Port number
- Version
- Path relative to monorepo root

**Data source:**
Reads from `.claude/app-registry.json` which is auto-discovered via `get_project_root()` utility.
