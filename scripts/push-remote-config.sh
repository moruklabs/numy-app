#!/bin/bash

# Push Remote Config to Firebase
# Usage: ./scripts/push-remote-config.sh [project-id]
#
# This script uses firebase deploy --only remoteconfig which reads the template
# from the path specified in firebase.json under remoteconfig.template
#
# IMPORTANT: Always pull before pushing to avoid overwriting changes

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

# Check if template file exists
if [ ! -f "$TEMPLATE_FILE" ]; then
    echo -e "${RED}Error: Remote config template not found at $TEMPLATE_FILE${NC}"
    echo ""
    echo "Run this first to pull the current config:"
    echo "  ./scripts/pull-remote-config.sh"
    exit 1
fi

# Get project ID from argument or firebase config
PROJECT_ID="${1:-breathe-easy-cdaad}"

# Check if backup exists (indicates a recent pull)
if [ ! -f "$BACKUP_FILE" ]; then
    echo -e "${YELLOW}⚠ Warning: No backup file found.${NC}"
    echo ""
    echo "This might mean you haven't pulled the latest config."
    echo -e "${BLUE}It's recommended to pull before pushing to avoid conflicts.${NC}"
    echo ""
    read -p "Do you want to pull first? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo ""
        echo "Running pull script..."
        "$SCRIPT_DIR/pull-remote-config.sh" "$PROJECT_ID"
        echo ""
        echo "Now continuing with push..."
        echo ""
    else
        echo ""
        echo -e "${YELLOW}Continuing without pull...${NC}"
        echo ""
    fi
fi

echo -e "${YELLOW}Pushing Remote Config to project: $PROJECT_ID${NC}"
echo ""

# Validate JSON
if ! python3 -c "import json; json.load(open('$TEMPLATE_FILE'))" 2>/dev/null; then
    echo -e "${RED}Error: Invalid JSON in $TEMPLATE_FILE${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Template file validated.${NC}"

# Show summary of what will be pushed
PARAM_COUNT=$(python3 -c "import json; data=json.load(open('$TEMPLATE_FILE')); print(len(data.get('parameters', {})))" 2>/dev/null || echo "unknown")
echo ""
echo "Summary:"
echo "  Parameters to push: $PARAM_COUNT"
echo ""

# Confirm before pushing
read -p "Continue with push? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Push cancelled."
    exit 0
fi

echo ""

# Deploy remote config using firebase deploy
echo "Deploying Remote Config..."
cd "$PROJECT_ROOT"
if firebase deploy --only remoteconfig --project "$PROJECT_ID"; then
    echo ""
    echo -e "${GREEN}✓ Remote Config pushed successfully!${NC}"
    echo ""
    echo "View in Firebase Console:"
    echo "  https://console.firebase.google.com/project/$PROJECT_ID/config"
else
    echo ""
    echo -e "${RED}Failed to push Remote Config.${NC}"
    echo ""
    echo "Make sure you have the necessary permissions and are logged in:"
    echo "  firebase login"
    exit 1
fi
