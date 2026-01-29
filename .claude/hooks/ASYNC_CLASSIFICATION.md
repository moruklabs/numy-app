# Hook Handler Async Classification - Quick Reference

**Last Updated:** 2025-12-24  
**Total Handlers:** 24  
**Async Candidates:** 12  
**Must Remain Sync:** 12

---

## Classification by Handler

| Handler | Event Type | Priority | Async? | Reason | Impact |
|---------|-----------|----------|--------|--------|--------|
| **log_agent_decision.py** | on_agent_decision | 800 | 🟢 Yes | Observer, logging only | Low-Med |
| rate_limiter.py | on_agent_decision | 50 | 🔴 No | Must block if limit exceeded | N/A |
| **event_logger.py** | on_notification | 900 | 🟢 Yes | Observer, logging only | Low-Med |
| **event_logger.py** | on_post_tool_use | 900 | 🟢 Yes | Observer, logging only | Low-Med |
| cache_store.py | on_post_tool_use | 150 | 🟡 Maybe | Background cache, needs testing | Med-High |
| subagent_validator.py | on_post_tool_use | 100 | 🔴 No | Want immediate feedback | N/A |
| **event_logger.py** | on_pre_compact | 900 | 🟢 Yes | Observer, logging only | Low-Med |
| **transcript_backup.py** | on_pre_compact | 100 | 🟢 Yes | Background file copy | Med-High |
| **event_logger.py** | on_pre_tool_use | 900 | 🟢 Yes | Observer, logging only | Low-Med |
| dangerous_rm_blocker.py | on_pre_tool_use | 20 | 🔴 No | Security critical, must block | N/A |
| env_file_blocker.py | on_pre_tool_use | 10 | 🔴 No | Security critical, must block | N/A |
| cache_lookup.py | on_pre_tool_use | 5 | 🔴 No | Must block on cache hit | N/A |
| **event_logger.py** | on_session_start | 900 | 🟢 Yes | Observer, logging only | Low-Med |
| context_loader.py | on_session_start | 100 | 🔴 No | Critical path, must complete | N/A |
| github_token_cleaner.py | on_session_start | 100 | 🔴 No | Security, must complete | N/A |
| **event_logger.py** | on_stop | 900 | 🟢 Yes | Observer, logging only | Low-Med |
| chat_saver.py | on_stop | 100 | 🟡 Maybe | Fire-and-forget, needs shutdown | Low-Med |
| **event_logger.py** | on_subagent_stop | 900 | 🟢 Yes | Observer, logging only | Low-Med |
| chat_saver.py | on_subagent_stop | 100 | 🟡 Maybe | Fire-and-forget, needs shutdown | Low-Med |
| **log_tool_complete.py** | on_tool_complete | 800 | 🟢 Yes | Observer, logging only | Low-Med |
| cache_result.py | on_tool_complete | 150 | 🟡 Maybe | Background cache, needs testing | Low-Med |
| **log_tool_start.py** | on_tool_start | 800 | 🟢 Yes | Observer, logging only | Low-Med |
| **event_logger.py** | on_user_prompt_submit | 900 | 🟢 Yes | Observer, logging only | Low-Med |
| prompt_validator.py | on_user_prompt_submit | 50 | 🔴 No | Must block invalid prompts | N/A |

**Legend:**
- 🟢 **Yes** = Should be converted to async (clear benefit, low risk)
- 🟡 **Maybe** = Consider async after profiling/testing
- 🔴 **No** = Must remain synchronous (blocking required)

---

## Summary by Event Type

| Event Type | Total | Async | Maybe | Sync |
|------------|-------|-------|-------|------|
| on_agent_decision | 2 | 1 | 0 | 1 |
| on_notification | 1 | 1 | 0 | 0 |
| on_post_tool_use | 3 | 1 | 1 | 1 |
| on_pre_compact | 2 | 2 | 0 | 0 |
| on_pre_tool_use | 4 | 1 | 0 | 3 |
| on_session_start | 3 | 1 | 0 | 2 |
| on_stop | 2 | 1 | 1 | 0 |
| on_subagent_stop | 2 | 1 | 1 | 0 |
| on_tool_complete | 2 | 1 | 1 | 0 |
| on_tool_start | 1 | 1 | 0 | 0 |
| on_user_prompt_submit | 2 | 1 | 0 | 1 |
| **TOTALS** | **24** | **12** | **4** | **8** |

---

## Summary by Priority Band

| Priority Band | Description | Total | Async | Must Sync |
|---------------|-------------|-------|-------|-----------|
| 0-99 | Blockers (Security, Critical) | 5 | 0 | 5 |
| 100-199 | Standard Handlers | 9 | 1 | 4 |
| 800-899 | Observers | 3 | 3 | 0 |
| 900-999 | Cleanup/Logging | 8 | 8 | 0 |

**Key Insight:** All priority 800+ handlers (observers) are async candidates!

---

## Conversion Priority

### Phase 1: High Priority (Do First) ⭐⭐⭐
**All observer handlers (11 total)**
- 8 event_logger.py handlers (priority 900)
- 3 specialized loggers (log_agent_decision.py, log_tool_start.py, log_tool_complete.py at priority 800)
- Identical pattern across all
- Clear async benefit
- Low risk
- Low effort
- **Total Impact:** Medium (cumulative)

**transcript_backup.py**
- High impact for large files
- Clear async benefit
- Low risk
- **Impact:** Medium-High

### Phase 2: Low Priority (Profile First) ⭐
**cache_store.py, cache_result.py**
- Need profiling data
- Complex (multiple backends)
- Moderate risk
- **Impact:** Potentially High (if Redis/Qdrant slow)

**chat_saver.py (2 instances)**
- Need graceful shutdown
- Moderate complexity
- **Impact:** Low-Medium

### Phase 3: Do Not Convert ❌
**All security and critical path handlers (12 total)**
- Blocking is required
- No performance benefit
- Risk of breaking functionality

---

## Quick Decision Tree

```
Is this handler at priority 800+?
├─ YES → Convert to async ✅
└─ NO  → Is it a security validator or must block?
         ├─ YES → Keep sync ❌
         └─ NO  → Is it I/O heavy or fire-and-forget?
                  ├─ YES → Consider async 🟡
                  └─ NO  → Keep sync ❌
```

---

## Implementation Order

1. ✅ **Phase 1:** Infrastructure + 11 observer handlers (Week 1-2)
2. ✅ **Phase 2:** transcript_backup (Week 2-3)
3. 🟡 **Phase 3:** Cache operations (only if profiling shows benefit) (Week 3-4)
4. 🟡 **Phase 4:** chat_saver (if graceful shutdown solid) (Week 4)
5. ✅ **Phase 5:** Documentation + polish (Week 5)

---

## Expected Outcomes

### Performance Improvements
- **Observer overhead:** 20-40% reduction
- **Pre-compact time:** 30-50% reduction (large transcripts)
- **Post-tool latency:** 10-20% reduction (if cache async)

### Code Quality
- Clearer separation of concerns
- Better resource utilization
- More responsive operations

### Risks Mitigated
- All security handlers remain sync
- Critical path unchanged
- Backward compatible (sync handlers continue working)

---

## References

- **Full Audit:** `ASYNC_HOOKS_AUDIT.md`
- **Implementation Plan:** `ASYNC_CONVERSION_PLAN.md`
- **Hooks Guide:** `HOOKS_GUIDE.md`
