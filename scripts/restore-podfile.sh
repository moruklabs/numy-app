#!/bin/bash
# Restore custom Podfile after expo prebuild

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

CUSTOM_PODFILE="$PROJECT_ROOT/ios/Podfile.custom"
TARGET_PODFILE="$PROJECT_ROOT/ios/Podfile"

if [ -f "$CUSTOM_PODFILE" ]; then
    cp "$CUSTOM_PODFILE" "$TARGET_PODFILE"
    echo "Restored custom Podfile"
else
    echo "No custom Podfile found at $CUSTOM_PODFILE"
    exit 1
fi
