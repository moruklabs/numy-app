# Create Agent Command

Use the Task tool with `subagent_type="meta-agent"` to create a new Claude Code agent based on the requirements below.

## Invocation Context

This command supports two modes:

### Interactive Mode (Human invocation with no arguments)

If `$ARGUMENTS` is empty or contains only whitespace, the meta-agent should use its full interactive workflow with AskUserQuestion to gather requirements through discovery questions.

### Non-Interactive Mode (Agent or Human with arguments)

If `$ARGUMENTS` contains a description or specification, the meta-agent should:

1. Parse the provided requirements autonomously
2. Use ultrathink to design the optimal agent architecture
3. Only ask clarifying questions if there are critical ambiguities that would significantly impact the agent's design
4. Generate the agent file with sensible defaults for any unspecified options

## Requirements

$ARGUMENTS

## Output Location

Save generated agents to: `.claude/agents/` (project-specific, version controlled)

If the `.claude/agents/` directory doesn't exist in the current project, create it.

**Tier-Based Organization** (for global agents at `~/.claude/agents/`):
Each domain folder contains three tiers:

- `<domain>/tier-0/` - Opus-level agents that coordinate other agents
- `<domain>/tier-1/` - Sonnet-level domain experts
- `<domain>/tier-2/` - Haiku-level fast, simple task agents

Domain folders: orchestrators, cloudflare, expo, firebase, gcloud, github, meta, mobile-app-recreation, rebrand, sentry, general

## Execution Instructions

1. Determine the invocation mode based on whether `$ARGUMENTS` is provided
2. In non-interactive mode:
   - Extract agent purpose, scope, and any specified tools/model from the arguments
   - Determine appropriate tier based on complexity:
     - Tier 0 (opus): Multi-agent coordination, architecture decisions → `<domain>/tier-0/`
     - Tier 1 (sonnet): Domain implementations, analysis (default) → `<domain>/tier-1/`
     - Tier 2 (haiku): File scanning, simple lookups → `<domain>/tier-2/`
   - Apply sensible defaults: appropriate model for tier, tool subset, project-scoped
   - Use ultrathink to refine the agent design
   - Generate and save the agent file
   - Provide a brief summary of what was created
3. In interactive mode:
   - Follow the full Phase 1-6 discovery workflow from the meta-agent
   - Use AskUserQuestion strategically at each phase
4. Always verify the generated agent follows best practices:
   - Single responsibility
   - Clear invocation triggers with examples
   - Appropriate tool access (minimal necessary)
   - Right-sized model selection
   - Quality assurance checklist

## Core Principles

### Parallelization (CRITICAL for Speed)

When researching existing agents, execute ALL searches in parallel:

- Multiple agent file reads -> ONE message with multiple Read calls
- Multiple pattern searches -> ONE message with multiple Grep/Glob calls

### Depth-First Strategy (DFS over BFS)

When designing the agent, go DEEP into each aspect before moving to the next:

- Complete the agent's purpose definition fully before moving to triggers
- Finish all trigger scenarios before designing the system prompt

### Architecture Principles

**FSD over DDD:** Structure agents following Feature-Sliced Design patterns.

**DRY & OPEN-CLOSED:**

- Check existing agents for patterns to reuse
- Design agents for extension without modification
- Extract common patterns into shared agent templates
