---
description: "Use Cursor Agent CLI to execute AI-powered code analysis and generation tasks with the composer model"
argument-hint: "[your prompt or task description]"
---

# Cursor Agent CLI Command

Execute Cursor Agent CLI in headless mode for AI-powered code analysis, generation, and automation tasks using the composer model.

## Usage

```
/cursor [your prompt or task description]
```

## Examples

```
/cursor Review this code for security issues
/cursor Generate commit message from staged changes
/cursor Refactor this code with composer model
/cursor Analyze codebase architecture
/cursor Batch process all JavaScript files
```

## Instructions

Use the Task tool to invoke the `cursor-agent-cli` agent with the user's prompt:

```
$ARGUMENTS
```

The cursor-agent-cli agent will:

- Execute `cursor-agent --print` commands in headless mode
- Use the composer model for advanced code generation and refactoring
- Support JSON and stream-json output formats for programmatic parsing
- Handle code analysis, documentation generation, and batch processing
- Provide structured output with metadata and statistics

If no arguments are provided, the agent will ask what task you'd like to accomplish with Cursor Agent CLI.

## Core Principles

### Depth-First Strategy (DFS over BFS)

When analyzing, go DEEP into one problem before moving to the next:

- Complete one feature implementation fully before moving to another
- Finish one refactoring task completely before the next

### Architecture Principles

**FSD over DDD:** Structure analysis following Feature-Sliced Design layers.

**TDD First:** Include test suggestions in implementation output.

**DRY & OPEN-CLOSED:**

- Identify opportunities for code reuse
- Suggest designs for extension without modification
