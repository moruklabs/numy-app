# Identifiers Monorepo - Task Runner
# https://github.com/casey/just

# List of apps dynamically sourced from the apps/ directory
apps := shell("ls -d apps/*/ | sed 's|apps/||;s|/||g' | xargs")

# Note: Xcode uses its own incremental build cache (DerivedData).
# ccache doesn't integrate with Xcode's build system without complex setup.
# To keep fast builds: avoid `clean:ios` and don't clear DerivedData unnecessarily.

# Default recipe - list all available commands
default:
    @just --list

watchman-setup:
    pkill -f watchman > /dev/null 2>&1 || true
    @watchman watch-del '{{justfile_directory()}}' > /dev/null 2>&1 || true
    @watchman watch-project '{{justfile_directory()}}' > /dev/null 2>&1

# Install all dependencies
install:
    yarn install

# Validate all workspaces (test, lint, type-check, expo-doctor, merge-metadata, localization)
validate:
    yarn validate
    just merge-metadata
    just test-localization
    node scripts/test-ads-schema.js

# Run validation for draft apps (error-tolerant)
validate-drafts:
    @for app in draft-apps/*; do \
        if [ -d "$app" ] && [ -f "$app/justfile" ]; then \
            echo "Validating draft app: $app"; \
            just -f "$app/justfile" validate || true; \
        fi \
    done

# Quick validation (for PRs) - type-check, lint, format
validate-quick:
    yarn validate:quick

# CI validation (type-check, lint, format, test)
validate-ci:
    yarn validate:ci

# Fix validation issues (expo install --check)
validate-fix:
    yarn validate:fix

# Validate app.json configurations (supportsTablet, etc.)
validate-configs:
    yarn validate:configs

# Lint all workspaces
lint:
    yarn lint

# Fix lint issues
lint-fix:
    yarn lint:fix

# Check for dependency issues (YN0060, YN0002)
check-deps:
    bash scripts/check-dependencies.sh

# Format all files
format:
    yarn format

# Fix formatting issues
format-fix:
    yarn format:fix

# Fix all issues in all workspaces (lint, format, doctor)
fix:
    EXPO_NO_CACHE=1 yarn workspaces foreach -Ap --exclude '@moruk/identifiers-monorepo' run fix

# Type check all workspaces
type-check:
    yarn type-check

# Validate store metadata configurations for all apps
test-metadata:
    node scripts/__tests__/store-config.test.js

# Validate localization (32 in-app translations, 39 store locales, auto-increment)
test-localization target="":
    #!/usr/bin/env bash
    set -e
    if [ -n "{{target}}" ]; then
        node scripts/__tests__/localization.test.js {{target}}
    else
        node scripts/__tests__/localization.test.js
    fi

# Generate and test store metadata for a specific app
merge-metadata target_or_flags="" *flags:
    #!/usr/bin/env bash
    set -e
    APPS=(numy)

    TARGET="{{target_or_flags}}"
    FLAGS="{{flags}}"

    # Check if target is an app
    IS_APP=0
    for app in "${APPS[@]}"; do
        if [ "$app" = "$TARGET" ]; then
            IS_APP=1
            break
        fi
    done

    if [ "$IS_APP" -eq 1 ]; then
        # Run for single app
        echo "Merging metadata for $TARGET..."
        (cd apps/$TARGET && node ../../scripts/localization/merge-metadata.js $FLAGS)
        node scripts/__tests__/store-config.test.js $TARGET
    else
        # Run for all apps, treating TARGET as a flag if it's not empty
        ALL_FLAGS="$TARGET $FLAGS"
        echo "Merging metadata for ALL apps with flags: $ALL_FLAGS"

        for app in "${APPS[@]}"; do
             echo "=== $app ==="
             (cd apps/$app && node ../../scripts/localization/merge-metadata.js $ALL_FLAGS)
             node scripts/__tests__/store-config.test.js $app
             echo ""
        done
    fi

# Run tests across all apps
test-apps:
    yarn test:apps

# Run tests with coverage across all apps
test-coverage:
    yarn test:coverage

# Clean watchman state
watchman-clean:
    yarn watchman:clean

# Build all packages (in topological order)
build-packages:
    yarn build

# Build ALL apps (default: parallel). Use `just build-all serial` for lower disk pressure.
build-all mode="parallel":
    #!/usr/bin/env bash
    set -e

    # Minimum free disk space (in GB) required to run multi-app iOS builds.
    MIN_FREE_GB=30

    # Get free space in GB (works on both macOS and Linux)
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS: df -g gives output in GB
        FREE_GB=$(df -g . | awk 'NR==2 {print $4}')
    else
        # Linux: df -BG gives output in GB, strip the 'G' suffix
        FREE_GB=$(df -BG . | awk 'NR==2 {print $4}' | sed 's/G//')
    fi

    if [ "$FREE_GB" -lt "$MIN_FREE_GB" ]; then
        echo "✗ Not enough free disk space for build-all (mode: {{mode}})."
        echo "  Required: >= ${MIN_FREE_GB}GB, Available: ${FREE_GB}GB"
        echo "  Tip: Run 'just free' to clean Xcode/Expo/Yarn caches, then retry."
        exit 1
    fi

    MODE="{{mode}}"
    APPS=(numy)
    LOG_DIR="./builds/logs"
    mkdir -p "$LOG_DIR"
    TIMESTAMP=$(date +%Y%m%d-%H%M%S)

    if [ "$MODE" = "serial" ]; then
        echo "Starting SERIAL builds (no parallel tasks). Logs in $LOG_DIR"
        echo "Apps: ${APPS[*]}"
        echo ""

        for app in "${APPS[@]}"; do
            LOG_FILE="$LOG_DIR/${app}-build-${TIMESTAMP}.log"
            echo "Starting $app (serial) (log: $LOG_FILE)"
            if (cd apps/$app && eas build --platform ios --profile production --local > "../../$LOG_FILE" 2>&1); then
                echo "✓ $app completed successfully"
            else
                echo "✗ $app FAILED (check log for details)"
                exit 1
            fi
        done

        echo ""
        echo "All serial builds completed successfully!"
        exit 0
    fi

    echo "Starting parallel builds + validation tasks..."
    echo "Logs will be saved to $LOG_DIR"
    echo ""

    PIDS=()
    NAMES=()

    # Start validation tasks concurrently
    echo "Starting test (log: $LOG_DIR/test-${TIMESTAMP}.log)"
    (yarn test > "$LOG_DIR/test-${TIMESTAMP}.log" 2>&1) &
    PIDS+=($!); NAMES+=("test")


    echo "Starting lint:expo (log: $LOG_DIR/lint-expo-${TIMESTAMP}.log)"
    (yarn lint:expo > "$LOG_DIR/lint-expo-${TIMESTAMP}.log" 2>&1) &
    PIDS+=($!); NAMES+=("lint:expo")

    echo "Starting workspace validate (log: $LOG_DIR/workspace-validate-${TIMESTAMP}.log)"
    (yarn workspaces foreach -Ap --exclude '@moruk/identifiers-monorepo' run validate > "$LOG_DIR/workspace-validate-${TIMESTAMP}.log" 2>&1) &
    PIDS+=($!); NAMES+=("workspace-validate")

    echo "Starting expo:doctor (log: $LOG_DIR/expo-doctor-${TIMESTAMP}.log)"
    (yarn expo:doctor > "$LOG_DIR/expo-doctor-${TIMESTAMP}.log" 2>&1) &
    PIDS+=($!); NAMES+=("expo:doctor")

    # Start all app builds in parallel (default behavior)
    for app in "${APPS[@]}"; do
        LOG_FILE="$LOG_DIR/${app}-build-${TIMESTAMP}.log"
        echo "Starting $app (log: $LOG_FILE)"
        (cd apps/$app && eas build --platform ios --profile production --local > "../../$LOG_FILE" 2>&1) &
        PIDS+=($!)
        NAMES+=("$app")
    done

    echo ""
    echo "All ${#PIDS[@]} tasks started. Waiting for completion..."
    echo ""

    FAILED=()
    for i in "${!PIDS[@]}"; do
        name="${NAMES[$i]}"
        pid="${PIDS[$i]}"
        if wait $pid; then
            echo "✓ $name completed successfully"
        else
            echo "✗ $name FAILED (check log for details)"
            FAILED+=("$name")
        fi
    done

    echo ""
    if [ ${#FAILED[@]} -eq 0 ]; then
        echo "All ${#PIDS[@]} tasks completed successfully!"
    else
        echo "Failed (${#FAILED[@]}): ${FAILED[*]}"
        echo "Check logs in $LOG_DIR for details"
        exit 1
    fi

# Clean all build artifacts and node_modules
clean target="all":
    #!/usr/bin/env bash
    set -e

    if [ "{{target}}" = "all" ]; then
        bash scripts/link-firebase-files.sh
        yarn clean
        exit 0
    fi

# Free disk space for local iOS builds (cleans common caches and Xcode artifacts)
free target="":
    #!/usr/bin/env bash
    set -e

    echo "Current disk usage:"
    df -h .
    echo ""

    echo "Cleaning Xcode DerivedData and Archives..."
    rm -rf ~/Library/Developer/Xcode/DerivedData/*
    rm -rf ~/Library/Developer/Xcode/Archives/*

    echo "Cleaning Expo/EAS caches..."
    rm -rf ~/.expo
    rm -rf ~/.eas

    echo "Cleaning Yarn Berry cache..."
    rm -rf ~/.yarn/berry/cache || true

    echo "Cleaning NPX cache..."
    rm -rf ~/.npm/_npx || true

    echo ""
    echo "Disk usage after cleanup:"
    df -h .

    INPUT="{{target}}"
    if [ -z "$INPUT" ]; then
        exit 0
    fi

    APPS=(numy)
    MATCHED=""

    # Try exact match first
    for a in "${APPS[@]}"; do
        if [ "$a" = "$INPUT" ]; then
            MATCHED="$a"
            break
        fi
    done

    # Try prefix match if no exact match
    if [ -z "$MATCHED" ]; then
        for a in "${APPS[@]}"; do
            if [[ "$a" == "$INPUT"* ]]; then
                if [ -n "$MATCHED" ]; then
                    echo "Ambiguous: '$INPUT' matches multiple apps:"
                    for m in "${APPS[@]}"; do
                        [[ "$m" == "$INPUT"* ]] && echo "  - $m"
                    done
                    exit 1
                fi
                MATCHED="$a"
            fi
        done
    fi

    # Try contains match if no prefix match
    if [ -z "$MATCHED" ]; then
        for a in "${APPS[@]}"; do
            if [[ "$a" == *"$INPUT"* ]]; then
                if [ -n "$MATCHED" ]; then
                    echo "Ambiguous: '$INPUT' matches multiple apps:"
                    for m in "${APPS[@]}"; do
                        [[ "$m" == *"$INPUT"* ]] && echo "  - $m"
                    done
                    exit 1
                fi
                MATCHED="$a"
            fi
        done
    fi

    if [ -z "$MATCHED" ]; then
        echo "No app matching '$INPUT'. Available apps:"
        printf '  %s\n' "${APPS[@]}"
        exit 1
    fi

    echo "Cleaning $MATCHED..."
    yarn workspace @moruk/$MATCHED clean

# Clear ALL caches, artifacts, and reinstall (nuclear option)
clear-all:
    #!/usr/bin/env bash
    set -e
    echo "Clearing all caches and artifacts..."

    # Run clear:all in each workspace
    echo "Running clear:all in all workspaces..."
    yarn workspaces foreach -Ap --exclude '@moruk/identifiers-monorepo' run clear:all || true

    # Remove node_modules
    echo "Removing node_modules..."
    rm -rf node_modules
    rm -rf apps/*/node_modules
    rm -rf packages/*/node_modules

    # Remove iOS artifacts
    echo "Removing iOS artifacts..."
    rm -rf apps/*/ios/Pods
    rm -rf apps/*/ios/build
    rm -rf ~/Library/Developer/Xcode/DerivedData/*moruk*

    # Remove build outputs
    echo "Removing build outputs..."
    rm -rf builds
    rm -rf apps/*/builds

    # Remove caches
    echo "Removing caches..."
    rm -rf .yarn/cache
    rm -rf .expo
    rm -rf apps/*/.expo

    # Reinstall dependencies
    echo "Reinstalling dependencies..."
    yarn install

    echo "✓ All caches cleared and dependencies reinstalled!"

# Kill process on a specific port
killport port:
    bash scripts/killport.sh {{port}}

# Test a specific app
test app:
    yarn workspace @moruk/{{app}} test

# Test a specific app with coverage
test-app-coverage app:
    yarn workspace @moruk/{{app}} test:coverage

# Test a specific app in watch mode
test-app-watch app:
    yarn workspace @moruk/{{app}} test:watch

# Run a specific app (supports partial matching: just run coin, just run stone)
# Default starts Metro server. Use "just run coin -p android" to build & launch.
# If no app is specified, defaults to numy.
# If platform is specified as first arg (e.g. `just run ios`), defaults app to numy.
run app="numy" *flags:
    #!/usr/bin/env bash
    set -e
    APPS=(numy)
    INPUT="{{app}}"
    EXTRA_FLAGS="{{flags}}"

    # Check if input is a platform, if so, default to numy and treat input as flag
    if [ "$INPUT" = "ios" ] || [ "$INPUT" = "android" ]; then
        EXTRA_FLAGS="$INPUT $EXTRA_FLAGS"
        INPUT="numy"
    fi

    MATCHED=""

    # Try exact match first
    for a in "${APPS[@]}"; do
        if [ "$a" = "$INPUT" ]; then
            MATCHED="$a"
            break
        fi
    done

    # Try prefix match if no exact match
    if [ -z "$MATCHED" ]; then
        for a in "${APPS[@]}"; do
            if [[ "$a" == "$INPUT"* ]]; then
                if [ -n "$MATCHED" ]; then
                    echo "Ambiguous: '$INPUT' matches multiple apps:"
                    for m in "${APPS[@]}"; do
                        [[ "$m" == "$INPUT"* ]] && echo "  - $m"
                    done
                    exit 1
                fi
                MATCHED="$a"
            fi
        done
    fi

    # Try contains match if no prefix match
    if [ -z "$MATCHED" ]; then
        for a in "${APPS[@]}"; do
            if [[ "$a" == *"$INPUT"* ]]; then
                if [ -n "$MATCHED" ]; then
                    echo "Ambiguous: '$INPUT' matches multiple apps:"
                    for m in "${APPS[@]}"; do
                        [[ "$m" == *"$INPUT"* ]] && echo "  - $m"
                    done
                    exit 1
                fi
                MATCHED="$a"
            fi
        done
    fi

    if [ -z "$MATCHED" ]; then
        echo "No app matching '$INPUT'. Available apps:"
        printf '  %s\n' "${APPS[@]}"
        exit 1
    fi

    REAL_PLATFORM="start"
    for arg in $EXTRA_FLAGS; do
        if [ "$arg" = "android" ] || [ "$arg" = "ios" ]; then REAL_PLATFORM="$arg"; fi
    done

    echo "Running $MATCHED on $REAL_PLATFORM..."
    yarn workspace @moruk/$MATCHED $REAL_PLATFORM

# Run a specific app (legacy command)
run-app app platform="ios":
    yarn workspace @moruk/{{app}} {{platform}}

# Run a specific app (fast mode - skips pod install)
run-app-fast app:
    yarn workspace @moruk/{{app}} ios:fast

start app:
    yarn workspace @moruk/{{app}} start

# Initialize EAS for a specific app
init app:
    (cd apps/{{app}} && eas init)

# Build a specific app (local). Use -p android for Android, defaults to ios.
build app *flags:
    #!/usr/bin/env bash
    set -e
    PLATFORM="ios"
    PROFILE="production"
    for arg in {{flags}}; do
        if [ "$arg" = "android" ] || [ "$arg" = "ios" ]; then PLATFORM="$arg"; fi
        if [ "$arg" = "development" ] || [ "$arg" = "preview" ]; then PROFILE="$arg"; fi
        if [ "$arg" = "-p" ] || [ "$arg" = "--platform" ]; then
            # Peek at next arg if possible? tricky in just.
            # We'll just check if current arg is android/ios in loop.
            true
        fi
    done
    echo "Building $app (platform: $PLATFORM, profile: $PROFILE)..."

    # Note: expo-audio Android patch is permanently applied via yarn patch in package.json

    INTERACTIVE_FLAG="--non-interactive"
    for arg in {{flags}}; do
        if [ "$arg" = "-i" ] || [ "$arg" = "--interactive" ]; then
            INTERACTIVE_FLAG=""
            break
        fi
    done
    (cd apps/{{app}} && eas build --platform $PLATFORM --profile $PROFILE --local $INTERACTIVE_FLAG)

# Submit latest local build to App Store/Play Store. Use -p android for Android, defaults to ios.
submit app *flags:
    #!/usr/bin/env bash
    set -e
    PLATFORM="ios"
    for arg in {{flags}}; do
        if [ "$arg" = "android" ] || [ "$arg" = "ios" ]; then PLATFORM="$arg"; fi
    done

    BUILD_DIR="apps/{{app}}/builds"
    if [ ! -d "$BUILD_DIR" ]; then
        echo "Error: No builds directory found at $BUILD_DIR"
        exit 1
    fi

    if [ "$PLATFORM" = "ios" ]; then
        LATEST_BUILD=$(ls -t "$BUILD_DIR"/ios-*.tar.gz 2>/dev/null | head -1)
        FILE_EXT="ios-*.tar.gz"
    else
        LATEST_BUILD=$(ls -t "$BUILD_DIR"/*.apk "$BUILD_DIR"/*.aab 2>/dev/null | head -1)
        FILE_EXT="*.apk or *.aab"
    fi

    if [ -z "$LATEST_BUILD" ]; then
        echo "Error: No $PLATFORM builds found in $BUILD_DIR"
        exit 1
    fi

    echo "Submitting $PLATFORM build: $LATEST_BUILD"

    INTERACTIVE_FLAG="--non-interactive"
    for flag in {{flags}}; do
        if [ "$flag" = "-i" ] || [ "$flag" = "--interactive" ]; then
            INTERACTIVE_FLAG=""
            break
        fi
    done
    (cd apps/{{app}} && eas submit --platform $PLATFORM --path "../../$LATEST_BUILD" $INTERACTIVE_FLAG)

# Submit a specific app to App Store (interactive, picks from EAS)
submit-ios app:
    yarn workspace @moruk/{{app}} eas submit --platform ios --profile production

# Submit a specific app to Google Play
submit-android app:
    yarn workspace @moruk/{{app}} eas submit --platform android --profile production

# Generate assets for a specific app
generate-assets app:
    (cd apps/{{app}} && npx tsx ../../scripts/generate-assets.ts)

# Generate assets for all apps (or specific app)
generate-all-assets target="all":
    bash scripts/generate-app-assets.sh {{target}}

# Push Firebase Remote Config for a specific app
push-remote-config app:
    (cd apps/{{app}} && bash ../../scripts/push-remote-config.sh)

# Pull Firebase Remote Config for a specific app
pull-remote-config app:
    (cd apps/{{app}} && bash ../../scripts/pull-remote-config.sh)

# Sync Firebase Remote Config for a specific app
sync-remote-config app:
    (cd apps/{{app}} && bash ../../scripts/sync-remote-config.sh)

# Alias for merge-metadata
alias update-metadata := merge-metadata

# Push App Store metadata for a specific app (or all apps if target is empty)
push-metadata target="" profile="production":
    #!/usr/bin/env bash
    set -e
    APPS=(numy)

    TARGET="{{target}}"
    PROFILE="{{profile}}"

    # If target is empty or "all", run for all apps
    if [ -z "$TARGET" ] || [ "$TARGET" = "all" ]; then
        echo "Pushing metadata for ALL apps (profile: $PROFILE)..."
        echo "Note: This runs 'eas metadata:push' sequentially."
        echo ""

        for app in "${APPS[@]}"; do
            echo "=== $app ==="
            if (cd apps/$app && bash ../../scripts/update-metadata.sh $PROFILE); then
                echo "✓ $app metadata pushed"
            else
                echo "✗ $app failed to push metadata"
                # We optionally exit on failure or continue. Since it's a push operation, maybe fail fast?
                # scripts/update-metadata.sh has 'set -euo pipefail', so it fails.
                # If we want to continue, we need to capture error.
                # Let's start with fail-fast behavior as per 'set -e' at top.
            fi
            echo ""
        done
        echo "All metadata push operations completed."
        exit 0
    fi

    # Check if target is a valid app
    IS_APP=0
    for app in "${APPS[@]}"; do
        if [ "$app" = "$TARGET" ]; then
            IS_APP=1
            break
        fi
    done

    if [ "$IS_APP" -eq 1 ]; then
        # Run for single app
        echo "Pushing metadata for $TARGET (profile: $PROFILE)..."
        (cd apps/$TARGET && bash ../../scripts/update-metadata.sh $PROFILE)
    else
        echo "Error: '$TARGET' is not a valid app."
        echo "Available apps: ${APPS[*]}"
        exit 1
    fi

# List all workspaces
workspaces:
    yarn workspaces list

# Check for outdated dependencies
outdated:
    yarn upgrade-interactive

# iOS Simulators helpers
simulators-list: watchman-setup
    xcrun simctl list devices

simulators-list-available: watchman-setup
    xcrun simctl list devices available

simulators-runtimes: watchman-setup
    xcrun simctl list runtimes

simulators-list-compact: watchman-setup
    xcrun simctl list devices available | sed -n 's/^[[:space:]]*\(.*\) (\([0-9A-F-]\+\)) (\(.*\))/\1\t\2\t\3/p'

# Add a dependency to a specific workspace
add workspace package:
    yarn workspace {{workspace}} add {{package}}

# Add a dev dependency to a specific workspace
add-dev workspace package:
    yarn workspace {{workspace}} add -D {{package}}

# Build and submit all Tier 1 apps to App Store (coin, stone, interval)
build-submit-tier1 *flags:
    #!/usr/bin/env bash
    set -e
    for app in numy; do
        echo "=== Building and submitting $app ==="
        (cd apps/$app && ../../scripts/ios-build-submit.sh {{flags}})
    done
    echo "All Tier 1 apps built and submitted!"

# Push an OTA update (Over-the-Air) to an app (Fast & Free)
update app message="":
    (cd apps/{{app}} && eas update --branch production --message "{{message}}")

# Build and submit a single app to App Store
build-submit app *flags:
    #!/usr/bin/env bash
    set -e
    APPS=(numy)
    INPUT="{{app}}"
    MATCHED=""

    # Try exact match first
    for a in "${APPS[@]}"; do
        if [ "$a" = "$INPUT" ]; then
            MATCHED="$a"
            break
        fi
    done

    # Try prefix match if no exact match
    if [ -z "$MATCHED" ]; then
        for a in "${APPS[@]}"; do
            if [[ "$a" == "$INPUT"* ]]; then
                if [ -n "$MATCHED" ]; then
                    echo "Ambiguous: '$INPUT' matches multiple apps:"
                    for m in "${APPS[@]}"; do
                        [[ "$m" == "$INPUT"* ]] && echo "  - $m"
                    done
                    exit 1
                fi
                MATCHED="$a"
            fi
        done
    fi

    # Try contains match if no prefix match
    if [ -z "$MATCHED" ]; then
        for a in "${APPS[@]}"; do
            if [[ "$a" == *"$INPUT"* ]]; then
                if [ -n "$MATCHED" ]; then
                    echo "Ambiguous: '$INPUT' matches multiple apps:"
                    for m in "${APPS[@]}"; do
                        [[ "$m" == *"$INPUT"* ]] && echo "  - $m"
                    done
                    exit 1
                fi
                MATCHED="$a"
            fi
        done
    fi

    if [ -z "$MATCHED" ]; then
        echo "No app matching '$INPUT'. Available apps:"
        printf '  %s\n' "${APPS[@]}"
        exit 1
    fi

    echo "Building and submitting $MATCHED..."

    PLATFORM="ios"
    for flag in {{flags}}; do
        if [ "$flag" = "android" ] || [ "$flag" = "ios" ]; then PLATFORM="$flag"; fi
    done

    if [ "$PLATFORM" = "ios" ]; then
        (cd apps/$MATCHED && ../../scripts/ios-build-submit.sh {{flags}})
    else
        # For Android, we just run build and then submit
        just build $MATCHED $PLATFORM {{flags}}
        just submit $MATCHED $PLATFORM {{flags}}
    fi

# Build and submit a single app (Fast Local Build with Caching)
build-submit-fast app *flags:
    #!/usr/bin/env bash
    set -e
    APPS=(numy)
    INPUT="{{app}}"
    MATCHED=""

    # Try exact match first
    for a in "${APPS[@]}"; do
        if [ "$a" = "$INPUT" ]; then
            MATCHED="$a"
            break
        fi
    done

    # Try prefix match if no exact match
    if [ -z "$MATCHED" ]; then
        for a in "${APPS[@]}"; do
            if [[ "$a" == "$INPUT"* ]]; then
                if [ -n "$MATCHED" ]; then
                    echo "Ambiguous: '$INPUT' matches multiple apps:"
                    for m in "${APPS[@]}"; do
                        [[ "$m" == "$INPUT"* ]] && echo "  - $m"
                    done
                    exit 1
                fi
                MATCHED="$a"
            fi
        done
    fi

    # Try contains match if no prefix match
    if [ -z "$MATCHED" ]; then
        for a in "${APPS[@]}"; do
            if [[ "$a" == *"$INPUT"* ]]; then
                if [ -n "$MATCHED" ]; then
                    echo "Ambiguous: '$INPUT' matches multiple apps:"
                    for m in "${APPS[@]}"; do
                        [[ "$m" == *"$INPUT"* ]] && echo "  - $m"
                    done
                    exit 1
                fi
                MATCHED="$a"
            fi
        done
    fi

    if [ -z "$MATCHED" ]; then
        echo "No app matching '$INPUT'. Available apps:"
        printf '  %s\n' "${APPS[@]}"
        exit 1
    fi

    echo "Building (fast) $MATCHED..."

    PLATFORM="ios"
    for arg in {{flags}}; do
        if [ "$arg" = "android" ] || [ "$arg" = "ios" ]; then PLATFORM="$arg"; fi
    done

    INTERACTIVE_FLAG="--non-interactive"
    for arg in {{flags}}; do
        if [ "$arg" = "-i" ] || [ "$arg" = "--interactive" ]; then
            INTERACTIVE_FLAG=""
            break
        fi
    done
    (cd apps/$MATCHED && USE_CCACHE=1 eas build --platform $PLATFORM --profile production --local $INTERACTIVE_FLAG)
    just submit $MATCHED $PLATFORM

# Build and submit ALL apps to App Store in parallel (non-interactive)
build-submit-all: validate
    #!/usr/bin/env bash
    set -e
    APPS=(numy)
    LOG_DIR="./builds/logs"
    mkdir -p "$LOG_DIR"
    TIMESTAMP=$(date +%Y%m%d-%H%M%S)

    echo "Starting parallel build and submit for ${#APPS[@]} apps..."
    echo "Logs will be saved to $LOG_DIR"
    echo ""

    PIDS=()
    for app in "${APPS[@]}"; do
        LOG_FILE="$LOG_DIR/${app}-${TIMESTAMP}.log"
        echo "Starting $app (log: $LOG_FILE)"
        (cd apps/$app && ../../scripts/ios-build-submit.sh > "../../$LOG_FILE" 2>&1) &
        PIDS+=($!)
    done

    echo ""
    echo "All builds started. Waiting for completion..."
    echo ""

    FAILED=()
    for i in "${!PIDS[@]}"; do
        app="${APPS[$i]}"
        pid="${PIDS[$i]}"
        if wait $pid; then
            echo "✓ $app completed successfully"
        else
            echo "✗ $app FAILED (check log for details)"
            FAILED+=("$app")
        fi
    done

    echo ""
    if [ ${#FAILED[@]} -eq 0 ]; then
        echo "All ${#APPS[@]} apps built and submitted successfully!"
    else
        echo "Failed apps (${#FAILED[@]}): ${FAILED[*]}"
        echo "Check logs in $LOG_DIR for details"
        exit 1
    fi
