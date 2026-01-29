#!/bin/bash
# Test runner for hook registration tests

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "================================"
echo "Hook Registration Test Suite"
echo "================================"
echo

# Run all tests with unittest discovery
python3 -m unittest discover -s . -p "test_*.py" -v

echo
echo "================================"
echo "All tests passed!"
echo "================================"
