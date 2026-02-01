#!/bin/bash
# Kill process on specified port

PORT=${1:-3131}
echo "Killing process on port $PORT..."
lsof -ti:$PORT | xargs kill -9 2>/dev/null || true
echo "Port $PORT is now free"
