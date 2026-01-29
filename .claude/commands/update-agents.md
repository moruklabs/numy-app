---
name: update-agents
description: Batch update Claude Code agents based on natural language instructions
---

# Update Agents Command

Update one or more Claude Code agent files using natural language instructions.

## Instructions

$ARGUMENTS

## Agent Configuration

Use the `multiple-agents-updater` agent with subagent_type to process this request.

The agent will:

1. Parse the change request from the instructions above
2. Discover matching agents in `.claude/agents/`
3. Read and analyze target agents
4. Plan the changes with before/after preview
5. Apply changes while preserving agent structure
6. Report results

## Examples

Common usage patterns:

- `/update-agents Add WebSearch tool to all research-related agents`
- `/update-agents Update the model from sonnet to opus for fsd-architect`
- `/update-agents Add a new invocation scenario to the fsd-coder agent`
- `/update-agents Remove deprecated Bash tool from all tier-2 agents`
- `/update-agents Add parallel execution strategy section to all FSD agents`

## Core Principles

### Parallelization (CRITICAL for Speed)

When updating multiple agents, execute ALL operations in parallel:

- Multiple agent reads -> ONE message with multiple Read calls
- Multiple agent writes -> ONE message with multiple Edit calls

### Depth-First Strategy (DFS over BFS)

When planning updates, go DEEP into each agent before moving to the next:

- Complete analysis of one agent fully before analyzing another
- Finish all changes for one agent before moving to the next

### Architecture Principles

**FSD over DDD:** Ensure agents follow Feature-Sliced Design patterns.

**DRY & OPEN-CLOSED:**

- Check existing agents for patterns to reuse
- Design updates for extension without breaking existing functionality
