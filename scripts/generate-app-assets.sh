#!/usr/bin/env bash

##############################################################################
# Generate App Assets
#
# Generates all required app assets (icons, splash screens) from the source
# files in each app's asset-template directory.
#
# Usage:
#   ./scripts/generate-app-assets.sh [app-name|all|--help]
#
# Examples:
#   ./scripts/generate-app-assets.sh numy  # Generate for one app
#   ./scripts/generate-app-assets.sh all              # Generate for all apps
#   ./scripts/generate-app-assets.sh                  # Generate for all apps (default)
#   ./scripts/generate-app-assets.sh --help           # Show this help
#
# Requirements:
#   - Source image must be in app's asset-template/ directory
#   - Supported formats: .png, .jpg, .jpeg
#   - sharp npm package must be installed
#
# Known Issues:
#   ⚠️  numy has stone-identifier.jpg (should have bird image)
#   ⚠️  insect-identifier has stone-identifier.jpg (should have insect image)
##############################################################################

set -e

# Get the monorepo root directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MONOREPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# List of all apps
ALL_APPS=(
  "numy"
  "numy"
  "pet-doctor"
  "numy"
  "finance-dictionary"
  "insect-identifier"
  "interval-timer"
  "minday"
  "numy"
  "plant-doctor"
  "rizzman"
  "stone-identifier"
)

# Function to print colored output
print_info() {
  echo -e "${BLUE}ℹ${NC} $1"
}

print_success() {
  echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
  echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
  echo -e "${RED}✗${NC} $1"
}

# Function to check if app exists
app_exists() {
  local app=$1
  for valid_app in "${ALL_APPS[@]}"; do
    if [[ "$valid_app" == "$app" ]]; then
      return 0
    fi
  done
  return 1
}

# Function to generate assets for a single app
generate_for_app() {
  local app=$1
  local app_dir="$MONOREPO_ROOT/apps/$app"

  echo ""
  print_info "Generating assets for $app..."

  # Check if app directory exists
  if [[ ! -d "$app_dir" ]]; then
    print_error "App directory not found: $app_dir"
    return 1
  fi

  # Check if asset-template directory exists
  if [[ ! -d "$app_dir/asset-template" ]]; then
    print_error "No asset-template directory found for $app"
    return 1
  fi

  # Check if there's a source image
  local source_image=$(find "$app_dir/asset-template" -maxdepth 1 -type f \( -iname "*.png" -o -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.avif" \) | head -1)

  if [[ -z "$source_image" ]]; then
    print_error "No source image found in $app/asset-template/"
    return 1
  fi

  print_info "Source: $(basename "$source_image")"

  # Check for copy-paste bugs
  if [[ "$app" == "numy" && "$(basename "$source_image")" == "stone-identifier.jpg" ]]; then
    print_warning "numy has stone-identifier.jpg (should have bird image)"
    print_warning "Assets will be generated but with wrong image!"
  fi

  if [[ "$app" == "insect-identifier" && "$(basename "$source_image")" == "stone-identifier.jpg" ]]; then
    print_warning "insect-identifier has stone-identifier.jpg (should have insect image)"
    print_warning "Assets will be generated but with wrong image!"
  fi

  # Change to app directory and run the generator
  cd "$app_dir"

  if npx tsx ../../scripts/generate-assets.ts; then
    print_success "Assets generated for $app"
    return 0
  else
    print_error "Failed to generate assets for $app"
    return 1
  fi
}

# Main script
main() {
  local target="${1:-all}"

  # Show help
  if [[ "$target" == "--help" || "$target" == "-h" ]]; then
    cat << 'HELP'
Generate App Assets

Generates all required app assets (icons, splash screens) from source images.

Usage:
  ./scripts/generate-app-assets.sh [app-name|all|--help]

Arguments:
  app-name    Generate assets for a specific app
  all         Generate assets for all apps (default)
  --help      Show this help message

Examples:
  ./scripts/generate-app-assets.sh numy
  ./scripts/generate-app-assets.sh all
  ./scripts/generate-app-assets.sh

Generated Assets:
  - icon.png (1024x1024) - Production icon
  - icon-dev.png (1024x1024) - Development icon with badge
  - icon-preview.png (1024x1024) - Preview icon with badge
  - splash.png (1284x2778) - Splash screen
  - favicon.png (48x48) - Web favicon
  - adaptive-icon.png (1024x1024) - Android adaptive icon

See docs/ASSET_GENERATION.md for more information.
HELP
    exit 0
  fi

  cd "$MONOREPO_ROOT"

  echo "🚀 App Asset Generator"
  echo "====================="

  if [[ "$target" == "all" ]]; then
    print_info "Generating assets for all apps..."

    local failed_apps=()
    local success_count=0

    for app in "${ALL_APPS[@]}"; do
      if generate_for_app "$app"; then
        ((success_count++))
      else
        failed_apps+=("$app")
      fi
    done

    echo ""
    echo "====================="
    print_info "Summary: $success_count/${#ALL_APPS[@]} apps processed successfully"

    if [[ ${#failed_apps[@]} -gt 0 ]]; then
      print_warning "Failed apps: ${failed_apps[*]}"
      exit 1
    else
      print_success "All assets generated successfully!"
    fi
  else
    # Generate for specific app
    if ! app_exists "$target"; then
      print_error "Unknown app: $target"
      echo ""
      echo "Available apps:"
      printf '  %s\n' "${ALL_APPS[@]}"
      exit 1
    fi

    if generate_for_app "$target"; then
      echo ""
      print_success "Done!"
    else
      exit 1
    fi
  fi
}

# Run main function
main "$@"
