# Monorepo

This is a Yarn workspaces monorepo for Expo 54 React Native apps.

- claude files are in ./.claude/ folder
- custom plugins are in ./.claude-plugins/ folder
- expo 54 react native apps are in ./apps/ folder
- shared packages are in ./packages/ folder
- documentation is in ./docs/ folder
- scripts are in ./scripts/ folder
- eas workflows are in ./workflows/ folder
- we use justfile for commands
- we use yarn for package management
- we use yarn workspaces for monorepo

> **First message?** Read [CHANGELOG.md](./CHANGELOG.md) to catch up on recent changes.

> Read CURRENT_TASK.md, SESSION.md

Yarn workspaces monorepo for Expo 54 React Native apps targeting iOS and Android (web is not actively supported).

## Project Structure

```
monorepo/
├── apps/                     # App sources
│   └── numy/      # Coin ID - Identifier
├── packages/                  # Shared packages (16 total)
│   ├── ai/                   # AI analysis services
│   ├── config/               # Shared configuration
│   ├── context/              # Shared React contexts
│   ├── event-tracking/       # Event tracking utilities
│   ├── firebase/             # Firebase integration
│   ├── gemini-client/        # @moruk/gemini-client - Gemini API client
│   ├── hoc/                  # Higher-order components
│   ├── hooks/                # Shared React hooks
│   ├── image/                # Image utilities
│   ├── info/                 # Device/system info utilities
│   ├── logger/               # Logging utilities
│   ├── monitoring-client/    # Monitoring client
│   ├── navigation/           # Navigation utilities
│   ├── storage/              # Storage utilities
│   └── ui/                   # Shared UI components
├── workers/                  # Cloudflare Workers (API proxies)
│   ├── gemini-api/           # Gemini API proxy worker
│   └── monitor-api/           # Monitor API worker (error reporting)
├── .claude/                  # Claude Code configuration
│   ├── agents/               # Custom agents (40+ agents)
│   ├── apps/                 # Per-app context files
│   ├── commands/             # Custom slash commands
│   ├── hooks/                # Event hooks system
│   ├── app-registry.json     # App registry with metadata
│   └── settings.json         # Shared settings
├── docs/                     # Documentation
├── scripts/                  # Build/deploy scripts
├── workflows/                # EAS workflows
└── [config files]            # Root configs
```

## Version Management

- **Node**: 25.2.1 (managed by asdf)
- **Yarn**: 4.12.0
- **Expo SDK**: 54
- **React Native**: 0.81.5

## Commands

```bash
# Install dependencies
just install          # or: yarn install

# Validate (lint + type-check + expo-doctor)
just validate         # or: yarn validate (Full - ~5-10 min)
just validate-quick   # or: yarn validate:quick (Fast - ~1-2 min, for PRs)
just validate-ci      # or: yarn validate:ci (CI - ~3-5 min, includes tests)
just validate-fix     # or: yarn validate:fix (expo install --check)

# Linting & formatting
just lint             # or: yarn lint
just lint-fix         # or: yarn lint:fix
just format           # or: yarn format
just format-fix       # or: yarn format:fix

# Type checking
just type-check       # or: yarn type-check

# Run a specific app
just run-app numy ios
just run-app numy android

# Build apps (local)
just build-ios numy
just build-android numy

# Submit to stores
just submit-ios numy
just submit-android numy

# Utility
just killport 3131    # Kill process on port
just workspaces       # List all workspaces
```

### Validation Strategies

| Command          | Use Case                    | Duration  | What It Checks           |
| ---------------- | --------------------------- | --------- | ------------------------ |
| `validate:quick` | PR checks, pre-commit hooks | ~1-2 min  | Type-check, lint, format |
| `validate:ci`    | CI pipeline                 | ~3-5 min  | validate:quick + tests   |
| `validate`       | Full release validation     | ~5-10 min | All checks + expo-doctor |

**When to use:**

- **validate:quick**: Fast feedback during development and PR reviews
- **validate:ci**: Comprehensive checks for CI/CD pipelines
- **validate**: Full validation before releases or major changes

## Backend APIs

### Gemini API Proxy

- **URL**: `https://gemini-api.moruk.workers.dev`
- **Reference**: `workers/gemini-api` (relative to monorepo root)
- **Endpoints**:
  - `GET /health` - Health check
  - `POST /api/v1/generate` - Text generation
  - `POST /api/v1/banana` - Image generation

### Monitor API

- **URL**: `https://monitor-api.moruk.workers.dev`
- **Reference**: `workers/monitor-api` (relative to monorepo root)
- **Endpoint**: `POST /error` - Error reporting to Telegram

## Workers (Cloudflare Workers)

The `workers/` directory contains Cloudflare Workers that serve as API proxies:

### gemini-api

Gemini API proxy worker that handles text and image generation requests.

- **Location**: `workers/gemini-api/`
- **Deployment**: `https://gemini-api.moruk.workers.dev`
- **Endpoints**:
  - `GET /health` - Health check
  - `POST /api/v1/generate` - Text generation
  - `POST /api/v1/banana` - Image generation
- **Documentation**: `workers/gemini-api/docs/`

### monitor-api

Monitoring worker for error reporting and telemetry.

- **Location**: `workers/monitor-api/`
- **Deployment**: `https://monitor-api.moruk.workers.dev`
- **Endpoint**: `POST /error` - Error reporting to Telegram
- **Documentation**: `workers/monitor-api/docs/`

## Apps Overview

| App             | Bundle ID               | Port | Primary Color  |
| ---------------- | ------------------------ | ---- | -------------- |
| numy | ai.moruk.babyglimpse | 3131 | Silver #C0C0C0 |

### Running App

```bash
# Run the app
just run-app numy ios     # port 3131
just run-app numy android # port 3131
```

Each app automatically kills its assigned port before starting via `prestart` and `preios` hooks.

## Architecture

- **SOLID Principles** - Single responsibility, dependency injection
- **DRY** - Don't repeat yourself
- **Feature Sliced Design** - Layered architecture

## Packages

The monorepo contains 12 shared packages used across apps:

### @moruk/gemini-client

Standalone Gemini API client for the moruk.workers.dev proxy:

- **GeminiClient**: Class for text/image generation via Gemini API
- **Types**: GeminiRequest, GeminiResponse, GeminiContent, ImageData, etc.

```typescript
import { GeminiClient, geminiClient } from "@moruk/gemini-client";

// Use default instance
const result = await geminiClient.generateText("Hello");

// Or create custom instance
const client = new GeminiClient({ debug: true });
```

### @moruk/ai

Reusable AI analysis services and types for identification apps.

- **AnalysisService**: Generic service for image-based AI analysis
- **Types**: AnalysisConfig, AnalysisRequest, AnalysisResponse, AnalysisError

### @moruk/context

Shared React contexts for theme, language, and other global state.

### @moruk/event-tracking

Event tracking utilities for analytics and user behavior.

### @moruk/firebase

Firebase integration including Crashlytics service.

### @moruk/hoc

Higher-order components for common patterns:

- `withAccessibility` - Accessibility enhancements
- `withKeyboardAvoidance` - Keyboard handling
- `withSafeArea` - Safe area handling

### @moruk/image

Image processing and manipulation utilities.

### @moruk/info

Device and system information utilities:

- Device info
- Network info
- System info
- User info

### @moruk/logger

Centralized logging utilities with Monitor API integration.

### @moruk/monitoring-client

Monitoring client for error reporting and telemetry.

### @moruk/navigation

Navigation utilities and helpers.

### @moruk/storage

Storage utilities for persistent data.

### @moruk/ui

Shared UI components and primitives:

- ThemedText, ThemedView
- Typography components

## iOS Development

### iOS Fix Scripts

When making iOS-specific fixes, use the idempotent script at `scripts/ios-fixes.sh`. It's automatically hooked to `prebuild` and `preios` commands for all apps.

```bash
# Manual run for a specific app
./scripts/ios-fixes.sh numy
```

The script checks:

- iOS directory existence
- DerivedData status
- Podfile configuration
- Bundle identifier consistency

---

## Claude Code Configuration

This monorepo uses Claude Code with extensive customization through agents, commands, hooks, and plugins. All paths are dynamically discovered using the `get_project_root()` utility.

### Configuration Files

- **`.claude.json`** - Main Claude Code configuration (project root)
  - Plugin registration
  - Hooks directory configuration
  - Project metadata

- **`.claude/settings.json`** - Shared project settings
  - Monorepo structure configuration
  - Validation settings
  - Shared across all team members

- **`.claude/settings.local.json`** - User-specific settings (gitignored)
  - Personal overrides
  - Local development preferences

### Dynamic Path Resolution

**All paths in Claude Code configuration are relative to the monorepo root**, which is auto-discovered using the `get_project_root()` utility from `.claude/hooks/utils/path_utils.py`.

**Never use hardcoded paths:**

- ❌ `~/Users/fatih/mobile/numy`
- ❌ `/Users/username/Users/fatih/mobile/numy`
- ✅ `apps/numy` (relative to monorepo root)

The `get_project_root()` utility:

- Uses git to discover the monorepo root dynamically
- Works from any working directory
- Falls back to deriving from `.claude/hooks/` location if git unavailable
- Cached with `@lru_cache` for performance

### Claude Code Plugins

Project-specific plugins are located in `.claude-plugins/` directory.

**Available Plugins:**

- **monorepo-utils** - Utilities for navigating and working with the monorepo
  - Commands: `/switch-app`, `/list-apps`
  - Agent: `monorepo-navigator`

See `.claude-plugins/README.md` for plugin development guidelines.

### Claude Code Hooks

Hooks provide deterministic automation at various lifecycle points. Located in `.claude/hooks/` with a handler-based architecture.

**Key Hook Events:**

- `PreToolUse` - Before tool execution (can block/modify)
- `PostToolUse` - After tool completion
- `UserPromptSubmit` - Before processing user input
- `SessionStart` - At session initialization (loads app context)
- `Stop` - When main agent finishes
- `SubagentStop` - When subagents complete

**SessionStart Hook:**
The `context_loader` hook automatically:

1. Detects which app you're working in from the working directory
2. Loads app-specific context from `.claude/apps/{app}/`
3. Injects path resolution hints for agents

See `.claude/hooks/HOOKS_GUIDE.md` for comprehensive hook documentation.

### Claude Code Agents

Custom agents are located in `.claude/agents/` (40+ agents available).

**Key Agents:**

- **image-analyzer** - Unified image analysis agent
  - Error detection mode: Rapid identification of errors, warnings, and issues
  - Design extraction mode: Detailed UI/UX analysis with layout, components, and design system
  - Comprehensive mode: Both error detection and design extraction
  - Use: `/verify-screenshot` or `/extract-designs` commands

- **monorepo-navigator** - Expert at navigating monorepo structure
  - Find files across multiple apps
  - Understand dependencies between apps and packages
  - Get context about specific apps
  - Available via `monorepo-utils` plugin

- **fsd-orchestrator** - FSD Product Manager, Lead Architect, and Documentation Guardian
- **fsd-coder** - Implements features following FSD architecture
- **fsd-entity-manager** - Manages entities layer
- **fsd-feature-specialist** - Creates user-facing features
- **hooks-manager** - Expert on Claude Code hooks API

See `.claude/agents/` directory for complete list.

### Claude Code Commands

Custom slash commands are located in `.claude/commands/`.

**Key Commands:**

- `/verify-screenshot [path]` - Analyze screenshot for errors using image-analyzer
- `/extract-designs [path]` - Extract UI design descriptions using image-analyzer
- `/switch-app [app-name]` - Switch context to different app (monorepo-utils plugin)
- `/list-apps` - List all apps in monorepo (monorepo-utils plugin)

### App Context System

Each app has its own context directory at `.claude/apps/{app}/`:

- **CURRENT_TASK.md** - Active task/context for the app
- **SPEC.md** - Current feature specification
- **.docs/backlog.md** - Features waiting to be built
- **.docs/changelog.md** - History of completed work
- **.docs/adr/** - Architecture Decision Records

The SessionStart hook automatically loads this context when you're working in an app directory.

### App Registry

The `.claude/app-registry.json` file contains metadata for all apps:

- App name, path, bundle ID, port, version
- All paths are relative to monorepo root
- Auto-discovered via `get_project_root()` utility

---

## Context Persistence Protocol

### First-Message Protocol

When starting a new session, read these files in order:

1. **CLAUDE.md** (this file) - Framework rules and standards
2. **docs/SESSION.md** - Active work state and current focus
3. **CHANGELOG.md** - Recent decisions and history

Then confirm understanding:

```
Current Branch: [branch name]
Active Task: [from SESSION.md Current Focus]
Active Blockers: [list or "None"]
Next Action: [from SESSION.md Next Actions Queue]
```

### During-Session Protocol

1. **Before making decisions:**
   - Check CHANGELOG.md Decisions section for prior choices
   - Check SESSION.md Established Patterns for conventions
   - If contradicting previous work, explain why

2. **When encountering blockers:**
   - Add to SESSION.md Active Blockers immediately
   - Include severity, root cause, resolution plan

3. **When completing tasks:**
   - Update SESSION.md Progress Summary
   - Move items from Next Actions as appropriate

### End-of-Session Protocol

Before ending any significant session:

1. **Update docs/SESSION.md:**
   - Progress Summary - Mark completed items
   - Active Blockers - Add new, resolve fixed
   - Next Actions Queue - Update priorities
   - Session Handoff Notes - Document incomplete work
   - Session History - Add entry

2. **Update CHANGELOG.md (if applicable):**
   - Add changes to [Unreleased] section
   - Add architectural decisions to Decisions section

3. **Commit context updates:**

   ```bash
   git add docs/SESSION.md CHANGELOG.md
   git commit -m "docs: update session context"
   ```

4. **Verbal summary to human:**
   - What was accomplished
   - What's the immediate next step
   - Any risks or blockers

---

## iOS Development Framework

### Phase 1: Minimal Viable (Ship First)

Required for App Store submission:

- [ ] `app/+not-found.tsx` exists (CRITICAL)
- [ ] Provider hierarchy in `_layout.tsx`
- [ ] `yarn validate` passes
- [ ] `eas.json` has `ascAppId` set
- [ ] Local production build succeeds

### Phase 2: Quality Baseline (Post-Launch)

- [ ] Jest tests for hooks/utilities
- [ ] 39 locale translations
- [ ] Accessibility labels
- [ ] `store-metadata/` with all locales

### Phase 3: Full TDD (Mature Apps)

- [ ] 100% test coverage
- [ ] Mutation testing
- [ ] BDD tests
- [ ] Integration tests

### Standard Provider Hierarchy

```tsx
<ErrorBoundary>
  <ThemeProvider initialTheme="light|dark">
    <NotificationProvider>
      <LanguageProvider>
        <SafeAreaProvider>
          <Stack />
        </SafeAreaProvider>
      </LanguageProvider>
    </NotificationProvider>
  </ThemeProvider>
</ErrorBoundary>
```

### OTA Update Strategy

| Change Type                       | Action                            |
| --------------------------------- | --------------------------------- |
| JS/TS code, styling, translations | `eas update --channel production` |
| New native dependency             | Full rebuild required             |
| Plugin changes, permissions       | Full rebuild required             |

---

## Localization Languages

Translation files in `src/translations/`:

```
ar.ts cs.ts de.ts en.ts fi.ts he.ts hr.ts id.ts it.ts ko.ts nl.ts pl.ts ro.ts sk.ts th.ts uk.ts zh.ts
ca.ts da.ts el.ts es.ts fr.ts hi.ts hu.ts index.ts ja.ts ms.ts no.ts pt.ts ru.ts sv.ts tr.ts vi.ts
```

### Metadata Locales

Under `store-metadata/locales/`:

```
ar-SA.json  en-AU.json  es-ES.json  fr-CA.json  hu.json  nl-NL.json  pt-PT.json  sv.json    zh-Hans.json
ca.json     en-CA.json  es-MX.json  fr-FR.json  id.json  no.json     ro.json     th.json    zh-Hant.json
cs.json     en-GB.json  fi.json     he.json     it.json  pl.json     ru.json     tr.json
da.json     en-US.json  hr.json     hi.json     ja.json  pt-BR.json  sk.json     uk.json
de-DE.json  el.json                             ko.json              ms.json     vi.json
```

## Development Principles

The year is 2025.

### Core Practices

- **TDD First** - Write tests before implementation
- **Dependency Injection** - Favor composition over inheritance
- **SOLID Principles** - Single responsibility, Open/closed, Liskov substitution, Interface segregation, Dependency inversion
- **DRY** - Don't Repeat Yourself
- **Testable Code** - Design for testability from the start

### Parallel Execution (CRITICAL for Speed)

**ALL tool calls and agent invocations MUST be parallelized when independent.**

This is a fundamental performance optimization. Sequential operations that could run in parallel waste significant time.

#### Tool Parallelization

When reading multiple files, searching, or running commands - do ALL in a SINGLE message:

```
# GOOD: All in one message (parallel)
Read: package.json
Read: CLAUDE.md
Read: tsconfig.json
Glob: src/**/*.ts
Grep: "pattern" in src/

# BAD: Sequential messages (slow)
Read: package.json
[wait]
Read: CLAUDE.md
[wait]
...
```

#### Agent Parallelization

When spawning multiple agents for independent tasks, invoke ALL in ONE message:

```
# GOOD: All agents in one message (parallel)
Task: fsd-architect "Validate structure"
Task: fsd-qa "Create test plan"
Task: deep-researcher "Research best practices"

# BAD: Sequential agent spawns (slow)
Task: fsd-architect "Validate structure"
[wait for result]
Task: fsd-qa "Create test plan"
[wait for result]
...
```

#### WebSearch Parallelization

When researching multiple topics, search ALL at once:

```
# GOOD: All searches in one message
WebSearch: "React Native performance 2025"
WebSearch: "Expo SDK 54 best practices"
WebSearch: "FSD architecture patterns"

# BAD: Sequential searches
WebSearch: "React Native performance 2025"
[wait]
WebSearch: "Expo SDK 54 best practices"
[wait]
...
```

#### Bash Command Parallelization

When running independent commands:

```
# GOOD: All commands in one message
Bash: git status
Bash: npm test -- --coverage --json
Bash: npx tsc --noEmit

# BAD: Sequential commands
Bash: git status
[wait]
Bash: npm test
[wait]
...
```

#### When NOT to Parallelize

Only run sequentially when there are dependencies:

```
# Sequential required: Write depends on Bash output
Bash: git rev-parse --show-toplevel  # Need this path first
[wait]
Write: {path}/file.txt  # Uses the path from above
```

### Testing Requirements

| Type              | Coverage                                        |
| ----------------- | ----------------------------------------------- |
| Unit Tests        | 100%                                            |
| Integration Tests | 100%                                            |
| Mutation Testing  | Required (verify tests actually test something) |
| BDD Testing       | Required                                        |

> Treat test code as production code - apply the same principles.

### Code Quality

- Keep code readable and maintainable
- Use comments to document intent for future developers
- Be critical, ask clarifying questions

---

## Tech Stack

| Technology   | Version |
| ------------ | ------- |
| Expo         | 54      |
| React Native | Latest  |

---

## Accessibility & i18n

- **Accessibility:** Support all accessibility features (VoiceOver, TalkBack, Dynamic Type, etc.)
- **Multilingual:** App must support multiple languages

---

## API Configuration

### Gemini Proxy

| Property       | Value                                                           |
| -------------- | --------------------------------------------------------------- |
| Endpoint       | `https://gemini-api.moruk.workers.dev`                          |
| Documentation  | `workers/gemini-api/docs` (relative to monorepo root)           |
| Endpoints Docs | `workers/gemini-api/docs/endpoints` (relative to monorepo root) |

### Monitoring Client

- **URL**: `https://monitor-api.moruk.workers.dev`
- **Reference**: `workers/monitor-api` (relative to monorepo root)
- **Package**: `@moruk/monitoring-client`
- **Endpoint**: `POST /error` - Error reporting to Telegram

---

## Shell Commands

> If `cd` will be used in a script or shell command, execute the whole command in a subshell so `pwd` won't change afterwards.

```bash
# Good
(cd /some/path && ./script.sh)

# Bad
cd /some/path && ./script.sh
```

---

## Documentation

### Project Docs

- **PRD.md** - Product requirements and feature specifications
- **DEPENDENCY_MANAGEMENT.md** - Guide for managing dependencies and resolving peer dependency warnings

### Platform Guidelines

| Topic                      | Documentation                                                                                |
| -------------------------- | -------------------------------------------------------------------------------------------- |
| Dependency Management      | [docs/DEPENDENCY_MANAGEMENT.md](docs/DEPENDENCY_MANAGEMENT.md)                               |
| FSD Architecture           | [docs/fsd-guides/README.md](docs/fsd-guides/README.md)                                       |
| Localization               | [docs/LOCALIZATION_README.md](docs/LOCALIZATION_README.md)                                   |
| Validation Troubleshooting | [docs/VALIDATION_TROUBLESHOOTING.md](docs/VALIDATION_TROUBLESHOOTING.md)                     |
| Apple HIG                  | [developer.apple.com](https://developer.apple.com/design/human-interface-guidelines)         |
| App Store Review           | [developer.apple.com](https://developer.apple.com/app-store/review/guidelines/)              |
| Android UI Design          | [developer.android.com](https://developer.android.com/design/ui/mobile)                      |
| Google Play Policy         | [support.google.com](https://support.google.com/googleplay/android-developer/answer/9859455) |
| Claude Code Best Practices | [anthropic.com](https://www.anthropic.com/engineering/claude-code-best-practices)            |

---

## Quick Reference

### Claude Code Tips (from Best Practices)

1. **Explore, Plan, Code, Commit** - Read files first, plan with "think hard", implement, commit
2. **TDD Flow** - Write failing tests, commit, write code until tests pass
3. **Visual Iteration** - Provide mocks, implement, screenshot, iterate 2-3x
4. **Be Specific** - Detailed instructions improve first-attempt success
5. **Use `/clear`** - Reset context between tasks for performance
6. **Extended Thinking** - Use "think", "think hard", "think harder", or "ultrathink" for complex problems

### Dependency Management

Check for dependency warnings:

```bash
# Quick check
yarn check:deps

# Using just
just check-deps

# Manual check
yarn install 2>&1 | grep -E "YN0060|YN0002"
```

Fix dependency issues:

```bash
# Check for version mismatches
yarn lint:deps

# Fix automatically
yarn fix:deps

# Check Expo compatibility
yarn lint:expo

# Fix Expo dependencies
yarn fix:expo
```

See [docs/DEPENDENCY_MANAGEMENT.md](docs/DEPENDENCY_MANAGEMENT.md) for detailed guide.

## Using Gemini CLI for Large Codebase Analysis

When analyzing large codebases or multiple files that might exceed context limits, use the Gemini CLI with its massive
context window. Use `gemini -p` to leverage Google Gemini's large context capacity.

## File and Directory Inclusion Syntax

Use the `@` syntax to include files and directories in your Gemini prompts. The paths should be relative to WHERE you run the
gemini command:

### Examples:

**Single file analysis:**
gemini -p "@src/main.py Explain this file's purpose and structure"

Multiple files:
gemini -p "@package.json @src/index.js Analyze the dependencies used in the code"

Entire directory:
gemini -p "@src/ Summarize the architecture of this codebase"

Multiple directories:
gemini -p "@src/ @tests/ Analyze test coverage for the source code"

Current directory and subdirectories:
gemini -p "@./ Give me an overview of this entire project"

# Or use --all_files flag:

gemini --all_files -p "Analyze the project structure and dependencies"

Implementation Verification Examples

Check if a feature is implemented:
gemini -p "@src/ @lib/ Has dark mode been implemented in this codebase? Show me the relevant files and functions"

Verify authentication implementation:
gemini -p "@src/ @middleware/ Is JWT authentication implemented? List all auth-related endpoints and middleware"

Check for specific patterns:
gemini -p "@src/ Are there any React hooks that handle WebSocket connections? List them with file paths"

Verify error handling:
gemini -p "@src/ @api/ Is proper error handling implemented for all API endpoints? Show examples of try-catch blocks"

Check for rate limiting:
gemini -p "@backend/ @middleware/ Is rate limiting implemented for the API? Show the implementation details"

Verify caching strategy:
gemini -p "@src/ @lib/ @services/ Is Redis caching implemented? List all cache-related functions and their usage"

Check for specific security measures:
gemini -p "@src/ @api/ Are SQL injection protections implemented? Show how user inputs are sanitized"

Verify test coverage for features:
gemini -p "@src/payment/ @tests/ Is the payment processing module fully tested? List all test cases"

When to Use Gemini CLI

Use gemini -p when:

- Analyzing entire codebases or large directories
- Comparing multiple large files
- Need to understand project-wide patterns or architecture
- Current context window is insufficient for the task
- Working with files totaling more than 100KB
- Verifying if specific features, patterns, or security measures are implemented
- Checking for the presence of certain coding patterns across the entire codebase

Important Notes

- Paths in @ syntax are relative to your current working directory when invoking gemini
- The CLI will include file contents directly in the context
- No need for --yolo flag for read-only analysis
- Gemini's context window can handle entire codebases that would overflow Claude's context
- When checking implementations, be specific about what you're looking for to get accurate results

## Must Haves

### Must have directories

- docs/
- scripts/

### Must have files

- justfile (or Makefile for legacy projects)
- README.md
- .gitignore
- scripts/killport.sh

### Must have commands

- `just validate` (or `make validate`) - Validate the codebase
- `just killport <port>` (or `make killport`) - Kill the port

# Agent Rules for Monorepo

## Cross-Platform Development

This project is developed on both macOS and Linux machines. All shell scripts and commands MUST work on both platforms.

### Platform-Specific Command Handling

When writing shell scripts that use platform-specific commands:

1. **Always check the OS type** using `$OSTYPE` or similar
2. **Test on both platforms** before committing
3. **Document platform differences** in comments

### Common Platform Differences

#### Disk Space Check (`df`)

- **macOS (BSD)**: `df -g` outputs in GB
- **Linux (GNU)**: `df -BG` outputs with 'G' suffix

**Correct cross-platform pattern:**

```bash
if [[ "$OSTYPE" == "darwin"* ]]; then
  # macOS: df -g gives output in GB
  FREE_GB=$(df -g . | awk 'NR==2 {print $4}')
else
  # Linux: df -BG gives output in GB, strip the 'G' suffix
  FREE_GB=$(df -BG . | awk 'NR==2 {print $4}' | sed 's/G//')
fi
```

#### Other Common Differences

- **sed**: macOS requires `-i ''` for in-place edits, Linux uses `-i`
- **date**: Different flags for date formatting
- **readlink**: macOS doesn't support `-f`, use `greadlink` (via coreutils)
- **grep**: Some flags differ between BSD and GNU versions

### Node.js and Package Management

- Node and npm are managed by **asdf** (not nvm)
- Use **npm** as the package manager (not yarn or pnpm for global installs)
- Always check with `asdf current` to verify versions

### Shell Environment

- Default shell: **zsh**
- macOS and Linux both use zsh but with different system configurations
