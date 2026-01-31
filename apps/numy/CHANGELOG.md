# Changelog

## [Unreleased]

### Fixed

- Fixed `PrivacySequence.test.ts` failure by updating `jest.config.js` to correctly handle TypeScript files via `babel-jest` and including `expo-tracking-transparency` in transformation whitelist.
- Fixed `calculatorStore.test.ts` failure caused by Jest mock hoisting issues by refactoring manual mocks to use proper factory pattern and type casting.
- Optimized imports in `calculatorStore.test.ts` to satisfy linting rules.
