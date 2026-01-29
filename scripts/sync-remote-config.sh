#!/bin/bash

# Sync Remote Config with Firebase (Pull → Edit → Push)
# Usage: ./scripts/sync-remote-config.sh [project-id]
#
# This script:
# 1. Pulls current config from Firebase
# 2. Shows diff (if any changes)
# 3. Allows you to edit
# 4. Pushes changes back to Firebase

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

# Get project ID from argument or use default
PROJECT_ID="${1:-breathe-easy-cdaad}"

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║         Firebase Remote Config Sync Workflow               ║"
echo "║  Pull → Review → Edit → Push                               ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Step 1: Pull current config
echo -e "${BLUE}Step 1/3: Pulling current config from Firebase...${NC}"
echo ""
if ! "$SCRIPT_DIR/pull-remote-config.sh" "$PROJECT_ID"; then
    echo -e "${RED}Failed to pull config. Aborting.${NC}"
    exit 1
fi

echo ""
echo "─────────────────────────────────────────────────────────────"
echo ""

# Step 2: Show diff if backup exists
if [ -f "$BACKUP_FILE" ]; then
    echo -e "${BLUE}Step 2/3: Checking for local changes...${NC}"
    echo ""

    if diff -q "$BACKUP_FILE" "$TEMPLATE_FILE" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ No local changes detected.${NC}"
        echo ""
        echo "Your local config matches Firebase."
    else
        echo -e "${YELLOW}⚠ Local changes detected!${NC}"
        echo ""
        echo "Showing differences (- remote, + local):"
        echo ""
        diff -u "$BACKUP_FILE" "$TEMPLATE_FILE" | head -50 || true
        echo ""
        echo -e "${BLUE}💡 Full diff available at: diff $BACKUP_FILE $TEMPLATE_FILE${NC}"
    fi

    echo ""
    read -p "Do you want to edit the config now? (y/n) " -n 1 -r
    echo

    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo ""
        echo "Opening editor..."
        ${EDITOR:-code} "$TEMPLATE_FILE"
        echo ""
        echo "Press Enter when you're done editing..."
        read
    fi
else
    echo -e "${GREEN}✓ Config pulled for the first time.${NC}"
fi

echo ""
echo "─────────────────────────────────────────────────────────────"
echo ""

# Step 3: Push changes
echo -e "${BLUE}Step 3/3: Pushing config to Firebase...${NC}"
echo ""

read -p "Push your changes to Firebase? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    # Use printf to answer 'y' to the push script's confirmation
    printf "y\n" | "$SCRIPT_DIR/push-remote-config.sh" "$PROJECT_ID"

    echo ""
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║                    ✨ Sync Complete! ✨                     ║"
    echo "╚════════════════════════════════════════════════════════════╝"
else
    echo ""
    echo "Push cancelled. Your local changes are saved in:"
    echo "  $TEMPLATE_FILE"
    echo ""
    echo "Run this to push later:"
    echo "  ./scripts/push-remote-config.sh"
fi
