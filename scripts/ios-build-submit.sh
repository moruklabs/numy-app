#!/bin/bash
set -e

# Function to display usage
usage() {
  echo "Usage: $0 [options] [platform] [patch|minor|major]"
  echo "  platform - production (default), preview, or development"
  echo "  patch    - Bump patch version (1.3.1 -> 1.3.2)"
  echo "  minor    - Bump minor version (1.3.1 -> 1.4.0)"
  echo "  major    - Bump major version (1.3.1 -> 2.0.0)"
  echo ""
  echo "Options:"
  echo "  -i, --interactive    Run in interactive mode (allows credential setup)"
  echo ""
  echo "Examples:"
  echo "  $0                     # production build & submit, no bump"
  echo "  $0 -i                  # interactive mode for credential setup"
  echo "  $0 patch               # production build & submit, bump patch"
  echo "  $0 preview             # preview build only, no submission"
  echo "  $0 development minor   # dev build, bump minor"
  echo ""
  echo "If platform is preview or development, submission is skipped."
  exit 1
}

is_valid_platform() {
  [[ "$1" =~ ^(production|preview|development|prod|prev|dev)$ ]]
}

is_valid_bump() {
  [[ "$1" =~ ^(patch|minor|major)$ ]]
}

# Function to bump version
bump_version() {
  local current_version=$1
  local bump_type=$2

  IFS='.' read -r -a version_parts <<< "$current_version"
  local major="${version_parts[0]}"
  local minor="${version_parts[1]}"
  local patch="${version_parts[2]}"

  case $bump_type in
    patch)
      patch=$((patch + 1))
      ;;
    minor)
      minor=$((minor + 1))
      patch=0
      ;;
    major)
      major=$((major + 1))
      minor=0
      patch=0
      ;;
    *)
      echo "Invalid bump type: $bump_type"
      usage
      ;;
  esac

  echo "${major}.${minor}.${patch}"
  echo "${major}.${minor}.${patch}"
}

increment_build_number() {
  echo "Incrementing build number..."

  if command -v jq &> /dev/null; then
    # Read current values
    CURRENT_IOS_BUILD=$(jq -r '.expo.ios.buildNumber // "0"' app.json)
    CURRENT_ANDROID_CODE=$(jq -r '.expo.android.versionCode // 0' app.json)

    # Increment
    NEW_IOS_BUILD=$((CURRENT_IOS_BUILD + 1))
    NEW_ANDROID_CODE=$((CURRENT_ANDROID_CODE + 1))

    echo "Updating build number: iOS $CURRENT_IOS_BUILD -> $NEW_IOS_BUILD, Android $CURRENT_ANDROID_CODE -> $NEW_ANDROID_CODE"

    # Write back
    jq --arg iosBuild "$NEW_IOS_BUILD" --argjson androidCode "$NEW_ANDROID_CODE" \
       '.expo.ios.buildNumber = $iosBuild | .expo.android.versionCode = $androidCode' \
       app.json > app.json.tmp && mv app.json.tmp app.json

    echo "✓ Updated app.json build numbers"
  else
    echo "Warning: jq not found, skipping build number auto-increment"
  fi
}

# Function to parse command line arguments
parse_arguments() {
  while [ $# -gt 0 ]; do
    case "$1" in
      -i|--interactive)
        INTERACTIVE=true; shift
        ;;
      --platform)
        if [ -n "$2" ] && [[ ! "$2" =~ ^- ]]; then
          PLATFORM="$2"; shift 2
        else
          echo "Error: --platform requires a value" >&2; usage
        fi
        ;;
      --platform=*)
        PLATFORM="${1#--platform=}"; shift
        ;;
      --bump)
        if [ -n "$2" ] && [[ ! "$2" =~ ^- ]]; then
          BUMP_TYPE="$2"; shift 2
        else
          echo "Error: --bump requires a value" >&2; usage
        fi
        ;;
      --bump=*)
        BUMP_TYPE="${1#--bump=}"; shift
        ;;
      -h|--help)
        usage
        ;;
      -*)
        echo "Error: Unknown option '$1'" >&2; usage
        ;;
      *)
        parse_positional_argument "$1"
        shift
        ;;
    esac
  done
}

# Function to parse positional arguments (platform or bump type)
parse_positional_argument() {
  local arg="$1"

  if is_valid_platform "$arg"; then
    PLATFORM="$arg"
    # Normalize shorthands
    case "$PLATFORM" in
      dev) PLATFORM="development" ;;
      prev) PLATFORM="preview" ;;
      prod) PLATFORM="production" ;;
      *) ;; # Already validated, no action needed for full names
    esac
  elif is_valid_bump "$arg"; then
    if [ -n "$BUMP_TYPE" ]; then
      echo "Error: Bump type already specified ('$BUMP_TYPE' and '$arg')" >&2; usage
    fi
    BUMP_TYPE="$arg"
  else
    echo "Error: Invalid argument '$arg'" >&2; usage
  fi
}

# Parse arguments (platform + optional bump type)
PLATFORM="production"
BUMP_TYPE=""
INTERACTIVE=false

# Parse arguments (platform, bump type, flags)
parse_arguments "$@"

# Bump version if requested
if [ -n "$BUMP_TYPE" ]; then
  echo "Bumping $BUMP_TYPE version..."

  # Get current version from package.json
  CURRENT_VERSION=$(node -p "require('./package.json').version")
  echo "Current version: $CURRENT_VERSION"

  # Calculate new version
  NEW_VERSION=$(bump_version "$CURRENT_VERSION" "$BUMP_TYPE")
  echo "New version: $NEW_VERSION"

  # Update package.json
  if command -v jq &> /dev/null; then
    # Use jq if available (more reliable)
    jq --arg version "$NEW_VERSION" '.version = $version' package.json > package.json.tmp
    mv package.json.tmp package.json
  else
    # Fallback to sed
    sed -i.bak "s/\"version\": \"$CURRENT_VERSION\"/\"version\": \"$NEW_VERSION\"/" package.json
    rm package.json.bak
  fi
  echo "✓ Updated package.json"

  # Update app.config.js or app.json
  if [ -f "app.config.ts" ]; then
    sed -i.bak "s/version: '$CURRENT_VERSION'/version: '$NEW_VERSION'/" app.config.js
    rm app.config.ts.bak
    echo "✓ Updated app.config.ts"
  elif [ -f "app.json" ]; then
    if command -v jq &> /dev/null; then
      # Use jq if available (more reliable)
      jq --arg version "$NEW_VERSION" '.expo.version = $version' app.json > app.json.tmp
      mv app.json.tmp app.json
    else
      # Fallback to sed
      sed -i.bak "s/\"version\": \"$CURRENT_VERSION\"/\"version\": \"$NEW_VERSION\"/" app.json
      rm app.json.bak
    fi
    echo "✓ Updated app.json"
  else
    echo "Warning: Neither app.config.js nor app.json found"
  fi

  echo "Version bumped successfully: $CURRENT_VERSION -> $NEW_VERSION"
else
  echo "Skipping version bump (no bump type specified)"
fi

# Create builds directory if it doesn't exist
mkdir -p ./builds

# Generate a timestamp for the build file
TIMESTAMP=$(date +%s)


# if platform is production, set APP_ENV=production
if [ "$PLATFORM" = "production" ]; then
  export APP_ENV="PROD"
  echo "Set APP_ENV=PROD for production build"
elif [ "$PLATFORM" = "preview" ]; then
  export APP_ENV="PREV"
  echo "Set APP_ENV=PREV for preview build"
else
  export APP_ENV="DEV"
  echo "Set APP_ENV=DEV for non-production build"
fi

BUILD_FILE="./builds/ios-${PLATFORM}-${APP_ENV}-${TIMESTAMP}.tar.gz"

echo ""
echo ""
increment_build_number
echo "Starting iOS build process..."
echo "Using platform profile: ${PLATFORM} and APP_ENV=${APP_ENV}"

# 1) local production build
if [ "$INTERACTIVE" = true ]; then
  eas build --local \
            --platform ios \
            --profile "${PLATFORM}" \
            --output "${BUILD_FILE}"
else
  eas build --local \
            --platform ios \
            --profile "${PLATFORM}" \
            --output "${BUILD_FILE}" \
            --non-interactive
fi

echo "Build completed successfully. Build file: ${BUILD_FILE}"

# Verify the build file exists
if [ ! -f "${BUILD_FILE}" ]; then
  echo "Error: Build file not found: ${BUILD_FILE}" >&2
  exit 1
fi

echo "Starting App Store submission..."

if [ "$PLATFORM" == "development" ]; then
  echo "Skipping submission for development platform: ${PLATFORM}"
  exit 0
fi

# 2) submit the build to App Store
if [ "$INTERACTIVE" = true ]; then
  eas submit --platform ios \
             --path "${BUILD_FILE}"
else
  eas submit --platform ios \
             --path "${BUILD_FILE}" \
             --non-interactive
fi

echo "iOS build and submission completed successfully."
