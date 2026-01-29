#!/bin/bash
# Kill process running on a specific port
# Usage: ./killport.sh <port>

set -e

PORT=${1:-8081}

if [ -z "$PORT" ]; then
    echo "Usage: $0 <port>"
    exit 1
fi

# Find and kill process on the specified port
PID=$(lsof -t -i:$PORT 2>/dev/null || true)

if [ -n "$PID" ]; then
    echo "Killing process $PID on port $PORT..."
    kill -9 $PID
    echo "Done."
else
    echo "No process found on port $PORT"
fi
