#!/usr/bin/env python3
"""
Context Loader Handler

Loads development context at session start.
Supports monorepo app detection for per-app context isolation.
"""

import argparse
import json
import os
import sys
from pathlib import Path
from typing import Optional

sys.path.insert(0, str(Path(__file__).parent.parent))

from utils import BaseHandler, HandlerContext, HandlerResult, Safe
from utils.path_utils import get_project_root


@Safe
class ContextLoader(BaseHandler):
    """Loads development context at session start with monorepo support."""

    name = "context_loader"
    description = "Loads development context with monorepo app detection"
    priority = 100

    def configure_args(self, parser: argparse.ArgumentParser) -> None:
        parser.add_argument(
            '--load-context',
            action='store_true',
            help='Load development context at session start'
        )
        parser.add_argument(
            '--no-monorepo',
            action='store_true',
            help='Disable monorepo detection'
        )

    def should_run(self, context: HandlerContext) -> bool:
        # Always run to check for monorepo context
        # Can be disabled with --no-monorepo flag
        if getattr(context.args, 'no_monorepo', False):
            return False
        return True

    def run(self, context: HandlerContext) -> HandlerResult:
        cwd = context.event_data.get('cwd', os.getcwd())
        source = context.event_data.get('source', 'unknown')

        # Try monorepo context first
        monorepo_context = self._load_monorepo_context(cwd)
        if monorepo_context:
            output = {
                'hookSpecificOutput': {
                    'hookEventName': 'SessionStart',
                    'additionalContext': monorepo_context,
                }
            }
            return HandlerResult(
                success=True,
                stdout=json.dumps(output)
            )

        # Fall back to generic development context
        dev_context = self._load_development_context(source)
        if dev_context:
            output = {
                'hookSpecificOutput': {
                    'hookEventName': 'SessionStart',
                    'additionalContext': dev_context,
                }
            }
            return HandlerResult(
                success=True,
                stdout=json.dumps(output)
            )

        return HandlerResult(success=True)

    def _detect_monorepo_app(self, cwd: str) -> Optional[str]:
        """
        Detect which monorepo app we're in based on cwd.

        Returns the app name if in a monorepo app directory, None otherwise.
        """
        try:
            monorepo_root = get_project_root()
            apps_dir = monorepo_root / 'apps'
            cwd_path = Path(cwd).resolve()

            # Check if cwd is within apps directory
            try:
                relative = cwd_path.relative_to(apps_dir)
                # Get first component (app name)
                app_name = relative.parts[0] if relative.parts else None
                return app_name if app_name else None
            except ValueError:
                # cwd is not within apps directory
                return None
        except Exception:
            # Fallback: if get_project_root fails, return None
            return None

    def _load_monorepo_context(self, cwd: str) -> str:
        """
        Load monorepo-specific context for the detected app.

        Reads CURRENT_TASK.md and other context files from .claude/{app}/.
        """
        app_name = self._detect_monorepo_app(cwd)
        if not app_name:
            return ''

        try:
            monorepo_root = get_project_root()
            apps_dir = monorepo_root / 'apps'
            claude_dir = monorepo_root / '.claude'
            app_context_dir = claude_dir / 'apps' / app_name
            app_path = apps_dir / app_name

            context_parts = []
            context_parts.append(f"## Monorepo App Context: {app_name}")
            context_parts.append("")
            context_parts.append(f"**Current App**: `{app_name}`")
            context_parts.append(f"**App Path**: `{app_path}`")
            context_parts.append(f"**Context Dir**: `{app_context_dir}`")
            context_parts.append("")

            # Load CURRENT_TASK.md if exists
            task_file = app_context_dir / 'CURRENT_TASK.md'
            if task_file.exists():
                try:
                    task_content = task_file.read_text().strip()
                    if task_content and task_content != "No active task.":
                        context_parts.append("### Active Task")
                        context_parts.append("```markdown")
                        context_parts.append(task_content)
                        context_parts.append("```")
                        context_parts.append("")
                except Exception:
                    pass

            # Load SPEC.md if exists
            spec_file = app_context_dir / 'SPEC.md'
            if spec_file.exists():
                try:
                    spec_content = spec_file.read_text().strip()
                    if spec_content:
                        context_parts.append("### Current Specification")
                        context_parts.append("```markdown")
                        # Truncate if too long
                        if len(spec_content) > 2000:
                            spec_content = spec_content[:2000] + "\n... (truncated)"
                        context_parts.append(spec_content)
                        context_parts.append("```")
                        context_parts.append("")
                except Exception:
                    pass

            # Add path resolution hints for agents
            context_parts.append("### Monorepo Path Resolution")
            context_parts.append("")
            context_parts.append("When working in this monorepo app:")
            context_parts.append(f"- **Source files**: `{app_path}/src/`")
            context_parts.append(f"- **Context files**: `{app_context_dir}/`")
            context_parts.append(f"- **CURRENT_TASK.md**: `{app_context_dir}/CURRENT_TASK.md`")
            context_parts.append(f"- **SPEC.md**: `{app_context_dir}/SPEC.md`")
            context_parts.append(f"- **Backlog**: `{app_context_dir}/.docs/backlog.md`")
            context_parts.append(f"- **Changelog**: `{app_context_dir}/.docs/changelog.md`")
            context_parts.append(f"- **ADRs**: `{app_context_dir}/.docs/adr/`")
            context_parts.append("")
            context_parts.append("Run commands in app directory:")
            context_parts.append("```bash")
            context_parts.append(f"(cd {app_path} && yarn test)")
            context_parts.append("```")

            return '\n'.join(context_parts)
        except Exception:
            # If path resolution fails, return empty context
            return ''

    def _load_development_context(self, source: str) -> str:
        """
        Load relevant development context for non-monorepo projects.

        Extend this method to add context loading logic.
        """
        # Currently returns empty - extend as needed for non-monorepo projects
        return ''
