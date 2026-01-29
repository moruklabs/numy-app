# Claude Code Hooks Documentation

This directory contains the Claude Code hooks system and documentation.

---

## Quick Start

| Document | Purpose | Audience |
|----------|---------|----------|
| 📚 **[HOOKS_GUIDE.md](HOOKS_GUIDE.md)** | Complete guide to hooks system | Developers |
| 🎯 **[ASYNC_EXECUTIVE_SUMMARY.md](ASYNC_EXECUTIVE_SUMMARY.md)** | Async conversion decision summary | Stakeholders |
| 📊 **[ASYNC_HOOKS_AUDIT.md](ASYNC_HOOKS_AUDIT.md)** | Detailed technical analysis | Engineers |
| 📋 **[ASYNC_CONVERSION_PLAN.md](ASYNC_CONVERSION_PLAN.md)** | Implementation guide | Implementers |
| 🔍 **[ASYNC_CLASSIFICATION.md](ASYNC_CLASSIFICATION.md)** | Handler classification table | Quick Reference |

---

## For Developers: Understanding Hooks

### What are Claude Code Hooks?

Hooks provide deterministic automation that transforms recommendations into guaranteed actions. Instead of relying on Claude to remember to validate inputs or format code, hooks ensure these actions happen every time.

**Start here:** [HOOKS_GUIDE.md](HOOKS_GUIDE.md)

### How do I create a hook handler?

1. Choose the appropriate hook event type (PreToolUse, PostToolUse, etc.)
2. Create a handler class extending `BaseHandler` (sync) or `AsyncBaseHandler` (async)
3. Implement `should_run()` and `run()` methods
4. Place in the appropriate `on_*` directory

**See:** [HOOKS_GUIDE.md - Creative Agentic Patterns](HOOKS_GUIDE.md#creative-agentic-patterns)

### When should I use async vs sync?

**Use async for:**
- 🟢 Logging and telemetry (fire-and-forget)
- 🟢 Background file operations (backups, cleanup)
- 🟢 Non-critical caching

**Use sync for:**
- 🔴 Security validation (must block dangerous operations)
- 🔴 Input modification (must transform before tool runs)
- 🔴 Critical path operations (context loading, rate limiting)

**See:** [HOOKS_GUIDE.md - Async vs Synchronous Hooks](HOOKS_GUIDE.md#async-vs-synchronous-hooks)

---

## For Stakeholders: Async Conversion Project

### Should we convert hooks to async?

**TL;DR:** Yes, but start small (Phases 1-2).

**Benefits:**
- 20-40% reduction in observer hook overhead
- 30-50% faster pre-compact operations
- Better resource utilization

**Risks:**
- Complexity increase (mitigated by phased approach)
- Need proper testing (covered in plan)

**Recommendation:** Approve Phases 1-2 (2 weeks), evaluate before continuing.

**Start here:** [ASYNC_EXECUTIVE_SUMMARY.md](ASYNC_EXECUTIVE_SUMMARY.md)

### What's the implementation plan?

5 phases over 5 weeks, but can stop after Phase 2 (2 weeks) if not seeing benefit.

**See:** [ASYNC_CONVERSION_PLAN.md](ASYNC_CONVERSION_PLAN.md)

### Which handlers should be async?

- ✅ **11 handlers:** All observer handlers (8 event_logger.py at priority 900 + 3 specialized loggers at priority 800)
- ✅ **1 handler:** transcript_backup.py
- 🟡 **4 handlers:** Cache operations (profile first)
- ❌ **12 handlers:** Security validators, critical path (must stay sync)

**See:** [ASYNC_CLASSIFICATION.md](ASYNC_CLASSIFICATION.md)

---

## For Engineers: Technical Analysis

### Complete Audit Report

**Document:** [ASYNC_HOOKS_AUDIT.md](ASYNC_HOOKS_AUDIT.md) (21KB)

**Contents:**
- Hook-by-hook analysis of all 24 handlers
- I/O operations, blocking requirements, performance impact
- Summary statistics and classification matrix
- Infrastructure requirements
- Implementation plan with 5 phases
- Risk analysis and mitigation strategies
- Testing strategy
- Success metrics

### Handler Classification

**Document:** [ASYNC_CLASSIFICATION.md](ASYNC_CLASSIFICATION.md) (6KB)

**Contents:**
- At-a-glance table of all 24 handlers
- Async recommendations for each
- Summary by event type and priority band
- Conversion priority order
- Quick decision tree

### Implementation Guide

**Document:** [ASYNC_CONVERSION_PLAN.md](ASYNC_CONVERSION_PLAN.md) (8KB)

**Contents:**
- Phase-by-phase implementation checklist
- Code templates for async handlers
- Testing checklist
- Success criteria
- Rollback plan
- Quick wins and anti-patterns

---

## Directory Structure

```
.claude/hooks/
├── README.md                       # This file
├── HOOKS_GUIDE.md                  # Main hooks documentation
├── ASYNC_EXECUTIVE_SUMMARY.md      # Decision summary for stakeholders
├── ASYNC_HOOKS_AUDIT.md            # Complete technical analysis
├── ASYNC_CONVERSION_PLAN.md        # Implementation guide
├── ASYNC_CLASSIFICATION.md         # Handler classification table
│
├── on_agent_decision/              # Agent decision hooks
│   ├── log_agent_decision.py       # 🟢 Async candidate
│   └── rate_limiter.py             # 🔴 Must stay sync
│
├── on_notification/                # Notification hooks
│   └── event_logger.py             # 🟢 Async candidate
│
├── on_post_tool_use/               # Post-tool hooks
│   ├── event_logger.py             # 🟢 Async candidate
│   ├── cache_store.py              # 🟡 Consider async
│   └── subagent_validator.py       # 🔴 Must stay sync
│
├── on_pre_compact/                 # Pre-compact hooks
│   ├── event_logger.py             # 🟢 Async candidate
│   └── transcript_backup.py        # 🟢 Async candidate
│
├── on_pre_tool_use/                # Pre-tool hooks
│   ├── event_logger.py             # 🟢 Async candidate
│   ├── dangerous_rm_blocker.py     # 🔴 Must stay sync (security)
│   ├── env_file_blocker.py         # 🔴 Must stay sync (security)
│   └── cache_lookup.py             # 🔴 Must stay sync (blocking)
│
├── on_session_start/               # Session start hooks
│   ├── event_logger.py             # 🟢 Async candidate
│   ├── context_loader.py           # 🔴 Must stay sync (critical path)
│   └── github_token_cleaner.py     # 🔴 Must stay sync (security)
│
├── on_stop/                        # Stop hooks
│   ├── event_logger.py             # 🟢 Async candidate
│   └── chat_saver.py               # 🟡 Consider async
│
├── on_subagent_stop/               # Subagent stop hooks
│   ├── event_logger.py             # 🟢 Async candidate
│   └── chat_saver.py               # 🟡 Consider async
│
├── on_tool_complete/               # Tool complete hooks
│   ├── log_tool_complete.py        # 🟢 Async candidate
│   └── cache_result.py             # 🟡 Consider async
│
├── on_tool_start/                  # Tool start hooks
│   └── log_tool_start.py           # 🟢 Async candidate
│
├── on_user_prompt_submit/          # Prompt submit hooks
│   ├── event_logger.py             # 🟢 Async candidate
│   └── prompt_validator.py         # 🔴 Must stay sync (validation)
│
├── utils/                          # Shared utilities
│   ├── base_handler.py             # Handler base classes
│   ├── event_runner.py             # Event orchestration
│   ├── logging_utils.py            # Logging infrastructure
│   └── ...                         # Other utilities
│
└── tests/                          # Hook tests
    └── ...
```

**Legend:**
- 🟢 Async candidate (clear benefit, low risk)
- 🟡 Consider async (needs profiling/testing)
- 🔴 Must stay sync (blocking required)

---

## Common Questions

### Q: How do I add a new hook handler?

1. Choose the event type (see HOOKS_GUIDE.md)
2. Create a Python file in the appropriate `on_*` directory
3. Extend `BaseHandler` (sync) or `AsyncBaseHandler` (async)
4. Implement `should_run()` and `run()` methods
5. Set appropriate priority (0-99: blockers, 100-199: standard, 900+: observers)

### Q: What's the difference between sync and async handlers?

- **Sync handlers:** Block execution until complete (use for security, validation)
- **Async handlers:** Run in background (use for logging, telemetry, backups)

### Q: When should I use each priority band?

- **0-99:** Blockers (security, validation) - run first, can block operations
- **100-199:** Standard (transformation, enhancement) - normal processing
- **800-899:** Observers (non-blocking logging) - should be async
- **900-999:** Cleanup (final actions) - should be async

### Q: How do I test a hook handler?

See `tests/` directory for examples. All handlers should have:
- Unit tests (handler in isolation)
- Integration tests (with other handlers)
- Performance tests (if relevant)

### Q: Can hooks communicate with each other?

Yes, via `context.shared_state` dict. Earlier handlers (lower priority) can set state that later handlers read.

### Q: What happens if a handler fails?

- Blocking handlers (exit code 2): Operation is blocked
- Non-blocking handlers (exit code 1): Error is logged, operation continues
- Success (exit code 0): Continue normally

---

## Contributing

When adding or modifying hooks:

1. **Follow existing patterns** - Look at similar handlers first
2. **Test thoroughly** - Unit + integration tests required
3. **Document** - Update this README and HOOKS_GUIDE.md
4. **Consider async** - Use decision tree in ASYNC_CLASSIFICATION.md
5. **Mind priority** - Choose appropriate priority band
6. **Handle errors** - Hooks should never crash the system

---

## Status

- ✅ **Hooks System:** Fully functional, production-ready
- ✅ **Async Audit:** Complete (2025-12-24)
- ⏳ **Async Implementation:** Pending approval
- 📊 **Handlers:** 24 total (8 async candidates, 4 maybes, 12 sync required)

---

## Next Steps

### For Reviewers
1. Read [ASYNC_EXECUTIVE_SUMMARY.md](ASYNC_EXECUTIVE_SUMMARY.md)
2. Decide: Approve, defer, or reject async conversion
3. If approved: Create feature branch `feature/async-hooks`

### For Implementers
1. Read [ASYNC_CONVERSION_PLAN.md](ASYNC_CONVERSION_PLAN.md)
2. Follow phase-by-phase checklist
3. Test after each phase
4. Measure performance improvements

### For Users
1. Read [HOOKS_GUIDE.md](HOOKS_GUIDE.md)
2. Create custom handlers as needed
3. Follow async vs sync guidelines
4. Contribute improvements

---

## Resources

- **Documentation:** All .md files in this directory
- **Code:** `utils/` for infrastructure, `on_*/` for handlers
- **Tests:** `tests/` directory
- **Examples:** See existing handlers for patterns

---

Last Updated: 2025-12-24  
Status: Analysis Complete, Ready for Decision
