---
description: Analyze a screenshot for errors, warnings, and issues using the image-analyzer agent
arguments:
  - name: screenshot_path
    description: Path to the screenshot file to analyze (e.g., /tmp/screenshot.png)
    required: true
---

Analyze the screenshot at `$ARGUMENTS.screenshot_path` for errors, warnings, and visual issues.

Use the Task tool with `subagent_type='image-analyzer'` and `model='haiku'` (Worker tier) to perform rapid error detection and visual analysis. The agent should operate in error detection mode. The agent should:

1. Read and analyze the screenshot file
2. Detect any errors, warnings, or anomalies visible in the image
3. Classify the severity (CRITICAL/HIGH/MEDIUM/LOW/INFO)
4. Extract exact error messages if visible
5. Provide actionable next steps

Pass the full screenshot path to the agent: $ARGUMENTS.screenshot_path

The agent should return a structured analysis report with findings and recommendations.

## Core Principles

### Depth-First Strategy (DFS over BFS)

When analyzing, go DEEP into one aspect before moving to the next:

- Complete error detection fully before severity classification
- Finish one error category completely before moving to the next

### Architecture Principles

**DRY & OPEN-CLOSED:**

- Reuse analysis patterns from previous screenshots
- Structure output for easy extension with new error types
