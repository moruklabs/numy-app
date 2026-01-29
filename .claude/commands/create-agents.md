---
description: "Create multiple Claude Code agents from a single natural language description"
argument-hint: "<agent descriptions, e.g., 'a code-reviewer, a test-generator, and a doc-writer'>"
---

# Create Agents Command

Use the Task tool with `subagent_type="multiple-agents-creator"` to create multiple Claude Code agents from a single natural language description.

## Invocation Context

This command supports two modes:

### Interactive Mode (No arguments)

If `$ARGUMENTS` is empty or contains only whitespace, the multiple-agents-creator agent should:

1. Use AskUserQuestion to gather requirements through discovery questions:
   - What domain or workflow are these agents for?
   - How many agents do you need?
   - What are their responsibilities?
2. Parse responses and design the agent set
3. Present the plan for confirmation
4. Generate all agent files

### Non-Interactive Mode (With arguments)

If `$ARGUMENTS` contains agent descriptions, the multiple-agents-creator agent should:

1. Parse the natural language input to extract agent definitions
2. Determine model tier and tools for each agent
3. Present the creation plan
4. Generate all agent files in parallel

## Agent Descriptions

$ARGUMENTS

## Description Formats Supported

The agent accepts various formats for defining multiple agents:

| Pattern             | Example                                               |
| ------------------- | ----------------------------------------------------- |
| Comma-separated     | "a code-reviewer, a test-generator, and a doc-writer" |
| Numbered lists      | "(1) API creator, (2) schema designer, (3) tester"    |
| Colon definitions   | "reviewer: reviews code, generator: creates tests"    |
| "One for X" pattern | "one for entities, one for features, one for widgets" |
| Explicit list       | "agents: analyzer, optimizer, validator"              |

## Output Location

All agents are saved to: `.claude/agents/` (project-specific, version controlled)

If the `.claude/agents/` directory doesn't exist, create it.

## Execution Instructions

1. **Determine Mode**
   - Empty `$ARGUMENTS` → Interactive mode with discovery questions
   - Provided `$ARGUMENTS` → Non-interactive parsing and generation

2. **Parse Agent Definitions**
   - Extract name, purpose, and domain for each agent
   - Handle all supported description formats
   - If unclear, ask clarifying questions

3. **Design Each Agent**
   - Determine model tier:
     - **haiku**: Quick tasks, scanning, validation
     - **sonnet**: Most agents (default) - implementations, analysis
     - **opus**: Complex reasoning, multi-agent coordination
   - Select minimal tool set based on purpose
   - Ensure single responsibility per agent

4. **Present Plan for Confirmation**
   - Show table with: Name, Purpose, Model, Tools
   - Allow modifications before proceeding
   - Check for conflicts with existing agents

5. **Generate Agent Files (PARALLEL)**
   - Create all agent files in a SINGLE message using multiple Write calls
   - Validate YAML frontmatter for each agent
   - Include invocation scenarios and example triggers

6. **Report Summary**
   - List all created agent files with absolute paths
   - Provide usage examples for each agent
   - Confirm agents are available in Task tool

## Quality Checks

Before completing, verify:

- [ ] All agent names are unique and kebab-cased
- [ ] Each agent has clear, non-overlapping purpose
- [ ] Model tiers match agent complexity
- [ ] Tools are minimal but sufficient
- [ ] All files have valid YAML frontmatter
- [ ] All agents have invocation scenarios and examples

## Examples

### Example 1: Create Testing Agents

```
/create-agents a code-reviewer that reviews PRs, a test-generator that creates unit tests, and a coverage-analyzer that checks test coverage
```

Creates 3 agents:

- `code-reviewer.md` - Reviews pull requests
- `test-generator.md` - Creates unit tests
- `coverage-analyzer.md` - Analyzes test coverage

### Example 2: Create FSD Agents

```
/create-agents one for entities, one for features, one for widgets in FSD architecture
```

Creates 3 FSD-specialized agents.

### Example 3: Interactive Mode

```
/create-agents
```

Prompts for agent requirements through discovery questions.
