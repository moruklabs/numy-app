#!/bin/bash
# iOS Fixes Script
# Idempotent script that applies common iOS fixes before prebuild
# Usage: ./ios-fixes.sh [app-name]
#
# This script is designed to be run multiple times safely.
# It should be hooked to prebuild, preinstall, and preios commands.

set -e

APP_NAME=${1:-""}

echo "====================================="
echo "Running iOS fixes..."
echo "App: ${APP_NAME:-'(from script directory)'}"
echo "====================================="

# Get the script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MONOREPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

# Determine app directory
if [ -n "$APP_NAME" ]; then
    APP_DIR="${MONOREPO_ROOT}/apps/${APP_NAME}"
else
    # Try to detect from current directory
    APP_DIR="$(pwd)"
fi

if [ ! -d "$APP_DIR" ]; then
    echo "Error: App directory not found: $APP_DIR"
    exit 1
fi

echo "App directory: $APP_DIR"
cd "$APP_DIR"

# ===================================
# Fix 1: Ensure ios directory exists
# ===================================
echo ""
echo "Fix 1: Checking ios directory..."
if [ ! -d "ios" ]; then
    echo "  ios directory does not exist, it will be created during prebuild"
else
    echo "  ios directory exists: OK"
fi

# ===================================
# Fix 2: Clean DerivedData if it exists and is corrupted
# ===================================
echo ""
echo "Fix 2: Checking DerivedData..."
# Get the Xcode project name from app.json or directory name
if [ -f "app.json" ]; then
    PROJECT_NAME=$(grep -o '"name": *"[^"]*"' app.json | head -1 | sed 's/"name": *"\([^"]*\)"/\1/' | tr -d ' ')
else
    PROJECT_NAME=$(basename "$APP_DIR")
fi

# Clean DerivedData only if there's a known issue (build errors)
# This is idempotent - cleaning an empty/non-existent directory is safe
DERIVED_DATA_PATH="${HOME}/Library/Developer/Xcode/DerivedData"
if [ -d "$DERIVED_DATA_PATH" ]; then
    echo "  DerivedData path exists"
    # Only log, don't automatically clean unless explicitly requested
    MATCHING_DIRS=$(find "$DERIVED_DATA_PATH" -maxdepth 1 -type d -name "${PROJECT_NAME}*" 2>/dev/null || true)
    if [ -n "$MATCHING_DIRS" ]; then
        echo "  Found DerivedData for ${PROJECT_NAME}:"
        echo "$MATCHING_DIRS" | while read -r dir; do
            echo "    - $(basename "$dir")"
        done
        echo "  To clean: rm -rf ~/Library/Developer/Xcode/DerivedData/${PROJECT_NAME}*"
    else
        echo "  No DerivedData found for ${PROJECT_NAME}"
    fi
else
    echo "  DerivedData path does not exist"
fi

# ===================================
# Fix 3: Ensure Podfile modifications are applied
# ===================================
echo ""
echo "Fix 3: Checking Podfile..."
if [ -f "ios/Podfile" ]; then
    echo "  Podfile found: OK"

    # Check for common issues
    if grep -q "use_frameworks!" "ios/Podfile"; then
        echo "  use_frameworks! found: OK"
    fi
else
    echo "  Podfile not found (will be created during prebuild)"
fi

# ===================================
# Fix 4: Verify bundle identifier matches app.json
# ===================================
echo ""
echo "Fix 4: Checking bundle identifier..."
if [ -f "app.json" ]; then
    BUNDLE_ID=$(grep -o '"bundleIdentifier": *"[^"]*"' app.json | sed 's/"bundleIdentifier": *"\([^"]*\)"/\1/')
    if [ -n "$BUNDLE_ID" ]; then
        echo "  Bundle ID in app.json: $BUNDLE_ID"

        # Check if it matches in ios project
        if [ -d "ios" ]; then
            PBXPROJ_FILES=$(find ios -name "project.pbxproj" 2>/dev/null)
            if [ -n "$PBXPROJ_FILES" ]; then
                if grep -q "$BUNDLE_ID" $PBXPROJ_FILES; then
                    echo "  Bundle ID in Xcode project: MATCHES"
                else
                    echo "  Warning: Bundle ID may not match in Xcode project"
                    echo "  Run 'npx expo prebuild --clean' to regenerate"
                fi
            fi
        fi
    else
        echo "  Warning: bundleIdentifier not found in app.json"
    fi
fi

echo ""
echo "====================================="
echo "iOS fixes check complete"
echo "====================================="
