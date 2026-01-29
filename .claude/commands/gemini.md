---
description: "Use Gemini CLI to execute AI-powered code analysis, generation, and automation tasks in headless mode"
argument-hint: "[your prompt or task description]"
---

# Gemini CLI Command

Execute Google's Gemini CLI in headless mode for AI-powered code analysis, generation, and automation tasks.

## Usage

```
/gemini [your prompt or task description]
```

## Examples

```
/gemini Review this code for security issues
/gemini Generate commit message from staged changes
/gemini Analyze codebase architecture
/gemini Batch process all Python files for code quality
```

## Instructions

Use the Task tool to invoke the `gemini-cli` agent with the user's prompt:

```
$ARGUMENTS
```

The gemini-cli agent will:

- Execute `gemini -p` commands in headless mode
- Support JSON output for programmatic parsing
- Handle code analysis, documentation generation, and batch processing
- Use appropriate Gemini models (gemini-3-pro-preview, gemini-2.5-pro, gemini-2.5-flash, gemini-2.5-flash-lite)

If no arguments are provided, the agent will ask what task you'd like to accomplish with Gemini CLI.

## Core Principles

### Parallelization (CRITICAL for Speed)

When gathering context, use @ syntax to include multiple files at once:

```bash
gemini -p "@src/feature1.ts @src/feature2.ts Analyze both features"
```

### Depth-First Strategy (DFS over BFS)

When analyzing, go DEEP into one aspect before moving to the next:

- Complete one feature analysis fully before moving to another
- Finish one code review dimension completely before the next

### Architecture Principles

**FSD over DDD:** Structure analysis following Feature-Sliced Design layers.

**TDD First:** Include test suggestions in analysis output.

**DRY & OPEN-CLOSED:**

- Identify opportunities for code reuse
- Suggest designs for extension without modification
