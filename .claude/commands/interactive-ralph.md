---
description: "Interactive Ralph loop with human-in-the-loop validation, testing, and commit checkpoints at each iteration"
argument-hint: "<task-description>"
---

# Interactive Ralph: Human-in-the-Loop Iterative Development

You are orchestrating an **interactive Ralph Wiggum loop** with human oversight and validation at each iteration.

**Task:** $ARGUMENTS

## Philosophy: Human-in-the-Loop Development

This command enhances the Ralph loop with interactive checkpoints:

- **Critical questions** before starting the loop
- **Critical thinking review** via critical-thinker agent before execution
- **Validation scripts** after each iteration (user-defined per project)
- **Manual testing prompts** for human verification
- **Smart commit checkpoints** after validation success + human confirmation
- **Documentation updates** via documentation-orchestrator at key milestones
- **Auto-fix on failures** to keep momentum

---

## Step 1: Pre-Flight Questions & Setup

Before starting the Ralph loop, gather essential context using the AskUserQuestion tool:

### Question 1: Branching Strategy

Ask the user: "Do you want to create a new branch for this work or continue on the current branch?"

Options:

- **Create new branch**: Create a feature branch based on the task name (recommended for new features)
- **Stay on current**: Continue working on the current branch

If user chooses "Create new branch":

1. Generate a branch name from the task (e.g., "feat/add-authentication", "fix/login-bug")
2. Run: `git checkout -b [branch-name]`
3. Confirm branch creation

### Question 2: Validation Command

Ask the user: "What validation command should I run after each iteration?"

Options:

- **make validate**: Run your project's make validate command
- **npm test**: Run npm test suite
- **Custom command**: User specifies a custom validation command

Cache this validation command for use throughout the session.

### Question 3: Documentation Tracking

Ask the user: "Do you want documentation updates at key milestones?"

Options:

- **Full tracking**: Update CHANGELOG.md, STATUS.md, CURRENT_TASK.md at phase completions
- **Minimal tracking**: Only update CURRENT_TASK.md with task progress
- **None**: Skip documentation updates (faster but no tracking)

If user chooses "Full tracking" or "Minimal tracking":

- Cache this setting for use throughout the session
- Enable documentation-orchestrator integration

### Question 4: Critical Review Before Starting

Ask the user: "Do you want a critical thinking review of the approach before starting?"

Options:

- **Yes, review first**: Invoke critical-thinker agent to challenge assumptions and identify risks
- **Skip review**: Start immediately without critical analysis

### Question 5: Confirm Start

Ask: "Ready to start the interactive Ralph loop with these settings?"

Show summary:

```
═══════════════════════════════════════════════════════════
INTERACTIVE RALPH CONFIGURATION
═══════════════════════════════════════════════════════════
Task: [task description]
Branch: [branch name or current branch]
Validation: [validation command]
Commits: After each iteration (validation success + confirmation)
Documentation: [Full tracking | Minimal tracking | None]
Critical Review: [Yes | No]
═══════════════════════════════════════════════════════════
```

Options:

- **Yes, start the loop**: Begin the Ralph loop with interactive checkpoints
- **Adjust settings**: Let user modify validation command or branch choice

---

## Step 1.5: Critical Thinking Review (If Enabled)

If user requested critical review, invoke the critical-thinker agent:

```
subagent_type: critical-thinker
model: haiku
prompt: |
  Perform a critical analysis of this planned implementation task:

  TASK: "$ARGUMENTS"

  As a devil's advocate, please:

  1. **Challenge Core Assumptions**
     - What assumptions are we making about the problem?
     - Are we solving the symptom or root cause?
     - Could a simpler solution address the real problem?

  2. **Identify Risks & Edge Cases**
     - What could go wrong with this approach?
     - What edge cases might we miss?
     - What are the failure modes?

  3. **Evaluate Trade-offs**
     - What are we gaining vs. losing with this approach?
     - Is this over-engineered or under-engineered?
     - Are there hidden costs (complexity, maintenance)?

  4. **Suggest Alternatives**
     - What's the simplest possible solution?
     - What would a more robust solution look like?
     - What did others choose for similar problems?

  5. **Key Questions to Answer**
     - List 3-5 critical questions that should be answered before proceeding

  Format your response as:

  PROBLEM STATEMENT: [Restate what's being decided]

  CORE ASSUMPTIONS:
  - [Assumption 1 - is it valid?]
  - [Assumption 2 - is it valid?]

  RISKS & CONCERNS:
  - [Risk 1] - Impact: High/Medium/Low, Mitigation: [suggestion]

  WHAT'S GOOD ABOUT THIS APPROACH:
  - [Real benefit 1]
  - [Real benefit 2]

  ALTERNATIVES TO CONSIDER:
  1. [Alternative A] - Pros/Cons

  QUESTIONS TO ANSWER:
  - [Critical question 1]
  - [Critical question 2]

  RECOMMENDATION:
  [Go ahead / Reconsider / Need more info]
```

After receiving the critical analysis:

1. **Present the analysis to the user**
2. **Ask for confirmation:**
   - "Critical review complete. How would you like to proceed?"
   - Options:
     - **Proceed with original plan**: Continue with the task as planned
     - **Modify approach**: User describes changes based on the review
     - **Research first**: Do deeper research before starting
     - **Cancel**: Abort the task

If user chooses "Modify approach":

- Update the task description with user's modifications
- Continue to Step 2

---

## Step 2: Quick Initial Discovery (Like auto-ralph)

**Launch these TWO agents in parallel** - keep it fast:

### Agent 1: Codebase Explorer (haiku - Worker tier)

```
subagent_type: codebase-explorer
model: haiku
prompt: |
  Quick exploration for this task: "$ARGUMENTS"

  Return ONLY:
  1. Project type and tech stack
  2. 3-5 most relevant files/directories
  3. Key patterns to follow

  Keep it brief - we'll discover more as we implement.
```

### Agent 2: Task Complexity Assessment (haiku - Worker tier)

```
subagent_type: codebase-explorer
model: haiku
prompt: |
  Quick complexity assessment for: "$ARGUMENTS"

  Return:
  1. Complexity: simple/medium/complex/very complex
  2. Estimated phases (1-5)
  3. Recommended max-iterations (simple:10, medium:20, complex:35, very-complex:50, NEVER 0)
  4. First actionable step to start immediately

  IMPORTANT: max-iterations MUST be > 0 for safety. Never recommend 0 (infinite loops).

  No deep analysis needed - we'll research as we go.
```

---

## Step 3: Generate Interactive Ralph Loop Prompt

Using the quick discovery, generate a Ralph loop prompt with **INTERACTIVE CHECKPOINTS** at each iteration.

**CRITICAL - SHELL-SAFE PROMPT GENERATION:**

Before generating the /ralph-wiggum:ralph-loop command, you MUST sanitize the entire prompt:

1. **Character Replacement Rules:**
   - Replace backticks (`) with single quotes (')
   - Replace exclamation marks (!) with periods (.)
   - Replace unescaped dollar signs ($) with the word "dollar" or remove them
   - Use "===" or "###" instead of "---" for visual separators
   - Use asterisks (**bold**) or CAPS instead of emphasis with special chars

2. **Safe Formatting:**
   - Use plain text wherever possible
   - Use equals signs (===) for section dividers
   - Use asterisks (\*\*) for emphasis
   - Use hyphens only in lists, not as separators

3. **Verification Before Execution:**
   - Scan the final prompt string for: ` ! $ (except in flags)
   - If found, replace with safe alternatives
   - Double-check that command will execute in bash without expansion

**Interactive Ralph Loop Structure:**

```bash
/ralph-wiggum:ralph-loop "
# Interactive Ralph Loop: [Task Title]

## Objective
$ARGUMENTS

## Quick Context
[From codebase-explorer: tech stack, key files, patterns]

## IMPORTANT: Interactive Checkpoints

At the END of each iteration, you MUST follow this checkpoint workflow:

### Checkpoint 1: Validation
1. Run the validation command: [cached validation command from user]
2. If validation FAILS:
   - Analyze the errors
   - Attempt to auto-fix the issues
   - Re-run validation
   - If still failing after 1 auto-fix attempt, report to user and ask whether to:
     * Continue debugging (count as next iteration)
     * Skip and continue with loop
     * Abort the loop
3. If validation SUCCEEDS: proceed to Checkpoint 2

### Checkpoint 2: Manual Testing Prompt
Ask the user: 'Please test iteration [N] manually. What is the result?'

Options:
- **Working correctly**: Feature works as expected - continue to Checkpoint 3
- **Found issues**: User will describe problems - fix in next iteration
- **Skip testing**: User skips manual testing - continue to Checkpoint 3

If user found issues:
- Document the issues
- Plan fixes for next iteration
- Do NOT proceed to Checkpoint 3 (no commit)
- Continue loop

### Checkpoint 3: Commit Checkpoint
Ask the user: 'Iteration [N] validated successfully. Ready to commit these changes?'

Options:
- **Yes, commit now**: Create a commit with current changes
- **Skip for now**: Continue without committing
- **Show me git diff first**: Display git diff, then ask again

If user chooses to commit:
1. Run git status to show changes
2. Run git diff to show detailed changes
3. Analyze changes and create a meaningful commit message following conventional commits:
   - feat: New feature
   - fix: Bug fix
   - refactor: Code refactoring
   - test: Adding tests
   - docs: Documentation
   - chore: Maintenance
4. Execute: git add [relevant files]
5. Execute: git commit -m "[type]([scope]): [description]

🤖 Generated with Claude Code - Interactive Ralph Loop iteration [N]

Co-Authored-By: Claude <noreply@anthropic.com>"
6. Confirm commit with git log -1

### Checkpoint 4: Documentation Update (If Enabled)

**Only if documentation tracking is enabled (Full or Minimal):**

If "Full tracking" mode:
- After every 3-5 iterations OR at phase completion, invoke documentation-orchestrator:
  * Update CURRENT_TASK.md with task progress
  * Update STATUS.md with "What Just Happened"
  * If phase completed, add CHANGELOG.md entry

If "Minimal tracking" mode:
- Update CURRENT_TASK.md only (mark tasks complete, add new discovered tasks)

Ask user: "Update documentation for this milestone?"
Options:
- **Yes, update docs**: Invoke documentation-orchestrator or task-manager
- **Skip for now**: Continue without documentation update
- **End of phase**: Mark this as phase completion (triggers full documentation update)

### Checkpoint 5: Continue Decision
After commit (or skip), briefly summarize:
- What was accomplished this iteration
- What's next
- Continue to next iteration automatically

## Development Phases with Research Checkpoints

### Phase 1: [First Phase Name]
**Goal:** [Specific deliverable]
**Start with:** [First concrete step from quick discovery]
**Research trigger:** If stuck for 2+ iterations, research: [specific topic]
**Done when:** [Testable criteria]

**Remember: Run interactive checkpoints at the END of each iteration**

### Phase 2: [Second Phase Name]
**Goal:** [Building on Phase 1]
**Research trigger:** If encountering [specific pattern/library], research best practices
**Done when:** [Testable criteria]

**Remember: Run interactive checkpoints at the END of each iteration**

[Continue phases as needed...]

## Research Guidelines (Just-In-Time)

**DO research during iterations when:**
- You hit an unfamiliar API/library
- Error messages suggest missing knowledge
- Architecture decision has multiple valid paths
- Security-sensitive code needs validation

**HOW to research during iterations:**
1. Use WebSearch tool with query: [specific question] 2025
2. Use WebFetch tool to fetch specific documentation pages
3. Document findings in a comment before implementing
4. Apply research immediately in the same iteration

**DO NOT over-research:**
- Skip research if you can make reasonable progress
- One focused search > multiple broad searches
- Implementation validates assumptions faster than research

## Completion Criteria
- [ ] All phases complete
- [ ] All iterations validated successfully
- [ ] Tests passing
- [ ] No TypeScript/linting errors
- [ ] User confirmed manual testing passes
- [ ] [Task-specific criteria]

When ALL criteria are met, output: <promise>INTERACTIVE_RALPH_COMPLETE</promise>

## Emergency Commands

**Pause the loop:** Ask user for guidance if stuck
**Cancel the loop:** /ralph-wiggum:cancel-ralph
" --max-iterations [N from assessment] --completion-promise "INTERACTIVE_RALPH_COMPLETE"
```

---

## Step 4: Display Configuration and Execute

Display the configuration summary:

```
═══════════════════════════════════════════════════════════
INTERACTIVE RALPH LOOP STARTING
═══════════════════════════════════════════════════════════
Task: $ARGUMENTS
Branch: [branch name]
Validation: [validation command]
Max Iterations: [N]
Interactive Checkpoints: ✓ Enabled
  - Validation after each iteration
  - Manual testing prompts
  - Smart commit checkpoints
═══════════════════════════════════════════════════════════
Quick Discovery Results:
- Tech stack: [summary]
- Key files: [list]
- Complexity: [X] → Iterations: [N]
═══════════════════════════════════════════════════════════
```

**IMMEDIATELY execute the generated Ralph loop command** - no additional confirmation needed.

---

## Step 5: Post-Loop Completion

When the Ralph loop completes (promise received), perform these actions:

### 5.1: Final Documentation Update (If Enabled)

**If documentation tracking was enabled (Full or Minimal):**

Invoke the documentation-orchestrator for comprehensive updates:

```
subagent_type: documentation-orchestrator
model: sonnet
prompt: |
  The Interactive Ralph loop has completed for task: "$ARGUMENTS"

  Please perform a Phase Completion documentation update:

  1. **CHANGELOG.md**: Add entry for this development iteration
     - Document what was Added, Changed, Fixed
     - Include technical metrics if available

  2. **STATUS.md**: Update current state
     - Update "What Just Happened" with accomplishments
     - Update "What's Next" with remaining work or next phase

  3. **CURRENT_TASK.md**: Update task tracking
     - Mark completed tasks as done
     - Archive any completed phase tasks
     - Add any new tasks discovered during development

  4. **DECISIONS.md** (if applicable): Document any architectural decisions made

  Commit all documentation changes with message:
  "docs: Complete Interactive Ralph loop - [brief summary]"
```

### 5.2: User Options

Ask the user: "Interactive Ralph loop completed. What would you like to do next?"

Options:

- **Create pull request**: Push branch and create a PR for review
- **Continue iterating**: Start another interactive Ralph loop for refinements
- **Review changes**: Show git log and git diff summary
- **Critical review of results**: Invoke critical-thinker to review what was built
- **Done for now**: Finish the session

If user chooses "Create pull request":

1. Check if branch has remote tracking: `git branch -vv`
2. If not, push with: `git push -u origin [branch-name]`
3. Use `gh pr create` to create the PR with a comprehensive summary
4. Include all commit messages in the PR description
5. Return the PR URL

If user chooses "Critical review of results":

1. Invoke critical-thinker agent to review the implementation:

   ```
   subagent_type: critical-thinker
   model: haiku
   prompt: |
     Review the implementation just completed for task: "$ARGUMENTS"

     Analyze the code changes (use git diff to see what was changed) and provide:

     1. **Quality Assessment**: Is the implementation solid?
     2. **Risk Analysis**: Any potential issues or bugs?
     3. **Technical Debt**: Does this create future problems?
     4. **Improvement Suggestions**: What could be better?
     5. **Security Review**: Any security concerns?

     Provide a brief, actionable summary.
   ```

2. Present findings to user
3. Ask if they want to address any concerns in another iteration

---

## Key Differences from auto-ralph

| Feature         | auto-ralph                     | interactive-ralph                                |
| --------------- | ------------------------------ | ------------------------------------------------ |
| Validation      | None (trust the loop)          | After every iteration                            |
| Manual Testing  | None                           | Prompted after each iteration                    |
| Commits         | Manual (after loop)            | After each validated iteration                   |
| Human Oversight | Minimal                        | Continuous                                       |
| Auto-fix        | Not applicable                 | Auto-fix validation failures                     |
| Branching       | Manual                         | Asked before starting                            |
| Speed           | Faster (autonomous)            | Slower (human checkpoints)                       |
| Critical Review | None                           | Optional pre/post analysis via critical-thinker  |
| Documentation   | None                           | Optional tracking via documentation-orchestrator |
| Use Case        | Trusted, straightforward tasks | Critical features, learning, debugging           |

---

## When to Use interactive-ralph vs auto-ralph

**Use interactive-ralph when:**

- Building critical features that need validation
- Learning a new codebase or technology
- Debugging complex issues
- Want granular commit history
- Need to manually test after each change
- Working on features with high risk
- Want critical analysis before/after implementation
- Need documentation tracking for team visibility

**Use auto-ralph when:**

- Task is well-understood and low-risk
- Trust the autonomous loop
- Speed is priority over oversight
- Will review and commit after completion
- Refactoring or straightforward implementations
- Documentation tracking not needed

---

## Emergency Stop

If the loop gets stuck or needs to be cancelled:

```
/ralph-wiggum:cancel-ralph
```

This will terminate the loop immediately from any directory.

---

## Validation Command Examples

Based on project type, suggest these defaults when asking for validation:

| Project Type       | Suggested Command                |
| ------------------ | -------------------------------- |
| Node.js/TypeScript | `npm run type-check && npm test` |
| Python             | `pytest` or `python -m pytest`   |
| React Native/Expo  | `npm run type-check && npm test` |
| Rust               | `cargo test`                     |
| Go                 | `go test ./...`                  |
| Generic            | `make validate`                  |

---

## Integrated Agents

### critical-thinker (Specialist - Sonnet)

**Purpose:** Devil's advocate for challenging assumptions and identifying risks

**Integration Points:**

1. **Pre-loop (Step 1.5):** Optional critical review before starting implementation
   - Challenges assumptions about the problem
   - Identifies risks and edge cases
   - Suggests alternatives
   - Recommends: Go ahead / Reconsider / Need more info

2. **Post-loop (Step 5.2):** Optional review of completed implementation
   - Quality assessment
   - Risk analysis
   - Technical debt evaluation
   - Security concerns

**When to Enable:** High-risk features, unfamiliar domains, architectural decisions

### documentation-orchestrator (Orchestrator - Opus)

**Purpose:** Coordinates 6 documentation management agents for comprehensive tracking

**Integration Points:**

1. **During loop (Checkpoint 4):** Periodic documentation updates
   - Full tracking: CHANGELOG, STATUS, CURRENT_TASK at milestones
   - Minimal tracking: CURRENT_TASK only

2. **Post-loop (Step 5.1):** Final documentation update
   - Phase completion entry in CHANGELOG
   - Status update with accomplishments
   - Task tracking updates
   - Optional architectural decision records

**Sub-agents orchestrated:**

- changelog-manager: CHANGELOG.md (Keep a Changelog format)
- status-manager: STATUS.md (project state tracking)
- task-manager: CURRENT_TASK.md (priority-based task tracking)
- decision-manager: DECISIONS.md (ADR format)
- ticket-manager: TICKET.md (feature specifications)
- claude-manager: CLAUDE.md (workflow protocols)

**When to Enable:** Team projects, documentation requirements, audit trails

---

## Core Principles

### Parallelization (CRITICAL for Speed)

When gathering context, execute ALL in parallel:

- Step 2 agents (codebase-explorer + complexity assessment) -> ONE message
- Multiple file reads -> ONE message with multiple Read calls
- Git operations (status + diff + log) -> ONE message with multiple Bash calls

### Depth-First Strategy (DFS over BFS)

When implementing, go DEEP into one iteration before moving to the next:

- Complete one iteration fully (implement, validate, test, commit) before starting another
- Finish one checkpoint completely before moving to the next

### Architecture Principles

**FSD over DDD:** Follow Feature-Sliced Design architecture for implementations.

**TDD First:** Each iteration follows RED-GREEN-REFACTOR cycle.

**DRY & OPEN-CLOSED:**

- Check existing patterns before creating new ones
- Design for extension without modification
- Extract common logic into shared utilities

## Notes

- The validation command is cached for the session and reused for all iterations
- Auto-fix attempts are limited to 1 per validation failure to prevent infinite loops
- Commits are only created after validation success AND user confirmation
- Manual testing prompts can be skipped if user is confident
- The loop continues even if commits are skipped (allowing batch commits later)
- All commit messages include "Interactive Ralph Loop iteration [N]" for traceability
- Critical-thinker integration is optional - skip for well-understood tasks
- Documentation tracking is optional - choose None for maximum speed
- documentation-orchestrator uses Opus model for complex multi-agent coordination
