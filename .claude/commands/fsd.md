---
description: "FSD Development Lifecycle - Auto-detects phase from CURRENT_TASK.md and routes to appropriate agent"
argument-hint: "<task-description>"
---

# FSD Development Lifecycle

You are invoking the FSD (Feature-Sliced Design) development lifecycle. This command auto-detects
the current phase and routes to the appropriate agents for TDD-driven development.

**Task:** $ARGUMENTS

## Invocation Logic

Use the Task tool with `subagent_type="auto-fsd"` to orchestrate the FSD workflow:

```
Task(
  subagent_type: "auto-fsd",
  prompt: "
    Task Description: $ARGUMENTS

    Execute the FSD Auto-Orchestrator:
    1. Detect project root (git rev-parse --show-toplevel)
    2. Read CURRENT_TASK.md to determine current phase
    3. Route to appropriate agents based on state
    4. Execute Ralph loop for efficient TDD iteration

    If task description is empty:
    - Display current task status
    - Show available actions
  "
)
```

## Workflow Overview

```
+------------------+
| /fsd [task]      |
+--------+---------+
         |
         v
+------------------+
| Detect Git Root  |
+--------+---------+
         |
         v
+------------------+
| @fsd-police      | ← Infrastructure audit (first run)
+--------+---------+
         |
         v
+------------------+
| Read CURRENT_TASK|
+--------+---------+
         |
    +----+----+
    |         |
    v         v
No Task    Active Task
    |         |
    v         v
@fsd-pm   Detect Phase
    |         |
    v         |
@fsd-feasibility  |
    |         |
    v    +----+----+----+
@fsd-qa  |    |    |    |
    |    RED  GREEN REFACTOR
    v    |    |    |    |
Ralph    v    v    v    |
Loop   @fsd-qa/coder    |
         |              |
         v              |
    @fsd-validate       |
         |              |
         v              |
    @fsd-refactoring    |
         |              |
         v              |
    @fsd-commit --------+
         |
         v
    @fsd-orchestrator
       (changelog)
```

## Commands

| Command            | Description                               |
| ------------------ | ----------------------------------------- |
| `/fsd [task]`      | Start new task or continue current        |
| `/fsd`             | Show status and continue                  |
| `/fsd --status`    | Detailed status display                   |
| `/fsd --backlog`   | Show backlog items                        |
| `/fsd-feasibility` | Check feature feasibility before TDD      |
| `/fsd-refactor`    | Analyze refactoring opportunities         |
| `/fsd-commit`      | Create semantic commit for completed task |

## What Happens

### New Task (no active task)

1. **@fsd-police** audits project infrastructure (first run)
2. **@fsd-pm** creates SPEC.md with acceptance criteria
3. **@fsd-feasibility-checker** validates implementation feasibility
4. **@fsd-qa** creates CURRENT_TASK.md with test plan (RED phase)
5. **Ralph loop** executes TDD cycle

### Continue Task (active task exists)

1. Reads current phase from CURRENT_TASK.md
2. Routes to appropriate agent (@fsd-qa, @fsd-coder)
3. Continues TDD cycle from current step

### Phase Transitions

- **RED → GREEN**: When tests fail correctly
- **GREEN → REFACTOR**: When tests pass + @fsd-validate passes
- **REFACTOR → RED**: When refactor complete, more tests needed
- **REFACTOR → COMPLETE**: When all tests pass → @fsd-commit creates commit

### Quality Gates

- **@fsd-validate** - Runs after GREEN phase (TypeScript, lint, tests)
- **@fsd-refactoring** - Analyzes code before REFACTOR phase
- **@fsd-commit** - Creates semantic commit after task completion

## Examples

```bash
# Start a new feature
/fsd Add dark mode toggle to settings

# Continue current task
/fsd

# Check status
/fsd --status

# View backlog
/fsd --backlog
```

## Core Principles

### Parallelization (CRITICAL for Speed)

All independent operations MUST be parallelized:

- Multiple agent tasks -> ONE message with multiple Task calls
- Multiple file reads -> ONE message with multiple Read calls
- Git status + git diff + git log -> ONE message with multiple Bash calls

### Depth-First Strategy (DFS over BFS)

When implementing, go DEEP into one path before moving to the next:

- Complete one test case fully (RED-GREEN-REFACTOR) before starting another
- Finish one feature layer completely before moving to the next
- Resolve one error completely before addressing others

### Architecture Principles

**FSD over DDD:** Feature-Sliced Design with strict layer boundaries:

- entities -> features -> widgets -> pages
- Never import from higher layers

**TDD First:** Always follow RED-GREEN-REFACTOR:

1. RED: Write failing test
2. GREEN: Minimal code to pass
3. REFACTOR: Clean up with tests passing

**DRY & OPEN-CLOSED:**

- Extract common patterns into shared layer
- Design for extension without modification
- Check existing patterns before creating new ones

## Notes

- All artifacts (SPEC.md, CURRENT_TASK.md, .docs/) are created in the git root
- Uses just-in-time research (codebase first, web second, agent third)
- Follows strict TDD: tests before implementation
- Max 20 iterations per Ralph loop

## Emergency Stop

If the loop gets stuck:

```
/ralph-wiggum:cancel-ralph
```
