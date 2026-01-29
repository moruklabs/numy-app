---
description: "Use GitHub Copilot CLI to execute AI-powered code analysis and generation tasks with gpt-5-mini or gpt-4.1 models"
argument-hint: "[your prompt or task description]"
---

# GitHub Copilot CLI Command

Execute GitHub Copilot CLI in headless mode for AI-powered code analysis, generation, and automation tasks using gpt-5-mini or gpt-4.1 models.

## Usage

```
/copilot [your prompt or task description]
```

## Examples

```
/copilot Review this code for security issues
/copilot Generate commit message from staged changes
/copilot Refactor this code with gpt-5-mini
/copilot Analyze codebase architecture with gpt-4.1
/copilot Batch process all TypeScript files
```

## Instructions

Use the Task tool to invoke the `copilot-cli` agent with the user's prompt:

```
$ARGUMENTS
```

The copilot-cli agent will:

- Execute `copilot -p` commands in headless mode
- Use gpt-5-mini for quick, cost-effective tasks
- Use gpt-4.1 for balanced performance on moderate complexity tasks
- Handle tool permissions safely with `--allow-tool` flags
- Support directory access control with `--add-dir`
- Provide silent output mode for scripting with `--silent`

If no arguments are provided, the agent will ask what task you'd like to accomplish with GitHub Copilot CLI.

## Core Principles

### Depth-First Strategy (DFS over BFS)

When analyzing, go DEEP into one problem before moving to the next:

- Complete one code analysis dimension fully before moving to another
- Finish one generation task completely before the next

### Architecture Principles

**FSD over DDD:** Structure analysis following Feature-Sliced Design layers.

**TDD First:** Include test suggestions in generation output.

**DRY & OPEN-CLOSED:**

- Identify opportunities for code reuse
- Suggest designs for extension without modification
