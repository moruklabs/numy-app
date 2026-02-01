# Numy - Task Runner
set dotenv-load := true

# Default recipe - list all available commands
default:
    @just --list

# ============================================================
# Development
# ============================================================

# Start development server or run app with flags
# Usage: just run [--build] [--android] [--clean] [--no-cache]
run *args:
    ./scripts/just-run.sh {{args}}

# Alias for run
start *args:
    just run {{args}}

# Run on iOS simulator
ios:
    just run --build

# Run on Android emulator
android:
    just run --build --android

# ============================================================
# Validation
# ============================================================

# Run full validation (type-check, lint, format, doctor, test, circular, metadata, ads)
validate:
    @yarn type-check
    @yarn lint
    @yarn format
    @npx expo-doctor > /dev/null
    @yarn test
    @just check-circular
    @yarn validate:metadata
    @node scripts/test-ads-schema.js

# Run deep validation including E2E tests
validate-deep: validate
    maestro test e2e/launch.yaml

# Check for circular dependencies
check-circular:
    @npx dpdm --no-tree --no-warning --exit-code circular:1 app/_layout.tsx > /dev/null

# Run tests
test *args:
    yarn test {{args}}

# Type check
type-check:
    yarn type-check

# Lint code
lint:
    yarn lint

# Fix all issues (lint, format, doctor)
fix:
    yarn fix

# Run AI translations for app and store metadata
# Usage: just translate [app|store|all]
translate mode="all":
    yarn translate {{mode}}

# ============================================================
# Building & Release
# ============================================================

# Build for iOS (local)
build-ios:
    eas build --platform ios --profile production --local

# Build for Android (local)
build-android:
    eas build --platform android --profile production --local

# Build and submit to App Store
# Usage: just build-submit [platform] [bump]
# Examples:
#   just build-submit                    # production build & submit
#   just build-submit production patch   # production build & submit, bump patch
#   just build-submit preview            # preview build only
build-submit *args:
    ./scripts/ios-build-submit.sh {{args}}

# Upload sourcemaps to Sentry (requires SENTRY_AUTH_TOKEN)
upload-sourcemaps platform="android":
    #!/usr/bin/env bash
    set -e
    if [ -z "$SENTRY_AUTH_TOKEN" ]; then echo "Error: SENTRY_AUTH_TOKEN is not set."; exit 1; fi
    ORG="moruk"
    PROJECT="numy"
    RELEASE=$(node -e "console.log(require('./package.json').version)")
    DIST="{{platform}}"
    if [ "{{platform}}" = "android" ]; then
        BUNDLE="android/app/build/generated/assets/createBundleReleaseJsAndAssets/index.android.bundle"
        SOURCEMAP="android/app/build/intermediates/sourcemaps/react/release/index.android.bundle.packager.map"
    else
        BUNDLE="ios/main.jsbundle"
        SOURCEMAP="ios/main.jsbundle.map"
    fi
    npx sentry-cli sourcemaps upload --org "$ORG" --project "$PROJECT" --release "numy@$RELEASE" --dist "$DIST" "$BUNDLE" "$SOURCEMAP"

# Clean build artifacts
clean:
    yarn run clean

# Kill process on port 8081
killport:
    ./scripts/killport.sh 8081

# Sync Firebase symlinks (legacy compatibility)
sync-firebase:
    @mkdir -p firebase/development firebase/production
    @cp secrets/info-plists/numy-GoogleService-Info.plist firebase/development/GoogleService-Info.plist
    @cp secrets/info-plists/numy-GoogleService-Info.plist firebase/production/GoogleService-Info.plist
    @echo "✅ Firebase configuration files synced to firebase/ from secrets/"
