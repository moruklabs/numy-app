#!/bin/bash
set -e

# Parallel Build Validation Script
# Tests all apps concurrently with configurable parallelism
#
# Usage:
#   ./test-parallel-build.sh                    # Test all apps
#   ./test-parallel-build.sh numy    # Test specific app(s)
#   ./test-parallel-build.sh coin cat plant     # Test multiple apps
#
# Environment Variables:
#   PARALLEL_JOBS   Number of concurrent builds (default: 4)
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

LOG_DIR="./builds/logs-parallel"
mkdir -p "$LOG_DIR"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

PID_FILE="/tmp/test-parallel-build.pid"

# Cleanup function to kill background jobs and remove PID file on exit
cleanup() {
    echo "Stopping background jobs..."
    for pid in "${pids[@]}"; do
        kill "$pid" 2>/dev/null || true
    done
    rm -f "$PID_FILE"
}
trap cleanup EXIT INT TERM

# Kill previous instance if PID file exists
if [ -f "$PID_FILE" ]; then
    old_pid=$(cat "$PID_FILE")
    if ps -p "$old_pid" > /dev/null 2>&1; then
        echo "Killing orphaned process $old_pid from previous run..."
        kill "$old_pid" 2>/dev/null || true
        # Wait for it to die
        sleep 1
    fi
fi

# Write current PID to file
echo $$ > "$PID_FILE"

echo "=================================================="
echo "Phase 0: Uninstalling Existing Apps"
echo "=================================================="

for app in "${apps[@]}"; do
    # helper: logic for bundle id
    if [ "$app" == "rizzman" ]; then
        bundle_id="ai.rizzman"
    else
        bundle_id="ai.moruk.${app//-/}"
    fi

    echo "[$app] Uninstalling $bundle_id..."
    # Run in background to speed up? simctl might lock, but let's try parallel or just fast sequential.
    # Uninstall is fast.
    xcrun simctl uninstall booted "$bundle_id" 2>/dev/null || true
done
echo "Uninstall complete."
echo ""

echo "=================================================="
echo "Phase 1: Parallel Clean, Prebuild, and Compilation"
echo "=================================================="
echo "Testing ${#apps[@]} app(s) with $PARALLEL_JOBS concurrent jobs"
echo "Logs will be saved to $LOG_DIR"

pids=()
app_names=()

# Configurable maximum number of parallel jobs via environment variable
PARALLEL_JOBS=${PARALLEL_JOBS:-4}

# Enable job control for 'jobs' command to work in script
set -m

for app in "${apps[@]}"; do
  # Wait if we have too many jobs running
  while [ $(jobs -rp | wc -l) -ge $PARALLEL_JOBS ]; do
    sleep 1
  done

  # Print this synchronously so the user sees it immediately
  log_file="$LOG_DIR/${app}-build-${TIMESTAMP}.log"
  echo "[$app] Starting build process (in background)... (Log: $log_file)"

  (
    # 1. Clean
    # Ignore errors and silence output
    rm -rf "apps/$app/ios" "apps/$app/android" "apps/$app/node_modules/.cache" > /dev/null 2>&1 || true

    # 2. Prebuild
    # Note: --no-interactive is not supported by 'expo prebuild', so it's removed.
    echo "[$app] Prebuilding..." >> "$log_file" 2>&1
    if ! (cd "apps/$app" && EXPO_NO_GIT_STATUS=1 npx expo prebuild --platform ios --clean >> "../../$log_file" 2>&1); then
        echo "[$app] Prebuild FAILED"
        exit 1
    fi

    # 3. Compile with xcodebuild
    # Find the workspace file (only at the top level of directories to avoid xcodeproj contents)
    # We use -maxdepth 1 to find it in apps/$app/ios/
    workspace=$(find "apps/$app/ios" -maxdepth 1 -name "*.xcworkspace" | head -n 1)
    if [ -z "$workspace" ]; then
        echo "[$app] Error: No .xcworkspace found" >> "$log_file" 2>&1
        exit 1
    fi

    scheme=$(basename "$workspace" .xcworkspace)

    echo "[$app] Compiling (Scheme: $scheme)..." >> "$log_file" 2>&1

    # Using a local derived data path to isolate builds and easily find the .app later
    derived_data_path="ios/build_parallel"

    if ! xcodebuild \
        -workspace "$workspace" \
        -scheme "$scheme" \
        -configuration Debug \
        -sdk iphonesimulator \
        -derivedDataPath "apps/$app/$derived_data_path" \
        -quiet \
        >> "$log_file" 2>&1; then
        echo "[$app] Compilation FAILED"
        exit 1
    fi

    echo "[$app] Build successfully completed!"
  ) &

  pids+=($!)
  app_names+=("$app")
done

# Wait for all background jobs to finish
wait

echo "checking results..."

failed_apps=()
for app in "${apps[@]}"; do
    log_file="$LOG_DIR/${app}-build-${TIMESTAMP}.log"
    if grep -q "Build successfully completed!" "$log_file"; then
        echo "[$app] VALID"
    else
        echo "[$app] FAILED"
        failed_apps+=("$app")
    fi
done

if [ ${#failed_apps[@]} -ne 0 ]; then
  echo "The following apps failed to build: ${failed_apps[*]}"
  exit 1
fi

echo ""
echo "=================================================="
echo "Phase 2: Sequential Launch"
echo "=================================================="

for app in "${apps[@]}"; do
  echo "[$app] Launching on Simulator..."

  # Find the .app binary
  app_binary=$(find "apps/$app/ios/build_parallel/Build/Products/Debug-iphonesimulator" -name "*.app" | head -n 1)

  if [ -z "$app_binary" ]; then
    echo "[$app] Error: Could not find compiled .app binary."
    continue
  fi

  echo "[$app] Installing and running $app_binary..."

  # Use the app's 'ios:fast' script which handles port killing and ccache
  # We append the --binary argument to it.
  (cd "apps/$app" && yarn workspace "@moruk/$app" ios:fast --binary "../../$app_binary")

  echo "[$app] Execution command finished."
done

echo ""
echo "✓ All ${#apps[@]} app(s) processed successfully!"
