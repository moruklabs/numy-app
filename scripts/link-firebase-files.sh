#!/bin/bash

# Script to create symlinks for Firebase configuration files
# This ensures all apps use the centralized firebase-files directory

set -e

# Get the monorepo root
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
MOBILE_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
FIREBASE_DIR="$MOBILE_ROOT/secrets"
APPS_DIR="$MOBILE_ROOT/apps"

echo "Mobile root: $MOBILE_ROOT"
echo "Firebase files: $FIREBASE_DIR"
echo "Apps directory: $APPS_DIR"
echo ""

# Function to create symlink
create_symlink() {
  local app=$1
  local ios_plist=$2
  local android_json=$3

  local app_dir="$APPS_DIR/$app"

  echo "📱 Processing $app..."

  # Create iOS plist symlink
  if [ -n "$ios_plist" ]; then
    local source_file="$FIREBASE_DIR/info-plists/$ios_plist"
    local link_path="$app_dir/GoogleService-Info.plist"

    if [ ! -f "$source_file" ]; then
      echo "  ⚠️  iOS plist not found: $source_file"
    else
      # Remove existing file if it's not a symlink
      if [ -f "$link_path" ] && [ ! -L "$link_path" ]; then
        echo "  🗑️  Removing existing plist file"
        rm "$link_path"
      elif [ -L "$link_path" ]; then
        echo "  ♻️  Removing existing plist symlink"
        rm "$link_path"
      fi

      # Create symlink
      ln -s "$source_file" "$link_path"
      echo "  ✅ Created iOS plist symlink"
    fi
  fi

  # Create Android json symlink
  if [ -n "$android_json" ]; then
    local source_file="$FIREBASE_DIR/google-services/$android_json"
    local link_path="$app_dir/google-services.json"

    if [ ! -f "$source_file" ]; then
      echo "  ⚠️  Android json not found: $source_file"
    else
      # Remove existing file if it exists
      if [ -f "$link_path" ] && [ ! -L "$link_path" ]; then
        echo "  🗑️  Removing existing google-services.json file"
        rm "$link_path"
      elif [ -L "$link_path" ]; then
        echo "  ♻️  Removing existing google-services.json symlink"
        rm "$link_path"
      fi

      # Create symlink
      ln -s "$source_file" "$link_path"
      echo "  ✅ Created Android json symlink"
    fi
  fi

  echo ""
}

# Process each app
create_symlink "numy" "coin-id-GoogleService-Info.plist" "numy-google-services.json"
create_symlink "interval-timer" "interval-timer-GoogleService-Info.plist" "interval-timer-google-services.json"
create_symlink "minday" "minday-GoogleService-Info.plist" "minday-google-services.json"
create_symlink "numy" "numy-GoogleService-Info.plist" "numy-google-services.json"
create_symlink "plant-doctor" "plant-doctor-GoogleService-Info.plist" "plant-doctor-google-services.json"
create_symlink "rizzman" "rizzman-GoogleService-Info.plist" "rizzman-google-services.json"
create_symlink "stone-identifier" "stone-identifier-GoogleService-Info.plist" "stone-identifier-google-services.json"

echo "✨ All Firebase configuration symlinks created successfully!"
echo ""
echo "Verification:"
for app in numy interval-timer minday numy plant-doctor rizzman stone-identifier; do
  echo "  $app:"
  ls -la "$APPS_DIR/$app/GoogleService-Info.plist" 2>/dev/null | grep -q "^l" && echo "    ✅ plist symlink" || echo "    ❌ plist missing or not symlink"
  ls -la "$APPS_DIR/$app/google-services.json" 2>/dev/null | grep -q "^l" && echo "    ✅ google-services.json symlink" || echo "    ❌ google-services.json missing or not symlink"
done
