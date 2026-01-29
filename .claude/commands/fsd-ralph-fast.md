---
description: "Generate optimized Ralph loop prompt with minimal upfront research and code exploration, doing validations within iterations, and code exploration, research as needed within iterations."
argument-hint: "<task-description>"
---

# FSD-Ralph-Fast: Minimal Upfront, Just-in-Time Research

You are orchestrating a Ralph Wiggum loop for the following task with **minimal upfront overhead and just-in-time research**:

**Task:** $ARGUMENTS

## Philosophy: Start Fast, Research When Blocked

**Approach:** Quick FSD Check -> Minimal Context -> Start Coding -> Research/Explore When Needed

This approach:

- Starts implementation within 30 seconds (vs 3-5 minutes for fsd-ralph)
- Trusts the developer to provide sufficient context in the task description
- Does validation and exploration **within iterations** when blocked
- Front-loads action, not research
- Best for familiar codebases, well-defined tasks, or time-sensitive work

**Comparison:**

| Aspect          | fsd-ralph (heavy)   | fsd-ralph-fast (this)    |
| --------------- | ------------------- | ------------------------ |
| Startup time    | 3-5 minutes         | 30 seconds               |
| Upfront agents  | 5 parallel agents   | 1 quick agent            |
| Research timing | Before coding       | During iterations        |
| Best for        | Unfamiliar, complex | Familiar, defined        |
| Agent cost      | Higher upfront      | Lower upfront, on-demand |

---

## Step 0: Quick FSD Protocol Check (30 seconds max)

**MANDATORY but FAST - just read, do not analyze deeply:**

### 0.1 Quick State Check

```
Read CURRENT_TASK.md - Is there an active task?
IF active task exists:
  Ask user: "Active task found: [name]. Continue that, or start this new task?"
  Wait for response.
```

### 0.2 Quick Layer Detection

Based on the task description, make a quick determination:

```
IF task mentions UI/screen/page -> widgets/pages layer (BDD)
IF task mentions state/store/model -> entities layer (TDD)
IF task mentions user action/flow/hook -> features layer (BDD)
IF task mentions util/helper/API -> shared layer (TDD)

Default to features layer if unclear.
```

**DO NOT spawn agents for this - just use pattern matching.**

---

## Step 1: Minimal Context Gathering (Single Agent, 15 seconds)

**Launch ONE haiku agent for quick context:**

### Agent 1: Quick FSD Context (haiku - Worker tier)

```
subagent_type: codebase-explorer
model: haiku
prompt: |
  FAST context scan for: "$ARGUMENTS"

  Return in 10 lines or less:
  1. FSD layer: [entities/features/widgets/shared/pages]
  2. Test location: [path]
  3. Implementation location: [path]
  4. Similar existing file: [one file path to follow as pattern]
  5. Key import: [one import statement to use]

  DO NOT analyze deeply. Return immediately with best guess.
```

---

## Step 2: Generate Lean Ralph Loop Prompt

**Generate a minimal Ralph loop that does research WITHIN iterations when blocked:**

**CRITICAL - SHELL-SAFE PROMPT GENERATION:**

Before generating the /ralph-wiggum:ralph-loop command, you MUST sanitize:

1. Replace backticks (`) with single quotes (')
2. Replace exclamation marks (!) with periods (.)
3. Replace unescaped dollar signs ($) with "dollar" or remove
4. Use "===" instead of "---" for separators

**Lean FSD Ralph Loop Structure:**

```
/ralph-wiggum:ralph-loop "
# [Task Title]

## Objective
$ARGUMENTS

## FSD Quick Context
**Layer:** [from quick scan]
**Test:** [test path]
**Implementation:** [impl path]
**Pattern file:** [similar file to follow]

## TDD Cycle (Start Immediately)

### Iteration Pattern

For EACH iteration, follow this TDD micro-cycle:

1. **RED:** Write/extend a failing test
2. **GREEN:** Write minimal code to pass
3. **REFACTOR:** Clean up if needed
4. **VALIDATE:** Run 'npm test' or relevant test command

### Just-In-Time Research Protocol

**WHEN TO RESEARCH (not before):**

Research ONLY when you hit a blocker:
- Unknown API or library usage
- Unclear pattern in codebase
- Error you cannot resolve in 1 attempt
- Security-sensitive code

**HOW TO RESEARCH (inline):**

1. **Codebase first:** Read similar files in same FSD layer
   - Grep for similar patterns
   - Read the 'pattern file' identified above
   - Check shared/lib for utilities

2. **Web search second (if codebase does not help):**
   - WebSearch: '[specific question] [framework] 2025'
   - Keep searches focused and specific

3. **Agent spawn third (if still blocked after 2 attempts):**
   - fsd-entity-manager for entities issues
   - fsd-feature-specialist for features issues
   - fsd-ui-composer for widgets/pages issues

**DO NOT research preemptively. Code first, research when blocked.**

## Phase 1: Core Implementation

**Goal:** Get the basic functionality working with tests

1. Write first test (RED)
2. Make it pass (GREEN)
3. Repeat until core feature works

**Validation per iteration:** Run tests, check TypeScript

## Phase 2: Edge Cases (if needed)

**Goal:** Handle edge cases discovered during Phase 1

Research trigger: If you encounter an edge case you did not anticipate, research how similar files handle it.

## Phase 3: Polish (if needed)

**Goal:** Clean up, add any missing tests, verify exports

## Quality Gates (Inline Validation)

After each iteration, verify:
- [ ] Tests pass
- [ ] No TypeScript errors
- [ ] Follows FSD layer rules (no importing from higher layers)

## CURRENT_TASK.md Updates

Update CURRENT_TASK.md at:
- Start of task (set to Phase: Red, Step 1)
- End of each phase (update progress)
- Task completion (clear to 'No active task.')

## Completion Criteria

- [ ] Core functionality works with tests
- [ ] Edge cases handled (if any emerged)
- [ ] No TypeScript/linting errors
- [ ] Exports in index.ts
- [ ] CURRENT_TASK.md cleared

When ALL criteria are met, output: <promise>FSD_FAST_COMPLETE</promise>

## Error Recovery (Inline)

**On test failure:**
1. Read error message
2. Check if similar test exists in codebase
3. Fix and retry (max 2 attempts before researching)

**On stuck (2+ failed attempts):**
1. Read related files in same FSD layer
2. If still stuck, spawn appropriate fsd-specialist agent
3. If architectural issue, spawn fsd-architect agent

**On circular dependency:**
Immediately spawn fsd-architect: 'Circular dependency between [A] and [B]. Which logic moves where?'
" --max-iterations 20 --completion-promise "FSD_FAST_COMPLETE"
```

---

## Step 3: Execute Immediately

**DO NOT wait for confirmation. Execute the Ralph loop immediately after generating.**

Display minimal summary:

```
===============================================================
FSD-RALPH-FAST STARTING
===============================================================
Task: $ARGUMENTS
Layer: [detected layer]
Test: [test path]
Impl: [impl path]
Pattern: [similar file]
===============================================================
Upfront research: MINIMAL (1 haiku agent, 15 sec)
In-loop research: AS NEEDED (when blocked)
Max iterations: 20
===============================================================
Starting immediately...
===============================================================
```

**IMMEDIATELY execute** - no user confirmation needed.

---

## Just-In-Time Research Reference

### Codebase Exploration (First Resort)

When blocked, explore the codebase BEFORE web searching:

```
1. Read files in same FSD layer:
   - Glob "src/[layer]/**/*.ts"
   - Find similar implementations

2. Read the pattern file identified in quick context

3. Check shared utilities:
   - src/shared/lib/ for helpers
   - src/shared/api/ for API patterns
   - src/shared/config/ for constants

4. Check entity stores if working with state:
   - src/entities/**/model/
```

### Web Research (Second Resort)

Only if codebase exploration does not help:

```
WebSearch: "[exact error]" OR "[specific API question] 2025"

Keep searches:
- Specific (not broad)
- Current (add 2025)
- Actionable (seeking code pattern, not theory)
```

### Agent Spawn (Third Resort)

Only if stuck after codebase and web research:

```
| Layer | Agent | When |
|-------|-------|------|
| entities | fsd-entity-manager | Store/model issues |
| features | fsd-feature-specialist | Hook/flow issues |
| widgets/pages | fsd-ui-composer | Composition issues |
| shared/api | fsd-integration-specialist | External API issues |
| any | fsd-architect | Layer/dependency issues |
```

---

## Core Principles

### Parallelization (CRITICAL for Speed)

When multiple independent operations are needed, execute ALL in a SINGLE message:

- Multiple file reads -> one message with multiple Read calls
- Multiple searches -> one message with multiple Grep/Glob calls
- Multiple web searches -> one message with multiple WebSearch calls

### Depth-First Strategy (DFS over BFS)

When implementing, go DEEP into one path before moving to the next:

- Complete one test case fully (RED-GREEN-REFACTOR) before starting another
- Finish one FSD layer completely before moving to the next
- Resolve one error completely before addressing others

### Architecture Principles

**FSD Architecture:** Feature-Sliced Design with strict layer boundaries.

**TDD First:** Always follow RED-GREEN-REFACTOR cycle.

**DRY & OPEN-CLOSED:**

- Check existing patterns in same FSD layer before creating new ones
- Extract common logic into shared layer
- Design for extension without modification

---

## When to Use fsd-ralph-fast vs fsd-ralph

**Use fsd-ralph-fast (this) when:**

- Task is well-defined in the prompt
- Familiar with the codebase
- Time-sensitive work
- Simple to medium complexity
- Prefer action over analysis

**Use fsd-ralph (heavy) when:**

- Unfamiliar codebase
- Complex architectural decisions
- Security-critical features
- Want comprehensive upfront analysis
- New to FSD methodology

---

## Emergency Stop

If the loop gets stuck or needs cancellation:

```
/ralph-wiggum:cancel-ralph
```

---

## Iteration Adjustment

If task is more complex than expected during execution:

1. Continue with fsd-ralph-fast (research inline as needed)
2. OR cancel and switch to /fsd-ralph for heavy upfront research

The loop will adapt by spawning specialists when genuinely blocked.
