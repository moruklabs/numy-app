---
description: "Generate optimized Ralph loop prompt with minimal upfront research, just-in-time exploration as needed"
argument-hint: "<task-description>"
---

# Auto-Ralph-Fast: Minimal Upfront, Just-in-Time Research

You are orchestrating a Ralph Wiggum loop for the following task with **minimal upfront overhead and just-in-time research**:

**Task:** $ARGUMENTS

## Philosophy: Start Fast, Research When Blocked

**Approach:** Quick Context Scan -> Start Coding -> Research/Explore When Needed

This approach:

- Starts implementation within 30 seconds (vs 3-5 minutes for auto-ralph)
- Trusts the developer to provide sufficient context in the task description
- Does validation and exploration **within iterations** when blocked
- Front-loads action, not research
- Best for familiar codebases, well-defined tasks, or time-sensitive work

**Comparison:**

| Aspect          | auto-ralph (heavy)  | auto-ralph-fast (this)   |
| --------------- | ------------------- | ------------------------ |
| Startup time    | 3-5 minutes         | 30 seconds               |
| Upfront agents  | 5 parallel agents   | 1 quick agent            |
| Research timing | Before coding       | During iterations        |
| Best for        | Unfamiliar, complex | Familiar, defined        |
| Agent cost      | Higher upfront      | Lower upfront, on-demand |

---

## Step 0: Quick Context Scan (30 seconds max)

**MANDATORY but FAST - just scan, do not analyze deeply:**

**Launch ONE haiku agent for quick context:**

### Agent 1: Quick Context (haiku - Worker tier)

```
subagent_type: codebase-explorer
model: haiku
prompt: |
  FAST context scan for: "$ARGUMENTS"

  Return in 10 lines or less:
  1. Project type: [e.g., Node.js, Python, React Native]
  2. Tech stack: [key frameworks/libraries]
  3. Test location: [path]
  4. Implementation location: [path]
  5. Similar existing file: [one file path to follow as pattern]
  6. Key import: [one import statement to use]

  DO NOT analyze deeply. Return immediately with best guess.
```

---

## Step 1: Generate Lean Ralph Loop Prompt

**Generate a minimal Ralph loop that does research WITHIN iterations when blocked:**

**CRITICAL - SHELL-SAFE PROMPT GENERATION:**

Before generating the /ralph-wiggum:ralph-loop command, you MUST sanitize:

1. Replace backticks (`) with single quotes (')
2. Replace exclamation marks (!) with periods (.)
3. Replace unescaped dollar signs ($) with "dollar" or remove
4. Use "===" instead of "---" for separators

**Lean Ralph Loop Structure:**

```
/ralph-wiggum:ralph-loop "
# [Task Title]

## Objective
$ARGUMENTS

## Quick Context
**Project:** [from quick scan]
**Tech Stack:** [from quick scan]
**Test:** [test path]
**Implementation:** [impl path]
**Pattern file:** [similar file to follow]

## TDD Cycle (Start Immediately)

### Iteration Pattern

For EACH iteration, follow this TDD micro-cycle:

1. **RED:** Write/extend a failing test
2. **GREEN:** Write minimal code to pass
3. **REFACTOR:** Clean up if needed
4. **VALIDATE:** Run tests and type-check

### Just-In-Time Research Protocol

**WHEN TO RESEARCH (not before):**

Research ONLY when you hit a blocker:
- Unknown API or library usage
- Unclear pattern in codebase
- Error you cannot resolve in 1 attempt
- Security-sensitive code

**HOW TO RESEARCH (inline):**

**Level 1 - Codebase first (immediate):**
- Read similar files in the project
- Grep for similar patterns
- Read the 'pattern file' identified above
- Check shared/lib directories for utilities

**Level 2 - Web search second (if codebase does not help):**
- WebSearch: '[specific question] [framework] 2025'
- Keep searches focused and specific

**Level 3 - Agent spawn third (if still blocked after 2 attempts):**
- codebase-explorer for finding patterns
- deep-researcher for best practices
- architecture-advisor for design decisions

**Level 4 - Critical review (if architectural uncertainty):**
- critical-architect for validating approach

**Level 5 - CLI tools (if still blocked):**
- /gemini '@src/ @lib/ [question about large codebase]'
- /codex '[complex reasoning question]'

**DO NOT research preemptively. Code first, research when blocked.**

## Phase 1: Core Implementation

**Goal:** Get the basic functionality working with tests

1. Write first test (RED)
2. Make it pass (GREEN)
3. Repeat until core feature works

**Validation per iteration:** Run tests, check TypeScript/linting

## Phase 2: Edge Cases (if needed)

**Goal:** Handle edge cases discovered during Phase 1

Research trigger: If you encounter an edge case you did not anticipate, research how similar files handle it.

## Phase 3: Polish (if needed)

**Goal:** Clean up, add any missing tests, verify exports

## Quality Gates (Inline Validation)

After each iteration, verify:
- [ ] Tests pass
- [ ] No TypeScript/linting errors
- [ ] Follows existing codebase patterns

## Completion Criteria

- [ ] Core functionality works with tests
- [ ] Edge cases handled (if any emerged)
- [ ] No TypeScript/linting errors
- [ ] Exports configured properly
- [ ] Documentation updated if needed

When ALL criteria are met, output: <promise>AUTO_RALPH_FAST_COMPLETE</promise>

## Error Recovery (Inline)

**On test failure:**
1. Read error message
2. Check if similar test exists in codebase
3. Fix and retry (max 2 attempts before researching)

**On stuck (2+ failed attempts):**
1. Read related files in codebase (Level 1)
2. WebSearch for specific error (Level 2)
3. Spawn appropriate agent (Level 3)
4. Use CLI tools if still blocked (Level 5)

**On architectural uncertainty:**
Spawn critical-architect: 'Is this approach correct? [describe concern]'
" --max-iterations 20 --completion-promise "AUTO_RALPH_FAST_COMPLETE"
```

---

## Step 2: Execute Immediately

**DO NOT wait for confirmation. Execute the Ralph loop immediately after generating.**

Display minimal summary:

```
===============================================================
AUTO-RALPH-FAST STARTING
===============================================================
Task: $ARGUMENTS
Project: [detected project type]
Tech Stack: [detected stack]
Test: [test path]
Impl: [impl path]
Pattern: [similar file]
===============================================================
Upfront research: MINIMAL (1 haiku agent, 30 sec)
In-loop research: AS NEEDED (when blocked)
Max iterations: 20
===============================================================
Starting immediately...
===============================================================
```

**IMMEDIATELY execute** - no user confirmation needed.

---

## Just-In-Time Research Reference

### Level 1: Codebase Exploration (First Resort)

When blocked, explore the codebase BEFORE web searching:

```
1. Read files with similar functionality:
   - Glob "src/**/*.ts" for TypeScript projects
   - Find similar implementations

2. Read the pattern file identified in quick context

3. Check shared utilities:
   - src/shared/, src/lib/, src/utils/ for helpers
   - src/api/, src/services/ for API patterns
   - src/config/ for constants

4. Check existing tests for patterns:
   - tests/, __tests__/, *.test.ts, *.spec.ts
```

### Level 2: Web Research (Second Resort)

Only if codebase exploration does not help:

```
WebSearch: "[exact error]" OR "[specific API question] 2025"

Keep searches:
- Specific (not broad)
- Current (add 2025)
- Actionable (seeking code pattern, not theory)
```

### Level 3: Agent Spawn (Third Resort)

Only if stuck after codebase and web research:

```
| Issue Type | Agent | When |
|-----------|-------|------|
| Finding patterns | codebase-explorer | Lost in codebase |
| Best practices | deep-researcher | Unknown approach |
| Architecture | architecture-advisor | Design decisions |
| Validation | critical-architect | Questioning approach |
```

### Level 4: CLI Tools (Final Resort)

For large codebases or complex debugging:

```
/gemini "@src/ @lib/ Why is [error] occurring? Find all related code and explain."
/codex "Analyze this error: [error]. Given the codebase structure, what is the correct fix?"
```

| CLI     | Use Case                                          |
| ------- | ------------------------------------------------- |
| /gemini | Large codebase context (1M tokens), Google Search |
| /codex  | Deep reasoning, complex debugging                 |

---

## Core Principles

### Parallelization (CRITICAL for Speed)

When multiple independent operations are needed, execute ALL in a SINGLE message:

- Multiple file reads -> one message with multiple Read calls
- Multiple searches -> one message with multiple Grep/Glob calls
- Multiple web searches -> one message with multiple WebSearch calls

### Depth-First Strategy (DFS over BFS)

When exploring or implementing, go DEEP into one path before moving to the next:

- Complete one feature fully before starting another
- Resolve one error completely before addressing others
- Finish one test case before writing the next

### Architecture Principles

**FSD over DDD:** Prefer Feature-Sliced Design. Organize by features/layers, not domains.

**TDD First:** Always write tests before implementation (RED-GREEN-REFACTOR).

**DRY & OPEN-CLOSED:**

- Check for existing patterns before creating new ones
- Extract common logic into shared utilities
- Design for extension without modification

---

## When to Use auto-ralph-fast vs auto-ralph

**Use auto-ralph-fast (this) when:**

- Task is well-defined in the prompt
- Familiar with the codebase
- Time-sensitive work
- Simple to medium complexity
- Prefer action over analysis

**Use auto-ralph (heavy) when:**

- Unfamiliar codebase
- Complex architectural decisions
- Security-critical features
- Want comprehensive upfront analysis
- Need thorough research before coding

---

## Emergency Stop

If the loop gets stuck or needs cancellation:

```
/ralph-wiggum:cancel-ralph
```

---

## Iteration Adjustment

If task is more complex than expected during execution:

1. Continue with auto-ralph-fast (research inline as needed)
2. OR cancel and switch to /auto-ralph for heavy upfront research

The loop will adapt by spawning specialists when genuinely blocked.
