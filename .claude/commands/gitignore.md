---
description: Automatically detect and add relevant files to .gitignore by analyzing the codebase
---

You are orchestrating two specialized agents to intelligently update the project's .gitignore file.

## Workflow

### Phase 1: Codebase Analysis

First, launch the **codebase-explorer** agent (Worker tier, haiku) to understand the project structure:

Use the Task tool with `subagent_type: "codebase-explorer"` and `model: "haiku"` with this prompt:

```
Explore this codebase to identify:
1. The primary programming languages used
2. Frameworks and libraries (check package.json, requirements.txt, Cargo.toml, go.mod, etc.)
3. Build tools and bundlers in use
4. Any IDE/editor configuration files present
5. Testing frameworks
6. Infrastructure tools (Docker, Terraform, etc.)
7. Any existing .gitignore file and its current patterns

Provide a structured summary of the technology stack that will be used to determine what should be in .gitignore.
```

### Phase 2: Update .gitignore

After receiving the codebase analysis, launch the **gitignorer** agent (Worker tier, haiku):

Use the Task tool with `subagent_type: "gitignorer"` and `model: "haiku"`, including findings from Phase 1:

```
Based on this project analysis:
[INSERT CODEBASE-EXPLORER FINDINGS HERE]

Please:
1. Review the existing .gitignore (if any)
2. Create or update .gitignore with comprehensive patterns for all detected technologies
3. Ensure security-sensitive files are properly ignored (.env, credentials, keys)
4. Organize patterns with clear section comments
5. Report any files that are currently tracked but should be ignored (and provide untrack commands)
```

### Phase 3: Summary

After both agents complete, provide the user with:

- A summary of technologies detected
- Key additions made to .gitignore
- Any files that need to be manually untracked
- Suggestion to run `git status` to verify changes

## Core Principles

### Parallelization (CRITICAL for Speed)

When exploring the codebase, execute ALL searches in parallel:

- Multiple file pattern searches -> ONE message with multiple Glob calls
- Multiple content searches -> ONE message with multiple Grep calls

### Depth-First Strategy (DFS over BFS)

When analyzing, go DEEP into each technology stack before moving to the next:

- Complete analysis of one framework fully before moving to another
- Finish one category of patterns completely before starting another

### Architecture Principles

**DRY & OPEN-CLOSED:**

- Reuse common gitignore patterns from existing templates
- Design patterns for extension (use wildcards appropriately)
- Avoid redundant patterns that overlap

## Important Notes

- Always run Phase 1 before Phase 2 - the gitignorer needs context from the explorer
- If the project has no .gitignore, create one from scratch
- Be thorough but not excessive - only add patterns relevant to detected technologies
