# Numy - Task Runner
set dotenv-load := true

# Default recipe - list all available commands
default:
    @just --list

# Internal: verify bun + node prerequisites (cached for 1 hour)
_check-prereqs:
    @../../shared/scripts/check-prereqs.sh

# ============================================================
# Development
# ============================================================

# Start development server or run app with flags
# Usage: just run [--build] [--android] [--clean] [--no-cache]
run *args:
    ../../shared/scripts/just-run.sh {{args}}

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
validate: _check-prereqs
    @bun run type-check
    @bun run lint
    @bun run format
    @npx expo-doctor > /dev/null
    @bun run test
    @just check-circular
    @bun run validate: _check-prereqsmetadata
    @node scripts/test-ads-schema.js

# Run deep validation including E2E tests
validate-deep: validate
    maestro test e2e/launch.yaml

# Check for circular dependencies
check-circular:
    @npx dpdm --no-tree --no-warning --exit-code circular:1 app/_layout.tsx > /dev/null

# Check for code duplication (copy-paste detection)
check-duplication:
    @bunx jscpd src/

# Run lint tests (used by root just _run-all test-lint)
test-lint:
    bun run test:lint

# Validate store metadata (used by root just _run-all check-metadata)
check-metadata:
    bun run validate:metadata

# Validate AdMob schema (used by root just _run-all check-ads-schema)
check-ads-schema:
    bun run validate:ads

# Validate localization (used by root just _run-all check-localization)
check-localization:
    bun run validate:metadata

# Run tests
test *args:
    bun run test {{args}}

# Type check
type-check:
    bun run type-check

# Lint code
lint:
    bun run lint

# Fix lint issues
lint-fix:
    bun run lint:fix

# Check formatting
format:
    bun run format

# Fix formatting issues
format-fix:
    bun run format:fix

# Run expo doctor
doctor:
    bun run doctor

# Fix expo doctor issues
doctor-fix:
    bun run doctor:fix

# EAS/Expo config validation
eas-config:
    eas config --profile preview --platform ios --non-interactive
eas-inspect:
    rm -rf ./inspect-output
    gtimeout 90 eas build:inspect --platform ios --stage pre-build --output ./inspect-output
prebuild-check:
    CI=1 npx expo prebuild --platform ios

# Fix all issues (lint, format, doctor)
fix:
    bun run fix

# Run AI translations for app and store metadata
# Usage: just translate [app|store|all]
translate mode="all":
    bun run translate {{mode}}

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
    ../../shared/scripts/build/ios_build_submit.sh {{args}}

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
    bun run clean

# Kill process on port 2007
killport:
    PYTHONPATH=../../ python3 -m shared.scripts.killport 2010

# Sync Firebase symlinks (legacy compatibility)
sync-firebase:
    @mkdir -p firebase/development firebase/production
    @cp secrets/info-plists/numy-GoogleService-Info.plist firebase/development/GoogleService-Info.plist
    @cp secrets/info-plists/numy-GoogleService-Info.plist firebase/production/GoogleService-Info.plist
    @echo "✅ Firebase configuration files synced to firebase/ from secrets/"

# Show app kanban board
board:
	PYTHONPATH="../../.." python3 -m shared.scripts.product_management.kanban_board --app numy

# Show app status
status:
	PYTHONPATH="../../.." python3 -m shared.scripts.product_management.workspace_status --app numy
