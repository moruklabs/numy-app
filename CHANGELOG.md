# Changelog

All notable changes to Plant Doctor are documented here.

## [Unreleased]

### Firebase Initialization Fix

#### Fix: No Firebase App '[DEFAULT]' has been created

- **Issue**: Crashlytics and Analytics transports were failing with "No Firebase App '[DEFAULT]' has been created - call firebase.initializeApp()" error
- **Root Cause**: The `@react-native-firebase/app` plugin was missing from `app.config.ts` plugins array, preventing Firebase auto-initialization
- **Fix**: Added `@react-native-firebase/app` to the plugins array in `app.config.ts` (line 83)
- **Impact**: Firebase services (Crashlytics, Analytics) now initialize properly on app startup
- **Sentry Issue**: [PLANT-DOCTOR-3X](https://moruk.sentry.io/issues/95423126/)

### Storage Key Migration & Logger Service Refactoring

#### Storage Key Migration to Unified Schema

- Migrated all AsyncStorage keys to unified `@pd/{category}/{key}` naming schema
- Updated storage key definitions in `src/shared/config/constants/index.ts`
- Created and ran storage migration in `src/shared/storage/migration.ts`
- Key changes:
  - `@moruk/consent` → `@pd/tracking/consent`
  - `@moruk/onboarding_completed` → `@pd/onboarding/completed`
  - `@moruk/language` → `@pd/preferences/language`
  - `@moruk/theme` → `@pd/preferences/theme`
  - And 10+ more keys (see migration file for full mapping)
- **Impact**: Cleaner storage namespace, improved debuggability, future-proof key structure

#### Logger Service Architecture Refactor

- Refactored centralized logger service with modular transport system
- Created dedicated transport modules in `src/services/logger/transports/`:
  - **Analytics Transport**: Firebase Analytics event tracking
  - **Crashlytics Transport**: Firebase Crashlytics logging
  - **Sentry Transport**: Error tracking and breadcrumbs
  - **Console Transport**: Development debugging
  - **Telegram Transport**: Remote logging (infrastructure ready)
  - **Queued Transport**: Wrapper for retry/buffering logic
- Removed deprecated Firebase service wrappers:
  - Deleted `src/shared/firebase/analytics/AnalyticsService.ts`
  - Deleted `src/shared/firebase/crashlytics/CrashlyticsService.ts`
  - Deleted old monitoring client infrastructure
- Centralized event definitions in `src/shared/config/events.ts`
- **Benefits**:
  - Single import point for all logging: `import { logger } from "@/src/services/logger.service"`
  - Consistent API across all log types: `logger.info()`, `logger.event()`, `logger.error()`
  - Easy to add/remove transports without touching business logic
  - Better testability with transport-level mocking

#### Test Infrastructure Updates

- Fixed `useConsentRecovery.test.ts` to mock new logger service instead of deprecated Firebase analytics
- Updated all service tests to use centralized logger mocks
- Added architecture enforcement test (`__tests__/architecture/logger-enforcement.test.ts`)
- Validates no direct usage of:
  - `console.log/warn/error` (except in allowed files)
  - `@sentry/react-native` (except in sentry transport)
  - `@react-native-firebase/analytics` (except in analytics transport)
  - `@react-native-firebase/crashlytics` (except in crashlytics transport)
- **Impact**: Enforced architectural boundaries, prevented logging anti-patterns

#### Validation & CI

- All 87 Jest test suites passing (804 tests)
- All 15 Bun test files passing
- Architecture enforcement validates on every CI run
- No console.\* violations in production code

### Developer Experience: Project-Based Node Version Management

- Added `.nvmrc` file with Node.js version 25.2.1 for nvm users
- Added `engines.node: ">=24.0.0"` to `package.json` to document the minimum supported Node.js version
- Added `volta.node: "25.2.1"` to `package.json` for Volta project pinning
- Updated `scripts/check-prereqs.sh` to use project-based version management:
  - Interactive prompts now ask for permission before installing Node.js
  - Non-interactive environments (CI) automatically skip installation with clear warnings
  - Version is dynamically read from `.nvmrc` or `.tool-versions` to avoid drift
  - `asdf` uses `.tool-versions` with `asdf local` (project-scoped)
  - `nvm` uses `.nvmrc` with `nvm install` and `nvm use` (uses detected version as fallback)
  - `volta` uses `package.json` volta field for project pinning
  - `fnm` installs project-specific version
  - Added proper error handling for failed installations
  - Removed global version installations (`fnm default`, `nvm alias default`, `asdf global`)
  - Removed Homebrew option (doesn't support project-based versions)
- **Impact**: Developers can now safely use different Node versions across projects without conflicts

### Mutation Testing Infrastructure

- Added StrykerJS mutation testing configuration (`stryker.config.js`)
- Configured for critical path focus (services, hooks, utilities)
- Performance-optimized with incremental mode, per-test coverage, and TypeScript checking
- Added mutation testing scripts to `package.json` and `justfile`
- Created comprehensive documentation:
  - `docs/testing/MUTATION_TESTING.md` - Implementation guide and rationale
  - `docs/MUTATION_TESTING_STATUS.md` - Integration challenges and alternative approaches
- **Status**: Partially implemented, integration with React Native/Expo pending
- **Alternative**: Manual mutation testing recommended for critical paths

### Fix: Sentry EU Endpoint (CI/CD)

- Fixed Sentry 401 auth error in CI/CD by switching all Sentry integration points from US (`sentry.io`) to EU (`de.sentry.io`) data center
- Updated `app.json` Sentry plugin URL to `https://de.sentry.io/`
- Added `SENTRY_URL: https://de.sentry.io/` env var to `deploy.yml` (3 steps) and `validate.yml` (1 step)
- Added `url` to Sentry extra config in `app.config.ts` for runtime consistency

### Iteration 1: B1 — TrackingService No-Throw (OTA-safe)

- Fixed `throw error` in `TrackingService.requestPermission()` catch block — now returns `"unavailable"` instead of crashing the consent chain

### Iteration 2: B2 — Consent Orchestrator Try-Catch (OTA-safe)

- Added try-catch around `TrackingService.requestPermission()` in consent orchestrator — UMP always runs regardless of ATT outcome (defense-in-depth)

### Iteration 3: B3 + B4 — Onboarding Finally + Review >= (OTA-safe)

- **B3**: Moved `@pd:onboarding_completed` write to `finally` block — onboarding always completes even if consent flow throws
- **B4**: Changed review trigger from `=== 3` to `>= 3` with `hasReviewBeenTriggered` guard — prevents permanently skipped reviews

### Iteration 4: B5 — Consent Recovery Hook (OTA-safe)

- Added `useConsentRecovery` hook with `AppState` listener to detect ATT status changes when user returns from iOS Settings

### Iteration 5: Integrity Worker (OTA-safe)

- Added storage integrity worker that runs on app mount to repair orphaned state (missing `review_triggered`, missing `onboarding_completed`)

### Iteration 6: Post-Onboarding Interstitial Ad (OTA-safe)

- Added `"onboarding_complete"` ad trigger that bypasses review gate

### Fix: Double History Entry Bug

- Removed duplicate `HistoryService.saveAnalysis()` call from `useImageAnalysis` hook — history is now saved once by the API layer (`AnalysisService.analyzeImages`) with deduplication support
- Shows interstitial ad after onboarding completes, wrapped in try-catch for graceful failure

### Settings Enhancement

- Added OTA publish datetime display below version number in Settings screen — shows when the currently running update was published, useful for verifying OTA updates are applied

### Iteration 7: UMP Consent Refresh on Every App Launch (OTA-safe)

- Extended `useConsentRecovery` to always call `AdMobService.requestConsent()` on mount and foreground, regardless of ATT status match
- Fixes permanent ad blocking in GDPR regions where initial UMP consent failed (network error, timeout) and ATT status never changed
- UMP call is idempotent — returns immediately if consent already obtained, per Google UMP SDK docs
- Wrapped in try-catch for graceful failure; logs `ump_consent_refreshed` analytics event

### Sentry Context Enrichment (OTA-safe)

- Added automatic context enrichment for every Sentry event — attaches device info, app info, network status, user preferences, localization, and full AsyncStorage snapshot
- Uses dependency inversion (`context-enrichment.ts` has no native imports) to avoid circular deps between `@moruk/logger`, `@moruk/storage`, and `@moruk/info`
- Auto-refreshes context every 5 minutes; large storage values truncated to keep payloads manageable
- Tags (platform, os_version, app_version, language, theme, etc.) are indexed and searchable in Sentry dashboard
- Persistent user identity via `getUserOrCreateUserId()` UUID

### Iteration 9: AsyncStorage Explorer Enhancements (OTA-safe)

- AsyncStorage Explorer now supports multi-expand (multiple items open simultaneously)
- Added "Collapse All" toolbar button — visible only when items are expanded
- Added "Copy JSON" toolbar button — serializes all storage as `{key: value}` to clipboard
- 10 new tests in `AsyncStorageDebugScreen.test.tsx`

### Notification Queue + OTA Success Message (OTA-safe)

### Changed

- **CI: Split validation into parallel jobs** — each check (typecheck, lint, format, test, other-checks) runs on its own GitHub Actions runner with full 7GB RAM, eliminating OOM failures and removing the 8GB swap workaround from `validate.yml` (note: `deploy.yml` still uses swap expansion)

---

## [1.1.4] - 2026-02-07

### Added

- **Ads Flow Overhaul**: Removed review gate, ads shown on every analysis, UMP consent triggered on home screen after onboarding
- **CI/CD Pipeline**: `validate.yml` (merge gate), `deploy.yml` (automated OTA + Sentry source maps), `upload-secrets.sh`, `sentry-ci-report.sh`
- **Local CI Testing**: `act` support with `just ci`, `just ci-debug`, `just ci-check`, `just ci-pull` recipes
- **Consent Recovery Hook**: `useConsentRecovery` with `AppState` listener for ATT status changes; UMP consent refresh on every app launch
- **Storage Integrity Worker**: Repairs orphaned state (`review_triggered`, `onboarding_completed`) on app mount
- **Sentry Context Enrichment**: Auto-attaches device info, app info, network, preferences, AsyncStorage snapshot; auto-refreshes every 5 min
- **AsyncStorage Explorer**: Multi-expand, "Collapse All" button, "Copy JSON" button, 10 new tests
- **Notification Queue**: `NotificationService` imperative bridge, sequential display (max 5), OTA success notification
- **Post-Onboarding Interstitial Ad**: `"onboarding_complete"` trigger that bypasses review gate
- **OTA Publish Date**: Localized publish datetime in Settings screen
- **Documentation**: Iteration issue files (`board/iterations/`), OTA deployment protocol in `CLAUDE.md`, CI/CD docs

### Changed

- Review trigger scan count changed to 15 (from 3)
- Ad frequency capping relaxed (`maxPerSession: 99`, `intervalMinutes: 0`)
- `resetConsent()` now works in production builds
- Simplified settings reset logic (removed individual storage key removals)

### Fixed

- **Sentry EU Endpoint**: Fixed 401 auth error by switching from US to EU (`de.sentry.io`) data center
- **TrackingService**: Returns `"unavailable"` instead of crashing consent chain
- **Consent Orchestrator**: UMP always runs regardless of ATT outcome (defense-in-depth)
- **Onboarding**: `@pd:onboarding_completed` write moved to `finally` block
- **Review Trigger**: Changed from `=== 3` to `>= 3` with `hasReviewBeenTriggered` guard
- **Double History Entry**: Removed duplicate `HistoryService.saveAnalysis()` call
- **Notification Context**: Fixed `useMemo` TODO on Provider value

---

## [1.1.3] - 2026-02-05

### Fixed

- Fixed navigation routes for `/settings/async-storage` and `/settings/telemetry` (404 errors)
- Added missing route registrations in `app/_layout.tsx`
- Extended "Reset All Settings" to include UMP ads consent reset

### Added

- OTA update checker on 404 page with 7-state machine
- "Check for Updates" button with status feedback
- "Do Not Close" warning during analysis phases with orange icon
- Route registration validation test
- AnalysisOverlay test suite (10/10 passing)

---

## [1.1.3] - 2026-02-04

### Changed

- Consolidated application configuration into `src/config/settings.ts` as single source of truth
- Deprecated and removed Firebase Remote Config
- Enforced strict ad frequency capping (1/session, 24/day, 60 min interval)

### Added

- Hidden developer mode (unlocked by tapping version 5 times, password: 3146)
- "Restart Onboarding" and "Reload App" functionalities
- "Use System Theme" toggle, "Cookie Policy", "App Permissions", "More From Us" links
- Comprehensive AdMob diagnostics to Debug Screen with reset capabilities
- "Log Current Configs" feature for clipboard debugging

### Fixed

- DetailsScreen back button navigation
- `.gitignore` compliance for Expo Doctor (`.expo/`)

---

## [1.1.3] - 2026-02-01

### Fixed

- "Rate Us" link pointing to correct feedback URL
- "Join Our Community" link display in Settings
- Replaced `require` with top-level imports in `useImageAnalysis.ts`

### Added

- Store Review dialog trigger after 3 successful image analyses
- `communityUrl` and `rateUrl` to application configuration

---

## [1.1.3] - 2026-01-31

### Fixed

- `just clean` command failing due to DEV environment suffix in app name
- Firebase config file paths from `./firebase/` to root (`.`)
- Created missing `google-services.json` for Android builds
- Fixed failing `useAnalytics` hook tests (achieved 100% coverage)
- Fixed TypeScript errors in gateway, factory, and gemini-client tests

### Added

- Validation tests for app config, DEV prefix, and justfile recipes
- 810 tests passing across 91 suites

---

## [1.1.3] - 2026-01-25

### Added

- Accessibility infrastructure with contrast utility and WCAG compliance checking
- Accessibility test suites for atomic components (Text, Button, Badge)
- Full AdMob integration with production App IDs (`ca-app-pub-9347276405837051~9238472056`)
- InterstitialAdService with frequency control and interval management
- Ad preloading on app startup
- 15 new AdMob service tests

---

## [1.1.3] - 2026-01-24

### Added

- Store review functionality with `StoreReviewUtils` utility
- Redesigned home screen title component
- Cache deduplication using FNV-1a hash (prevents duplicate history entries)
- `cacheKey` field to `HistoryItem` interface
- 444 total tests passing

### Fixed

- Navigation after analysis results (Details -> Home instead of Summary)

---

## [1.1.3] - 2026-01-23

### Changed

- Unified `just run` command with flag-based configuration (`--build`, `--android`, `--clean`)
- Automatic Watchman project reset before every run
- Refactored justfile to use central dispatcher (`scripts/just-run.sh`)

### Added

- "Open Settings" button for photo access permissions
- "App Permissions" item in Settings screen
- Turkish translations for new permission strings

---

## [1.1.3] - 2026-01-22

### Added

- Native build caching via ccache for iOS
- High-performance image rendering via `expo-image`
- Comprehensive unit test coverage for HistoryScreen, HomeImageUploader
- Accessibility roles/labels to image components

### Fixed

- Infinite loop in `useFocusEffect` tests
- Image rendering performance issues

---

## [1.0.1] - 2026-01-21

### Fixed

- App initialization crash from circular dependencies in shared config barrel
- Goal persistence conflict during image changes
- Theming crashes by unifying duplicated ThemeContext
- Expo Router missing default export warnings

### Changed

- Standardized logging using central `logLevel` config
- Consolidated package manifests into single root `package.json`
