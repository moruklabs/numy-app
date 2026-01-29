# Firebase iOS Build Fix

## Problem

Building the iOS app failed with the error: `include of non-modular header inside framework module`. This occurred specifically with `@react-native-firebase` modules.

## Root Cause

The `app.json` was configured with `useFrameworks: "static"` in `expo-build-properties`. This setting forces all Pods to be linked as static frameworks. However, React Native Firebase's header structure and its dependencies are not fully compliant with modular header requirements in a global static framework context, leading to Clang compiler errors.

## Solution

The fix involved three main steps to align with the working standard in this monorepo:

1.  **Removed Redundant Configuration**: Removed `"useFrameworks": "static"` from the `expo-build-properties` plugin in `app.json`.
2.  **Modular Headers Plugin**: Ensured the `../../packages/config/src/plugins/withModularHeaders.js` plugin is active in `app.json`.
3.  **Specific Patches**: The plugin was updated to:
    - Set `$RNFirebaseAsStaticFramework = true` and `use_modular_headers!` globally in the `Podfile`.
    - Apply `CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES = 'YES'` to all Pod targets in the `post_install` hook.

## How to Apply

If you encounter similar issues after a configuration change:

1. Ensure `app.json` does **not** have global static framework linkage forced.
2. Run a deep clean: `yarn run clean`.
3. Re-run the build: `just run <app> ios`.
