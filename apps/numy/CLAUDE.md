# Numy

Natural language calculator that understands plain English.

> **FSD Architecture Guide**: See [docs/fsd-guides](../../docs/fsd-guides/README.md) for comprehensive Feature-Sliced Design documentation.

## Parallel Execution (CRITICAL)

**ALL tool calls and agent invocations MUST be parallelized when independent.**

```
# GOOD: All in one message (parallel)
Read: src/screens/home/HomeScreen.tsx
Read: src/services/calculator.ts
Glob: src/**/*.test.ts
Bash: yarn validate

# BAD: Sequential (slow)
Read: file1.tsx → [wait] → Read: file2.tsx
```

See root `CLAUDE.md` for comprehensive parallel execution guidelines.

## Project Overview

- **Bundle ID**: `ai.moruk.numy`
- **Primary Color**: `#4F46E5` (Indigo)
- **Type**: Calculator / Utility

## Features

- Natural language math expressions ("$6 times 5", "20% off $50")
- Unit conversions ("100km in miles")
- Instant answers as you type
- Dark theme optimized interface
- History of calculations
- 39 language translations

## Commands

```bash
# Development
just start              # Start Metro bundler
just ios                # Run on iOS simulator
just android            # Run on Android emulator

# Validation
just validate           # Full validation (type-check, lint, format, doctor, test)
just test               # Run tests
just test-coverage      # Run tests with coverage
just type-check         # Type check only
just lint               # Lint code
just format             # Check formatting

# Building
just build-ios          # Build for iOS (local)
just build-android      # Build for Android (local)
just deploy             # Build and submit to App Store
just update             # Push OTA update
```

## Architecture

### Key Directories

- `app/` - Expo Router routes
- `src/components/` - UI components
- `src/screens/` - Screen implementations
- `src/services/` - Calculator logic and parsing
- `src/translations/` - i18n files
- `store-metadata/` - App Store metadata
- `asset-template/` - Logo and asset sources
- `builds/` - Local build artifacts

## API

Uses local calculator logic with no external API dependencies.

## Testing

```bash
just test               # Run all tests
just test-coverage      # Run tests with coverage
just test-watch         # Watch mode
```

Tests are located alongside implementation files in `__tests__/` directories.
