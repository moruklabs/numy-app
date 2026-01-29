# Claude Code Hooks: Agentic Capabilities Guide

## Overview

Claude Code hooks provide deterministic automation that transforms recommendations into guaranteed actions. Instead of relying on Claude to remember to validate inputs or format code, hooks ensure these actions happen every time.

---

## All 10 Hook Events

| Event | When It Fires | Agentic Potential | Async Support |
|-------|---------------|-------------------|---------------|
| `PreToolUse` | After Claude creates tool params, before execution | **High** - Block/modify tool inputs | ⚠️ Partial |
| `PostToolUse` | Immediately after tool completion | **Medium** - Validate outputs, trigger actions | ✅ Yes |
| `PermissionRequest` | When permission dialogs appear | **High** - Auto-approve/deny | ❌ No |
| `UserPromptSubmit` | Before Claude processes user input | **High** - Inject context, route tasks | ⚠️ Partial |
| `Stop` | When main agent finishes responding | **High** - Approval workflows | ⚠️ Partial |
| `SubagentStop` | When subagents complete execution | **High** - Validate subagent work | ⚠️ Partial |
| `SessionStart` | At session initialization/resumption | **Medium** - Environment setup | ⚠️ Partial |
| `SessionEnd` | During session termination | **Low** - Cleanup, logging | ✅ Yes |
| `PreCompact` | Before context compaction | **Low** - Preserve context | ✅ Yes |
| `Notification` | When Claude Code sends notifications | **Low** - Custom alerts | ✅ Yes |

**Async Support Legend:**
- ✅ **Yes**: All handlers for this event can be async
- ⚠️ **Partial**: Some handlers must be sync (blockers), others can be async (observers)
- ❌ **No**: All handlers must be synchronous

---

## Subagent Intervention Capabilities

### Can We Intervene in Subagent Invocation?

**Partially.** There is NO `PreSubagentInvocation` hook to modify prompts before subagents run.

| Hook | Capability |
|------|------------|
| `SubagentStop` | Evaluate/block subagent results **after** completion |
| `PreToolUse` | Block the `Task` tool call **before** subagent spawns |
| `Stop` | Intercept main agent responses |

### Workarounds for Prompt Modification

1. **UserPromptSubmit**: Guide user input that influences subagent creation
2. **PreToolUse on Task tool**: Block unwanted subagent invocations
3. **Stop/SubagentStop**: Evaluate results afterward and reject if needed

---

## Hook Execution Models

### 1. Command Hooks (Shell Scripts)

```json
{
  "type": "command",
  "command": "/path/to/script.sh",
  "timeout": 60
}
```

**Environment variables available:**
- `CLAUDE_PROJECT_DIR` - Absolute project root path
- `CLAUDE_CODE_REMOTE` - Set if running remotely
- `CLAUDE_ENV_FILE` - Path for persisting env vars (SessionStart only)

### 2. Prompt-Based Hooks (LLM-Powered)

```json
{
  "type": "prompt",
  "prompt": "Evaluate if this tool call is safe: $ARGUMENTS",
  "timeout": 30
}
```

Works with: `PreToolUse`, `PermissionRequest`, `UserPromptSubmit`, `Stop`, `SubagentStop`

**This is the most powerful agentic capability** - Claude Haiku makes intelligent decisions autonomously.

---

## Hook Matchers

### Tool-Specific (PreToolUse/PostToolUse/PermissionRequest)

```json
{
  "matcher": "Edit|Write",        // Specific tools
  "matcher": "Bash",              // Single tool
  "matcher": "*",                 // All tools (wildcard)
  "matcher": "mcp__.*__write.*"   // MCP tools with regex
}
```

### Notification Matchers

```json
{
  "matcher": "permission_prompt",
  "matcher": "idle_prompt",
  "matcher": "auth_success",
  "matcher": "elicitation_dialog"
}
```

### SessionStart/PreCompact Matchers

```json
{
  "matcher": "startup",   // Initial session start
  "matcher": "resume",    // Session resumed
  "matcher": "clear",     // After /clear command
  "matcher": "compact",   // After compaction
  "matcher": "manual",    // Manual precompact
  "matcher": "auto"       // Automatic precompact
}
```

### No Matchers

`UserPromptSubmit`, `Stop`, `SubagentStop`, `SessionEnd` - these apply globally.

---

## Input/Output Schema

### Input Data (stdin JSON)

```json
{
  "session_id": "uuid-string",
  "transcript_path": "/path/to/transcript.json",
  "cwd": "/current/working/directory",
  "permission_mode": "default|plan|acceptEdits|bypassPermissions",
  "hook_event_name": "PreToolUse|PostToolUse|...",

  // PreToolUse/PermissionRequest:
  "tool_name": "Edit",
  "tool_input": {
    "file_path": "/path/to/file",
    "command": "bash command string"
  },

  // PostToolUse:
  "tool_response": {
    "result": "output from tool"
  },

  // UserPromptSubmit:
  "prompt": "The user's input text",

  // Stop/SubagentStop:
  "response": "Agent's response text",
  "stopReason": "end_turn|user_interruption|..."
}
```

### Output (Exit Codes + JSON)

| Exit Code | Meaning |
|-----------|---------|
| `0` | Success (JSON output can modify behavior) |
| `2` | Blocking error (stderr becomes error message) |
| `1` | Non-blocking error (shown in verbose mode) |

**JSON Response Format:**

```json
{
  "decision": "approve|block|allow|deny",
  "reason": "Explanation string",
  "continue": false,
  "stopReason": "User-facing message for Stop event",
  "systemMessage": "Warning or context message",
  "suppressOutput": true,
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "additionalContext": "String added to conversation",
    "updatedInput": {
      "command": "modified bash command"
    },
    "permissionDecision": "allow|deny|ask",
    "permissionDecisionReason": "Why this decision"
  }
}
```

---

## Creative Agentic Patterns

### Pattern 1: LLM-Powered Approval Workflows

Use prompt-based hooks for intelligent decision-making:

```json
{
  "type": "prompt",
  "prompt": "Review this deployment command and decide if it's safe:\n\n$ARGUMENTS\n\nRespond with JSON: {\"decision\": \"approve\"|\"block\", \"reason\": \"...\"}",
  "timeout": 30
}
```

### Pattern 2: Tool Input Transformation

Modify dangerous commands to be safer:

```python
class BashSanitizer(BaseHandler):
    name = "bash_sanitizer"

    def should_run(self, context: HandlerContext) -> bool:
        return context.event_data.get('tool_name') == 'Bash'

    def run(self, context: HandlerContext) -> HandlerResult:
        command = context.event_data.get('tool_input', {}).get('command', '')

        # Add safety flags
        if 'rm' in command and '-i' not in command:
            safe_command = command.replace('rm ', 'rm -i ')
            return HandlerResult(
                success=True,
                stdout=json.dumps({
                    "decision": "approve",
                    "hookSpecificOutput": {
                        "updatedInput": {"command": safe_command}
                    }
                })
            )

        return HandlerResult(success=True)
```

### Pattern 3: Smart Task Routing

Inject context based on user input keywords:

```python
class SmartRouter(BaseHandler):
    name = "smart_router"

    def run(self, context: HandlerContext) -> HandlerResult:
        prompt = context.event_data.get('prompt', '')

        routing_hints = {
            'architecture': 'Consider using architecture-advisor agent',
            'performance': 'Consider using dev-workflow-optimizer agent',
            'cloudflare': 'Consider using cloudflare-workers-expert agent'
        }

        for keyword, hint in routing_hints.items():
            if keyword in prompt.lower():
                return HandlerResult(
                    success=True,
                    stdout=json.dumps({
                        "hookSpecificOutput": {
                            "additionalContext": f"\n\nNote: {hint}"
                        }
                    })
                )

        return HandlerResult(success=True)
```

### Pattern 4: Autonomous Code Quality Gates

Auto-run linters/formatters after code changes:

```python
class CodeQualityGate(BaseHandler):
    name = "code_quality"
    priority = 100

    def should_run(self, context: HandlerContext) -> bool:
        tool = context.event_data.get('tool_name')
        return tool in ('Edit', 'Write')

    def run(self, context: HandlerContext) -> HandlerResult:
        file_path = context.event_data.get('tool_input', {}).get('file_path', '')

        if file_path.endswith('.ts'):
            result = subprocess.run(
                ['npx', 'eslint', '--fix', file_path],
                capture_output=True
            )

            if result.returncode != 0:
                return HandlerResult(
                    block=True,
                    message=f"Code quality issues: {result.stderr.decode()}"
                )

        return HandlerResult(success=True)
```

### Pattern 5: Subagent Output Validation

Block subagent results that don't meet criteria:

```python
class SubagentValidator(BaseHandler):
    name = "subagent_validator"
    priority = 50

    def run(self, context: HandlerContext) -> HandlerResult:
        response = context.event_data.get('tool_response', {})

        # Block if response contains errors
        if 'error' in str(response).lower():
            return HandlerResult(
                block=True,
                message="Subagent encountered error - blocking result"
            )

        return HandlerResult(success=True)
```

### Pattern 6: Environment Context Injection

Set up persistent environment variables:

```python
class EnvironmentSetup(BaseHandler):
    name = "environment_setup"

    def should_run(self, context: HandlerContext) -> bool:
        return context.event_data.get('matcher') == 'startup'

    def run(self, context: HandlerContext) -> HandlerResult:
        env_file = os.environ.get('CLAUDE_ENV_FILE')

        env_vars = {
            'API_KEY': get_api_key(),
            'PROJECT_ROOT': context.event_data.get('cwd'),
            'DEBUG': 'true'
        }

        if env_file:
            with open(env_file, 'w') as f:
                for k, v in env_vars.items():
                    f.write(f"export {k}={v}\n")

        return HandlerResult(success=True, message="Environment initialized")
```

---

## Priority Bands for Multi-Handler Orchestration

```
Priority 0-99:    Blockers (validation, security) - run first
Priority 100-199: Standard handlers (transformation, enhancement)
Priority 800-899: Observers (non-blocking logging)
Priority 900-999: Cleanup (final actions)
```

Example:

```python
class SecurityValidator(BaseHandler):
    priority = 25  # Run early, can block

class Transformer(BaseHandler):
    priority = 150  # Standard processing

class AuditLogger(BaseHandler):
    priority = 950  # Observe only, never blocks
```

---

## Handler Coordination via shared_state

Handlers can communicate through the context's shared state:

```python
# Handler A (priority 50) sets state
context.shared_state['validated'] = True
context.shared_state['user_tier'] = 'premium'

# Handler B (priority 100) reads state
if context.shared_state.get('validated'):
    if context.shared_state.get('user_tier') == 'premium':
        # Apply premium features
        pass
```

---

## Limitations

| Limitation | Impact |
|------------|--------|
| No `PreSubagentInvocation` hook | Cannot modify prompts before subagent runs |
| Cannot spawn agents from hooks | Can only suggest via context injection |
| Cannot modify Claude's reasoning | Only controls tool execution |
| 60-second default timeout | Long operations may timeout |
| Hooks are local only | Don't run on remote/cloud executions |

---

## Quick Reference: What Each Hook Can Do

| Hook | Block | Modify Input | Add Context | Auto-Approve |
|------|-------|--------------|-------------|--------------|
| PreToolUse | ✅ | ✅ | ✅ | ✅ |
| PostToolUse | ❌ | ❌ | ✅ | ❌ |
| PermissionRequest | ✅ | ✅ | ✅ | ✅ |
| UserPromptSubmit | ✅ | ❌ | ✅ | ❌ |
| Stop | ✅ | ❌ | ✅ | ❌ |
| SubagentStop | ✅ | ❌ | ✅ | ❌ |
| SessionStart | ❌ | ❌ | ✅ | ❌ |
| SessionEnd | ❌ | ❌ | ❌ | ❌ |
| PreCompact | ❌ | ❌ | ✅ | ❌ |
| Notification | ❌ | ❌ | ❌ | ❌ |

---

## Async vs Synchronous Hooks

### When to Use Async Hooks

**Async hooks** run in the background without blocking the main execution flow. Use async for:

- 🟢 **Logging and telemetry** - Fire-and-forget operations
- 🟢 **Background file operations** - Backups, cleanup
- 🟢 **Non-critical caching** - Store results after tool completes
- 🟢 **Monitoring and analytics** - Send metrics asynchronously

**Synchronous hooks** block execution until complete. Use sync for:

- 🔴 **Security validation** - Must block dangerous operations
- 🔴 **Input modification** - Must transform before tool runs
- 🔴 **Critical path operations** - Context loading, rate limiting
- 🔴 **User confirmations** - Wait for user decision

### Async Handler Example

```python
from utils import AsyncBaseHandler, HandlerContext, HandlerResult

class MyAsyncLogger(AsyncBaseHandler):
    """Async logger that doesn't block main flow."""
    
    name = "async_logger"
    description = "Logs events asynchronously"
    priority = 900  # Observer level
    
    async def should_run_async(self, context: HandlerContext) -> bool:
        """Check if handler should run."""
        return True
    
    async def run_async(self, context: HandlerContext) -> HandlerResult:
        """Execute async operation."""
        await self._log_to_file(context.event_data)
        return HandlerResult(success=True)
    
    async def _log_to_file(self, data: dict):
        """Async file write using aiofiles."""
        import aiofiles
        async with aiofiles.open('/tmp/log.json', 'a') as f:
            await f.write(json.dumps(data) + '\n')
```

### Handler Priority Bands & Async Suitability

```
Priority 0-99:    Blockers (validation, security) - MUST BE SYNC ❌
Priority 100-199: Standard handlers (transformation) - CAN BE EITHER ⚠️
Priority 800-899: Observers (non-blocking logging) - SHOULD BE ASYNC ✅
Priority 900-999: Cleanup (final actions) - SHOULD BE ASYNC ✅
```

### Performance Benefits

Async hooks provide:
- **20-40% reduction** in observer hook overhead
- **30-50% faster** pre-compact operations (with large files)
- **Better responsiveness** - main flow doesn't wait for I/O
- **Resource efficiency** - concurrent I/O operations

### Current Async Handlers

See `ASYNC_HOOKS_AUDIT.md` for:
- Complete classification of all handlers
- Conversion recommendations
- Implementation plan
- Performance analysis

---

## Current Directory Structure

```
hooks/
├── HOOKS_GUIDE.md              # This file
├── ASYNC_HOOKS_AUDIT.md        # Async conversion audit
├── ASYNC_CONVERSION_PLAN.md    # Implementation plan
├── on_pre_tool_use/            # PreToolUse handlers
├── on_post_tool_use/           # PostToolUse handlers
├── on_stop/                    # Stop handlers
├── on_subagent_stop/           # SubagentStop handlers
├── on_user_prompt_submit/      # UserPromptSubmit handlers
├── on_session_start/           # SessionStart handlers
├── on_pre_compact/             # PreCompact handlers
└── utils/                      # Shared utilities
```
