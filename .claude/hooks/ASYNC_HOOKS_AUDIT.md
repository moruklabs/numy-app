# Claude Code Hooks: Async Execution Audit Report

**Date:** 2025-12-24  
**Status:** Analysis Complete  
**Implementation:** Pending

---

## Executive Summary

This audit analyzes all 24 hook handlers across 11 event types to determine which hooks can and should be converted to async execution for better performance and non-blocking behavior.

**Key Findings:**
- ✅ **11 handlers** can be converted to async (all observer handlers at priority 800+)
- ⚠️ **4 handlers** could benefit from async but need careful consideration
- ❌ **12 handlers** MUST remain synchronous (critical path, security, validation)

**Potential Benefits:**
- ~30-50% reduction in hook execution time for non-blocking operations
- Improved responsiveness during logging and telemetry operations
- Better resource utilization for I/O-bound operations
- No impact on critical path operations (security, validation remain blocking)

---

## Classification Matrix

### Legend
- 🟢 **Should be Async**: Can run in background without blocking
- 🟡 **Consider Async**: Potential benefits but needs careful analysis
- 🔴 **Must Remain Sync**: Critical path operations that must block

---

## Hook-by-Hook Analysis

### 1. on_agent_decision (2 handlers)

#### 🔴 rate_limiter.py
- **Priority:** 50 (Blocker)
- **Operations:** File I/O (state file), rate limit checks
- **Classification:** **MUST REMAIN SYNC**
- **Reasoning:** 
  - Must block agent invocation if rate limit exceeded
  - State file access is critical path
  - Blocking behavior is the entire purpose
- **Performance Impact:** Minimal (simple file operations)

#### 🟢 log_agent_decision.py
- **Priority:** 900 (Observer)
- **Operations:** Logging agent decisions to file
- **Classification:** **SHOULD BE ASYNC**
- **Reasoning:**
  - Pure logging, no blocking required
  - Fire-and-forget operation
  - Does not affect decision flow
- **Performance Gain:** Low (quick operation, but removes I/O from critical path)
- **Implementation:** Simple async wrapper for file append

---

### 2. on_notification (1 handler)

#### 🟢 event_logger.py
- **Priority:** 900 (Observer)
- **Operations:** Append to notification.json log
- **Classification:** **SHOULD BE ASYNC**
- **Reasoning:**
  - Pure logging operation
  - Does not affect notification flow
  - Fire-and-forget
- **Performance Gain:** Low-Medium (removes I/O latency)
- **Implementation:** Async file append via LogManager

---

### 3. on_post_tool_use (3 handlers)

#### 🟢 event_logger.py
- **Priority:** 900 (Observer)
- **Operations:** Logging tool execution events
- **Classification:** **SHOULD BE ASYNC**
- **Reasoning:** Same as other event loggers
- **Performance Gain:** Low-Medium

#### 🟡 cache_store.py
- **Priority:** 150 (Standard)
- **Operations:** 
  - File I/O (file backend)
  - Redis operations (optional)
  - Qdrant vector operations (optional)
- **Classification:** **CONSIDER ASYNC**
- **Reasoning:**
  - Caching is not critical path
  - Can run in background after tool completes
  - However: Complex with multiple backends
  - Risk: Cache backend connection issues shouldn't block
- **Performance Gain:** Medium-High (Redis/Qdrant operations can be slow)
- **Concerns:**
  - Need proper error handling for async backend failures
  - Ensure cache consistency
  - Consider impact on cache hit rates

#### 🟢 subagent_validator.py
- **Priority:** 100 (Standard)
- **Operations:** File validation, schema checking
- **Classification:** **SHOULD REMAIN SYNC** (but non-blocking)
- **Reasoning:**
  - Validation happens after tool completes
  - Want immediate feedback in transcript
  - Fast operation (JSON validation)
- **Performance Impact:** Minimal
- **Note:** Could make async but little benefit

---

### 4. on_pre_compact (2 handlers)

#### 🟢 event_logger.py
- **Priority:** 900 (Observer)
- **Operations:** Logging compaction events
- **Classification:** **SHOULD BE ASYNC**
- **Reasoning:** Same as other event loggers
- **Performance Gain:** Low-Medium

#### 🟢 transcript_backup.py
- **Priority:** 100 (Standard)
- **Operations:** File copy operation (shutil.copy2)
- **Classification:** **SHOULD BE ASYNC**
- **Reasoning:**
  - Backup can happen in background
  - Large transcript files can be slow to copy
  - Pre-compact is not time-critical
  - Fire-and-forget operation
- **Performance Gain:** Medium-High (transcript files can be large)
- **Implementation:** Use asyncio for file I/O or thread pool for shutil.copy2
- **Concern:** Ensure backup completes before process exit

---

### 5. on_pre_tool_use (4 handlers)

#### 🟢 event_logger.py
- **Priority:** 900 (Observer)
- **Operations:** Logging tool invocation events
- **Classification:** **SHOULD BE ASYNC**
- **Reasoning:** Same as other event loggers
- **Performance Gain:** Low-Medium

#### 🔴 dangerous_rm_blocker.py
- **Priority:** 20 (Blocker - Security Critical)
- **Operations:**
  - Pattern matching
  - Gitignore parsing
  - User confirmation dialog (osascript)
  - Preference file I/O
- **Classification:** **MUST REMAIN SYNC**
- **Reasoning:**
  - Security critical - MUST block dangerous operations
  - User dialog requires waiting for response
  - Blocking is the entire purpose
- **Performance Impact:** Variable (dialog wait time)

#### 🔴 env_file_blocker.py
- **Priority:** 10 (Blocker - Security Critical)
- **Operations:** Pattern matching, path validation
- **Classification:** **MUST REMAIN SYNC**
- **Reasoning:**
  - Security critical - MUST block .env access
  - Fast operation (regex only)
- **Performance Impact:** Minimal

#### 🟡 cache_lookup.py
- **Priority:** 5 (Very Early - Performance Critical)
- **Operations:**
  - File I/O (file backend)
  - Redis lookups (optional)
  - Qdrant vector search (optional)
  - Git SHA lookup (subprocess)
- **Classification:** **CONSIDER ASYNC**
- **Reasoning:**
  - Must block if cache hit (return cached result)
  - Cache lookup latency directly impacts perceived performance
  - Redis/Qdrant operations can be slow
  - However: Async might not help if we need result immediately
- **Performance Considerations:**
  - Cache hit: Must wait for result anyway (no async benefit)
  - Cache miss: Could do async lookup and continue if no blocking needed
  - Complex: Different backends have different async support
- **Recommendation:** 
  - Keep sync for now
  - Consider async only for miss case (fire-and-forget invalidation checks)
  - Profile to see if cache latency is actually a problem

---

### 6. on_session_start (3 handlers)

#### 🟢 event_logger.py
- **Priority:** 900 (Observer)
- **Operations:** Logging session start events
- **Classification:** **SHOULD BE ASYNC**
- **Reasoning:** Same as other event loggers
- **Performance Gain:** Low-Medium

#### 🔴 context_loader.py
- **Priority:** 100 (Standard - Critical Path)
- **Operations:**
  - Monorepo app detection
  - File reads (CURRENT_TASK.md, SPEC.md)
  - Path resolution
- **Classification:** **MUST REMAIN SYNC**
- **Reasoning:**
  - Context must be loaded before session starts
  - Affects Claude's initial context
  - Critical path operation
  - Files are small (fast reads)
- **Performance Impact:** Low (small files)

#### 🔴 github_token_cleaner.py
- **Priority:** 100 (Standard - Security)
- **Operations:** Environment variable checks
- **Classification:** **MUST REMAIN SYNC**
- **Reasoning:**
  - Security-related operation
  - Must complete before session starts
  - Fast operation (env var checks only)
- **Performance Impact:** Minimal

---

### 7. on_stop (2 handlers)

#### 🟢 event_logger.py
- **Priority:** 900 (Observer)
- **Operations:** Logging stop events
- **Classification:** **SHOULD BE ASYNC**
- **Reasoning:** Same as other event loggers
- **Performance Gain:** Low-Medium

#### 🟡 chat_saver.py
- **Priority:** 100 (Standard)
- **Operations:** Copy transcript to chat.json
- **Classification:** **CONSIDER ASYNC**
- **Reasoning:**
  - Not critical path (session is ending)
  - File copy can be slow for large transcripts
  - Fire-and-forget operation
  - However: Want to ensure save completes before exit
- **Performance Gain:** Low-Medium (depends on transcript size)
- **Concern:** Ensure save completes before process terminates
- **Recommendation:** Use async but wait for completion before exit

---

### 8. on_subagent_stop (2 handlers)

#### 🟢 event_logger.py
- **Priority:** 900 (Observer)
- **Operations:** Logging subagent stop events
- **Classification:** **SHOULD BE ASYNC**
- **Reasoning:** Same as other event loggers
- **Performance Gain:** Low-Medium

#### 🟡 chat_saver.py
- **Priority:** 100 (Standard)
- **Operations:** Copy transcript to chat.json
- **Classification:** **CONSIDER ASYNC**
- **Reasoning:** Same as on_stop/chat_saver.py
- **Performance Gain:** Low-Medium
- **Concern:** Same as on_stop version

---

### 9. on_tool_complete (2 handlers)

#### 🟢 log_tool_complete.py
- **Priority:** 900 (Observer)
- **Operations:** Logging tool completion events
- **Classification:** **SHOULD BE ASYNC**
- **Reasoning:**
  - Pure logging operation
  - Observer pattern
  - Does not affect tool result
- **Performance Gain:** Low-Medium

#### 🟡 cache_result.py
- **Priority:** 150 (Standard)
- **Operations:** Cache tool results to file
- **Classification:** **CONSIDER ASYNC**
- **Reasoning:**
  - Caching is not critical path
  - Can run in background
  - Fire-and-forget operation
- **Performance Gain:** Low-Medium
- **Note:** Similar to cache_store.py - could benefit from async

---

### 10. on_tool_start (1 handler)

#### 🟢 log_tool_start.py
- **Priority:** 900 (Observer)
- **Operations:** Logging tool start events
- **Classification:** **SHOULD BE ASYNC**
- **Reasoning:**
  - Pure logging operation
  - Observer pattern
  - Does not affect tool execution
- **Performance Gain:** Low-Medium

---

### 11. on_user_prompt_submit (2 handlers)

#### 🟢 event_logger.py
- **Priority:** 900 (Observer)
- **Operations:** Logging prompt submission events
- **Classification:** **SHOULD BE ASYNC**
- **Reasoning:** Same as other event loggers
- **Performance Gain:** Low-Medium

#### 🔴 prompt_validator.py
- **Priority:** 50 (Blocker)
- **Operations:** Prompt validation (currently stub)
- **Classification:** **MUST REMAIN SYNC**
- **Reasoning:**
  - Designed to block invalid prompts
  - Critical path - must complete before prompt processed
  - Blocking is the purpose
- **Performance Impact:** Minimal (currently just returns True)

---

## Summary Statistics

### By Classification

| Classification | Count | Handlers |
|----------------|-------|----------|
| 🟢 Should be Async | 8 | All event_logger.py, log_tool_start.py, log_tool_complete.py |
| 🟡 Consider Async | 4 | cache_store.py, cache_result.py, 2x chat_saver.py, transcript_backup.py |
| 🔴 Must Remain Sync | 12 | Security validators, context loaders, rate limiters, cache_lookup.py |

### By Priority Band

| Priority | Async Candidates | Must Remain Sync |
|----------|-----------------|------------------|
| 0-99 (Blockers) | 0 | 5 (security, validation) |
| 100-199 (Standard) | 3 | 4 (critical path) |
| 800-899 (Observers) | 3 | 0 |
| 900-999 (Cleanup) | 8 | 0 |

### By Hook Event Type

| Event Type | Total | Async Candidates | Sync Required |
|------------|-------|-----------------|---------------|
| on_agent_decision | 2 | 1 | 1 |
| on_notification | 1 | 1 | 0 |
| on_post_tool_use | 3 | 1 | 2 |
| on_pre_compact | 2 | 2 | 0 |
| on_pre_tool_use | 4 | 1 | 3 |
| on_session_start | 3 | 1 | 2 |
| on_stop | 2 | 1 | 1 |
| on_subagent_stop | 2 | 1 | 1 |
| on_tool_complete | 2 | 2 | 0 |
| on_tool_start | 1 | 1 | 0 |
| on_user_prompt_submit | 2 | 1 | 1 |

---

## Performance Impact Analysis

### High Priority (High Impact, Low Risk)

1. **All observer handlers (11 total)** - Priority 800-900
   - 8 event_logger.py handlers (priority 900)
   - 3 specialized loggers: log_agent_decision.py, log_tool_start.py, log_tool_complete.py (priority 800)
   - **Impact:** Low-Medium per handler, cumulative medium-high
   - **Risk:** Very low (fire-and-forget logging)
   - **Effort:** Low (identical pattern across all)
   - **Benefit:** Removes I/O latency from observer hooks

2. **transcript_backup.py** - on_pre_compact
   - **Impact:** Medium-High (large file copies)
   - **Risk:** Low (backup can happen in background)
   - **Effort:** Low (simple file operation)
   - **Benefit:** Faster compaction when transcripts are large

### Medium Priority (Moderate Impact, Moderate Risk)

3. **cache_store.py** - on_post_tool_use
   - **Impact:** Medium-High (Redis/Qdrant operations)
   - **Risk:** Medium (need proper error handling)
   - **Effort:** Medium (multiple backends to handle)
   - **Benefit:** Tool completion doesn't wait for caching

4. **chat_saver.py (2 instances)** - on_stop, on_subagent_stop
   - **Impact:** Low-Medium (depends on transcript size)
   - **Risk:** Medium (must complete before exit)
   - **Effort:** Low-Medium (need graceful shutdown)
   - **Benefit:** Faster session/subagent completion

### Low Priority (Low Impact or High Risk)

5. **cache_lookup.py** - on_pre_tool_use
   - **Impact:** Unclear (depends on cache backend latency)
   - **Risk:** High (complex, cache hit must block anyway)
   - **Effort:** High (complex logic across backends)
   - **Benefit:** Questionable (need profiling data first)
   - **Recommendation:** Profile first, convert only if bottleneck identified

---

## Infrastructure Requirements

### Current State
- No async infrastructure exists
- All handlers are synchronous Python functions
- No event loop or async runtime

### Required Changes

#### 1. Async Handler Base Class
```python
class AsyncBaseHandler(BaseHandler):
    """Base class for async handlers."""
    
    async def should_run_async(self, context: HandlerContext) -> bool:
        """Async version of should_run."""
        return self.should_run(context)
    
    @abstractmethod
    async def run_async(self, context: HandlerContext) -> HandlerResult:
        """Async version of run."""
        ...
```

#### 2. Event Runner Support
```python
# In event_runner.py
async def run_async_handlers(handlers: list[AsyncBaseHandler], context: HandlerContext):
    """Run async handlers concurrently."""
    tasks = [h.run_async(context) for h in handlers if await h.should_run_async(context)]
    return await asyncio.gather(*tasks, return_exceptions=True)
```

#### 3. Hook Entry Point
```python
# In __main__.py
def main():
    # Run sync handlers first (blockers, critical path)
    sync_results = run_sync_handlers()
    
    # Start async handlers (observers, background tasks)
    # Use asyncio.run() or fire-and-forget depending on event type
    if has_async_handlers:
        if event_requires_wait:
            asyncio.run(run_async_handlers())
        else:
            # Fire-and-forget for observers
            start_background_tasks()
```

#### 4. Graceful Shutdown
```python
# Ensure async tasks complete before exit
import atexit
import asyncio

pending_tasks = []

def wait_for_pending():
    if pending_tasks:
        asyncio.run(asyncio.gather(*pending_tasks))

atexit.register(wait_for_pending)
```

---

## Implementation Plan

### Phase 1: Foundation (Week 1)
**Goal:** Establish async infrastructure without breaking existing hooks

- [ ] Create AsyncBaseHandler class
- [ ] Update event_runner.py to support async handlers
- [ ] Add asyncio support to __main__.py entry points
- [ ] Create graceful shutdown mechanism
- [ ] Add tests for async infrastructure
- [ ] Update HOOKS_GUIDE.md with async patterns

**Deliverables:**
- Working async infrastructure
- Documentation
- Tests
- No regression in existing hooks

### Phase 2: Low-Hanging Fruit (Week 2)
**Goal:** Convert all observer handlers to async (11 handlers)

- [ ] Create async LogManager methods
- [ ] Convert 8 event_logger.py handlers to async
- [ ] Convert 3 specialized loggers to async (log_agent_decision.py, log_tool_start.py, log_tool_complete.py)
- [ ] Add tests for async logging
- [ ] Measure performance improvement

**Deliverables:**
- 11 async observer handlers
- Performance benchmarks
- Test coverage

**Expected Impact:**
- 10-20% reduction in observer hook overhead
- Cleaner separation of concerns

### Phase 3: High-Impact Conversions (Week 3)
**Goal:** Convert high-impact, low-risk handlers

- [ ] Convert transcript_backup.py to async
- [ ] Convert log_tool_start.py to async
- [ ] Convert log_tool_complete.py to async
- [ ] Measure performance improvements

**Deliverables:**
- 3 more async handlers
- Performance benchmarks
- Test coverage

**Expected Impact:**
- Faster pre-compact operations
- Better tool execution performance

### Phase 4: Cache Operations (Week 4)
**Goal:** Convert caching operations (needs careful testing)

- [ ] Profile cache operations to identify bottlenecks
- [ ] Convert cache_store.py to async (if worthwhile)
- [ ] Convert cache_result.py to async
- [ ] Add error handling for async backend failures
- [ ] Extensive testing with all backends (file, Redis, Qdrant)

**Deliverables:**
- Async cache storage (if beneficial)
- Comprehensive error handling
- Test coverage

**Expected Impact:**
- Faster post-tool-use operations
- Better cache backend error isolation

### Phase 5: Polish & Documentation (Week 5)
**Goal:** Finalize, document, measure

- [ ] Update all documentation
- [ ] Create async handler development guide
- [ ] Comprehensive performance benchmarks
- [ ] Migration guide for custom hooks
- [ ] Final testing and validation

**Deliverables:**
- Complete documentation
- Performance report
- Migration guide

---

## Testing Strategy

### Unit Tests
- Test async handlers in isolation
- Test error handling in async operations
- Test cancellation and cleanup

### Integration Tests
- Test async + sync handler interaction
- Test graceful shutdown
- Test event ordering preservation

### Performance Tests
- Benchmark async vs sync for each converted handler
- Measure total hook overhead reduction
- Profile cache backend latency

### Regression Tests
- Ensure no change in handler behavior
- Verify blocking handlers still block
- Verify observer handlers still run

---

## Risks and Mitigations

### Risk 1: Complexity Increase
**Impact:** High  
**Probability:** High  
**Mitigation:**
- Clear documentation
- Gradual rollout (phase by phase)
- Maintain backward compatibility
- Extensive testing

### Risk 2: Race Conditions
**Impact:** Medium  
**Probability:** Low  
**Mitigation:**
- Async handlers should be fire-and-forget (no shared state)
- Use asyncio.Lock for shared resources
- Comprehensive testing

### Risk 3: Graceful Shutdown
**Impact:** Medium  
**Probability:** Medium  
**Mitigation:**
- Implement proper atexit handlers
- Test process termination scenarios
- Add timeout for pending tasks

### Risk 4: Error Handling
**Impact:** Medium  
**Probability:** Medium  
**Mitigation:**
- Async errors must not crash hook runner
- Log errors but continue execution
- Test failure scenarios

### Risk 5: Performance Regression
**Impact:** High  
**Probability:** Low  
**Mitigation:**
- Benchmark before and after
- Profile to identify actual bottlenecks
- Only convert where benefit is clear

---

## Success Metrics

### Performance Metrics
- [ ] Observer hook overhead reduced by 20-40%
- [ ] Pre-compact time reduced by 30-50% (with large transcripts)
- [ ] Post-tool-use latency reduced by 10-20%
- [ ] No regression in blocking handler latency

### Quality Metrics
- [ ] 100% test coverage for async infrastructure
- [ ] Zero regressions in existing behavior
- [ ] All async handlers have error handling
- [ ] Documentation coverage for async patterns

### Adoption Metrics
- [ ] 8+ handlers converted to async (event loggers)
- [ ] 3+ high-impact handlers converted (backup, cache)
- [ ] Migration guide published
- [ ] Developer feedback positive

---

## Recommendations

### Immediate Actions (Do Now)
1. ✅ **Convert all observer handlers to async** (11 handlers)
   - 8 event_logger.py handlers (priority 900)
   - 3 specialized loggers (priority 800)
   - Lowest risk, highest consistency
   - Clear performance benefit
   - Simple implementation

2. ✅ **Convert transcript_backup.py to async**
   - Clear benefit for large transcripts
   - Low risk (fire-and-forget)
   - User-visible improvement

### Short-term Actions (Next Sprint)
3. ⚠️ **Consider cache_store.py async conversion**
   - Profile first to measure actual latency
   - Convert only if Redis/Qdrant is bottleneck
   - Add comprehensive error handling

4. ⚠️ **Consider chat_saver.py async conversion**
   - Ensure graceful shutdown works
   - Test with large transcripts
   - Minimal benefit unless transcripts are huge

### Long-term Actions (Future)
5. ❌ **Do NOT convert cache_lookup.py**
   - Keep synchronous for now
   - Cache hit must block anyway
   - Complex with little benefit
   - Profile first if considering

6. ❌ **Do NOT convert security/validation handlers**
   - Blocking is their purpose
   - Security-critical
   - No performance benefit

### Infrastructure
7. ✅ **Build async infrastructure incrementally**
   - Start with simple fire-and-forget
   - Add complexity only as needed
   - Maintain backward compatibility
   - Extensive testing before rollout

---

## Conclusion

Converting hooks to async execution offers clear benefits for observer and background operations while maintaining critical blocking behavior for security and validation. The phased approach ensures:

- ✅ Low risk (gradual rollout)
- ✅ High value (8+ handlers with clear benefits)
- ✅ Maintainability (clear patterns, good documentation)
- ✅ Performance (20-40% reduction in observer overhead)

**Recommendation:** Proceed with implementation starting with Phase 1 (infrastructure) and Phase 2 (event loggers).
