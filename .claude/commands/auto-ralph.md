---
description: "Generate optimized Ralph loop prompt with comprehensive upfront research and code exploration"
argument-hint: "<task-description>"
---

# Auto-Ralph: Deep Research + Code Exploration

You are orchestrating a Ralph Wiggum loop for the following task with **comprehensive upfront research and code exploration**:

**Task:** $ARGUMENTS

## Philosophy: Thorough Upfront Research + Iterative Refinement

**Approach:** Deep research upfront → Comprehensive code exploration → Generate informed prompt → Execute with full context

This approach:

- Builds complete understanding before coding starts
- Discovers edge cases, patterns, and pitfalls early
- Generates highly-informed Ralph loop prompts
- Reduces mid-loop research interruptions
- Front-loads the hard thinking, enabling smoother execution

---

## Step 1: Deep Research Phase (Comprehensive)

**Launch these agents in PARALLEL for thorough upfront research:**

### Agent 1: Deep Researcher (opus - Tier-0 Orchestrator)

```
subagent_type: deep-researcher
model: sonnet
prompt: |
  Conduct comprehensive research for this task: "$ARGUMENTS"

  Research dimensions:
  1. **Best Practices**: Current (2025) industry best practices for this type of task
  2. **Technology Options**: Libraries, frameworks, or approaches commonly used
  3. **Pitfalls & Edge Cases**: Common mistakes, gotchas, and edge cases to handle
  4. **Security Considerations**: Any security implications or requirements
  5. **Performance Patterns**: Performance-optimized approaches if relevant

  For each dimension, provide:
  - Key findings with sources (prefer 2025 sources)
  - Specific recommendations for this task
  - Code patterns or examples where applicable

  Return a structured research report that can inform implementation decisions.
```

### Agent 2: Architecture Advisor (opus - Tier-0 Expert)

```
subagent_type: architecture-advisor
model: sonnet
prompt: |
  Provide architectural guidance for this task: "$ARGUMENTS"

  Analyze and recommend:
  1. **Design Patterns**: Which patterns fit this task (FSD, Clean Architecture, etc.)
  2. **Component Structure**: How to organize the code (files, modules, layers)
  3. **Interface Design**: Key interfaces, types, and contracts needed
  4. **Dependency Management**: How to structure dependencies for testability
  5. **SOLID Compliance**: How to ensure SOLID principles are followed

  Consider:
  - Existing codebase patterns (if available)
  - Testability from the start (TDD approach)
  - Maintainability and extensibility

  Return concrete architectural recommendations with rationale.
```

### Agent 3: Task Complexity Assessment (sonnet - Tier-1)

```
subagent_type: Explore
model: haiku
prompt: |
  Detailed complexity assessment for: "$ARGUMENTS"

  Analyze thoroughly:
  1. **Complexity Level**: simple/medium/complex/very complex (with justification)
  2. **Estimated Phases**: Break down into logical phases (1-5)
  3. **Dependencies**: External dependencies, APIs, or integrations needed
  4. **Risk Areas**: Parts likely to be challenging or error-prone
  5. **Testing Strategy**: Types of tests needed (unit, integration, e2e)
  6. **Recommended max-iterations**: (simple:10, medium:20, complex:35, very-complex:50)

  IMPORTANT: max-iterations MUST be > 0 for safety. Never recommend 0 (infinite loops).

  Return a detailed complexity analysis to inform planning.
```

---

## Step 2: Code Exploration Phase (Detailed Codebase Analysis)

**After research completes, launch comprehensive code exploration:**

### Agent 4: Codebase Explorer - Deep Scan (sonnet - Tier-1)

```
subagent_type: codebase-explorer
model: haiku
prompt: |
  Conduct THOROUGH codebase exploration for this task: "$ARGUMENTS"

  Explore and document:

  1. **Project Structure**
     - Directory layout and organization
     - Key entry points and main files
     - Configuration files and their purposes

  2. **Related Code Analysis**
     - Files that will be modified or extended
     - Similar existing implementations to follow as patterns
     - Shared utilities, helpers, or services to reuse

  3. **Type System & Interfaces**
     - Relevant types, interfaces, and schemas
     - Domain models and data structures
     - API contracts (if applicable)

  4. **Testing Patterns**
     - Existing test structure and conventions
     - Test utilities and mocks available
     - Coverage expectations

  5. **Dependencies & Imports**
     - Libraries already available in the project
     - Import patterns and module resolution
     - Version constraints to be aware of

  Return a comprehensive codebase analysis document.
```

### Agent 5: Pattern Extraction (sonnet - Tier-1) - Run in parallel with Agent 4

```
subagent_type: Explore
model: haiku
prompt: |
  Extract coding patterns and conventions from the codebase for: "$ARGUMENTS"

  Identify:

  1. **Naming Conventions**
     - File naming patterns
     - Variable/function/class naming
     - Constants and enum patterns

  2. **Code Style**
     - Import ordering
     - Export patterns
     - Error handling patterns
     - Async/await usage

  3. **Architecture Patterns**
     - How similar features are structured
     - Service/repository patterns used
     - State management approach

  4. **Documentation Patterns**
     - Comment styles
     - JSDoc/TSDoc conventions
     - README patterns

  Return extracted patterns that the implementation should follow.
```

### Optional: CLI Tool Research (if task requires external knowledge)

For tasks requiring large context analysis or deep reasoning:

```bash
# For entire codebase context (1M tokens):
/gemini "@src/ @lib/ Analyze the complete codebase architecture for: $ARGUMENTS"

# For deep architectural reasoning:
/codex "Analyze the optimal implementation approach for: $ARGUMENTS"
```

---

## Step 3: Generate Informed Ralph Loop Prompt

Using the **comprehensive research and code exploration findings**, generate a highly-informed Ralph loop prompt.

**CRITICAL - SHELL-SAFE PROMPT GENERATION:**

Before generating the /ralph-wiggum:ralph-loop command, you MUST sanitize the entire prompt:

1. **Character Replacement Rules:**
   - Replace backticks (`) with single quotes (')
   - Replace exclamation marks (!) with periods (.)
   - Replace unescaped dollar signs ($) with the word "dollar" or remove them
   - Use "===" or "###" instead of "---" for visual separators
   - Use asterisks (**bold**) or CAPS instead of emphasis with special chars

2. **Safe Formatting:**
   - Use plain text wherever possible
   - Use equals signs (===) for section dividers
   - Use asterisks (\*\*) for emphasis
   - Use hyphens only in lists, not as separators

3. **Verification Before Execution:**
   - Scan the final prompt string for: ` ! $ (except in flags)
   - If found, replace with safe alternatives
   - Double-check that command will execute in bash without expansion

**Example of unsafe → safe conversions:**

- "Test it!" → "Test it."
- "Run `npm install`" → "Run 'npm install'"
- "Set $PORT" → "Set the PORT variable"
- "Done!" → "Done."

**Example prompt structure (NOTE: this is a template - populate with actual research findings):**

/ralph-wiggum:ralph-loop "

# [Task Title]

## Objective

$ARGUMENTS

## Research Summary (Pre-Analyzed)

### Best Practices Discovered

[From deep-researcher: key best practices, patterns, and recommendations]

### Architecture Design

[From architecture-advisor: component structure, design patterns, interfaces]

### Codebase Context

[From codebase-explorer: relevant files, existing patterns, dependencies]

### Risk Areas and Mitigations

[From complexity assessment: identified risks and how to handle them]

## Implementation Plan (Research-Informed)

### Phase 1: [First Phase Name]

**Goal:** [Specific deliverable]
**Approach:** [Based on architecture-advisor recommendations]
**Files to modify/create:** [From codebase exploration]
**Patterns to follow:** [From pattern extraction]
**Tests:** [From testing strategy]
**Done when:** [Testable criteria]

### Phase 2: [Second Phase Name]

**Goal:** [Building on Phase 1]
**Approach:** [Informed by research findings]
**Integration points:** [Identified from codebase exploration]
**Done when:** [Testable criteria]

[Continue phases as needed based on complexity assessment...]

## Pre-Researched Knowledge Base

### Libraries and APIs

[From research: specific APIs, methods, patterns to use]

### Security Considerations

[From research: security patterns to implement]

### Performance Patterns

[From research: optimization approaches if relevant]

### Edge Cases to Handle

[From research: discovered edge cases and how to address them]

## Quality Gates (Per Phase)

Before moving to next phase:

- [ ] Unit tests written and passing (TDD)
- [ ] Follows extracted patterns from codebase
- [ ] Adheres to architecture recommendations
- [ ] No TypeScript/linting errors

## Completion Criteria

- [ ] All phases complete
- [ ] Full test coverage (unit + integration)
- [ ] No TypeScript/linting errors
- [ ] Documentation updated if needed
- [ ] [Task-specific criteria from research]

When ALL criteria are met, output: <promise>[PROMISE]</promise>

## Error Handling: Research and Explore on Failure

**IMPORTANT:** When you encounter errors, unexpected behavior, or blockers during execution, you MUST research and explore to resolve them. Do NOT blindly retry.

### On Any Error or Blocker:

1. **Explore the codebase** to understand the error context:
   - Read the failing file and surrounding code
   - Check related files, imports, and dependencies
   - Look for similar working implementations

2. **Research the specific issue:**
   - WebSearch: '[error message] [framework] 2025'
   - WebFetch: relevant documentation pages
   - Check if the error relates to a pattern discovered in upfront research

3. **For persistent blockers**, spawn targeted agents:
   - codebase-explorer: 'Find all usages of [failing component] and how they handle [issue]'
   - deep-researcher: 'Research [specific error/pattern] best practices 2025'
   - architecture-advisor: 'Review approach for [problem area]'
   - /gemini: Large context codebase analysis
   - /codex: Complex reasoning about the issue

4. **Document findings** before attempting fix:
   - What caused the error
   - What the research revealed
   - How the fix aligns with codebase patterns
     " --max-iterations [N from complexity assessment] --completion-promise "[PROMISE]"

```

---

## Step 4: Display Research Summary and Execute

Display the comprehensive research findings and generated prompt:

```

═══════════════════════════════════════════════════════════
DEEP RESEARCH COMPLETE
═══════════════════════════════════════════════════════════

📚 RESEARCH FINDINGS SUMMARY
═══════════════════════════════════════════════════════════

**Best Practices Discovered:**
[Key findings from deep-researcher]

**Architecture Recommendations:**
[Key recommendations from architecture-advisor]

**Complexity Assessment:**
[Level] → [N] max iterations
Risk areas: [identified risks]
Testing strategy: [approach]

═══════════════════════════════════════════════════════════

🔍 CODEBASE EXPLORATION RESULTS
═══════════════════════════════════════════════════════════

**Project Structure:**

- Tech stack: [summary]
- Key files to modify: [list]
- Related code: [existing implementations]

**Patterns to Follow:**

- Naming: [conventions]
- Architecture: [patterns]
- Testing: [conventions]

═══════════════════════════════════════════════════════════

🚀 GENERATED RALPH LOOP (Research-Informed)
═══════════════════════════════════════════════════════════

[Show the complete generated prompt with all research integrated]

═══════════════════════════════════════════════════════════
Total Research Time: [estimate based on agent count]
Upfront research: COMPREHENSIVE (5 agents)
In-loop research: MINIMAL (fallback only)
═══════════════════════════════════════════════════════════

```

**IMMEDIATELY execute** - no user confirmation needed.

**EMERGENCY STOP:** If the loop gets stuck or needs to be cancelled:
```

/ralph-wiggum:cancel-ralph

```
This will terminate the loop immediately from any directory.

---

## Error-Driven Research Escalation

When errors occur during the loop, **always investigate before retrying**. Escalate progressively:

### Level 1: Immediate Codebase Exploration
```

1. Read the file where error occurred
2. Read related/imported files
3. Search for similar patterns: Grep "[pattern]" in codebase
4. Find working examples: Glob "\**/*similar\*"

```
**Use for:** Understanding context, finding existing patterns to follow

### Level 2: Quick Web Search
```

WebSearch: "[exact error message] [framework] [version] 2025"
WebSearch: "[what you're trying to do] [tech stack] best practice 2025"

```
**Use for:** Error messages, API questions, syntax issues, deprecation warnings

### Level 3: Documentation Fetch
```

WebFetch: [official documentation URL for the failing API/library]
WebFetch: [migration guide if version-related]

```
**Use for:** Library docs, framework guides, API references, changelogs

### Level 4: Targeted Agent for Deep Analysis
```

Task tool with subagent_type: codebase-explorer
prompt: "Find how [pattern/component] is used throughout the codebase and identify the correct approach"

Task tool with subagent_type: deep-researcher
prompt: "Research: [specific error/pattern]. Find root cause and solution."

Task tool with subagent_type: architecture-advisor
prompt: "Review: Is [current approach] correct? What's the proper pattern?"

```
**Use for:** Complex errors, architectural misalignment, unfamiliar patterns

### Level 5: CLI Tools for Large-Scale Analysis
```

/gemini "@src/ @lib/ Why is [error] occurring? Find all related code and explain the issue."
/codex "Analyze this error: [error]. Given the codebase structure, what's the correct fix?"

```
**Use for:** Errors requiring full codebase context, complex debugging

---

## Available Agents for In-Loop Research

These agents can be spawned **during iterations** when specific research is needed:

| Agent | When to Spawn | Research Focus |
|-------|---------------|----------------|
| `deep-researcher` | Best practices needed | Current patterns, approaches |
| `architecture-advisor` | Architecture decision | FSD, clean architecture |
| `critical-architect` | Need critique | Validate approach |
| `cli-docs-explorer` | CLI integration | Command documentation |
| `cloudflare-*` | Cloudflare services | Service-specific patterns |
| `expo-*` | Expo/RN issues | Platform-specific solutions |

**Key principle:** Spawn only when blocked, not preemptively.

---

## Example: Deep Research in Action

**Task:** "Add JWT authentication"

### Upfront Research Phase (3-5 minutes)

**deep-researcher findings:**
- Use RS256 over HS256 for production
- Implement refresh token rotation
- Store tokens in httpOnly cookies, not localStorage
- Consider PKCE for public clients

**architecture-advisor recommendations:**
- Create AuthService in domain layer
- AuthMiddleware in infrastructure
- TokenRepository interface for testability
- Follow existing error handling patterns

**codebase-explorer findings:**
- Existing middleware in `src/middleware/`
- User model in `src/models/User.ts`
- Config pattern: `src/config/*.ts`
- Test pattern: `__tests__/` with jest

### Loop Execution (informed by research)

**Iteration 1:** Create AuthService with RS256 (from research) → Works
**Iteration 2:** Create AuthMiddleware following existing patterns → Works
**Iteration 3:** Implement refresh token rotation (pattern known upfront) → Works
**Iteration 4:** Add httpOnly cookie storage (security practice pre-researched) → Works
**Iteration 5-6:** Write tests following discovered patterns → Complete

**Result:** Zero mid-loop research interruptions. All best practices applied from the start.

### Error Handling Example (if iteration fails)

**Iteration 3:** Implement refresh token rotation → ERROR: "Cannot read property 'sign' of undefined"

**Error Response (DO NOT blindly retry):**

1. **Explore codebase:**
   - Read `src/services/AuthService.ts` (where error occurred)
   - Read `src/config/jwt.ts` (imported dependency)
   - Grep "jwt.sign" to find working examples
   - Found: Other services import jwt differently

2. **Research:**
   - WebSearch: "jsonwebtoken sign undefined node 2025"
   - Found: Need to import as `import * as jwt from 'jsonwebtoken'`

3. **Apply fix with understanding:**
   - Updated import to match codebase pattern
   - Verified against working examples found in step 1

**Iteration 3 (retry):** Refresh token rotation → Works

**Key:** The error led to codebase exploration, which revealed the correct import pattern.

---

## Parallelization Rules (CRITICAL for Speed)

**ALL independent operations MUST be parallelized. This is a fundamental performance optimization.**

1. **Step 1 (Deep Research):** 3 agents in parallel (deep-researcher, architecture-advisor, complexity assessment) - launch ALL in ONE message
2. **Step 2 (Code Exploration):** 2 agents in parallel (codebase-explorer, pattern extraction) - launch ALL in ONE message
3. **Optional CLI tools:** Can run in parallel with Step 2 if needed
4. **During loop:** Minimal research - only for unexpected blockers
5. **Fallback escalation:** One targeted agent at a time

**Example of parallel agent launch (DO THIS):**
```

Task 1: deep-researcher for best practices
Task 2: architecture-advisor for design
Task 3: complexity assessment for estimation

```
All three in a SINGLE message - NOT sequential messages.

## Depth-First Strategy (DFS over BFS)

When exploring or implementing, go DEEP into one path before moving to the next:
- Complete one research dimension fully before starting another
- Finish one implementation phase before starting the next
- Resolve one blocker completely before addressing others

## Architecture Principles

**FSD over DDD:** Prefer Feature-Sliced Design architecture. Organize by features/layers, not domains.

**TDD First:** Always write tests before implementation:
1. RED: Write failing test
2. GREEN: Minimal code to pass
3. REFACTOR: Clean up

**DRY & OPEN-CLOSED:**
- Extract common patterns into shared utilities
- Design for extension without modification
- Reuse existing codebase patterns before creating new ones

---

## Advantages of Deep Upfront Research

| Aspect | This Approach (Deep Upfront) | Iterative-Only Approach |
|--------|------------------------------|-------------------------|
| Startup time | 3-5 minutes | 30 seconds |
| Research scope | Comprehensive, thorough | Narrow, reactive |
| Initial understanding | Deep | Surface-level |
| Mid-loop interruptions | Minimal (fallback only) | Frequent |
| Loop prompt quality | Highly informed | Basic context |
| Risk discovery | Early (before coding) | Late (during coding) |
| Architecture alignment | Pre-validated | Discovered iteratively |
| Agent cost | Higher upfront ($$$) | Lower initial, variable mid-loop |
| Best for | Complex tasks, unfamiliar codebases | Simple tasks, familiar codebases |

## When to Use This Approach

**Use deep upfront research when:**
- Task is complex or multi-phase
- Working in an unfamiliar codebase
- Architecture decisions need to be made
- Security or performance is critical
- You want minimal mid-loop surprises

**Consider lighter approach when:**
- Simple, straightforward task
- Very familiar with the codebase
- Time-sensitive quick fix
- Exploratory prototyping
```
