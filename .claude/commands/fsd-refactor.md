---
description: "Analyze code for refactoring opportunities and optionally execute improvements"
argument-hint: "[focus-area]"
---

# FSD Refactor Command

Analyze the current feature for refactoring opportunities using the FSD Refactoring Advisor.

**Arguments:** $ARGUMENTS

## Invocation

Use the Task tool to invoke the `fsd-refactoring` agent:

```
Task(
  subagent_type: "fsd-refactoring",
  prompt: "
    Analyze code for refactoring opportunities.

    Focus Area: $ARGUMENTS

    Workflow:
    1. Read CURRENT_TASK.md for feature context
    2. Identify files in the current feature
    3. Analyze for code smells and improvements
    4. Generate prioritized refactoring report
    5. Create actionable prompts for @fsd-coder

    If focus area is specified, prioritize that category:
    - 'dry' - Focus on DRY violations
    - 'hooks' - Focus on hook consolidation
    - 'components' - Focus on component extraction
    - 'types' - Focus on TypeScript improvements
    - 'fsd' - Focus on FSD layer compliance
    - 'all' or empty - Full analysis
  "
)
```

## Usage

```bash
# Full refactoring analysis
/fsd-refactor

# Focus on specific area
/fsd-refactor hooks
/fsd-refactor dry
/fsd-refactor components

# Execute all suggestions
/fsd-refactor --all
```

## Workflow Integration

```
GREEN phase complete
    |
    v
@fsd-validate passes
    |
    v
/fsd-refactor (this command)
    |
    v
Review suggestions
    |
    v
REFACTOR phase with @fsd-coder
```

## Output

The agent will provide:

1. **Summary** - Overview of findings by priority
2. **Detailed Findings** - Each issue with location, category, and suggestion
3. **Refactoring Prompts** - Ready-to-use prompts for @fsd-coder
4. **Recommended Order** - Prioritized execution sequence

## Examples

```bash
# After GREEN phase, get refactoring suggestions
/fsd-refactor

# Focus on extracting hooks from components
/fsd-refactor hooks

# Check for FSD layer violations only
/fsd-refactor fsd
```

## Core Principles

### Parallelization (CRITICAL for Speed)

When analyzing multiple files, read ALL in a SINGLE message:

- Multiple file reads -> one message with multiple Read calls
- Multiple pattern searches -> one message with multiple Grep calls

### Depth-First Strategy (DFS over BFS)

When refactoring, go DEEP into one improvement before moving to the next:

- Complete one refactoring fully (test, apply, verify) before starting another
- Finish one DRY violation fix completely before addressing the next

### Architecture Principles

**FSD Architecture:** Refactor to align with Feature-Sliced Design layers.

**DRY Focus:**

- Identify and eliminate code duplication
- Extract common patterns into shared utilities
- Create reusable hooks/components

**OPEN-CLOSED:**

- Refactor for extension without modification
- Create abstraction points for future changes
- Preserve existing interfaces when possible

## Notes

- Run after GREEN phase when tests pass
- All suggestions preserve test coverage
- Each refactoring is independently committable
- Use @fsd-coder to execute the refactoring prompts
