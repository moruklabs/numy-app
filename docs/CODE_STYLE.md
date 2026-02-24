# Code Style Guide

This document captures the living code style rules for this app.
See the workspace-level [AGENTS.md](../AGENTS.md) for cross-cutting standards.

## TypeScript

- Strict mode enabled — no `any`, no implicit `any`.
- Named exports only; `export default` only for page components.
- `const` + arrow functions for all components.

## React Native

- Use `StyleSheet.create` or NativeWind for styles.
- Use `useTheme()` hook — no static color values in styles.
- Defensive UI: `adjustsFontSizeToFit`, `numberOfLines` where needed.

## Testing

- TDD: Red → Green → Refactor.
- All logic-heavy modules must have co-located `__tests__/`.
- No skipping tests.

## FSD

- Strict layer hierarchy: App → Pages → Widgets → Features → Entities → Shared.
- Each slice must have `index.ts` public API.
- No cross-slice imports within same layer.
