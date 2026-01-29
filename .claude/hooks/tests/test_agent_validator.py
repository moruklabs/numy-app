#!/usr/bin/env python3
"""
Tests for Agent Validator

Validates that the agent_validator module correctly validates
Claude Code agent files against the official schema.

Run with: python test_agent_validator.py
"""

import unittest
import sys
from pathlib import Path

# Add hooks directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from utils.agent_validator import (
    parse_frontmatter,
    validate_agent_content,
    validate_agent_file,
    is_agent_file,
    ValidationResult,
    REQUIRED_FIELDS,
    VALID_FIELDS,
    VALID_MODELS,
    VALID_PERMISSION_MODES,
)


class TestParseFrontmatter(unittest.TestCase):
    """Tests for frontmatter parsing."""

    def test_valid_frontmatter(self):
        """Test parsing valid frontmatter."""
        content = """---
name: test-agent
description: A test agent
model: haiku
---

Body content here.
"""
        frontmatter, body = parse_frontmatter(content)

        self.assertEqual(frontmatter["name"], "test-agent")
        self.assertEqual(frontmatter["description"], "A test agent")
        self.assertEqual(frontmatter["model"], "sonnet")
        self.assertIn("Body content here.", body)

    def test_multiline_description(self):
        """Test parsing multiline description."""
        content = """---
name: test-agent
description: |
  This is a multiline
  description field
model: haiku
---

Body here.
"""
        frontmatter, body = parse_frontmatter(content)

        self.assertEqual(frontmatter["name"], "test-agent")
        self.assertIn("multiline", frontmatter["description"])
        self.assertEqual(frontmatter["model"], "opus")

    def test_no_frontmatter(self):
        """Test content without frontmatter."""
        content = "Just some markdown without frontmatter."
        frontmatter, body = parse_frontmatter(content)

        self.assertEqual(frontmatter, {})
        self.assertEqual(body, content)

    def test_unclosed_frontmatter(self):
        """Test unclosed frontmatter."""
        content = """---
name: test-agent
description: Missing closing
"""
        frontmatter, body = parse_frontmatter(content)

        # Should return empty since frontmatter is malformed
        self.assertEqual(frontmatter, {})


class TestValidateAgentContent(unittest.TestCase):
    """Tests for agent content validation."""

    def test_valid_minimal_agent(self):
        """Test validation of minimal valid agent."""
        content = """---
name: my-agent
description: A minimal agent
---

System prompt here.
"""
        result = validate_agent_content(content)

        self.assertTrue(result.is_valid)
        self.assertEqual(len(result.errors), 0)

    def test_valid_full_agent(self):
        """Test validation of agent with all fields."""
        content = """---
name: full-agent
description: A fully configured agent
model: haiku
tools: Read, Write, Bash
permissionMode: default
skills: skill1, skill2
---

Full system prompt.
"""
        result = validate_agent_content(content)

        self.assertTrue(result.is_valid)
        self.assertEqual(len(result.errors), 0)

    def test_missing_name(self):
        """Test validation fails when name is missing."""
        content = """---
description: Agent without name
---

Body.
"""
        result = validate_agent_content(content)

        self.assertFalse(result.is_valid)
        self.assertTrue(any("name" in e.lower() for e in result.errors))

    def test_missing_description(self):
        """Test validation fails when description is missing."""
        content = """---
name: no-desc-agent
---

Body.
"""
        result = validate_agent_content(content)

        self.assertFalse(result.is_valid)
        self.assertTrue(any("description" in e.lower() for e in result.errors))

    def test_invalid_name_format(self):
        """Test validation fails for invalid name format."""
        content = """---
name: Invalid_Name_123
description: Agent with invalid name
---

Body.
"""
        result = validate_agent_content(content)

        self.assertFalse(result.is_valid)
        self.assertTrue(any("name" in e.lower() and "format" in e.lower() for e in result.errors))

    def test_valid_name_formats(self):
        """Test various valid name formats."""
        valid_names = ["agent", "my-agent", "agent-123", "a1", "test-agent-v2"]

        for name in valid_names:
            content = f"""---
name: {name}
description: Test agent
---

Body.
"""
            result = validate_agent_content(content)
            self.assertTrue(result.is_valid, f"Name '{name}' should be valid")

    def test_invalid_model(self):
        """Test validation fails for invalid model."""
        content = """---
name: test-agent
description: Agent with invalid model
model: gpt-4
---

Body.
"""
        result = validate_agent_content(content)

        self.assertFalse(result.is_valid)
        self.assertTrue(any("model" in e.lower() for e in result.errors))

    def test_valid_models(self):
        """Test all valid model values."""
        for model in VALID_MODELS:
            content = f"""---
name: test-agent
description: Agent with {model} model
model: {model}
---

Body.
"""
            result = validate_agent_content(content)
            self.assertTrue(result.is_valid, f"Model '{model}' should be valid")

    def test_invalid_permission_mode(self):
        """Test validation fails for invalid permissionMode."""
        content = """---
name: test-agent
description: Agent with invalid mode
permissionMode: invalidMode
---

Body.
"""
        result = validate_agent_content(content)

        self.assertFalse(result.is_valid)
        self.assertTrue(any("permissionMode" in e for e in result.errors))

    def test_valid_permission_modes(self):
        """Test all valid permissionMode values."""
        for mode in VALID_PERMISSION_MODES:
            content = f"""---
name: test-agent
description: Agent with {mode} mode
permissionMode: {mode}
---

Body.
"""
            result = validate_agent_content(content)
            self.assertTrue(result.is_valid, f"Permission mode '{mode}' should be valid")

    def test_unknown_field_warning(self):
        """Test that unknown fields generate warnings."""
        content = """---
name: test-agent
description: Agent with unknown field
unknownField: some value
tier: orchestrator
can_invoke: [workers]
---

Body.
"""
        result = validate_agent_content(content)

        # Should be valid but with warnings
        self.assertTrue(result.is_valid)
        self.assertTrue(len(result.warnings) > 0)
        self.assertTrue(any("unknownField" in w for w in result.warnings))

    def test_empty_body_warning(self):
        """Test that empty body generates warning."""
        content = """---
name: test-agent
description: Agent without body
---
"""
        result = validate_agent_content(content)

        self.assertTrue(result.is_valid)
        self.assertTrue(any("body" in w.lower() or "prompt" in w.lower() for w in result.warnings))


class TestIsAgentFile(unittest.TestCase):
    """Tests for agent file detection."""

    def test_valid_agent_paths(self):
        """Test detection of valid agent file paths."""
        # Use Path.home() for dynamic paths instead of hardcoded user paths
        home = str(Path.home())
        valid_paths = [
            f"{home}/.claude/agents/my-agent.md",
            f"{home}/.claude/agents/orchestrators/planner.md",
            "/path/to/project/.claude/agents/specialists/helper.md",
            "~/.claude/agents/workers/scanner.md",
        ]

        for path in valid_paths:
            self.assertTrue(is_agent_file(path), f"Should detect {path} as agent file")

    def test_invalid_agent_paths(self):
        """Test rejection of non-agent file paths."""
        # Use Path.home() for dynamic paths instead of hardcoded user paths
        home = str(Path.home())
        invalid_paths = [
            f"{home}/.claude/commands/my-command.md",
            f"{home}/project/README.md",
            "/path/to/agents.txt",  # Not .md
            "/path/to/project/src/agents.md",  # Not in agents/ dir
        ]

        for path in invalid_paths:
            self.assertFalse(is_agent_file(path), f"Should reject {path} as agent file")


class TestValidateAgentFile(unittest.TestCase):
    """Tests for file-based validation."""

    def test_nonexistent_file(self):
        """Test validation of non-existent file."""
        result = validate_agent_file("/nonexistent/path/agent.md")

        self.assertFalse(result.is_valid)
        self.assertTrue(any("not found" in e.lower() for e in result.errors))

    def test_wrong_extension(self):
        """Test validation rejects non-.md files."""
        result = validate_agent_file("/some/path/agent.txt")

        self.assertFalse(result.is_valid)
        # Either ".md" extension error or "not found" error is acceptable
        self.assertTrue(
            any(".md" in e for e in result.errors) or
            any("not found" in e.lower() for e in result.errors)
        )


class TestRealAgentFiles(unittest.TestCase):
    """Integration tests against real agent files."""

    def setUp(self):
        """Set up paths to real agent directories."""
        self.agents_dir = Path.home() / ".claude" / "agents"

    def test_orchestrators_are_valid(self):
        """Test all orchestrator agents are valid."""
        orchestrators_dir = self.agents_dir / "orchestrators"
        if not orchestrators_dir.exists():
            self.skipTest("Orchestrators directory not found")

        for agent_file in orchestrators_dir.glob("*.md"):
            result = validate_agent_file(agent_file)
            self.assertTrue(
                result.is_valid,
                f"Orchestrator {agent_file.name} is invalid:\n{result.errors}"
            )

    def test_specialists_are_valid(self):
        """Test all specialist agents are valid."""
        specialists_dir = self.agents_dir / "specialists"
        if not specialists_dir.exists():
            self.skipTest("Specialists directory not found")

        for agent_file in specialists_dir.rglob("*.md"):
            result = validate_agent_file(agent_file)
            self.assertTrue(
                result.is_valid,
                f"Specialist {agent_file.name} is invalid:\n{result.errors}"
            )

    def test_workers_are_valid(self):
        """Test all worker agents are valid."""
        workers_dir = self.agents_dir / "workers"
        if not workers_dir.exists():
            self.skipTest("Workers directory not found")

        for agent_file in workers_dir.glob("*.md"):
            result = validate_agent_file(agent_file)
            self.assertTrue(
                result.is_valid,
                f"Worker {agent_file.name} is invalid:\n{result.errors}"
            )

    def test_all_agents_have_valid_models(self):
        """Test all agents have valid model values if specified."""
        if not self.agents_dir.exists():
            self.skipTest("Agents directory not found")

        for agent_file in self.agents_dir.rglob("*.md"):
            content = agent_file.read_text()
            frontmatter, _ = parse_frontmatter(content)

            if "model" in frontmatter:
                model = frontmatter["model"].strip().lower()
                self.assertIn(
                    model,
                    VALID_MODELS,
                    f"Agent {agent_file.name} has invalid model: {model}"
                )


if __name__ == "__main__":
    # Run tests with verbosity
    unittest.main(verbosity=2)

