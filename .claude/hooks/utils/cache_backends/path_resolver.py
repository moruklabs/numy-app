#!/usr/bin/env python3
"""
Path Resolver Module

Provides portable path resolution for cache backends.
No hardcoded paths - supports subprojects with different PWDs.
"""

import hashlib
import json
import os
import subprocess
from functools import lru_cache
from pathlib import Path
from typing import Any, Dict, Optional


class PathResolver:
    """
    Resolves cache paths dynamically based on execution context.

    Priority for cache directory:
    1. Environment variable: CACHE_DIR
    2. Git root: {git_root}/.claude/cache/
    3. Project root: {cwd}/.claude/cache/
    4. Global fallback: ~/.claude/cache/

    All paths are resolved at runtime, never hardcoded.
    """

    def __init__(self, cwd: Optional[str] = None):
        """
        Initialize path resolver.

        Args:
            cwd: Current working directory (defaults to os.getcwd())
        """
        self._cwd = Path(cwd) if cwd else Path.cwd()
        self._hooks_dir = Path(__file__).parent.parent.resolve()

    @property
    def cwd(self) -> Path:
        """Get current working directory."""
        return self._cwd

    @property
    def hooks_dir(self) -> Path:
        """Get hooks directory (based on this file's location)."""
        return self._hooks_dir

    @property
    def claude_home(self) -> Path:
        """Get Claude home directory (~/.claude)."""
        return Path.home() / ".claude"

    def get_git_root(self, path: Optional[Path] = None) -> Optional[Path]:
        """
        Get git repository root for a given path.

        Args:
            path: Path to check (defaults to cwd)

        Returns:
            Git root path or None if not in a git repo
        """
        check_path = path or self._cwd

        try:
            result = subprocess.run(
                ['git', 'rev-parse', '--show-toplevel'],
                capture_output=True,
                text=True,
                timeout=5,
                cwd=str(check_path),
            )
            if result.returncode == 0:
                return Path(result.stdout.strip())
        except (subprocess.TimeoutExpired, subprocess.SubprocessError, FileNotFoundError):
            pass

        return None

    def get_cache_dir(self, cwd: Optional[str] = None) -> Path:
        """
        Resolve cache directory based on current context.

        Priority:
        1. CACHE_DIR environment variable
        2. Git root: {git_root}/.claude/cache/
        3. CLAUDE_HOME environment variable
        4. Global fallback: ~/.claude/cache/

        Args:
            cwd: Override current working directory

        Returns:
            Path to cache directory (created if needed)
        """
        # 1. Check environment variable override
        if cache_dir := os.getenv("CACHE_DIR"):
            path = Path(cache_dir)
            path.mkdir(parents=True, exist_ok=True)
            return path

        # 2. Check git root
        check_path = Path(cwd) if cwd else self._cwd
        git_root = self.get_git_root(check_path)
        if git_root:
            # If git root is already ~/.claude, don't add another .claude
            if git_root.name == ".claude":
                path = git_root / "cache"
            else:
                path = git_root / ".claude" / "cache"
            path.mkdir(parents=True, exist_ok=True)
            return path

        # 3. Check CLAUDE_HOME
        if claude_home := os.getenv("CLAUDE_HOME"):
            path = Path(claude_home) / "cache"
            path.mkdir(parents=True, exist_ok=True)
            return path

        # 4. Global fallback
        path = self.claude_home / "cache"
        path.mkdir(parents=True, exist_ok=True)
        return path

    def get_logs_dir(self, cwd: Optional[str] = None) -> Path:
        """
        Get logs directory.

        Args:
            cwd: Override current working directory

        Returns:
            Path to logs directory (created if needed)
        """
        # Check git root first
        check_path = Path(cwd) if cwd else self._cwd
        git_root = self.get_git_root(check_path)

        if git_root:
            path = git_root / "logs"
        else:
            path = self.claude_home / "logs"

        path.mkdir(parents=True, exist_ok=True)
        return path

    def get_config_dir(self) -> Path:
        """
        Get configuration directory.

        Returns:
            Path to config directory (created if needed)
        """
        path = self.claude_home / "config"
        path.mkdir(parents=True, exist_ok=True)
        return path

    def get_project_id(self, cwd: Optional[str] = None) -> str:
        """
        Generate a unique project identifier.

        Uses git remote URL if available, otherwise uses the path.
        This ensures cache isolation between different projects.

        Args:
            cwd: Override current working directory

        Returns:
            8-character project hash
        """
        check_path = Path(cwd) if cwd else self._cwd

        # Try to get git remote URL (most stable identifier)
        try:
            result = subprocess.run(
                ['git', 'remote', 'get-url', 'origin'],
                capture_output=True,
                text=True,
                timeout=5,
                cwd=str(check_path),
            )
            if result.returncode == 0 and result.stdout.strip():
                identifier = result.stdout.strip()
                return hashlib.sha256(identifier.encode()).hexdigest()[:8]
        except (subprocess.TimeoutExpired, subprocess.SubprocessError, FileNotFoundError):
            pass

        # Fallback to git root path
        git_root = self.get_git_root(check_path)
        if git_root:
            identifier = str(git_root.resolve())
            return hashlib.sha256(identifier.encode()).hexdigest()[:8]

        # Last resort: use cwd
        identifier = str(check_path.resolve())
        return hashlib.sha256(identifier.encode()).hexdigest()[:8]

    def generate_cache_key(
        self,
        tool_name: str,
        tool_input: Dict[str, Any],
        project_id: Optional[str] = None
    ) -> str:
        """
        Generate a cache key with project namespace.

        Format: {project_hash}:{tool}:{input_hash}

        Args:
            tool_name: Name of the tool
            tool_input: Tool input parameters
            project_id: Optional project ID (auto-generated if not provided)

        Returns:
            Cache key string
        """
        if project_id is None:
            project_id = self.get_project_id()

        # Serialize input deterministically
        input_str = json.dumps(tool_input, sort_keys=True, separators=(',', ':'))
        input_hash = hashlib.sha256(input_str.encode()).hexdigest()

        return f"{project_id}:{tool_name}:{input_hash}"

    def generate_redis_key(
        self,
        tool_name: str,
        tool_input: Dict[str, Any],
        cache_type: str = "exact",
        project_id: Optional[str] = None
    ) -> str:
        """
        Generate a Redis-compatible cache key.

        Format: cache:{project_hash}:{cache_type}:{tool}:{input_hash}

        Args:
            tool_name: Name of the tool
            tool_input: Tool input parameters
            cache_type: "exact" or "semantic"
            project_id: Optional project ID

        Returns:
            Redis key string
        """
        if project_id is None:
            project_id = self.get_project_id()

        input_str = json.dumps(tool_input, sort_keys=True, separators=(',', ':'))
        input_hash = hashlib.sha256(input_str.encode()).hexdigest()[:16]

        return f"cache:{project_id}:{cache_type}:{tool_name}:{input_hash}"

    def get_file_cache_path(
        self,
        tool_name: str,
        tool_input: Dict[str, Any],
        cache_type: str = "exact",
        cwd: Optional[str] = None
    ) -> Path:
        """
        Get file path for file-based cache.

        Args:
            tool_name: Name of the tool
            tool_input: Tool input parameters
            cache_type: "exact" or "semantic"
            cwd: Override current working directory

        Returns:
            Path to cache file
        """
        cache_dir = self.get_cache_dir(cwd)
        project_id = self.get_project_id(cwd)

        input_str = json.dumps(tool_input, sort_keys=True, separators=(',', ':'))
        input_hash = hashlib.sha256(input_str.encode()).hexdigest()[:16]

        # Create nested directory structure
        tool_dir = cache_dir / cache_type / tool_name
        tool_dir.mkdir(parents=True, exist_ok=True)

        return tool_dir / f"{project_id}_{input_hash}.json"


# Singleton instance
_resolver: Optional[PathResolver] = None


def get_resolver(cwd: Optional[str] = None) -> PathResolver:
    """Get or create the singleton PathResolver instance."""
    global _resolver
    if _resolver is None or cwd is not None:
        _resolver = PathResolver(cwd)
    return _resolver


# Convenience functions
def get_cache_dir(cwd: Optional[str] = None) -> Path:
    """Get cache directory."""
    return get_resolver(cwd).get_cache_dir(cwd)


def get_project_id(cwd: Optional[str] = None) -> str:
    """Get project identifier."""
    return get_resolver(cwd).get_project_id(cwd)


def generate_cache_key(
    tool_name: str,
    tool_input: Dict[str, Any],
    project_id: Optional[str] = None
) -> str:
    """Generate cache key."""
    return get_resolver().generate_cache_key(tool_name, tool_input, project_id)


def generate_redis_key(
    tool_name: str,
    tool_input: Dict[str, Any],
    cache_type: str = "exact",
    project_id: Optional[str] = None
) -> str:
    """Generate Redis key."""
    return get_resolver().generate_redis_key(tool_name, tool_input, cache_type, project_id)
