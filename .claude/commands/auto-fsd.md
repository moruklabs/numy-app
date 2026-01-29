---
description: "FSD ETERNAL Autonomous Development - Runs FOREVER until 100% coverage and beyond"
argument-hint: "[initial-task or empty to continue from backlog]"
---

# Auto-FSD: FULLY AUTONOMOUS Eternal Development Mode

You are invoking the FULLY AUTONOMOUS FSD development workflow. This command runs FOREVER with
NO HUMAN INTERACTION. All decisions are made autonomously by specialized agents.

**Initial Task (optional):** $ARGUMENTS

## KEY PRINCIPLES

1. **NO QUESTIONS** - Never use AskUserQuestion. Delegate to agents or decide autonomously.
2. **NEVER STOP** - When backlog empties, @fsd-work-scout discovers new work automatically.
3. **100% COVERAGE** - Loop continues until unit, E2E, and mutation test coverage all hit 100%.
4. **ETERNAL LOOP** - Even after 100% coverage, discover new improvements via market research.

## Invocation Logic

Use the Task tool with `subagent_type="auto-fsd"` and instruct it to run in ETERNAL autonomous mode:

````
Task(
  subagent_type: "auto-fsd",
  model: "opus",
  prompt: "
    ## ETERNAL AUTONOMOUS FSD Development Mode

    You are running in FULLY AUTONOMOUS ETERNAL mode. You run FOREVER with NO human interaction.
    ALL decisions are made by you or delegated to specialized agents.

    ### CRITICAL RULES

    1. **NEVER use AskUserQuestion** - You MUST NOT ask the user anything
    2. **NEVER stop** - When backlog empties, discover new work via @fsd-work-scout
    3. **100% coverage required** - Unit, E2E, and mutation tests must ALL be 100%
    4. **Autonomous decisions** - Use @fsd-researcher or decide yourself

    ### Initial Task (if provided): $ARGUMENTS

    ### Autonomous Decision Protocol

    When ANY decision is needed:
    1. READ: Check SPEC.md, PRD.md, README.md, .docs/adr/
    2. ANALYZE: Grep/read similar code in codebase
    3. RESEARCH: WebSearch for best practices 2025
    4. DELEGATE: Invoke @fsd-researcher for complex decisions
    5. DECIDE: Use sensible defaults (secure > insecure, simple > complex)
    6. DOCUMENT: Create ADR for significant decisions

    ### MANDATORY Coverage Gates

    After EVERY task completion, check coverage:
    ```
    npm test -- --coverage          # Unit tests: MUST be 100%
    maestro test .maestro/          # E2E tests: MUST be 100%
    npx stryker run                 # Mutation score: MUST be 100%
    ```

    IF any coverage < 100%:
      → @fsd-work-scout generates coverage improvement tasks
      → Add as CRITICAL priority to backlog
      → Continue loop

    ### Eternal Loop Protocol

    ```
    FOREVER:
      1. Detect project root (git rev-parse --show-toplevel)
      2. Read CURRENT_TASK.md and .docs/backlog.md

      IF first run on project:
        - @fsd-police audits infrastructure (log results, don't ask)
        - Add gaps to backlog automatically

      COVERAGE CHECK (after every task):
        - Run all coverage commands
        - IF < 100%: Generate coverage tasks, continue loop

      IF backlog empty AND coverage 100%:
        - @fsd-work-scout discovers new work from:
          * Codebase: TODOs, tech debt, type ignores
          * Market: WebSearch competitor features
          * Security: npm audit, OWASP checks
          * Performance: bundle size, render efficiency
        - Add items to .docs/backlog.md
        - Continue loop (NEVER STOP)

      IF no active task (but backlog has items):
        - Pick next item (Critical → High → Medium → Low)
        - @fsd-pm creates SPEC.md AUTONOMOUSLY
        - @fsd-feasibility-checker validates
        - IF blocked: log and skip to next
        - @fsd-qa creates test plan AUTONOMOUSLY

      Execute task through TDD:
        - RED → @fsd-qa + @fsd-coder
        - GREEN → @fsd-qa + @fsd-coder + @fsd-validate
        - REFACTOR → @fsd-refactoring + @fsd-coder + @fsd-validate

      On task completion:
        - @fsd-commit (semantic commit)
        - Update .docs/changelog.md
        - Log to .docs/lessons-learned.md
        - Mark complete in backlog
        - Clear CURRENT_TASK.md
        - Run coverage check
        - IMMEDIATELY continue (NO USER PROMPT)

    LOOP FOREVER
    ```

    ### Backlog Priority Order

    Process tasks in this order:
    1. Current active task (if exists)
    2. Critical/Blocking items
    3. High Priority items
    4. Medium Priority items
    5. Low Priority items
    6. Icebox items (only if all others done)

    ### Documentation Updates (AFTER EACH TASK)

    After completing EACH task, update these files:

    #### .docs/changelog.md
    ```markdown
    ## [Date] - [Task Name]

    ### Added
    - [New feature/capability]

    ### Changed
    - [Modified behavior]

    ### Fixed
    - [Bug fix]

    ### Technical Notes
    - [Implementation details worth noting]
    ```

    #### .docs/lessons-learned.md
    ```markdown
    ## [Date] - [Task Name]

    ### What Worked Well
    - [Success pattern]

    ### Challenges Encountered
    - [Problem and how it was solved]

    ### Future Recommendations
    - [Insight for similar tasks]
    ```

    ### Progress Reporting

    After each task completion, display:
    ```
    ═══════════════════════════════════════════════════════════════
    ✓ TASK COMPLETE: [Task Name]
    ═══════════════════════════════════════════════════════════════
    Duration:     [Time spent]
    Tests Added:  [Count]
    Files Changed: [Count]

    Backlog Status:
    - Completed: [X] tasks
    - Remaining: [Y] tasks

    Next Task: [Next backlog item name]
    ═══════════════════════════════════════════════════════════════
    ```

    ### NEVER STOP - Eternal Loop

    This loop NEVER terminates. Even when all criteria below are met,
    @fsd-work-scout will discover new work and continue:

    Coverage Gates (ALL MUST BE 100%):
    - [ ] Unit Test Coverage: 100%
    - [ ] E2E Test Coverage: 100%
    - [ ] Mutation Test Score: 100%

    Quality Gates:
    - [ ] No TypeScript errors
    - [ ] No lint errors
    - [ ] All tests passing
    - [ ] Changelog updated

    When ALL above are met → @fsd-work-scout discovers NEW work:
    - Market research for competitor features
    - Security audits for vulnerabilities
    - Performance analysis for optimizations
    - UX improvements from accessibility audits
    → Loop continues FOREVER

    ### Coverage Milestone Report (Logged but loop continues)

    When 100% coverage milestone is reached, log this report but CONTINUE:

    ```
    ═══════════════════════════════════════════════════════════════
    ✅ COVERAGE MILESTONE REACHED
    ═══════════════════════════════════════════════════════════════
    Unit Test Coverage:    100% ✓
    E2E Test Coverage:     100% ✓
    Mutation Test Score:   100% ✓

    Total Tasks Completed: [N]
    Total Tests Added:     [N]
    Total Files Changed:   [N]

    Coverage milestone reached. Invoking @fsd-work-scout for new work...
    ═══════════════════════════════════════════════════════════════
    ```

    Then @fsd-work-scout discovers new work and loop CONTINUES.

    ### Emergency Stop (USER MUST EXPLICITLY REQUEST)

    The loop only stops if the user explicitly runs:
    - `/ralph-wiggum:cancel-ralph` - Cancel the loop
    - Ctrl+C in terminal - Force stop

    Otherwise, the loop runs FOREVER.

    ### Error Recovery

    If stuck on a task for more than 5 iterations:
    1. Document the blocker in CURRENT_TASK.md
    2. Move task to 'Blocked' section of backlog with reason
    3. Continue with next available task
    4. Report blocked tasks in final summary

    ### Emergency Stop

    User can stop the loop anytime with:
    /ralph-wiggum:cancel-ralph

    ### BEGIN CONTINUOUS DEVELOPMENT NOW

    Start by detecting project root and reading current state.
    If an initial task was provided, add it to backlog as Critical priority first.
    Then begin the continuous loop.
  "
)
````

## How It Works

```
┌─────────────────────────────────────────────────────────────┐
│                    /auto-fsd [task?]                        │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│  1. Detect Project Root (git rev-parse --show-toplevel)    │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│  2. Read State:                                             │
│     - CURRENT_TASK.md (active work)                         │
│     - .docs/backlog.md (remaining work)                     │
└────────────────────────────┬────────────────────────────────┘
                             │
              ┌──────────────┴──────────────┐
              ▼                             ▼
       ┌──────────────┐              ┌──────────────┐
       │ Active Task  │              │  No Task     │
       │   Exists     │              │  (pick next) │
       └──────┬───────┘              └──────┬───────┘
              │                              │
              │                              ▼
              │                     ┌────────────────┐
              │                     │ @fsd-pm        │
              │                     │ Create SPEC.md │
              │                     └───────┬────────┘
              │                              │
              │                              ▼
              │                     ┌────────────────┐
              │                     │ @fsd-qa        │
              │                     │ Create Tests   │
              │                     └───────┬────────┘
              │                              │
              └──────────────┬───────────────┘
                             │
                             ▼
              ┌──────────────────────────────┐
              │      Detect Phase            │
              └──────────────┬───────────────┘
                             │
       ┌─────────────────────┼─────────────────────┐
       ▼                     ▼                     ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   RED        │     │   GREEN      │     │  REFACTOR    │
│ Write Tests  │     │ Implement    │     │  Improve     │
│ @fsd-qa +    │     │ @fsd-qa +    │     │  @fsd-coder  │
│ @fsd-coder   │     │ @fsd-coder   │     │              │
└──────┬───────┘     └──────┬───────┘     └──────┬───────┘
       │                     │                     │
       └─────────────────────┼─────────────────────┘
                             │
                             ▼
              ┌──────────────────────────────┐
              │   Task Complete?             │
              └──────────────┬───────────────┘
                             │
              ┌──────────────┴──────────────┐
              ▼                             ▼
       ┌──────────────┐              ┌──────────────┐
       │   NO         │              │   YES        │
       │ Continue TDD │              │ Update Docs  │
       └──────────────┘              └──────┬───────┘
                                            │
                                            ▼
                                   ┌────────────────┐
                                   │ More Backlog?  │
                                   └───────┬────────┘
                                           │
                             ┌─────────────┴─────────────┐
                             ▼                           ▼
                      ┌──────────────┐            ┌──────────────┐
                      │   YES        │            │   NO         │
                      │ Loop to top  │            │ DONE! 🎉     │
                      │ (next task)  │            │ Final Report │
                      └──────────────┘            └──────────────┘
```

## Commands Comparison

| Command            | Behavior                    | When to Use                     |
| ------------------ | --------------------------- | ------------------------------- |
| `/fsd [task]`      | Single task execution       | Working on one specific feature |
| `/auto-fsd`        | Continuous until all done   | Autonomous project development  |
| `/auto-fsd [task]` | Add task, then continue all | Start new + complete everything |
| `/fsd-feasibility` | Check feature feasibility   | Before starting a risky feature |
| `/fsd-refactor`    | Analyze refactoring         | After GREEN, before REFACTOR    |
| `/fsd-commit`      | Create semantic commit      | After task completion           |

## Usage Examples

```bash
# Start autonomous development from existing backlog
/auto-fsd

# Add a new task and then complete ALL remaining work
/auto-fsd Add user authentication

# Check current status during execution
/fsd --status

# Emergency stop
/ralph-wiggum:cancel-ralph
```

## Output Files Updated

After each task completion:

- `SPEC.md` → Archived or updated
- `CURRENT_TASK.md` → Cleared for next task
- `.docs/changelog.md` → New entry added
- `.docs/lessons-learned.md` → Insights documented
- `.docs/backlog.md` → Task marked complete

## Safety Features

1. **Progress Persistence** - State saved after each phase transition
2. **Blocked Task Handling** - Stuck tasks moved aside, work continues
3. **Emergency Stop** - Cancel anytime without losing progress
4. **Documentation Trail** - Full changelog and lessons for every task

## Quality Gates

During continuous development, these agents ensure quality:

| Agent                    | Phase         | Purpose                           |
| ------------------------ | ------------- | --------------------------------- |
| @fsd-police              | Start         | Audit infrastructure compliance   |
| @fsd-feasibility-checker | Pre-TDD       | Validate feature is feasible      |
| @fsd-validate            | Post-GREEN    | Run TypeScript, lint, tests       |
| @fsd-refactoring         | Pre-REFACTOR  | Analyze improvement opportunities |
| @fsd-commit              | Post-REFACTOR | Create semantic commit            |

## Notes

- Uses Ralph loop optimization for efficient TDD cycles
- Follows strict Red-Green-Refactor discipline
- Applies just-in-time research (codebase → web → agent spawn)
- Max 20 iterations per Ralph loop before reassessment
- @fsd-validate runs after every GREEN phase
- @fsd-commit creates semantic commits after each task
