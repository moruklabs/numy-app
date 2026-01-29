---
description: "Create an agentic execution plan for complex tasks using the agentic-task-planner agent"
---

# Agentic Task Planning

You are launching the **agentic-task-planner** agent (Orchestrator tier, opus) to create a comprehensive execution plan.

## User's Task Request

$ARGUMENTS

## Instructions

Use the Task tool to invoke the `agentic-task-planner` agent with the following prompt:

```
Create a comprehensive agentic execution plan for the following task:

$ARGUMENTS

Follow your complete planning workflow:
1. Parse and understand the task (ask clarifying questions only if truly ambiguous)
2. Explore the codebase for context (structure, patterns, conventions, existing code)
3. Discover available agents and commands in ~/.claude/agents/ and ~/.claude/commands/
4. Conduct research if the task involves unfamiliar technologies
5. Design an optimized multi-phase execution plan with:
   - Appropriate agent assignments
   - Cost-optimized model selection (haiku/sonnet/opus)
   - Parallelization opportunities
   - Risk analysis and mitigations
6. Write the complete plan to AGENTIC_PLAN.md
7. Present a concise summary with next steps

Important guidelines:
- If the task is brief (like "add auth"), explore first then ask targeted questions
- If the task is detailed, proceed without unnecessary questions
- Match agents to tasks based on their specializations
- Optimize for cost by using haiku for simple tasks, sonnet for standard work, opus for critical decisions
- Identify tasks that can run in parallel
- Include measurable success criteria
```

After the agent completes, summarize:

1. The plan location (AGENTIC_PLAN.md)
2. Key phases identified
3. Agents that will be leveraged
4. Any decisions requiring user input
5. How to proceed with execution

## Core Principles

### Parallelization (CRITICAL for Speed)

When planning, gather ALL context in parallel:

- Multiple file reads -> ONE message with multiple Read calls
- Multiple agent discoveries -> ONE message with multiple Glob/Grep calls
- Multiple research queries -> ONE message with multiple WebSearch calls

### Depth-First Strategy (DFS over BFS)

When creating the plan, go DEEP into each phase before moving to the next:

- Complete one phase's full specification before starting another
- Resolve all dependencies for one phase before designing the next

### Architecture Principles

**FSD over DDD:** Structure the plan following Feature-Sliced Design layers.

**TDD First:** Each implementation phase should include:

1. RED: Define failing tests
2. GREEN: Implementation steps
3. REFACTOR: Cleanup tasks

**DRY & OPEN-CLOSED:**

- Identify reusable components across phases
- Plan for extension without modification
- Leverage existing agents and patterns
