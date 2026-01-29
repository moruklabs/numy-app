---
description: Extract UI design descriptions from a folder or single screenshot using parallel image-analyzer agents
arguments:
  - name: path
    description: Path to a screenshot file or folder containing screenshots
    required: true
---

# Extract Designs Command

You are orchestrating the extraction of UI design descriptions from screenshots. The user has provided:

**Input Path:** $ARGUMENTS

## Your Task

1. **Analyze the input path** to determine if it's:
   - A single screenshot file (png, jpg, jpeg, webp, gif)
   - A folder containing multiple screenshots

2. **For a single file:**
   - Invoke the image-analyzer agent (Orchestrator tier) via Task tool with `subagent_type="image-analyzer"` and `model="haiku"` in design extraction mode
   - Pass the screenshot path for analysis
   - Save the output to a markdown file alongside the screenshot (same name with .md extension)

3. **For a folder:**
   - Use Glob to find all image files: `**/*.{png,jpg,jpeg,webp,gif,PNG,JPG,JPEG,WEBP,GIF}`
   - Launch **parallel** image-analyzer agents for ALL screenshots found (use multiple Task tool calls in a single message) in design extraction mode
   - Each agent should analyze one screenshot and save output to a .md file with matching name
   - After all agents complete, create a summary index file

## Execution Instructions

### Step 1: Determine Input Type

Use Bash with `ls -la` or `test -d` to check if the path is a file or directory.

### Step 2: Gather Screenshots

If folder, use Glob to find all screenshots. Report count to user.

### Step 3: Launch Parallel Extraction

**CRITICAL:** For multiple screenshots, you MUST launch ALL image-analyzer agents in a SINGLE message with multiple Task tool calls. This enables true parallel execution.

Example for 3 screenshots - send ONE message with THREE Task tool calls:

```
Task 1: image-analyzer for screenshot1.png (design extraction mode)
Task 2: image-analyzer for screenshot2.png (design extraction mode)
Task 3: image-analyzer for screenshot3.png (design extraction mode)
```

For each Task, use this prompt structure:

```
Analyze the screenshot at: [FULL_PATH] in design extraction mode.

Read the image file using the Read tool, then perform a complete UI analysis following your design extraction methodology.

After analysis, save your output to: [SAME_PATH_WITH_.md_EXTENSION]

Use the Write tool to save the analysis markdown file.
```

### Step 4: Create Summary (for folders only)

After all parallel extractions complete, create an `_index.md` file in the folder with:

- List of all analyzed screenshots
- Brief summary from each (first 2-3 lines of each analysis)
- Links to individual analysis files

## Output Format

For each screenshot, the image-analyzer will produce a detailed markdown analysis in design extraction mode.

Provide the user with:

1. Progress updates as agents are launched
2. Confirmation of output file locations
3. Any errors encountered
4. Final summary of all extracted designs

## Example Usage

```
# Single file
/extract-designs /path/to/screenshot.png

# Folder with multiple screenshots
/extract-designs /path/to/designs/folder

# Current directory
/extract-designs .
```

## Core Principles

### Parallelization (CRITICAL for Speed)

**MANDATORY:** For multiple screenshots, launch ALL agents in ONE message:

- Multiple image analyses -> ONE message with multiple Task calls
- This is NOT optional - sequential processing wastes significant time

### Depth-First Strategy (DFS over BFS)

When analyzing a single screenshot, go DEEP into all aspects:

- Complete full analysis of one screenshot before summarizing
- Finish all UI elements before moving to design system extraction

### Architecture Principles

**DRY & OPEN-CLOSED:**

- Reuse analysis patterns across screenshots
- Structure output for easy extension with new analysis dimensions

---

Begin by analyzing the provided path: $ARGUMENTS
