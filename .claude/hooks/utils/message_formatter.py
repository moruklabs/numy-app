#!/usr/bin/env python3
"""
Message Formatter Utility

Provides consistent formatting for error messages, help text, and suggestions.
"""

from typing import List, Optional


class MessageFormatter:
    """Utility class for formatting consistent hook messages."""

    # Color codes for terminal output
    COLORS = {
        "red": "\033[91m",
        "yellow": "\033[93m",
        "green": "\033[92m",
        "blue": "\033[94m",
        "cyan": "\033[96m",
        "bold": "\033[1m",
        "end": "\033[0m",
    }

    @classmethod
    def error_message(
        cls, title: str, details: str, suggestions: Optional[List[str]] = None
    ) -> str:
        """
        Format a standardized error message.

        Args:
            title: The main error title
            details: Detailed explanation
            suggestions: List of suggested solutions

        Returns:
            Formatted error message
        """
        msg = f"\n{cls.COLORS['red']}{cls.COLORS['bold']}❌ {title}{cls.COLORS['end']}\n"
        msg += f"{cls.COLORS['red']}{details}{cls.COLORS['end']}\n"

        if suggestions:
            msg += f"\n{cls.COLORS['yellow']}{cls.COLORS['bold']}💡 Suggested Solutions:{cls.COLORS['end']}\n"
            for i, suggestion in enumerate(suggestions, 1):
                msg += f"{cls.COLORS['yellow']}  {i}. {suggestion}{cls.COLORS['end']}\n"

        return msg

    @classmethod
    def cargo_enforcement_message(
        cls, detected_pattern: str, tool_name: Optional[str] = None
    ) -> str:
        """
        Format the specific message for cargo build enforcement.

        Args:
            detected_pattern: The cargo pattern that was detected
            tool_name: The tool name if extracted from command

        Returns:
            Formatted enforcement message
        """
        title = "Direct Cargo Build Command Blocked"
        details = (
            f"Detected blocked pattern: {cls.COLORS['cyan']}{detected_pattern}{cls.COLORS['end']}\n"
        )
        details += "This project enforces using release scripts instead of direct cargo commands."

        suggestions = []

        if tool_name:
            suggestions.extend(
                [
                    f"Use: {cls.COLORS['green']}././release.sh {tool_name}{cls.COLORS['end']}",
                    f"Or from tool directory: {cls.COLORS['green']}cd ./{tool_name} && ../../release.sh{cls.COLORS['end']}",
                ]
            )
        else:
            suggestions.extend(
                [
                    f"Use: {cls.COLORS['green']}././release.sh [tool-name]{cls.COLORS['end']}",
                    f"List available tools: {cls.COLORS['green']}././release.sh --list{cls.COLORS['end']}",
                ]
            )

        suggestions.extend(
            [
                f"Build all tools: {cls.COLORS['green']}././release.sh --all{cls.COLORS['end']}",
                "If the release script is missing features, create a feature branch to add them",
            ]
        )

        return cls.error_message(title, details, suggestions)

    @classmethod
    def release_script_guidance(cls, tool_name: Optional[str] = None) -> str:
        """
        Format guidance message for using release scripts.

        Args:
            tool_name: The specific tool name if known

        Returns:
            Formatted guidance message
        """
        msg = f"\n{cls.COLORS['blue']}{cls.COLORS['bold']}📋 Release Script Usage Guide{cls.COLORS['end']}\n"

        if tool_name:
            msg += f"For building {cls.COLORS['cyan']}{tool_name}{cls.COLORS['end']} tool:\n"
            examples = [
                f"././release.sh {tool_name}",
                f"cd cli-tools && ./release.sh {tool_name}",
                f"././release.sh {tool_name} --quiet",
            ]
        else:
            msg += "General usage:\n"
            examples = [
                "././release.sh [tool-name]",
                "././release.sh --list",
                "././release.sh --all",
            ]

        for example in examples:
            msg += f"  {cls.COLORS['green']}{example}{cls.COLORS['end']}\n"

        msg += "\nThe release script handles:\n"
        features = [
            "✓ Proper build environment setup",
            "✓ Binary installation to ./bin/",
            "✓ PATH management suggestions",
            "✓ Error handling and validation",
            "✓ Individual tool release scripts (if available)",
        ]

        for feature in features:
            msg += f"  {cls.COLORS['green']}{feature}{cls.COLORS['end']}\n"

        return msg

    @classmethod
    def branch_workflow_suggestion(cls, tool_name: str, missing_feature: str) -> str:
        """
        Format suggestion for feature branch workflow.

        Args:
            tool_name: The tool that needs the feature
            missing_feature: Description of the missing feature

        Returns:
            Formatted workflow suggestion
        """
        title = "Missing Feature - Suggested Workflow"
        details = f"The {tool_name} tool release script appears to be missing: {missing_feature}"

        suggestions = [
            f"Create feature branch: {cls.COLORS['green']}git checkout -b feature/{tool_name}-{missing_feature.lower().replace(' ', '-')}{cls.COLORS['end']}",
            f"Add the missing feature to ./{tool_name}/",
            f"Test the changes: {cls.COLORS['green']}././release.sh {tool_name}{cls.COLORS['end']}",
            f"Commit changes: {cls.COLORS['green']}git add . && git commit -m \"feat: add {missing_feature} to {tool_name}\"{cls.COLORS['end']}",
            f"Merge back: {cls.COLORS['green']}git checkout - && git merge feature/{tool_name}-{missing_feature.lower().replace(' ', '-')}{cls.COLORS['end']}",
            "Continue with your original task",
        ]

        return cls.error_message(title, details, suggestions)

    @classmethod
    def info_message(cls, title: str, content: str) -> str:
        """
        Format an informational message.

        Args:
            title: The info title
            content: The info content

        Returns:
            Formatted info message
        """
        msg = f"\n{cls.COLORS['blue']}{cls.COLORS['bold']}ℹ️  {title}{cls.COLORS['end']}\n"
        msg += f"{cls.COLORS['blue']}{content}{cls.COLORS['end']}\n"
        return msg
