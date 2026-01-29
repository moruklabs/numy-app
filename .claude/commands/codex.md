---
description: "Use Codex CLI to execute AI-powered coding tasks in headless mode with advanced reasoning capabilities"
argument-hint: "[your prompt or task description]"
---

# Codex CLI Command

Execute OpenAI's Codex CLI in headless mode for automated coding tasks, codebase exploration, and intelligent CLI tool invocation.

## Usage

```
/codex [your prompt or task description]
```

## Examples

```
/codex Find all API endpoints in this project
/codex Analyze this change and decide if tests should run
/codex Find files containing authentication logic
/codex Refactor this module with gpt-5.1-codex-max and medium reasoning
/codex Get JSON analysis of code complexity
```

## Instructions

Use the Task tool to invoke the `codex` agent with the user's prompt:

```
$ARGUMENTS
```

The codex agent will:

- Execute `codex exec` commands in headless mode with `--full-auto`
- Support advanced models like `gpt-5.1-codex-max` with reasoning effort control
- Handle codebase exploration, hook-based decision making, and intelligent CLI tool invocation
- Provide structured JSON output for programmatic processing

If no arguments are provided, the agent will ask what task you'd like to accomplish with Codex CLI.

## Core Principles

### Depth-First Strategy (DFS over BFS)

When analyzing, go DEEP into one problem before moving to the next:

- Complete one debugging dimension fully before moving to another
- Finish one refactoring suggestion completely before the next

### Architecture Principles

**FSD over DDD:** Structure analysis following Feature-Sliced Design layers.

**TDD First:** Include test suggestions in analysis output.

**DRY & OPEN-CLOSED:**

- Identify opportunities for code reuse
- Suggest designs for extension without modification
