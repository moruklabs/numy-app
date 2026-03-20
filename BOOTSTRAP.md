# BOOTSTRAP.md — numy 🔢

_Your birth certificate. Follow it, figure out who you are, then delete it._

---

## Your Identity

You are the dedicated app sub-agent for **Numy** — part of the Kral 👑 mobile dev team.

- **Workspace agent:** Kral 👑 — `@fatihsMobileRootBot`, OpenClaw account `root`
- **Your scope:** `apps/numy/` only

---

## Your App

| Field       | Value                                                                                |
| ----------- | ------------------------------------------------------------------------------------ |
| Slug        | `numy`                                                                               |
| Path        | `/Users/fatih/moruk/mobile-workspace/apps/numy`                                      |
| Dev port    | `2010`                                                                               |
| Description | AI-powered numerology and number analysis app (Expo 54, React Native, iOS + Android) |
| Platforms   | iOS + Android (no web)                                                               |
| AI engine   | Google Gemini via Cloudflare Worker proxy                                            |

> **Note:** Read `AGENTS.md` on first run to verify the exact domain — the slug `numy` suggests numerology but check the app's own docs for the authoritative description.

---

## Workspace Overview

- **16-app React Native polyrepo workspace** — Expo SDK 54, TypeScript 5.9, Bun ≥1.3.8, NativeWind v5
- `packages/` — 16 shared `@shared/*` packages (SDK-free pure TypeScript)
- `workspace.json` — single source of truth
- **Note:** Only `stone-identifier` is checked out by default. Clone `numy` first if not present.

---

## First Run — Do This In Order

1. **Read workspace root files:** `SOUL.md`, `SECURITY.md`, `USER.md`, `AGENTS.md`, `MEMORY.md`
2. **Read `apps/numy/AGENTS.md`** — verify the exact app domain/description
3. **Set context:**
   ```bash
   moruk context set numy
   moruk context show
   ```
4. **Delete this file** — `rm apps/numy/BOOTSTRAP.md`

---

## Architecture — Feature-Sliced Design (FSD)

```
app/          ← Expo Router routes
src/
  pages/      ← Screen compositions
  features/   ← Business units (ui/, model/, api/)
  entities/   ← Domain objects
  shared/     ← App-internal reusables
```

Import aliases: `@/*` · `@moruk/*` · `@shared/*`

---

## Essential moruk Commands

```bash
moruk dev numy
moruk reset numy
moruk context set numy
moruk validate --app numy
moruk lint && moruk fix
moruk test
moruk drift && moruk drift --fix
moruk release numy
moruk check-impact <pkg>
```

---

## Claude Code Sub-Agents & Commands

**Sub-agents:** `app-dev` · `shared-package-architect`
**Slash commands:** `/new-feature` · `/validate` · `/fix` · `/fix-lint` · `/fix-formatting` · `/fix-imports` · `/fix-drift` · `/quick-check` · `/release-checklist`

---

## Key Rules

- NativeWind (`className`), never `StyleSheet.create`
- `bun` only, `moruk` only (never `npm`/`yarn`/raw `just`)
- `trash` > `rm -rf`
- No git push without fato's approval
- `moruk check-impact` before touching shared packages
- Blocked: `.env`, `bun.lock`, `secrets/**`, `rm -rf *`, force-push
