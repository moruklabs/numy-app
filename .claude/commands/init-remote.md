---
description: Create a private GitHub repository with smart naming suggestions
---

Create a new private GitHub repository using the GitHub CLI, with intelligent repository name suggestions based on project type and best practices.

## Requirements

- Ensure `gh` (GitHub CLI) is installed and authenticated
- Verify we're in a git repository
- Check if remote 'origin' already exists

## Steps

1. **Verify Prerequisites**
   - Check if `gh` CLI is installed: `gh --version`
   - Verify user is authenticated: `gh auth status`
   - Confirm we're in a git repository: `git rev-parse --git-dir`
   - Verify if remote 'origin' exists: `git remote get-url origin`

2. **Analyze Project Context**
   - Get current directory name: `basename $(pwd)`
   - Detect project type by checking for key files:
     - `package.json` (Node.js/JavaScript/TypeScript)
     - `pyproject.toml` or `setup.py` (Python)
     - `app.json` (Expo/React Native)
     - `Cargo.toml` (Rust)
     - `go.mod` (Go)
     - `.next/` directory (Next.js)
   - Check for framework indicators:
     - React Native: `"react-native"` in package.json
     - Next.js: `"next"` in package.json or `.next/` directory
     - FastAPI: `"fastapi"` in pyproject.toml
     - CLI tools: `bin/` directory or executable files

3. **Generate Smart Repository Name Suggestions**

   Use the AskUserQuestion tool to present repository name options following these **NAMING CONVENTIONS**:

   **Rules:**
   - **Always use kebab-case** (lowercase with hyphens, never camelCase or snake_case)
   - **Be descriptive but concise** (3-4 words maximum)
   - **Include purpose/function** using common suffixes
   - **Technology indicators should be suffixes** (e.g., `-rn`, `-next`, `-py`)

   **Common Suffixes by Purpose:**
   - `-app` = Applications
   - `-cli` = Command-line tools
   - `-api` = API/backend services
   - `-client` = Client libraries
   - `-server` = Server components
   - `-sdk` = Software Development Kits
   - `-plugin` = Extensions/plugins
   - `-toolkit` = Tool collections
   - `-generator` = Code/content generators
   - `-optimizer` = Optimization tools
   - `-explorer` = Discovery/exploration tools
   - `-enhancer` = Browser extensions/augmentation
   - `-automation` = Automation tools
   - `-converter` = Format/type converters

   **Technology Suffixes:**
   - `-rn` = React Native
   - `-next` = Next.js
   - `-py` = Python
   - `-rs` = Rust
   - `-go` = Go
   - `-ts` = TypeScript

   **Generate 3-4 Options:**

   Option 1: **Directory name normalized to kebab-case**
   - Example: `my-project` → `my-project`
   - Example: `MyProject` → `my-project`

   Option 2: **Directory name + technology suffix**
   - If React Native detected: `project-name-rn`
   - If Next.js detected: `project-name-next`
   - If Python detected: `project-name-py`

   Option 3: **Directory name + purpose suffix**
   - If package.json has `"bin"`: `project-name-cli`
   - If API/server detected: `project-name-api` or `project-name-server`
   - If library/SDK: `project-name-sdk` or `project-name-client`
   - If general app: `project-name-app`

   Option 4: **Directory name + tech + purpose** (for complex projects)
   - Example: `mobile-interval-timer` (platform + product)
   - Example: `next-blog-api` (tech + purpose + function)

   **Present these options using AskUserQuestion:**
   - Set header to "Repository Name"
   - Set question to "What should the repository be named?"
   - Provide the 3-4 generated options with descriptions
   - multiSelect should be false (single choice)
   - The user can select "Other" to provide custom input

4. **Create Remote Repository**
   - Use the selected/entered repository name
   - Create a private repository: `gh repo create <repo-name> --private --source=. --remote=origin`
   - The `--source=.` flag connects the current directory
   - The `--remote=origin` flag sets up the remote named 'origin'

5. **Push Current Branch**
   - Determine the current branch name: `git branch --show-current`
   - Push the current branch to the new remote: `git push -u origin <branch-name>`
   - The `-u` flag sets up tracking for the branch

6. **Confirmation**
   - Display the repository URL
   - Confirm the branch was pushed successfully
   - Show next steps (e.g., view repo in browser with `gh repo view --web`)

## Error Handling

- If `gh` is not installed, provide installation instructions
- If not authenticated, guide user to run `gh auth login`
- If not in a git repository, inform the user
- If remote 'origin' already exists, ask if they want to use a different remote name or abort
- If no commits exist, inform user they need to make an initial commit first
- If chosen name doesn't follow kebab-case, suggest converting it

## Example Name Generation Logic

**Scenario 1: React Native App**

```
Directory: "MyAwesomeApp"
Files: package.json with "react-native"

Suggestions:
1. my-awesome-app (normalized)
2. my-awesome-app-rn (with tech suffix)
3. my-awesome-app-mobile (with platform suffix)
```

**Scenario 2: Next.js API**

```
Directory: "blog-backend"
Files: package.json with "next", API routes detected

Suggestions:
1. blog-backend (normalized)
2. blog-backend-next (with tech suffix)
3. blog-api (purpose-focused)
4. next-blog-api (tech + purpose)
```

**Scenario 3: Python CLI Tool**

```
Directory: "image_processor"
Files: pyproject.toml, bin/image-processor

Suggestions:
1. image-processor (normalized to kebab-case)
2. image-processor-py (with tech suffix)
3. image-processor-cli (with purpose suffix)
```

## Core Principles

### Parallelization (CRITICAL for Speed)

When gathering context, execute ALL checks in parallel:

- Git status + remote check + directory analysis -> ONE message with multiple Bash calls

### Depth-First Strategy (DFS over BFS)

When setting up, go DEEP into one aspect before moving to the next:

- Complete repository creation fully before pushing
- Finish all remote configuration before next steps

### Architecture Principles

**DRY & OPEN-CLOSED:**

- Follow existing naming conventions in the organization
- Design repository structure for extension

## Expected Behavior

- Analyzes project type and generates 3-4 smart repository name suggestions
- Follows kebab-case naming convention consistently
- Asks user to choose from suggestions or provide custom name
- Creates a private GitHub repository with the chosen name
- Pushes the current branch with tracking set up
