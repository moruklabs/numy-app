#!/bin/bash
set -e

# Sequential Build Validation Script
# Tests all apps one-by-one, exiting on first failure
#
# Usage:
#   ./test-build.sh                    # Test all apps
#   ./test-build.sh numy    # Test specific app(s)
#   ./test-build.sh coin cat plant     # Test multiple apps
#
# Exit Codes:
#   0 - All builds succeeded
#   1 - One or more builds failed

# All available apps
ALL_APPS=(
  "numy"
  "numy"
  "pet-doctor"
  "numy"
  "finance-dictionary"
  "insect-identifier"
  "rizzman"
  "stone-identifier"
  "interval-timer"
  "minday"
  "numy"
  "plant-doctor"
)

# Determine which apps to test
if [ $# -eq 0 ]; then
  # No args - test all apps
  apps=("${ALL_APPS[@]}")
else
  # Args provided - test only specified apps
  apps=("$@")
fi

echo "Starting sequential builds for ${#apps[@]} app(s)..."
fail_file=$(mktemp)

# Cleanup temp file on exit
trap 'rm -f "$fail_file"' EXIT INT TERM

for app in "${apps[@]}"; do
  echo "[$app] Building..."

  # Run build in subshell to isolate failures
  if ! (just run-app "$app" ios); then
    echo "[$app] BUILD FAILED"
    echo "$app" >> "$fail_file"
    # Exit immediately on first failure
    cat "$fail_file"
    rm "$fail_file"
    exit 1
  fi

  echo "[$app] Build succeeded"
done

# Check if any builds failed
if [ -s "$fail_file" ]; then
  echo ""
  echo "The following apps failed to build:"
  cat "$fail_file"
  rm "$fail_file"
  exit 1
else
  echo ""
  echo "✓ All ${#apps[@]} app(s) built successfully!"
  rm "$fail_file"
fi
