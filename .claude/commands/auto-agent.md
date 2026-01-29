---
description: "Use Ralph Wiggum loop to iteratively discover requirements and create a Claude Code agent in the current project"
argument-hint: "[agent-description]"
---

# Auto-Agent: Ralph Loop Agent Creator

You are orchestrating the creation of a Claude Code agent using an iterative Ralph Wiggum loop for discovery and refinement. The agent will be saved to the **current project's** `.claude/agents/` folder.

**Agent Requirements:** $ARGUMENTS

## Required Agent Frontmatter Format

All created agents MUST include this valid YAML frontmatter structure:

```yaml
---
name: agent-name-in-kebab-case
description: Use this agent when... (clear invocation triggers with examples)

  Examples:

  <example>
  Context: Describe the scenario
  user: "Example user request"
  assistant: "I'll use the agent-name agent to..."
  <Task tool invocation>
  </example>
model: haiku  # Options: haiku, sonnet, opus
tools: Read,Write,Edit,Grep,Glob  # Comma-separated, no spaces
---
```

## Workflow

### Step 1: Invoke the Ralph Prompt Architect

Use the Task tool to launch the `ralph-prompt-architect` agent (Orchestrator tier, opus) with the following prompt:

```
The user wants to create a new Claude Code agent using an iterative Ralph Wiggum loop.

Agent requirements provided: $ARGUMENTS

Your task is to generate an optimized Ralph loop prompt specifically for agent creation. The loop should:

1. **Discovery Phase**: Explore the codebase to understand:
   - Existing agents in `.claude/agents/` (both project and ~/.claude/agents/) for patterns
   - Project structure and common workflows
   - What tools and capabilities would benefit this agent

2. **Requirements Gathering**: If requirements are vague or missing, the prompt should guide Claude to:
   - Ask clarifying questions about the agent's purpose
   - Identify specific use cases and triggers (with 2-3 examples)
   - Determine appropriate tool access and model selection

3. **Iterative Refinement**: The loop should:
   - Draft the agent specification with VALID FRONTMATTER
   - Review against best practices (single responsibility, clear triggers, minimal tools)
   - Refine based on codebase patterns
   - Generate the final agent file

4. **Output Requirements - CRITICAL**:
   - Create the directory if needed: mkdir -p .claude/agents/
   - Save the agent to the CURRENT PROJECT: .claude/agents/[agent-name].md
   - The agent file MUST have valid YAML frontmatter with these fields:
     * name: kebab-case identifier
     * description: Multi-line with invocation triggers and examples
     * model: haiku, sonnet, or opus
     * tools: Comma-separated list (optional, omit for all tools)

AGENT FRONTMATTER TEMPLATE:
---
name: {agent-name}
description: {One sentence summary}. Use this agent when:
  - {Trigger scenario 1}
  - {Trigger scenario 2}

  Examples:

  <example>
  Context: {Scenario description}
  user: "{Example request}"
  assistant: "{How Claude would invoke this agent}"
  <Task tool invocation to {agent-name} agent>
  </example>
model: {haiku|sonnet|opus}
tools: {Tool1,Tool2,Tool3}
---

When you finish, provide the complete /ralph-wiggum:ralph-loop command ready to execute, formatted as:

/ralph-wiggum:ralph-loop "
[Your generated prompt here]
" --max-iterations [N] --completion-promise "[PROMISE]"
```

### Step 2: Review the Generated Prompt

After the ralph-prompt-architect agent returns with the generated prompt, display it clearly to the user with this format:

```
═══════════════════════════════════════════════════════════
GENERATED RALPH LOOP PROMPT FOR AGENT CREATION
═══════════════════════════════════════════════════════════

[Show the complete generated prompt here]

Target Location: .claude/agents/[agent-name].md (current project)

═══════════════════════════════════════════════════════════
```

### Step 3: Ask for Confirmation

Use the AskUserQuestion tool to ask:

- "Ready to start the Ralph loop to create this agent?"
- Options: "Start Ralph loop" / "Edit prompt first" / "Cancel"

### Step 4: Execute Based on Response

- **If "Start Ralph loop"**: Execute the /ralph-wiggum:ralph-loop command using the SlashCommand tool with the generated prompt and parameters
- **If "Edit prompt first"**: Ask what changes they want and regenerate, then return to Step 2
- **If "Cancel"**: Acknowledge and end

## Important Notes

- The Ralph loop will iteratively refine the agent through multiple cycles
- Each iteration improves the agent based on discovered patterns
- The completion promise ensures the loop knows when the agent is fully created
- Typical agent creation takes 3-5 iterations for quality results
- If no requirements provided, the loop will use interactive discovery
- **Agents are always saved to the current project's `.claude/agents/` folder** (not global)
