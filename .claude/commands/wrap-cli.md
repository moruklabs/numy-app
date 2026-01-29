---
allowed-tools: Task,Read,Write,Glob,Grep,Bash,AskUserQuestion
description: "Create a specialized CLI agent by exploring a command-line tool's capabilities and generating a production-ready agent file"
---

# CLI Agent Wrapper Command

Create a specialized CLI agent for the tool: **$ARGUMENTS**

## Instructions

You are creating a CLI agent wrapper. Use the `create-cli-agent` orchestrator to:

1. **Parse the arguments**: Extract the CLI tool name from the first argument
   - Format: `<cli-tool> [--tier worker|specialist] [--output <path>]`
   - Examples:
     - `/wrap-cli docker` - Create docker agent with auto-detected tier
     - `/wrap-cli kubectl --tier specialist` - Force specialist tier
     - `/wrap-cli gh --output ~/.claude/agents/github/` - Custom output path

2. **Validate the CLI tool exists** by running:

   ```bash
   command -v <cli-tool> || which <cli-tool>
   ```

3. **Invoke the create-cli-agent orchestrator** using the Task tool:

   ```
   subagent_type: create-cli-agent
   prompt: Create a comprehensive CLI agent for the "<cli-tool>" command-line tool.
           [Include tier override if specified]
           [Include output path override if specified]
   ```

4. **Report the result** with:
   - Path to the created agent file
   - Quick summary of capabilities documented
   - How to invoke the new agent

## Argument Parsing

If `$ARGUMENTS` is empty, ask the user which CLI tool they want to wrap.

Parse arguments:

- First positional arg = CLI tool name (required)
- `--tier <worker|specialist>` = Override auto-detected tier (affects model: haiku vs sonnet)
- `--output <path>` = Custom save location (default: `~/.claude/agents/cli/`)

**Tier Selection Guide:**

- **worker** (haiku): Simple CLI wrappers, documentation lookups
- **specialist** (sonnet): Complex CLI orchestration, multi-command workflows

## Example Invocations

```bash
# Basic usage
/wrap-cli docker

# With tier override
/wrap-cli terraform --tier specialist

# With custom output
/wrap-cli wrangler --output ~/.claude/agents/cloudflare/

# Combined options
/wrap-cli kubectl --tier specialist --output ~/.claude/agents/k8s/
```

## Core Principles

### Parallelization (CRITICAL for Speed)

When exploring CLI capabilities, run independent operations in parallel:

- Multiple help lookups -> ONE message with multiple Bash calls
- Multiple documentation reads -> ONE message with multiple Read calls

### Depth-First Strategy (DFS over BFS)

When exploring a CLI, go DEEP into one command category before moving to the next:

- Complete documentation for one subcommand fully before starting another
- Explore all options for one command before moving to the next

### Architecture Principles

**FSD over DDD:** Structure the agent following Feature-Sliced Design patterns.

**DRY & OPEN-CLOSED:**

- Check existing CLI agents for patterns to reuse
- Design agent for extension with new CLI features
- Extract common CLI patterns into shared utilities

## Success Output

After completion, display:

```
Created CLI Agent: <agent-name>
Location: <file-path>
Tier: <worker|specialist>

Capabilities:
- <capability 1>
- <capability 2>
- <capability 3>

Usage: Invoke with @<agent-name> or reference in Task tool
```
