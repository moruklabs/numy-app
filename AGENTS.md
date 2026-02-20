# AGENTS.md — Single Source of Truth

! Prefer simplicity over complexity without giving up from the main goal, and be critical

Canonical instruction set for all AI agents. **Do not edit symlink files directly** — always edit `AGENTS.md`.

| Symlink                           | Agent            |
| --------------------------------- | ---------------- |
| `CLAUDE.md`                       | Anthropic Claude |
| `GEMINI.md`                       | Google Gemini    |
| `WARP.md`                         | Warp AI          |
| `.github/copilot-instructions.md` | GitHub Copilot   |

```bash
make symlink        # interactive — prompts before replacing
make symlink-force  # non-interactive — overwrites
```

---

## 🧠 Core Memories & Constraints

- **macOS**, **FSD** + **TDD** + **ATDD**, **CNG** (ios/android gitignored)
- **Stack:** Expo SDK 54, TypeScript, Bun 1.3.8

## 🔄 Life Cycle

Read before any task: `AGENTS.md` → `docs/PRD.md` → `docs/TECHSPEC.md` → `docs/TROUBLESHOOTING.md` → `docs/CODE_STYLE.md` → `README.md` → `CHANGELOG.md`

- Follow **TDD** (Red-Green-Refactor). Ensure `just validate` passes 100%. Run `just validate` before commit; when it is green, review and commit (per WARP.md). Keep docs up to date.

> [!IMPORTANT]
> **Strict Exclusion Rule**: Do NOT lint, format, or test the `guides/` folder.

### Session Protocol

Every AI agent session **must** follow this start/end ritual to maintain cross-session continuity.

**Session Start:**

1. Read `docs/CURRENT_TASK.md` — understand what was in-progress
2. Check `.board/kanban/doing/` — verify active work items
3. Skim latest `docs/changelog/` entry — understand recent changes
4. If resuming work, update `CURRENT_TASK.md` status to 🟡 In Progress

**Session End:**

1. Update `docs/CURRENT_TASK.md` with: files touched, decisions made, handoff notes
2. Move completed kanban cards from `doing/` → `done/`
3. Append changelog entry to `docs/changelog/YYYY-MM-DD/CHANGELOG.md`
4. If task is incomplete, leave clear handoff notes in `CURRENT_TASK.md`

### Kanban Workflow

Cards live in `.board/kanban/{backlog,todo,doing,done}/` as markdown files.

| Column     | Meaning                                 | Who moves here                     |
| ---------- | --------------------------------------- | ---------------------------------- |
| `backlog/` | Ungroomed ideas                         | Anyone                             |
| `todo/`    | Groomed & prioritized, ready for pickup | Agent at session start             |
| `doing/`   | Actively being worked on (max 1-2)      | Agent when starting work           |
| `done/`    | Completed & verified                    | Agent after `just validate` passes |

**Rule:** Never have more than 2 items in `doing/`. Finish before starting new work.

### Architecture Decision Records

Major design decisions are logged in `.board/adr/` using the `ADR-NNN-title.md` format. See `.board/adr/README.md` for the template. Create an ADR when:

- Choosing between competing approaches
- Making breaking or irreversible changes
- Establishing new patterns or conventions

## Configuration Infrastructure

Single TypeScript file drives both native settings and app logic.

### 🏆 Source of Truth: `src/config/settings.ts`

Consolidates: App Metadata (name, bundle IDs, version), Feature Toggles (`darkMode`, `enhancedAnalysis`), Service Credentials (AdMob, Sentry DSN, Firebase), App Constants (URLs, log levels, timings), Remote Config Defaults.

> [!NOTE]
> Uses `export default { ... } as const;` for strict type safety and immutability.

### 🔌 Consumers

| Consumer      | File                                 | How                                                                               |
| :------------ | :----------------------------------- | :-------------------------------------------------------------------------------- |
| Native Config | `app.config.ts`                      | Imports `settings` for Expo env & native props (Bundle IDs, Google Service files) |
| App Code      | `src/lib/config/app-config/index.ts` | `createAppConfig` factory → type-safe `appConfig` object                          |
| Versioning    | `package.json`                       | Synced with `settings.ts` version via `__tests__/version-consistency.test.ts`     |

### 🛠 Secondary Config Files

| File                   | Purpose                                         |
| :--------------------- | :---------------------------------------------- |
| `.env` / `.env-sample` | Environment overrides & secrets (not committed) |
| `eas.json`             | EAS Build profiles & environment mapping        |
| `justfile`             | Command orchestration recipes                   |
| `tsconfig.json`        | TypeScript compiler settings                    |
| `babel.config.js`      | JS transformation rules                         |
| `metro.config.js`      | Bundler config (assets, aliases)                |

### Package Manager: Bun

| Command                         | Purpose              |
| :------------------------------ | :------------------- |
| `bun install`                   | Install deps         |
| `bun run <script>`              | Run scripts          |
| `bunx <command>`                | npx-style execution  |
| `bun install --frozen-lockfile` | CI immutable install |

> [!NOTE]
> `expo-doctor` may report false positives with Bun due to `npm explain` incompatibility. The `doctor` script uses `|| true`.

---

This app shares code with other apps from shared packages. Each app and each shared package is a **separate git repository**.

### Shared Code Structure

```
shared/                         # Shared code directory
├── __tests__/                  # Shared test utilities and lint tests
│   ├── scripts/                # Script validation tests
│   ├── test-utils/             # Shared test utilities
│   └── lint/                   # Lint validation tests
├── api/                        # API clients and services
├── storage/                     # Storage utilities and migrations
├── ui/                         # Shared UI components
├── config/                      # Configuration and plugins
├── context/                     # React contexts
├── primitives/                  # Hooks, HOCs, and primitives
└── {other-modules}/            # Other shared modules

workers/                        # Cloudflare Workers (shared)
scripts/                        # Build and utility scripts (shared)
guides/                         # Documentation (shared)
```

### How Apps Reference Shared Code

From `apps/numy/` (this app):

- **TypeScript paths** (`tsconfig.json`): `@moruk/*` → `../../shared/*`
- **Babel aliases** (`babel.config.js`): `@moruk` → `../../shared`
- **Expo plugins** (`app.config.ts`): `../../shared/config/plugins/*`
- **Import statements**: Use `@moruk/storage`, `@moruk/api`, etc. instead of relative paths

**Key Principle**: From `apps/{app}/`, shared directories are two levels up (`../../`), not one (`../`).

### Shared Code Modules

Common shared modules include:

- **`@moruk/storage`**: AsyncStorage wrappers, migrations, storage keys
- **`@moruk/api`**: API clients, AI providers (Gemini, Apple Intelligence), analysis services
- **`@moruk/ui`**: Reusable UI components (Button, Card, Badge, etc.)
- **`@moruk/config`**: Configuration utilities, Expo plugins
- **`@moruk/context`**: React contexts (Theme, Language, Notification)
- **`@moruk/primitives`**: Hooks (`useConsent`, `useEraseData`) and HOCs (`withSafeArea`)

### Test Organization

- **Shared tests**: Located in `shared/__tests__/` (scripts, test-utils, lint)
- **Worker tests**: Located in `workers/__tests__/` (if applicable)
- **App tests**: Stay in `apps/{app}/__tests__/` (app-specific only)

### IDE Configuration for Shared Code

All IDEs (VSCode, Cursor, Antigravity MCP, IntelliJ) are configured to analyze shared directories:

- `../../shared/**` - For cross-repo refactoring of shared code
- `../../workers/**` - For worker code analysis
- `../../scripts/**` - For script utilities

This enables safe refactoring of shared code that affects multiple repositories.

### Setting Up Shared Code in New Repositories

See `/Users/fatih/mobile/MIGRATION_PROMPT.md` for a complete guide on configuring a new repository to use shared code.

---

## Core Architecture: Feature-Sliced Design (FSD)

Strict layer hierarchy — modules can only import from layers **below**, never above or horizontally (except via public API).

**Layers (Top → Bottom):** App → Processes _(optional)_ → Pages → Widgets → Features → Entities → Shared

### Testing Strategy

Two layers of testing, each with a distinct purpose:

#### Unit Tests (TDD) — Implementation Correctness

1. **Red:** `__tests__/` folder → write failing test (Jest + RNTL)
2. **Green:** Minimum code to pass
3. **Refactor:** Clean up, strict types, FSD boundaries

#### E2E Specs (ATDD) — Executable Specifications

Maestro YAML specs are **colocated with source code** in `src/<layer>/<slice>/e2e/` directories. Each spec file is a runnable user story that serves as both acceptance test and product documentation.

| Convention      | Rule                                                                     |
| --------------- | ------------------------------------------------------------------------ |
| **Location**    | `src/<layer>/<slice>/e2e/` (colocated with source)                       |
| **Naming**      | `user-<verb>-<object>.yaml` — reads as a user story                      |
| **Clean State** | Every spec MUST use `launchApp: clearState: true` for test isolation     |
| **Comments**    | `# GIVEN:`, `# WHEN:`, `# THEN:` narrative structure                     |
| **Metadata**    | `name:`, `tags:` (feature area), `priority:` (P0-P2) in YAML frontmatter |
| **Spec Index**  | `docs/e2e-specs.md` — feature index serving as living PRD                |
| **Run**         | `find src -path '*/e2e/*.yaml' -exec maestro test {} +`                  |

**Spec-first workflow:**

1. Write the Maestro spec YAML describing the user story (acceptance criteria)
2. Run it — it fails (Red)
3. Implement the feature until the spec passes (Green)
4. Update `docs/e2e-specs.md` index

> [!IMPORTANT]
> If you delete a spec, you're removing the feature from the product. Specs ARE the PRD.

### Public API

Every slice has `index.ts`. **Only** import from `index.ts` — deep imports forbidden.

### Code Style

See [`docs/CODE_STYLE.md`](docs/CODE_STYLE.md) for the full living style guide. Update it whenever a new pattern is established or an anti-pattern is discovered.

| Element    | Spec                                                  |
| ---------- | ----------------------------------------------------- |
| Language   | TypeScript (Strict)                                   |
| Components | `const` + Arrow Functions                             |
| Styles     | `StyleSheet.create` or NativeWind                     |
| Tests      | `jest` + `bun:test` + `@testing-library/react-native` |
| Exports    | Named only (`export default` only for Pages)          |

### Slice Structure

```text
src/features/<feature-name>/
  ├── ui/         # Components
  ├── model/      # State (Zustand/Hooks)
  ├── api/        # API calls
  ├── e2e/        # Maestro YAML specs (ATDD)
  ├── __tests__/  # TDD
  └── index.ts    # Public API
```

### No-Go List

- **No** circular dependencies
- **No** business logic in `Shared`
- **No** cross-slice imports within the same layer → use `Process` or `Page`
- **No** skipping tests for logic-heavy `Entities`/`Features`
- **No** direct analytics/crashlytics/sentry/console calls → use centralized `logger` service (`src/services/logger.service.ts`)

### ⚠️ Firebase Modular API (v23+)

All `@react-native-firebase/*` packages use the **modular API** — functions are named exports that take the service instance as the first argument. Do NOT flag this pattern as a bug during code review:

```ts
// ✅ CORRECT — Modular API (v23+)
const { getCrashlytics, log, setAttributes } = require("@react-native-firebase/crashlytics");
const instance = getCrashlytics();
log(instance, "message");
setAttributes(instance, { key: "value" });

// ❌ WRONG — Legacy compat API (deprecated)
const crashlytics = getCrashlytics();
crashlytics.log("message");
```

---

## Must-Have Screens

### ⚙️ Settings Screen

| Section           | Items                                                                                                    |
| ----------------- | -------------------------------------------------------------------------------------------------------- |
| **Appearance**    | Language (current), Dark Mode (toggle), Use System Theme                                                 |
| **Accessibility** | Reduce Motion (toggle)                                                                                   |
| **Privacy**       | App Permissions (→ System), Privacy Policy, Terms, Cookie Policy, **Clear All Data** _(red/destructive)_ |
| **Support**       | Contact Support, Rate Us, Share App                                                                      |
| **Advanced**      | Debug Tools _(hidden in production)_                                                                     |
| **Footer**        | App Version                                                                                              |

### 🛠️ Debug Screen

| Section          | Items                                                                                            |
| ---------------- | ------------------------------------------------------------------------------------------------ |
| **Data & State** | View AsyncStorage, View Telemetry, Inject Mock Data, Restart Onboarding                          |
| **AdMob**        | Request/Check/Reset Consent, Show Interstitial, Reset Ad Frequency                               |
| **Tracking**     | ATT Request/Check, Advertising ID (copy), Track Test Event, Set Debug User Property              |
| **Diagnostics**  | Sentry: Test Error · Crashlytics: Test Crash/Log · UI: Success/Error Notification · Store Review |
| **Config**       | View Config Values (→ sub-screen)                                                                |

### 📄 Config Values Screen

| Section           | Items                                                                                 |
| ----------------- | ------------------------------------------------------------------------------------- |
| **Metadata**      | Environment, App Name, Version, Bundle/Package ID, Language, Language Decision Method |
| **Feature Flags** | Ads, Analytics, Crashlytics, Sentry, Remote Logging (Enabled/Disabled)                |
| **Ad Config**     | iOS/Android App ID & Unit ID, Ad Frequency, Ad Interval                               |
| **System**        | Review Reminder count, Notification Duration, Sentry DSN, Support/Privacy URLs        |

**UX Rules:** (1) Hide Debug Tools in prod — reveal by tapping Version 5×. (2) Red for destructive actions, Blue for primary. (3) Add search bar if Debug screen grows further.

---

## Iterative OTA Deployment

Issue files tracked in `board/iterations/` (iter-1 through iter-11).

**Pre-Deploy:** `just validate` (100%) → test on device → review iteration issue file

```bash
eas update --channel production --message "Iter N: <description>"  # manual only (deploy.yml)
```

**Post-Deploy:** Check Firebase Analytics error rate → Monitor Sentry → Verify consent flow

**Rollback:** `eas update:rollback --channel production`

**Safety Rules:** No new required storage keys, no breaking API changes, try-catch for graceful degradation, new features additive only.

---

## CI/CD (GitHub Actions)

### Workflows

| Workflow                 | Trigger                    | Purpose                                                   |
| ------------------------ | -------------------------- | --------------------------------------------------------- |
| `validate.yml`           | PRs to main                | Type-check, lint, format, test, doctor — merge gate       |
| `release.yml`            | Push tag `v*`              | Version check → Build → Submit to stores → GitHub Release |
| `deploy.yml`             | Manual (workflow_dispatch) | OTA deploy via EAS Update + Sentry source maps            |
| `claude-code-review.yml` | Manual                     | Claude AI code review                                     |

### Release Process

```bash
./scripts/ios-build-submit.sh patch  # bump version in package.json + settings.ts
git add -A && git commit -m "chore: bump version to 1.2.0"
git tag v1.2.0 && git push origin main --tags
# → release.yml fires: build → submit → GitHub Release
```

### Local vs CI Validation

|              | Local (`just validate`) | CI (`bun run validate:ci`)      |
| ------------ | ----------------------- | ------------------------------- |
| Lint/Format  | Auto-fixes              | Read-only                       |
| Dependencies | `bun install`           | `bun install --frozen-lockfile` |
| Prebuild     | `bunx expo prebuild`    | Skipped                         |

### GitHub Secrets

Upload via `./scripts/ci/upload-secrets.sh`:

| Secret              | Required For                     |
| ------------------- | -------------------------------- |
| `EXPO_TOKEN`        | `release.yml`, `deploy.yml`      |
| `SENTRY_AUTH_TOKEN` | `deploy.yml` (source map upload) |

### MCP Servers

All MCP servers are configured in `~/.gemini/antigravity/mcp_config.json`. Tool budget: **≤50 tools** across all servers.

#### Sentry

AI agents query issues/events/traces via the **Sentry MCP Server**.

| Field             | Value                     |
| ----------------- | ------------------------- |
| **Organization**  | `moruk`                   |
| **Project Slug**  | `numy`                    |
| **Project ID**    | _(set per project)_       |
| **Region / Host** | `de.sentry.io`            |
| **Region URL**    | `https://de.sentry.io`    |
| **Dashboard**     | `https://moruk.sentry.io` |

Requires `SENTRY_ACCESS_TOKEN` (generate at `de.sentry.io/settings/account/api/auth-tokens/` with `org:read`, `project:read`, `event:read` scopes).

#### Firebase

AI agents interact with Crashlytics, Auth, and project config via the **Firebase MCP Server**.

| Field                 | Value                                     |
| --------------------- | ----------------------------------------- |
| **Project ID**        | _(set per project)_                       |
| **Project Number**    | _(set per project)_                       |
| **Package (Android)** | _(from settings)_                         |
| **Bundle (iOS)**      | _(from settings)_                         |
| **Android App ID**    | _(from Firebase console)_                 |
| **iOS App ID**        | _(from Firebase console)_                 |
| **Enabled Tools**     | 6 tools (read-only diagnostics subset)    |
| **Dashboard**         | _(Firebase console URL for this project)_ |

Uses `firebase-tools@latest mcp` with `--dir` and `--only core,crashlytics,auth`. Requires Firebase CLI login (`npx firebase-tools@latest login`).

> [!NOTE]
> The `firebase.json` contains only `react-native` config (no Hosting/Firestore declarations), so `--tools` must be specified to avoid empty tool auto-detection. Admin/create/write tools are disabled to stay within tool budget.

#### GitHub

AI agents manage PRs and issues via the **GitHub MCP Server**.

| Field          | Value                     |
| -------------- | ------------------------- |
| **Repository** | `moruklabs/numy`          |
| **Toolsets**   | `issues`, `pull_requests` |

Runs via Docker (`ghcr.io/github/github-mcp-server`). Requires `GITHUB_PERSONAL_ACCESS_TOKEN` with `repo` scope.

#### Context7

Fetches up-to-date, version-specific library documentation (Expo, React Native, etc.) to prevent hallucinations. Runs via `npx @upstash/context7-mcp@latest`. No auth required.

#### Perplexity

Web search and research via `server-perplexity-ask`. Requires `PERPLEXITY_API_KEY`.

#### SonarQube

AI agents query code quality issues via the **SonarQube MCP Server** (3 read-only tools enabled).

| Field            | Value                                                          |
| ---------------- | -------------------------------------------------------------- |
| **Organization** | `moruklabs`                                                    |
| **Project Key**  | `moruklabs_numy-app`                                           |
| **Dashboard**    | `https://sonarcloud.io/project/overview?id=moruklabs_numy-app` |

Runs via Docker (`mcp/sonarqube`). Requires `SONARQUBE_TOKEN` (SonarCloud user token).

### CI Scripts

- `scripts/ci/upload-secrets.sh` — `.env` → GitHub secrets uploader (`gh` CLI)
- `scripts/ci/sentry-ci-report.sh` — Reports CI failures to Sentry (auto on workflow failure)

### Local Workflow Testing (`act`)

```bash
just ci          # Run validate.yml locally (Docker)
just ci-debug    # Verbose output
just ci-check    # Dry-run
just ci-pull     # Pull act Docker image
```

Config: `.actrc` (committed). Uses `.env` for secrets. **NEVER run `deploy.yml` or `release.yml` locally.**

---

## 📚 References

**Guides:** `guides/develop/` (Auth, Debug, Linking) · `guides/eas/` · `guides/eas-update/` · `guides/submit/` · `guides/app-signing/` · `guides/bare/` · `guides/brownfield/` · `guides/core-concepts.mdx` · `guides/tutorial/` · `guides/workflow/` · `guides/build-reference/` · `guides/faq.md` · `guides/technical-specs/`

**Docs:** [Expo](https://docs.expo.dev/) · [Expo Router](https://docs.expo.dev/router/introduction/) · [EAS Build](https://docs.expo.dev/build/introduction/) · [EAS Update](https://docs.expo.dev/eas-update/introduction/) · [NativeWind v4](https://www.nativewind.dev/) · [React Query](https://tanstack.com/query/latest/docs/framework/react/overview)

## URL Patterns

| Page            | URL                                  |
| --------------- | ------------------------------------ |
| Privacy Policy  | `https://moruk.link/$app-id/privacy` |
| Contact Support | `https://moruk.link/$app-id/support` |
| Rate Us         | `https://moruk.link/$app-id/review`  |
| Terms of Use    | `https://moruk.link/$app-id/terms`   |
| Cookie Policy   | `https://moruk.link/$app-id/cookie`  |
