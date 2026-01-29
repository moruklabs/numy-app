#!/bin/bash
set -e

# Agent and Command Validation Script
# Validates all Claude Code agents and commands for correctness
#
# Usage:
#   ./scripts/validate-agents.sh           # Validate all
#   ./scripts/validate-agents.sh agents    # Validate agents only
#   ./scripts/validate-agents.sh commands  # Validate commands only
#
# Exit Codes:
#   0 - All validations passed
#   1 - One or more validations failed

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0

echo "=================================================="
echo "Claude Code Agent & Command Validation"
echo "=================================================="
echo ""

# Validate a markdown frontmatter field
validate_frontmatter() {
    local file="$1"
    local field="$2"
    local required="$3"

    if ! grep -q "^$field:" "$file"; then
        if [ "$required" = "true" ]; then
            echo -e "${RED}✗${NC} Missing required field: $field"
            ((ERRORS++))
            return 1
        else
            echo -e "${YELLOW}⚠${NC} Missing optional field: $field"
            ((WARNINGS++))
            return 0
        fi
    fi
    echo -e "${GREEN}✓${NC} Has field: $field"
    return 0
}

# Validate agent file
validate_agent() {
    local file="$1"
    local filename=$(basename "$file")

    echo "Validating agent: $filename"

    # Check file has content
    if [ ! -s "$file" ]; then
        echo -e "${RED}✗${NC} File is empty"
        ((ERRORS++))
        return 1
    fi

    # Check frontmatter exists
    if ! head -n 1 "$file" | grep -q "^---$"; then
        echo -e "${RED}✗${NC} Missing frontmatter start (---)"
        ((ERRORS++))
        return 1
    fi

    # Validate required frontmatter fields
    validate_frontmatter "$file" "name" "true"
    validate_frontmatter "$file" "description" "true"
    validate_frontmatter "$file" "model" "false"
    validate_frontmatter "$file" "tools" "false"

    # Check for common issues
    if grep -q "TODO\|FIXME\|XXX" "$file"; then
        echo -e "${YELLOW}⚠${NC} Contains TODO/FIXME markers"
        ((WARNINGS++))
    fi

    # Check for proper markdown structure
    if ! grep -q "^#" "$file"; then
        echo -e "${YELLOW}⚠${NC} No markdown headings found"
        ((WARNINGS++))
    fi

    echo ""
    return 0
}

# Validate command file
validate_command() {
    local file="$1"
    local filename=$(basename "$file")

    echo "Validating command: $filename"

    # Check file has content
    if [ ! -s "$file" ]; then
        echo -e "${RED}✗${NC} File is empty"
        ((ERRORS++))
        return 1
    fi

    # Check for markdown structure
    if ! grep -q "^#" "$file"; then
        echo -e "${YELLOW}⚠${NC} No markdown headings found"
        ((WARNINGS++))
    fi

    # Check for usage examples
    if ! grep -qi "usage\|example" "$file"; then
        echo -e "${YELLOW}⚠${NC} No usage examples found"
        ((WARNINGS++))
    fi

    echo ""
    return 0
}

# Determine what to validate
MODE="${1:-all}"

# Validate agents
if [ "$MODE" = "all" ] || [ "$MODE" = "agents" ]; then
    echo "Validating agents in .claude/agents/"
    echo ""

    AGENT_COUNT=0
    for agent_file in .claude/agents/*.md; do
        if [ -f "$agent_file" ]; then
            validate_agent "$agent_file"
            ((AGENT_COUNT++))
        fi
    done

    echo "Validated $AGENT_COUNT agent(s)"
    echo ""
fi

# Validate commands
if [ "$MODE" = "all" ] || [ "$MODE" = "commands" ]; then
    echo "Validating commands in .claude/commands/"
    echo ""

    COMMAND_COUNT=0
    for command_file in .claude/commands/*.md; do
        if [ -f "$command_file" ]; then
            validate_command "$command_file"
            ((COMMAND_COUNT++))
        fi
    done

    echo "Validated $COMMAND_COUNT command(s)"
    echo ""
fi

# Summary
echo "=================================================="
echo "Validation Summary"
echo "=================================================="

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✓ All validations passed!${NC}"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠ $WARNINGS warning(s)${NC}"
    exit 0
else
    echo -e "${RED}✗ $ERRORS error(s), $WARNINGS warning(s)${NC}"
    exit 1
fi
