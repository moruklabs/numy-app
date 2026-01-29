#!/bin/bash
# Check for critical Yarn dependency warnings
# Usage: ./scripts/check-dependencies.sh

echo "🔍 Checking for critical dependency warnings..."
echo ""

# Capture yarn install output
INSTALL_OUTPUT=$(CI=false yarn install 2>&1 || true)

# Check for critical warnings
YN0060_COUNT=$(echo "$INSTALL_OUTPUT" | grep -c "YN0060" || true)
YN0002_COUNT=$(echo "$INSTALL_OUTPUT" | grep -c "YN0002" || true)

# Display results
echo "Results:"
echo "  YN0060 (peer dependency mismatches): $YN0060_COUNT"
echo "  YN0002 (missing dependencies): $YN0002_COUNT"
echo ""

# Exit with appropriate code
if [ "$YN0060_COUNT" -gt 0 ] || [ "$YN0002_COUNT" -gt 0 ]; then
  echo "❌ Found critical dependency warnings!"
  echo ""
  echo "YN0060 warnings (peer dependency version mismatches):"
  echo "$INSTALL_OUTPUT" | grep "YN0060" || echo "  None"
  echo ""
  echo "YN0002 warnings (missing dependencies):"
  echo "$INSTALL_OUTPUT" | grep "YN0002" || echo "  None"
  echo ""
  echo "See docs/DEPENDENCY_MANAGEMENT.md for resolution steps."
  exit 1
else
  echo "✅ No critical dependency warnings found!"
  exit 0
fi
