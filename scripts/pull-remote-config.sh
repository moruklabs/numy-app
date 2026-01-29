#!/bin/bash

# Pull Remote Config from Firebase
# Usage: ./scripts/pull-remote-config.sh [project-id]
#
# This script downloads the current remote config from Firebase
# and saves it to remoteconfig.template.json

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
TEMPLATE_FILE="$PROJECT_ROOT/remoteconfig.template.json"
BACKUP_FILE="$PROJECT_ROOT/remoteconfig.template.backup.json"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo -e "${RED}Error: Firebase CLI is not installed.${NC}"
    echo "Install it with: yarninstall -g firebase-tools"
    exit 1
fi

# Get project ID from argument or use default
PROJECT_ID="${1:-breathe-easy-cdaad}"

echo -e "${YELLOW}Pulling Remote Config from project: $PROJECT_ID${NC}"
echo ""

# Create backup of existing template if it exists
if [ -f "$TEMPLATE_FILE" ]; then
    echo -e "${BLUE}Creating backup of existing template...${NC}"
    cp "$TEMPLATE_FILE" "$BACKUP_FILE"
    echo -e "${GREEN}✓ Backup saved to: $BACKUP_FILE${NC}"
    echo ""
fi

# Pull remote config using firebase CLI
echo "Downloading Remote Config..."
cd "$PROJECT_ROOT"

if firebase remoteconfig:get --project "$PROJECT_ID" -o "$TEMPLATE_FILE"; then
    echo ""
    echo -e "${GREEN}✓ Remote Config pulled successfully!${NC}"
    echo ""
    echo "File saved to: $TEMPLATE_FILE"

    # Validate the downloaded JSON
    if python3 -c "import json; json.load(open('$TEMPLATE_FILE'))" 2>/dev/null; then
        echo -e "${GREEN}✓ Template file is valid JSON${NC}"
    else
        echo -e "${RED}⚠ Warning: Downloaded template has invalid JSON${NC}"
        if [ -f "$BACKUP_FILE" ]; then
            echo -e "${YELLOW}Restoring from backup...${NC}"
            mv "$BACKUP_FILE" "$TEMPLATE_FILE"
            echo -e "${GREEN}✓ Backup restored${NC}"
        fi
        exit 1
    fi

    # Show summary
    echo ""
    echo "Summary:"
    PARAM_COUNT=$(python3 -c "import json; data=json.load(open('$TEMPLATE_FILE')); print(len(data.get('parameters', {})))" 2>/dev/null || echo "unknown")
    echo "  Parameters: $PARAM_COUNT"

    if [ -f "$BACKUP_FILE" ]; then
        echo ""
        echo -e "${BLUE}💡 Tip: Compare with backup to see changes:${NC}"
        echo "   diff $BACKUP_FILE $TEMPLATE_FILE"
    fi
else
    echo ""
    echo -e "${RED}Failed to pull Remote Config.${NC}"
    echo "Make sure you:"
    echo "  1. Are logged in (firebase login)"
    echo "  2. Have the necessary permissions"
    echo "  3. Specified the correct project ID"

    # Restore backup if pull failed
    if [ -f "$BACKUP_FILE" ]; then
        echo ""
        echo -e "${YELLOW}Restoring from backup...${NC}"
        mv "$BACKUP_FILE" "$TEMPLATE_FILE"
        echo -e "${GREEN}✓ Backup restored${NC}"
    fi
    exit 1
fi
