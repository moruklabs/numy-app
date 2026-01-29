#!/bin/bash

# App Store Metadata Update Script
# This script pushes local store.config.json to App Store Connect
# Usage: ./update-metadata.sh [profile]
# Example: ./update-metadata.sh production

set -euo pipefail  # Exit on error, unset variable, or pipe failure

# Parse arguments
PROFILE=${1:-production}

echo "📝 Updating App Store metadata..."
echo "📋 Profile: $PROFILE"
echo ""
echo "⚠️  IMPORTANT: This requires an editable app version in App Store Connect"
echo "   - Either create a new version (e.g., 1.0.3) manually in App Store Connect"
echo "   - Or run this after submitting a new build (wait 5-10 min for processing)"
echo ""

# Check if EAS CLI is installed
if ! command -v eas &> /dev/null; then
    echo "❌ EAS CLI is not installed. Please install it first:"
    echo "yarninstall -g @expo/eas-cli"
    exit 1
fi

# Check if logged into Expo
echo "📋 Checking Expo authentication..."
if ! eas whoami &> /dev/null; then
    echo "❌ Not logged into Expo. Please login first:"
    echo "eas login"
    exit 1
fi

echo "✅ Expo authentication verified"
echo ""

# Check if store.config.json exists
if [ ! -f "store.config.json" ]; then
    echo "❌ store.config.json not found in current directory"
    echo "💡 Run 'eas metadata:pull' first to generate it"
    exit 1
fi

echo "📤 Pushing metadata to App Store Connect..."
echo ""

# Push metadata with helpful error handling
if eas metadata:push --profile "$PROFILE"; then
    echo ""
    echo "✅ App Store metadata updated successfully!"
    echo "🔗 Verify changes at: https://appstoreconnect.apple.com/apps/6748545235"
else
    EXIT_CODE=$?
    echo ""
    echo "❌ Metadata push failed"
    echo ""
    echo "Common reasons:"
    echo "  1. No editable app version exists in App Store Connect"
    echo "  2. You need to create a new version (1.0.3, etc.) first"
    echo "  3. Recently submitted build hasn't finished processing yet"
    echo ""
    echo "Solutions:"
    echo "  • Create new version: https://appstoreconnect.apple.com/apps/6748545235"
    echo "  • Wait 5-10 minutes after submitting a build"
    echo "  • Check if your app is in 'Prepare for Submission' state"
    echo ""
    exit $EXIT_CODE
fi
