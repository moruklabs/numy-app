---
description: "Create a new FSD agent with full ecosystem integration"
argument-hint: "<agent-name or description>"
---

# Create FSD Agent

You are creating a new FSD (Feature-Sliced Design) agent. Use the FSD Agent Creator
to ensure proper integration with the FSD ecosystem.

**Input:** $ARGUMENTS

## Invocation

Use the Task tool with `subagent_type="fsd-agent-creator"`:

```
Task(
  subagent_type: "fsd-agent-creator",
  prompt: "
    Create a new FSD agent based on this request: $ARGUMENTS

    Follow the complete workflow:
    1. Gather requirements (name, layer focus, purpose, tier, tools)
    2. Validate design against existing agents
    3. Generate the agent file
    4. Update routing tables (auto-fsd.md)
    5. Validate integration
    6. Report summary with test invocation

    If the input is vague, ask clarifying questions before proceeding.
  "
)
```

## Quick Examples

```bash
# Create a performance optimization agent
/create-fsd-agent performance optimizer for memoization and lazy loading

# Create a notification handler
/create-fsd-agent notification specialist for push and in-app notifications

# Create with explicit definition
/create-fsd-agent Name: fsd-animation-specialist, Layer Focus: features widgets, Purpose: Handle animations and transitions
```

## What Gets Created/Updated

1. **Agent File**: `~/.claude/agents/fsd/fsd-{name}.md`
2. **Routing Table**: `~/.claude/agents/fsd/auto-fsd.md` (Agent Invocation Reference)
3. **Optional**: Commands, CLAUDE.md if significant

## Core Principles

### Parallelization (CRITICAL for Speed)

When creating the agent, execute independent operations in parallel:

- Multiple existing agent reads for patterns -> ONE message
- Routing table updates + agent creation -> ONE message if independent

### Depth-First Strategy (DFS over BFS)

When designing the agent, go DEEP into each aspect before moving to the next:

- Complete the agent's purpose definition fully before layer focus
- Finish all trigger scenarios before designing the system prompt

### Architecture Principles

**FSD Architecture:** Agent must focus on specific FSD layers.

**TDD First:** Include test invocation in output.

**DRY & OPEN-CLOSED:**

- Check existing FSD agents for patterns to reuse
- Design agent for extension with new FSD patterns

## Output

After creation, you'll receive:

- Full path to the new agent file
- List of updated files
- Test invocation command
