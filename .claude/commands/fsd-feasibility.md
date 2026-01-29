---
description: "Check if a feature is feasible within current architecture before starting TDD"
argument-hint: "[feature-description]"
---

# FSD Feasibility Command

Check whether a feature can be implemented within the current architecture before starting the TDD cycle.

**Arguments:** $ARGUMENTS

## Invocation

Use the Task tool to invoke the `fsd-feasibility-checker` agent:

```
Task(
  subagent_type: "fsd-feasibility-checker",
  prompt: "
    Perform feasibility check for feature implementation.

    Feature Description: $ARGUMENTS

    Workflow:
    1. If no arguments, read SPEC.md for feature requirements
    2. If arguments provided, analyze the described feature
    3. Check dependency availability (entities, shared, APIs)
    4. Validate FSD layer compliance
    5. Identify blockers and warnings
    6. Calculate feasibility score (0-10)
    7. Generate report with recommendations

    Status Definitions:
    - FEASIBLE (7-10): Proceed to @fsd-qa
    - NEEDS_WORK (4-6): Address warnings first
    - BLOCKED (0-3): Resolve blockers before TDD
  "
)
```

## Usage

```bash
# Check feasibility using SPEC.md
/fsd-feasibility

# Check feasibility for a described feature
/fsd-feasibility add premium subscription with in-app purchases

# Quick dependency check
/fsd-feasibility "feature that needs user favorites"
```

## Workflow Integration

```
@fsd-pm creates SPEC.md
    |
    v
/fsd-feasibility (this command)
    |
    +-- FEASIBLE --> @fsd-qa creates test plan
    |
    +-- NEEDS_WORK --> Address warnings, re-check
    |
    +-- BLOCKED --> @fsd-pm adds blockers to backlog
```

## Output

The agent provides:

1. **Feasibility Score** - 0-10 rating
2. **Status** - FEASIBLE, NEEDS_WORK, or BLOCKED
3. **Dependency Status** - Table of required vs available
4. **FSD Compliance** - Layer placement validation
5. **Blockers** - Critical issues that must be resolved
6. **Warnings** - Issues that should be addressed
7. **Backlog Items** - Generated items for @fsd-pm

## Score Calculation

```
Score = 10 - (Blockers × 3) - (Warnings × 1)

10:   Perfect, proceed immediately
7-9:  Minor issues, can proceed
4-6:  Significant work needed
1-3:  Major blockers
0:    Not feasible
```

## Examples

```bash
# Before starting any new feature
/fsd-feasibility

# Check a specific feature idea
/fsd-feasibility "share workout with deep links"

# After addressing warnings, re-check
/fsd-feasibility
```

## Core Principles

### Parallelization (CRITICAL for Speed)

When checking feasibility, execute ALL checks in parallel:

- Multiple dependency checks -> ONE message with multiple Read/Grep calls
- Multiple layer validations -> ONE message with multiple Glob calls

### Depth-First Strategy (DFS over BFS)

When analyzing, go DEEP into one feasibility dimension before moving to the next:

- Complete dependency analysis fully before layer compliance check
- Finish one blocker analysis completely before moving to the next

### Architecture Principles

**FSD Architecture:** Validate alignment with Feature-Sliced Design layers.

**TDD First:** Ensure feasibility includes testability assessment.

**DRY & OPEN-CLOSED:**

- Check existing patterns that can be reused
- Identify extension points in current architecture

## Notes

- Run after SPEC.md is created but before RED phase
- Catches architectural blockers early
- Generates backlog items for missing infrastructure
- Helps estimate complexity before committing to implementation
