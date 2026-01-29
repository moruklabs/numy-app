---
description: Switch context to a different app in the monorepo
argument-hint: "[app-name]"
---

Switch Claude Code context to work on a different app in the monorepo.

**Usage:**

```
/switch-app baby-glimpse
/switch-app cat-doctor
```

**What it does:**

1. Changes working directory to `apps/{app-name}/`
2. Loads app-specific context from `.claude/apps/{app-name}/`
3. Updates session context with app information

**Available apps:**
See `/list-apps` command or check `.claude/app-registry.json`
