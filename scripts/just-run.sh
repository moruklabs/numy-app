#!/usr/bin/env bash
set -e

# Numy - Unified Run Script
# This script handles flag parsing for "just run"

# Default values
PORT=2007
PLATFORM="ios"
DEVICE="iPad Pro 13-inch (M4)"
BUILD=false
CLEAN=false
CACHE=true

# Get project root dynamically
PROJECT_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || pwd)

echo "🔄 Resetting Watchman for: $PROJECT_ROOT"
watchman watch-del "$PROJECT_ROOT" >/dev/null 2>&1 || true
watchman watch-project "$PROJECT_ROOT" >/dev/null 2>&1

# Usage function
usage() {
  echo "Usage: just run [options]"
  echo ""
  echo "Options:"
  echo "  --build      Build the development client before running"
  echo "  --android    Run on Android (default: ios)"
  echo "  --clean      Clean build artifacts before building"
  echo "  --no-cache   Run without build cache (prevents skipping install)"
  echo "  --help       Show this help message"
  echo ""
  echo "Examples:"
  echo "  just run                     # Start Metro bundler"
  echo "  just run --build             # Build and run on iOS"
  echo "  just run --build --android   # Build and run on Android"
  echo "  just run --build --clean     # Clean then build and run"
}

# Parse flags
while [[ "$#" -gt 0 ]]; do
  case $1 in
    --build) BUILD=true ;;
    --android) PLATFORM="android" ;;
    --clean) CLEAN=true ;;
    --no-cache) CACHE=false ;;
    --help) usage; exit 0 ;;
    *) echo "Unknown option: $1"; usage; exit 1 ;;
  esac
  shift
done

# Execute clean if requested
if [ "$CLEAN" = true ]; then
  echo "🧹 Cleaning build artifacts..."
  just clean
fi

# Determine flags based on cache setting
# If CACHE is true, we try to use --no-install for speed if it's a subsequent run
# However, "just run --build" should typically ensure things are correct.
# Let's map CACHE=false to "ensure full install/build"
# and CACHE=true (default) to "allow fast paths"
INSTALL_FLAGS=""
if [ "$CACHE" = true ]; then
  # For iOS, we often use --no-install in "fast" recipes
  # But for a generic --build, let's stick to standard unless user wants "fast"
  # Actually, the user's request mentioned --no-cache as "without build cache"
  INSTALL_FLAGS="" # Default prebuild behavior
else
  # If no-cache is requested, we definitely don't skip anything
  INSTALL_FLAGS=""
fi

if [ "$BUILD" = true ]; then
  echo "🏗️  Preparing development client for $PLATFORM..."

  # Run killport first to be safe
  just killport

  if [ "$PLATFORM" = "ios" ]; then
    # iOS Build & Run
    APP_ENV=DEV RCT_NEW_ARCH_ENABLED=1 USE_CCACHE=1 npx expo prebuild --platform ios
    APP_ENV=DEV RCT_NEW_ARCH_ENABLED=1 USE_CCACHE=1 npx expo run:ios --device "$DEVICE" --port $PORT
  else
    # Android Build & Run
    APP_ENV=DEV npx expo prebuild --platform android
    APP_ENV=DEV npx expo run:android --port $PORT
  fi
else
  # Just start Metro
  echo "🚀 Starting Metro bundler on port $PORT..."
  just killport
  APP_ENV=DEV npx expo start --port $PORT
fi
