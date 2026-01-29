#!/bin/bash
# Xcode Development Environment Setup for FAST Local Expo/EAS Builds

set -e

function green { echo -e "\033[32m$1\033[0m"; }
function yellow { echo -e "\033[33m$1\033[0m"; }

# Check Xcode installation
if ! command -v xcodebuild &> /dev/null; then
  echo "❌ Xcode not installed. Install from Mac App Store."
  exit 1
fi

# Display current version
green "Xcode version: $(xcodebuild -version | head -n 1)"

# Check and install iOS 18.0 runtime if missing
if ! xcrun simctl list runtimes | grep -q "iOS 18.0"; then
  yellow "📥 Downloading iOS 18.0 platform runtime (required for fast simulator/device builds)..."
  xcodebuild -downloadPlatform iOS
else
  green "✅ iOS 18.0 runtime already installed."
fi

# Show all available iOS runtimes
green "Installed iOS runtimes:"
xcrun simctl list runtimes | grep iOS
# Show current free disk space for large runtime download

echo "\nDisk space available:"
df -h . | awk 'NR==2{print $4 " free on " $1}'

green "Xcode iOS setup complete! Ready for fastest Expo/EAS iOS builds."
