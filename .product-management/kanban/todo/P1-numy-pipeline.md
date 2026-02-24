# P1 — Fix numy validate pipeline

**Priority:** 🟡 P1
**Scope:** apps/numy
**Effort:** Small

## Problem

`validate` in `package.json` runs only 5/8 steps: type-check, lint, format, doctor, test.
`check:circular` is absent entirely. `validate:ads` script is also missing.

## Fix

1. Add scripts to `package.json`:

```json
"check:circular": "npx dpdm --no-tree --no-warning --exit-code circular:1 app/_layout.tsx",
"validate:ads": "node scripts/test-ads-schema.js"
```

2. Copy `scripts/test-ads-schema.js` from a sibling app (e.g. bird-identifier)
3. Update `validate`:

```json
"validate": "concurrently --kill-others-on-fail -n \"TypeCheck,Lint,Format,Doctor,Test,Circular,Metadata,Ads\" -c \"magenta,cyan,yellow,magenta,purple,blue,green,white\" \"bun run type-check\" \"bun run lint\" \"bun run format\" \"bun run doctor\" \"bun run test\" \"bun run check:circular\" \"bun run validate:metadata\" \"bun run validate:ads\""
```

## Acceptance Criteria

- [ ] `bun run validate` runs all 8 steps
- [ ] All steps pass
