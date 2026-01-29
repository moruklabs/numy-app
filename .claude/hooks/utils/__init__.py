"""
Hook Utilities Package

This package contains shared utilities used across different hook strategies.
Provides common functionality for:
- Path resolution based on git repo root
- Handler-based event system (Open-Closed Principle)
- Auto-discovery and registration of handlers
- JSON logging operations (DRY)
- Command parsing, message formatting, and git operations
- Strongly-typed Pydantic models for hook events
"""

# Handler system (new architecture)
from .base_handler import BaseHandler, HandlerContext, HandlerResult
from .event_runner import create_event_main, run_event
from .handler_registry import discover_handlers, get_event_dir

# Legacy base hook (for backward compatibility)
from .base_hook import BaseHook, run_hook

# Utilities
from .command_parser import CommandParser
from .git_helper import GitHelper
from .logging_utils import LogManager
from .message_formatter import MessageFormatter
from .path_utils import get_git_root, get_hooks_dir, get_logs_dir, get_project_root
from .security_validators import (
    DangerousRmValidator,
    EnvFileValidator,
    SecurityValidator,
    ValidatorChain,
    create_default_validator_chain,
)
from .safe_decorator import Safe, safe_call

# Strongly-typed hook event models (optional - requires pydantic)
# These are lazily imported to avoid breaking hooks when pydantic is not installed
try:
    from .types import (
        # Enums
        HookEventName,
        PermissionMode,
        SessionSource,
        NotificationType,
        StopReason,
        ToolName,
        # Tool Inputs
        BashToolInput,
        ReadToolInput,
        WriteToolInput,
        EditToolInput,
        GlobToolInput,
        GrepToolInput,
        TaskToolInput,
        TodoWriteToolInput,
        SkillToolInput,
        LSPToolInput,
        # Tool Responses
        BashToolResponse,
        ReadToolResponse,
        WriteToolResponse,
        TaskToolResponse,
        # Hook Events
        BaseHookEvent,
        SessionStartEvent,
        SessionEndEvent,
        UserPromptSubmitEvent,
        PreToolUseEvent,
        PostToolUseEvent,
        StopEvent,
        SubagentStopEvent,
        NotificationEvent,
        PreCompactEvent,
        AgentDecisionEvent,
        ToolStartEvent,
        ToolCompleteEvent,
        PermissionRequestEvent,
        HookEvent,
        # Hook Output
        HookSpecificOutput,
        HookOutput,
        # Parsing
        parse_hook_event,
        parse_tool_input,
        # Base
        StrictModel,
    )
    _TYPES_AVAILABLE = True
except ImportError:
    # pydantic not installed - types module not available
    _TYPES_AVAILABLE = False

# Cache utilities (lazy imports - heavy dependencies)
# Import these directly when needed:
# from utils.cache_manager import HybridCacheManager, get_cache_manager
# from utils.vector_store import FAISSVectorStore, get_vector_store
# from utils.embedding_utils import EmbeddingManager, embed_text

__all__ = [
    # Handler system
    'BaseHandler',
    'HandlerContext',
    'HandlerResult',
    'run_event',
    'create_event_main',
    'discover_handlers',
    'get_event_dir',
    # Path utilities
    'get_project_root',
    'get_git_root',
    'get_hooks_dir',
    'get_logs_dir',
    # Legacy base hook
    'BaseHook',
    'run_hook',
    # Security validators
    'SecurityValidator',
    'ValidatorChain',
    'EnvFileValidator',
    'DangerousRmValidator',
    'create_default_validator_chain',
    # Utilities
    'CommandParser',
    'GitHelper',
    'LogManager',
    'MessageFormatter',
    # Safe decorator
    'Safe',
    'safe_call',
]

# Add typed hook events to __all__ if pydantic is available
if _TYPES_AVAILABLE:
    __all__.extend([
        'HookEventName',
        'PermissionMode',
        'SessionSource',
        'NotificationType',
        'StopReason',
        'ToolName',
        'BashToolInput',
        'ReadToolInput',
        'WriteToolInput',
        'EditToolInput',
        'GlobToolInput',
        'GrepToolInput',
        'TaskToolInput',
        'TodoWriteToolInput',
        'SkillToolInput',
        'LSPToolInput',
        'BashToolResponse',
        'ReadToolResponse',
        'WriteToolResponse',
        'TaskToolResponse',
        'BaseHookEvent',
        'SessionStartEvent',
        'SessionEndEvent',
        'UserPromptSubmitEvent',
        'PreToolUseEvent',
        'PostToolUseEvent',
        'StopEvent',
        'SubagentStopEvent',
        'NotificationEvent',
        'PreCompactEvent',
        'AgentDecisionEvent',
        'ToolStartEvent',
        'ToolCompleteEvent',
        'PermissionRequestEvent',
        'HookEvent',
        'HookSpecificOutput',
        'HookOutput',
        'parse_hook_event',
        'parse_tool_input',
        'StrictModel',
    ])