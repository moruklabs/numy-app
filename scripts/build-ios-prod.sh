#!/usr/bin/env bash
set -euo pipefail

# Minimum free disk space (in GB) required to run parallel local iOS builds.
# This prevents obscure ENOSPC errors during EAS/git/yarn steps.
MIN_FREE_GB=30

# Get free space in GB (works on both macOS and Linux)
if [[ "$OSTYPE" == "darwin"* ]]; then
  # macOS: df -g gives output in GB
  FREE_GB=$(df -g . | awk 'NR==2 {print $4}')
else
  # Linux: df -BG gives output in GB, strip the 'G' suffix
  FREE_GB=$(df -BG . | awk 'NR==2 {print $4}' | sed 's/G//')
fi

if [ "$FREE_GB" -lt "$MIN_FREE_GB" ]; then
  echo "✗ Not enough free disk space for local EAS builds."
  echo "  Required: >= ${MIN_FREE_GB}GB, Available: ${FREE_GB}GB"
  echo "  Tip: Run 'just free' to clean Xcode/Expo/Yarn caches, then retry."
  exit 1
fi

# Run this script using `nohup ./build-prod.sh > build.log 2>&1 &`
# to ensure it continues even if you close your terminal session.
# Builds run in parallel and if any build fails, all others are killed
# (fail-fast behavior).

# Active apps with EAS configuration
APPS=(
  "numy"
  "interval-timer"
  "minday"
  "numy"
  "plant-doctor"
  "rizzman"
  "stone-identifier"
)

# Array to store PIDs
declare -a PIDS=()
declare -a APP_NAMES=()

# Cleanup function to kill all background processes
cleanup() {
  if [ ${#PIDS[@]} -gt 0 ]; then
    echo "Killing all build processes..."
    for pid in "${PIDS[@]}"; do
      if kill -0 "$pid" 2>/dev/null; then
        kill "$pid" 2>/dev/null || true
      fi
    done
    # Wait a bit for processes to terminate
    sleep 2
    # Force kill if still running
    for pid in "${PIDS[@]}"; do
      if kill -0 "$pid" 2>/dev/null; then
        kill -9 "$pid" 2>/dev/null || true
      fi
    done
  fi
}

# Set trap to cleanup on exit
trap cleanup EXIT INT TERM

# Start all builds in parallel
for app in "${APPS[@]}"; do
  echo "=== Starting build for $app (ios, production) ==="
  (
    just build "$app" ios production
    echo "=== $app build completed ==="
  ) &
  PIDS+=($!)
  APP_NAMES+=("$app")
done

# Create a map of PID to app name for easier lookup
declare -A PID_TO_APP
for i in "${!PIDS[@]}"; do
  PID_TO_APP["${PIDS[$i]}"]="${APP_NAMES[$i]}"
done

# Wait for all builds and check exit codes
REMAINING_PIDS=("${PIDS[@]}")

# Wait for processes to complete one by one
while [ ${#REMAINING_PIDS[@]} -gt 0 ]; do
  # Wait for any process to finish (bash 4.0+)
  set +e  # Temporarily disable exit on error for wait -n
  wait -n "${REMAINING_PIDS[@]}"
  wait_exit_code=$?
  set -e  # Re-enable exit on error

  # Find which PID finished
  finished_pid=""
  for pid in "${REMAINING_PIDS[@]}"; do
    if ! kill -0 "$pid" 2>/dev/null; then
      finished_pid="$pid"
      break
    fi
  done

  if [ -n "$finished_pid" ]; then
    app="${PID_TO_APP[$finished_pid]}"
    if [ $wait_exit_code -eq 0 ]; then
      echo "✓ $app build succeeded"
    else
      echo "✗ $app build failed with exit code $wait_exit_code"
      # Exit - cleanup trap will kill all remaining processes
      exit 1
    fi
    # Remove finished PID from remaining list
    NEW_REMAINING=()
    for pid in "${REMAINING_PIDS[@]}"; do
      if [ "$pid" != "$finished_pid" ]; then
        NEW_REMAINING+=("$pid")
      fi
    done
    REMAINING_PIDS=("${NEW_REMAINING[@]}")
  fi
done

# Disable trap since we succeeded
trap - EXIT INT TERM

echo "✓ All production builds completed successfully."
