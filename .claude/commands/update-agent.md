---
description: Update or improve an existing Claude Code agent using the agent-updater agent
argument-hint: "<agent-name> [improvement description]"
---

You are now acting as the agent-updater agent. Your task is to analyze and improve an existing Claude Code agent definition.

**User Request:** $ARGUMENTS

## Instructions

1. **Parse the Request**
   - Extract the agent name from the arguments
   - Identify any specific improvements requested
   - If only an agent name is provided, ask what improvements are needed

2. **Locate the Agent**
   Search in order (use Glob patterns if name is ambiguous):
   - `.claude/agents/` (project-level - flat or tiered)
   - `~/.claude/agents/<domain>/tier-0/` (Tier 0 - Opus orchestrators)
   - `~/.claude/agents/<domain>/tier-1/` (Tier 1 - Sonnet specialists)
   - `~/.claude/agents/<domain>/tier-2/` (Tier 2 - Haiku workers)
   - Domain folders: orchestrators, cloudflare, expo, firebase, gcloud, github, meta, mobile-app-recreation, rebrand, sentry, general
   - `~/.claude/agents/cli/` (CLI tool integrations)
   - `~/.claude/agents/headless-cli-agents/` (headless command generators)

3. **Analyze and Improve**
   - Read the complete agent file
   - Analyze the frontmatter (name, description, model, tools)
   - Evaluate the system prompt structure
   - Identify improvement opportunities based on user requirements

4. **Apply Improvements**
   Follow the agent-updater workflow:
   - Enhance the description with clear invocation triggers
   - Add/improve example triggers
   - Optimize tool selection (minimal required tools)
   - Validate model selection against tier and task complexity:
     - Tier 0 (Orchestrators): `model: sonnet` - multi-agent coordination, architecture
     - Tier 1 (Specialists): `model: haiku` - domain implementations, analysis
     - Tier 2 (Workers): `model: haiku` - file scanning, simple lookups
   - Ensure agent is in the correct `<domain>/tier-X/` folder based on capabilities
   - Add quality assurance checklists if missing
   - Improve scope definition and boundaries

5. **Present and Save**
   - Show a summary of changes
   - Ask user preference: save directly or review diff first
   - Save the updated agent file

## Core Principles

### Parallelization (CRITICAL for Speed)

When searching for agents, execute ALL searches in parallel:

- Multiple agent file reads -> ONE message with multiple Read calls
- Multiple pattern searches -> ONE message with multiple Grep/Glob calls

### Depth-First Strategy (DFS over BFS)

When updating, go DEEP into each improvement before moving to the next:

- Complete one aspect of the update fully before starting another
- Finish the description update before modifying the system prompt

### Architecture Principles

**FSD over DDD:** Ensure agents follow Feature-Sliced Design patterns.

**DRY & OPEN-CLOSED:**

- Check existing agents for patterns to reuse
- Design updates for extension without breaking existing functionality

## Examples

```
/update-agent code-reviewer add security analysis
/update-agent deep-researcher improve tool selection
/update-agent cli-docs-explorer
```
