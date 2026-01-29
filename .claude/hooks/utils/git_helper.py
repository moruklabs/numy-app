#!/usr/bin/env python3
"""
Git Helper Utility

Provides git-related functionality for branch operations and repository management.
"""

import os
import subprocess
from typing import List, Optional


class GitHelper:
    """Utility class for git operations in hook context."""
    
    def __init__(self, repo_path: Optional[str] = None):
        """
        Initialize GitHelper.
        
        Args:
            repo_path: Path to git repository. If None, uses current directory.
        """
        self.repo_path = repo_path or os.getcwd()
    
    def get_current_branch(self) -> Optional[str]:
        """
        Get the current git branch name.
        
        Returns:
            Current branch name or None if unable to determine
        """
        try:
            result = subprocess.run(
                ['git', 'rev-parse', '--abbrev-ref', 'HEAD'],
                cwd=self.repo_path,
                capture_output=True,
                text=True,
                timeout=10
            )
            if result.returncode == 0:
                return result.stdout.strip()
        except (subprocess.TimeoutExpired, subprocess.SubprocessError):
            pass
        return None
    
    def is_git_repo(self) -> bool:
        """
        Check if current directory is a git repository.
        
        Returns:
            True if it's a git repository
        """
        try:
            subprocess.run(
                ['git', 'rev-parse', '--git-dir'],
                cwd=self.repo_path,
                capture_output=True,
                timeout=5
            )
            return True
        except (subprocess.TimeoutExpired, subprocess.SubprocessError):
            return False
    
    def has_uncommitted_changes(self) -> bool:
        """
        Check if there are uncommitted changes.
        
        Returns:
            True if there are uncommitted changes
        """
        try:
            result = subprocess.run(
                ['git', 'status', '--porcelain'],
                cwd=self.repo_path,
                capture_output=True,
                text=True,
                timeout=10
            )
            if result.returncode == 0:
                return bool(result.stdout.strip())
        except (subprocess.TimeoutExpired, subprocess.SubprocessError):
            pass
        return False
    
    def generate_branch_name(self, tool_name: str, feature_desc: str) -> str:
        """
        Generate a suggested branch name for a feature.
        
        Args:
            tool_name: The tool name
            feature_desc: Description of the feature
            
        Returns:
            Suggested branch name
        """
        # Clean up feature description for branch name
        clean_desc = feature_desc.lower().replace(' ', '-').replace('_', '-')
        # Remove special characters
        clean_desc = ''.join(c for c in clean_desc if c.isalnum() or c == '-')
        # Remove consecutive dashes
        while '--' in clean_desc:
            clean_desc = clean_desc.replace('--', '-')
        clean_desc = clean_desc.strip('-')
        
        return f"feature/{tool_name}-{clean_desc}"
    
    def get_branch_creation_commands(self, branch_name: str) -> List[str]:
        """
        Get the commands needed to create and switch to a new branch.
        
        Args:
            branch_name: The name of the branch to create
            
        Returns:
            List of git commands to execute
        """
        commands = []
        
        # If there are uncommitted changes, suggest stashing
        if self.has_uncommitted_changes():
            commands.append("git stash push -m 'WIP: stashing before branch creation'")
        
        commands.extend([
            f"git checkout -b {branch_name}",
            "# Make your changes here",
            "git add .",
            f"git commit -m 'feat: add feature to {branch_name.split('-')[1] if '-' in branch_name else 'tool'}'",
            "git checkout -",  # Switch back to previous branch
            f"git merge {branch_name}"
        ])
        
        # If we stashed changes, suggest popping them
        if self.has_uncommitted_changes():
            commands.append("git stash pop")
        
        return commands
    
    def get_repo_info(self) -> dict:
        """
        Get general information about the repository.
        
        Returns:
            Dictionary with repository information
        """
        info = {
            'is_repo': self.is_git_repo(),
            'current_branch': None,
            'has_changes': False,
            'repo_path': self.repo_path
        }
        
        if info['is_repo']:
            info['current_branch'] = self.get_current_branch()
            info['has_changes'] = self.has_uncommitted_changes()
        
        return info