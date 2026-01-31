# Changelog

## [Unreleased]

### Fixed

- Established centralized `secrets/` directory structure for Firebase configuration files as per monorepo standards.
- Migrated and renamed `GoogleService-Info.plist` and `google-services.json` from `apps/numy/` to `secrets/` to enable secure symlinking.
- Refactored `scripts/link-firebase-files.sh` to remove redundant app entries and align with current project structure, resolving `just clean` reporting errors.
- Recovered broken Yarn state by running `yarn install`, resolving "node_modules state file not found" errors during validation.
- Fixed `PrivacySequence.test.ts` failure by updating `jest.config.js` to correctly handle TypeScript files via `babel-jest` and including `expo-tracking-transparency` in transformation whitelist.
- Fixed `calculatorStore.test.ts` failure caused by Jest mock hoisting issues by refactoring manual mocks to use proper factory pattern and type casting.
- Optimized imports in `calculatorStore.test.ts` to satisfy linting rules.
- Fixed `SIGABRT` crash on iOS launch (GADApplicationIdentifier missing) by enforcing CNG compliance and removing stale `ios/` directory.
- Added validation test `validate-native-config.test.ts` to ensure AdMob configuration integrity.
- Refactored `apps/numy/app/(tabs)/_layout.tsx` to extract nested components (`HeaderAddButton`, `TabIcon`) and resolve IDE linting warnings.
- Migrated native resolution logic to `app.config.ts` to follow project standards and resolve monorepo plugin resolution issues.
- Updated `app.json` by moving plugins to `app.config.ts` to eliminate IDE resolution warnings.
- Updated `validate-native-config.test.ts` to use `@expo/config` for validating the final resolved configuration (app.json + app.config.ts).
- Fixed `SIGABRT` crash on iOS launch (`GADApplicationVerifyPublisherInitializedCorrectly`) by explicitly injecting `GADApplicationIdentifier` into the resolved config.
- Aligned `settings.ts` `bundleId` (`ai.moruk.numy`) with `app.json` and updated Android AdMob ID.
- Added `ios` and `android` recipes to `justfile` for convenient app launching (`just ios`, `just android`).
- Fixed validation script `test-ads-schema.js` runtime and type errors by adding proper JSDoc type definitions, declaring global `__dirname`, using `node:` imports, and improving Regex string handling.
- Resolved `tsconfig.json` validation error by updating module setting to `es2022`.
