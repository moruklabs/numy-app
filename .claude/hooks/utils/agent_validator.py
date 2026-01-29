#!/usr/bin/env python3
"""
Agent Validator Utility

Validates Claude Code agent files against the official schema.
Reference: https://code.claude.com/docs/en/sub-agents

Required fields:
- name: Unique identifier using lowercase letters and hyphens
- description: Natural language description of the agent's purpose

Optional fields:
- tools: Comma-separated list of specific tools
- model: haiku, opus, haiku, or inherit
- permissionMode: default, acceptEdits, bypassPermissions, plan, ignore
- skills: Comma-separated list of skill names
"""

import re
from pathlib import Path
from dataclasses import dataclass
from typing import Optional


@dataclass
class ValidationResult:
    """Result of agent file validation."""
    is_valid: bool
    errors: list[str]
    warnings: list[str]
    file_path: Optional[str] = None


# Valid frontmatter fields per Claude Code docs
REQUIRED_FIELDS = {"name", "description"}
OPTIONAL_FIELDS = {"tools", "model", "permissionMode", "skills"}
VALID_FIELDS = REQUIRED_FIELDS | OPTIONAL_FIELDS

# Valid values for specific fields
VALID_MODELS = {"sonnet", "opus", "haiku", "inherit"}
VALID_PERMISSION_MODES = {"default", "acceptEdits", "bypassPermissions", "plan", "ignore"}

# Name pattern: lowercase letters, numbers, and hyphens
NAME_PATTERN = re.compile(r"^[a-z][a-z0-9-]*$")


def parse_frontmatter(content: str) -> tuple[dict, str]:
    """
    Parse YAML frontmatter from markdown content.

    Returns:
        Tuple of (frontmatter_dict, body_content)
    """
    if not content.startswith("---"):
        return {}, content

    # Find the closing ---
    lines = content.split("\n")
    end_idx = None
    for i, line in enumerate(lines[1:], 1):
        if line.strip() == "---":
            end_idx = i
            break

    if end_idx is None:
        return {}, content

    # Parse frontmatter
    frontmatter = {}
    current_key = None
    current_value_lines = []

    for line in lines[1:end_idx]:
        # Check for multiline value continuation
        if current_key and (line.startswith("  ") or line.startswith("\t")):
            current_value_lines.append(line.strip())
            continue

        # Save previous key if exists
        if current_key and current_value_lines:
            frontmatter[current_key] = "\n".join(current_value_lines)
            current_value_lines = []

        # Parse new key-value
        if ":" in line:
            key, _, value = line.partition(":")
            key = key.strip()
            value = value.strip()

            # Handle multiline indicator
            if value == "|" or value == ">":
                current_key = key
                current_value_lines = []
            elif value:
                frontmatter[key] = value
                current_key = None
            else:
                current_key = key
                current_value_lines = []

    # Don't forget last key
    if current_key and current_value_lines:
        frontmatter[current_key] = "\n".join(current_value_lines)

    body = "\n".join(lines[end_idx + 1:])
    return frontmatter, body


def validate_agent_content(content: str, file_path: Optional[str] = None) -> ValidationResult:
    """
    Validate agent file content against the official schema.

    Args:
        content: The full content of the agent markdown file
        file_path: Optional path for error messages

    Returns:
        ValidationResult with is_valid, errors, and warnings
    """
    errors = []
    warnings = []

    # Parse frontmatter
    frontmatter, body = parse_frontmatter(content)

    if not frontmatter:
        errors.append("Missing or invalid YAML frontmatter (must start with ---)")
        return ValidationResult(False, errors, warnings, file_path)

    # Check required fields
    for field in REQUIRED_FIELDS:
        if field not in frontmatter:
            errors.append(f'Missing required field: "{field}"')
        elif not frontmatter[field].strip():
            errors.append(f'Required field "{field}" is empty')

    # Check for invalid fields
    for field in frontmatter:
        if field not in VALID_FIELDS:
            warnings.append(f'Unknown field "{field}" - valid fields are: {", ".join(sorted(VALID_FIELDS))}')

    # Validate name format
    if "name" in frontmatter:
        name = frontmatter["name"].strip()
        if not NAME_PATTERN.match(name):
            errors.append(f'Invalid name format "{name}" - must be lowercase letters, numbers, and hyphens (e.g., "my-agent")')

    # Validate model if present
    if "model" in frontmatter:
        model = frontmatter["model"].strip().lower()
        if model not in VALID_MODELS:
            errors.append(f'Invalid model "{model}" - valid values: {", ".join(sorted(VALID_MODELS))}')

    # Validate permissionMode if present
    if "permissionMode" in frontmatter:
        mode = frontmatter["permissionMode"].strip()
        if mode not in VALID_PERMISSION_MODES:
            errors.append(f'Invalid permissionMode "{mode}" - valid values: {", ".join(sorted(VALID_PERMISSION_MODES))}')

    # Check for body content
    if not body.strip():
        warnings.append("Agent has no system prompt (body content after frontmatter)")

    is_valid = len(errors) == 0
    return ValidationResult(is_valid, errors, warnings, file_path)


def validate_agent_file(file_path: str | Path) -> ValidationResult:
    """
    Validate an agent file from disk.

    Args:
        file_path: Path to the agent markdown file

    Returns:
        ValidationResult with is_valid, errors, and warnings
    """
    path = Path(file_path)

    if not path.exists():
        return ValidationResult(False, [f"File not found: {file_path}"], [], str(file_path))

    if not path.suffix == ".md":
        return ValidationResult(False, ["Agent files must have .md extension"], [], str(file_path))

    try:
        content = path.read_text(encoding="utf-8")
    except Exception as e:
        return ValidationResult(False, [f"Failed to read file: {e}"], [], str(file_path))

    return validate_agent_content(content, str(file_path))


def format_validation_result(result: ValidationResult) -> str:
    """Format validation result as a human-readable string."""
    lines = []

    if result.file_path:
        lines.append(f"Validating: {result.file_path}")

    if result.is_valid:
        lines.append("✓ Agent file is valid")
    else:
        lines.append("✗ Agent file has errors:")

    for error in result.errors:
        lines.append(f"  ERROR: {error}")

    for warning in result.warnings:
        lines.append(f"  WARNING: {warning}")

    return "\n".join(lines)


def is_agent_file(file_path: str | Path) -> bool:
    """Check if a file path is within an agents directory."""
    path_str = str(file_path)
    return "/agents/" in path_str and path_str.endswith(".md")


# For testing
if __name__ == "__main__":
    import sys

    if len(sys.argv) < 2:
        print("Usage: python agent_validator.py <agent_file.md>")
        sys.exit(1)

    result = validate_agent_file(sys.argv[1])
    print(format_validation_result(result))
    sys.exit(0 if result.is_valid else 1)

