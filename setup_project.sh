#!/bin/bash

# Log function for timestamps
log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Run initial commands
log "Resetting Git repository..."
rm -rf .git
git init
rm -rf validate.log

# Set Variables
app_slug=$(basename "$(pwd)")
pwd_dir=$(pwd)

# Generate dynamic names from slug
# app_name_lower_spaced: stone-identifier -> stone identifier
app_name_lower_spaced=$(echo "$app_slug" | tr '-' ' ')
# app_name: stone-identifier -> Stone Identifier
app_name=$(echo "$app_name_lower_spaced" | awk '{for(i=1;i<=NF;i++) $i=toupper(substr($i,1,1)) substr($i,2)}1')

log "App Slug: $app_slug"
log "App Name: $app_name"
log "Working Directory: $pwd_dir"

# Asset Management
log "Replacing splash screens with app icon..."
assets_dir="apps/$app_slug/assets/images"
if [ -d "$assets_dir" ]; then
  rm -f "$assets_dir/splash.png"
  rm -f "$assets_dir/splash-icon.png"
  cp "$assets_dir/icon.png" "$assets_dir/splash.png"
  cp "$assets_dir/icon.png" "$assets_dir/splash-icon.png"
  log "Assets updated in $assets_dir"
else
  log "Warning: Asset directory $assets_dir not found, skipping asset management."
fi

# Replace Text In Files
# We use perl for reliable text replacement across the codebase.
# We exclude the .git directory, .yarn, and this script itself.

log "Performing text replacements..."

# Find all files except for known directories to avoid corrupting binaries or the script itself
# We'll target text files and common source files.
find . -type f \
  -not -path '*/.*' \
  -not -path './node_modules/*' \
  -not -path './.yarn/*' \
  -not -name "setup_project.sh" \
  -not -name "yarn.lock" \
  -not -name "*.png" \
  -not -name "*.jpg" \
  -not -name "*.jpeg" \
  -not -name "*.gif" \
  -not -name "*.ico" \
  -not -name "*.pdf" \
  -print0 | xargs -0 perl -pi -e "
    # Replacements for slugs (match case and match whole word)
    \$count += s/\bbaby-glimpse\b/$app_slug/g;
    \$count += s/\bbird-identifier\b/$app_slug/g;

    # Replacements for App Names (Specific case)
    \$count += s/Baby Glimpse/$app_name/g;
    \$count += s/Bird Identifier/$app_name/g;

    # Replacements for lowercase spaced names (Case insensitive)
    \$count += s/baby glimpse/$app_name_lower_spaced/gi;
    \$count += s/bird identifier/$app_name_lower_spaced/gi;

    # Paths
    \$count += s|/Users/fatih/monorepo|$pwd_dir|g;
    \$count += s|/monorepo/apps/$app_slug|$pwd_dir|g;
    \$count += s|apps/bird-identifier|apps/$app_slug|g;

    # Report replacements per file to stderr
    if (\$count > 0 && eof) {
      print STDERR \"[REPLACED] \$count occurrences in \$ARGV\\n\";
      \$count = 0;
    }
  "

log "Running yarn..."
yarn

log "Running yarn validate..."
yarn validate

log "Running just run $app_slug ios..."
just run "$app_slug" ios

log "Done!"
