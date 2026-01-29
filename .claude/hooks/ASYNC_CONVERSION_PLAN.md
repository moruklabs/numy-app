# Async Hooks Conversion Plan - Quick Reference

**Status:** Ready for Implementation  
**Priority:** Medium  
**Estimated Effort:** 5 weeks  

---

## TL;DR

**Convert to Async:**
- ✅ 8x event_logger.py (all of them) - Priority 900 observers
- ✅ transcript_backup.py - Pre-compact backup
- ✅ log_tool_start.py, log_tool_complete.py - Tool logging
- ⚠️ cache_store.py, cache_result.py - If profiling shows benefit
- ⚠️ 2x chat_saver.py - If graceful shutdown is solid

**Keep Synchronous:**
- ❌ All security validators (dangerous_rm_blocker, env_file_blocker)
- ❌ All critical path (context_loader, rate_limiter)
- ❌ All prompt validators
- ❌ cache_lookup.py (cache hit must block anyway)

---

## Implementation Checklist

### Phase 1: Infrastructure ⏱️ Week 1
- [ ] Create `AsyncBaseHandler` class in `utils/base_handler.py`
- [ ] Add async support to `utils/event_runner.py`
- [ ] Update all `__main__.py` entry points for async
- [ ] Implement graceful shutdown (atexit handlers)
- [ ] Add unit tests for async infrastructure
- [ ] Update HOOKS_GUIDE.md with async patterns
- [ ] Create async handler template/example

### Phase 2: Observer Handlers ⏱️ Week 2
Convert all 11 observer handlers:

**8 event_logger.py handlers (priority 900):**
- [ ] on_notification/event_logger.py
- [ ] on_post_tool_use/event_logger.py
- [ ] on_pre_compact/event_logger.py
- [ ] on_pre_tool_use/event_logger.py
- [ ] on_session_start/event_logger.py
- [ ] on_stop/event_logger.py
- [ ] on_subagent_stop/event_logger.py
- [ ] on_user_prompt_submit/event_logger.py

**3 specialized loggers (priority 800):**
- [ ] on_agent_decision/log_agent_decision.py
- [ ] on_tool_start/log_tool_start.py
- [ ] on_tool_complete/log_tool_complete.py

**Plus:**
- [ ] Update LogManager with async methods
- [ ] Add async tests for all loggers
- [ ] Benchmark performance improvements

### Phase 3: High-Impact Handlers ⏱️ Week 3
- [ ] Convert transcript_backup.py to async
- [ ] Convert log_tool_start.py to async
- [ ] Convert log_tool_complete.py to async
- [ ] Add tests for async file operations
- [ ] Benchmark improvements

### Phase 4: Cache Operations (Optional) ⏱️ Week 4
**Prerequisites:**
- [ ] Profile cache operations (Redis, Qdrant, file)
- [ ] Identify actual bottlenecks

**If beneficial:**
- [ ] Convert cache_store.py to async
- [ ] Convert cache_result.py to async
- [ ] Add async error handling for backends
- [ ] Extensive testing with all backends

**If not beneficial:**
- [ ] Document why and skip

### Phase 5: Documentation & Polish ⏱️ Week 5
- [ ] Final documentation updates
- [ ] Create async handler development guide
- [ ] Comprehensive performance benchmarks
- [ ] Migration guide for custom hooks
- [ ] Final testing and validation
- [ ] Update README and CONTRIBUTING guides

---

## Quick Wins (Do First)

1. **All observer handlers** - 11 handlers, consistent pattern
   - **Breakdown:** 8 event_logger.py + 3 specialized loggers
   - **Why:** Consistent, low risk, clear benefit
   - **Effort:** Low (similar code pattern)
   - **Impact:** 20-40% reduction in observer overhead

2. **transcript_backup.py** - Pre-compact backup
   - **Why:** Large file copies can be slow
   - **Effort:** Low (simple file operation)
   - **Impact:** 30-50% faster compaction with large transcripts

---

## Anti-Patterns (Don't Do)

1. ❌ **Don't convert security validators**
   - dangerous_rm_blocker.py
   - env_file_blocker.py
   - Reason: Blocking is their purpose

2. ❌ **Don't convert critical path handlers**
   - context_loader.py
   - rate_limiter.py
   - prompt_validator.py
   - Reason: Must block before proceeding

3. ❌ **Don't convert cache_lookup.py** (for now)
   - Reason: Cache hit must block anyway
   - Action: Profile first, then decide

---

## Code Templates

### Async Handler Template
```python
from utils import AsyncBaseHandler, HandlerContext, HandlerResult

class MyAsyncHandler(AsyncBaseHandler):
    """Async handler description."""
    
    name = "my_async_handler"
    description = "Does something in background"
    priority = 900  # Observer level
    
    async def should_run_async(self, context: HandlerContext) -> bool:
        """Check if handler should run."""
        return True
    
    async def run_async(self, context: HandlerContext) -> HandlerResult:
        """Execute async operation."""
        # Do async work here
        await self._do_async_operation()
        return HandlerResult(success=True)
    
    async def _do_async_operation(self):
        """Async helper method."""
        # Use aiofiles for file I/O
        # Use httpx for HTTP requests
        # Use asyncio for concurrency
        pass
```

### Async Event Logger Template
```python
from utils import AsyncBaseHandler, HandlerContext, HandlerResult, LogManager

class EventLogger(AsyncBaseHandler):
    """Logs events asynchronously."""
    
    name = "event_logger"
    priority = 900  # Observer
    
    def __init__(self):
        self._log_manager = LogManager()
    
    async def should_run_async(self, context: HandlerContext) -> bool:
        return True
    
    async def run_async(self, context: HandlerContext) -> HandlerResult:
        await self._log_manager.append_entry_async(
            'event.json',
            context.event_data
        )
        return HandlerResult(success=True)
```

---

## Testing Checklist

### Unit Tests
- [ ] Test AsyncBaseHandler class
- [ ] Test async event runner
- [ ] Test graceful shutdown
- [ ] Test error handling in async ops
- [ ] Test cancellation scenarios

### Integration Tests
- [ ] Test async + sync handler interaction
- [ ] Test event ordering preservation
- [ ] Test concurrent async handlers
- [ ] Test atexit handlers

### Performance Tests
- [ ] Benchmark async vs sync (each handler)
- [ ] Measure total hook overhead
- [ ] Profile cache backend latency
- [ ] Test with various file sizes

### Regression Tests
- [ ] No change in handler behavior
- [ ] Blocking handlers still block
- [ ] Observers still capture all events
- [ ] No race conditions

---

## Success Criteria

### Must Have
- ✅ No regressions in existing behavior
- ✅ 100% test coverage for async infrastructure
- ✅ All async handlers have proper error handling
- ✅ Documentation updated

### Should Have
- ✅ 8+ handlers converted to async
- ✅ 20%+ reduction in observer overhead
- ✅ Graceful shutdown working reliably
- ✅ Migration guide published

### Nice to Have
- ✅ 30%+ reduction in pre-compact time
- ✅ Cache operations async (if beneficial)
- ✅ Performance benchmarks published
- ✅ Developer feedback positive

---

## Rollback Plan

If async conversion causes issues:

1. **Immediate:** Revert converted handlers to sync versions
2. **Short-term:** Keep infrastructure, disable async execution
3. **Long-term:** Remove async infrastructure if not beneficial

All changes should be:
- Behind feature flags (environment variables)
- Backward compatible (sync versions remain)
- Easily reversible (git revert)

---

## Dependencies

### Required
- Python 3.11+ (existing requirement)
- asyncio (standard library)

### Optional (for specific handlers)
- aiofiles (for async file I/O)
- httpx (for async HTTP, if needed)
- aioredis (for async Redis, if cache_store converted)

---

## Resources

- **Full Audit Report:** `ASYNC_HOOKS_AUDIT.md`
- **Hooks Guide:** `HOOKS_GUIDE.md`
- **Base Handler:** `utils/base_handler.py`
- **Event Runner:** `utils/event_runner.py`

---

## Questions & Answers

**Q: Why not make everything async?**  
A: Blocking handlers (security, validation) MUST block. Async adds complexity with no benefit.

**Q: Will this break existing custom hooks?**  
A: No. Sync handlers continue to work. Async is opt-in via AsyncBaseHandler.

**Q: What if async is slower?**  
A: We benchmark each conversion. If slower, we revert. Feature flags allow easy rollback.

**Q: Do we need to handle async/await in all handlers?**  
A: No. Only handlers that extend AsyncBaseHandler use async. Others remain sync.

**Q: What about Python 3.10 compatibility?**  
A: We require Python 3.11+ (per CLAUDE.md). asyncio is fully supported.

---

## Next Steps

1. Review this plan with team
2. Get approval for Phase 1 (infrastructure)
3. Create feature branch: `feature/async-hooks`
4. Start Phase 1 implementation
5. Review after each phase before proceeding

**Estimated Start:** After current PR is merged  
**Estimated Completion:** 5 weeks from start  
**Point of Contact:** TBD
