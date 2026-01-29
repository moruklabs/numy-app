#!/usr/bin/env python3
"""
Cache Configuration Module

Loads cache configuration from multiple sources with priority:
1. YAML config file (highest)
2. settings.json
3. Environment variables
4. Defaults (lowest)
"""

import json
import os
from dataclasses import dataclass, field
from functools import lru_cache
from pathlib import Path
from typing import Any, Dict, Optional

# Try to import yaml, fall back gracefully
try:
    import yaml
    YAML_AVAILABLE = True
except ImportError:
    YAML_AVAILABLE = False


@dataclass
class RedisConfig:
    """Redis connection configuration."""
    host: str = "localhost"
    port: int = 6379
    db: int = 0
    password: Optional[str] = None
    timeout: int = 5
    max_connections: int = 10


@dataclass
class QdrantConfig:
    """Qdrant connection configuration."""
    host: str = "localhost"
    port: int = 6333
    grpc_port: int = 6334
    collection_name: str = "claude_cache_semantic"
    timeout: int = 10


@dataclass
class CompressionConfig:
    """Compression settings."""
    enabled: bool = True
    algorithm: str = "gzip"
    level: int = 6
    min_size_bytes: int = 1024  # Only compress if > 1KB


@dataclass
class SemanticConfig:
    """Semantic cache settings."""
    enabled: bool = True
    similarity_threshold: float = 0.85
    embedding_model: str = "all-MiniLM-L6-v2"
    embedding_dimension: int = 384
    max_results: int = 5


@dataclass
class ObservabilityConfig:
    """Observability settings."""
    log_hits: bool = True
    log_misses: bool = True
    log_provider: bool = True
    enabled: bool = True


@dataclass
class TTLConfig:
    """TTL settings for different content types."""
    web_content: int = 1800  # 30 minutes
    agent_results: int = 36000  # 10 hours
    file_operations: int = 36000  # 10 hours
    exact_cache: int = 36000  # 10 hours
    semantic_cache: int = 18000  # 5 hours


@dataclass
class ToolConfig:
    """Per-tool configuration."""
    backend: str = "file"  # "file", "remote", or "hybrid"
    exact_cache: bool = True
    semantic_cache: bool = False
    ttl: int = 36000
    time_bucket_seconds: int = 3600


@dataclass
class CacheConfiguration:
    """Complete cache configuration."""
    version: str = "1.0"
    enabled: bool = True

    # Backend settings
    file_enabled: bool = True
    remote_enabled: bool = True
    fallback_to_file: bool = True

    # Component configs
    redis: RedisConfig = field(default_factory=RedisConfig)
    qdrant: QdrantConfig = field(default_factory=QdrantConfig)
    compression: CompressionConfig = field(default_factory=CompressionConfig)
    semantic: SemanticConfig = field(default_factory=SemanticConfig)
    observability: ObservabilityConfig = field(default_factory=ObservabilityConfig)
    ttl: TTLConfig = field(default_factory=TTLConfig)

    # Tool-specific configs
    tools: Dict[str, ToolConfig] = field(default_factory=dict)

    def __post_init__(self):
        """Set default tool configurations."""
        default_tools = {
            "WebFetch": ToolConfig(
                backend="remote",
                exact_cache=True,
                semantic_cache=True,
                ttl=1800,
                time_bucket_seconds=1800
            ),
            "WebSearch": ToolConfig(
                backend="remote",
                exact_cache=True,
                semantic_cache=True,
                ttl=1800,
                time_bucket_seconds=1800
            ),
            "Read": ToolConfig(
                backend="file",
                exact_cache=True,
                semantic_cache=False,
                ttl=36000
            ),
            "Grep": ToolConfig(
                backend="file",
                exact_cache=True,
                semantic_cache=False,
                ttl=36000
            ),
            "Glob": ToolConfig(
                backend="file",
                exact_cache=True,
                semantic_cache=False,
                ttl=36000
            ),
            "Bash": ToolConfig(
                backend="file",
                exact_cache=True,
                semantic_cache=False,
                ttl=36000
            ),
            "Task": ToolConfig(
                backend="file",
                exact_cache=True,
                semantic_cache=True,
                ttl=36000
            ),
        }
        # Merge with any provided tools
        for tool, config in default_tools.items():
            if tool not in self.tools:
                self.tools[tool] = config

    def get_tool_config(self, tool_name: str) -> ToolConfig:
        """Get configuration for a specific tool."""
        return self.tools.get(tool_name, ToolConfig())

    def should_use_remote(self, tool_name: str) -> bool:
        """Check if a tool should use remote backend."""
        if not self.remote_enabled:
            return False
        tool_config = self.get_tool_config(tool_name)
        return tool_config.backend in ("remote", "hybrid")

    def should_use_semantic(self, tool_name: str) -> bool:
        """Check if a tool should use semantic caching."""
        if not self.semantic.enabled:
            return False
        tool_config = self.get_tool_config(tool_name)
        return tool_config.semantic_cache


class ConfigLoader:
    """
    Loads configuration from multiple sources.

    Priority (highest to lowest):
    1. YAML config file
    2. settings.json
    3. Environment variables
    4. Defaults
    """

    def __init__(
        self,
        config_path: Optional[Path] = None,
        settings_path: Optional[Path] = None
    ):
        """
        Initialize config loader.

        Args:
            config_path: Path to YAML config (default: ~/.claude/config/cache_config.yaml)
            settings_path: Path to settings.json (default: ~/.claude/settings.json)
        """
        claude_home = Path.home() / ".claude"
        self.config_path = config_path or (claude_home / "config" / "cache_config.yaml")
        self.settings_path = settings_path or (claude_home / "settings.json")

    def load(self) -> CacheConfiguration:
        """Load configuration from all sources."""
        # Start with defaults
        config = CacheConfiguration()

        # Load from settings.json
        settings_config = self._load_settings_json()
        if settings_config:
            config = self._merge_config(config, settings_config)

        # Load from YAML (highest priority)
        yaml_config = self._load_yaml()
        if yaml_config:
            config = self._merge_config(config, yaml_config)

        # Apply environment variable overrides
        config = self._apply_env_overrides(config)

        return config

    def _load_yaml(self) -> Optional[Dict[str, Any]]:
        """Load configuration from YAML file."""
        if not YAML_AVAILABLE:
            return None

        if not self.config_path.exists():
            return None

        try:
            with open(self.config_path) as f:
                return yaml.safe_load(f)
        except Exception:
            return None

    def _load_settings_json(self) -> Optional[Dict[str, Any]]:
        """Load cache configuration from settings.json."""
        if not self.settings_path.exists():
            return None

        try:
            with open(self.settings_path) as f:
                settings = json.load(f)
                return settings.get("cache", {})
        except Exception:
            return None

    def _merge_config(
        self,
        base: CacheConfiguration,
        overrides: Dict[str, Any]
    ) -> CacheConfiguration:
        """Merge override dict into base configuration."""
        if not overrides:
            return base

        # Top-level settings
        if "enabled" in overrides:
            base.enabled = overrides["enabled"]
        if "version" in overrides:
            base.version = overrides["version"]

        # Backend settings
        backends = overrides.get("backends", {})
        if "file" in backends:
            base.file_enabled = backends["file"].get("enabled", base.file_enabled)
        if "remote" in backends:
            remote = backends["remote"]
            base.remote_enabled = remote.get("enabled", base.remote_enabled)
            base.fallback_to_file = remote.get("fallback_to_file", base.fallback_to_file)

            # Redis config
            if "redis" in remote:
                redis = remote["redis"]
                base.redis.host = redis.get("host", base.redis.host)
                base.redis.port = redis.get("port", base.redis.port)
                base.redis.db = redis.get("db", base.redis.db)
                base.redis.password = redis.get("password", base.redis.password)
                base.redis.timeout = redis.get("timeout", base.redis.timeout)

            # Qdrant config
            if "qdrant" in remote:
                qdrant = remote["qdrant"]
                base.qdrant.host = qdrant.get("host", base.qdrant.host)
                base.qdrant.port = qdrant.get("port", base.qdrant.port)
                base.qdrant.grpc_port = qdrant.get("grpc_port", base.qdrant.grpc_port)
                base.qdrant.collection_name = qdrant.get("collection_name", base.qdrant.collection_name)
                base.qdrant.timeout = qdrant.get("timeout", base.qdrant.timeout)

        # Direct redis/qdrant config (alternative structure)
        if "redis" in overrides:
            redis = overrides["redis"]
            base.redis.host = redis.get("host", base.redis.host)
            base.redis.port = redis.get("port", base.redis.port)
        if "qdrant" in overrides:
            qdrant = overrides["qdrant"]
            base.qdrant.host = qdrant.get("host", base.qdrant.host)
            base.qdrant.port = qdrant.get("port", base.qdrant.port)

        # Compression config
        if "compression" in overrides:
            comp = overrides["compression"]
            base.compression.enabled = comp.get("enabled", base.compression.enabled)
            base.compression.algorithm = comp.get("algorithm", base.compression.algorithm)
            base.compression.level = comp.get("level", base.compression.level)
            base.compression.min_size_bytes = comp.get("min_size_bytes", base.compression.min_size_bytes)

        # Semantic config
        if "semantic" in overrides:
            sem = overrides["semantic"]
            base.semantic.enabled = sem.get("enabled", base.semantic.enabled)
            base.semantic.similarity_threshold = sem.get("similarity_threshold", base.semantic.similarity_threshold)
            base.semantic.embedding_model = sem.get("embedding_model", base.semantic.embedding_model)
            base.semantic.max_results = sem.get("max_results", base.semantic.max_results)

        # Observability config
        if "observability" in overrides:
            obs = overrides["observability"]
            base.observability.log_hits = obs.get("log_hits", base.observability.log_hits)
            base.observability.log_misses = obs.get("log_misses", base.observability.log_misses)
            base.observability.log_provider = obs.get("log_provider", base.observability.log_provider)
            base.observability.enabled = obs.get("enabled", base.observability.enabled)

        # TTL config
        if "ttl" in overrides:
            ttl = overrides["ttl"]
            base.ttl.web_content = ttl.get("web_content", base.ttl.web_content)
            base.ttl.agent_results = ttl.get("agent_results", base.ttl.agent_results)
            base.ttl.file_operations = ttl.get("file_operations", base.ttl.file_operations)

        # Tool-specific config
        if "tools" in overrides:
            for tool_name, tool_config in overrides["tools"].items():
                if tool_name not in base.tools:
                    base.tools[tool_name] = ToolConfig()
                tc = base.tools[tool_name]
                tc.backend = tool_config.get("backend", tc.backend)
                tc.exact_cache = tool_config.get("exact_cache", tc.exact_cache)
                tc.semantic_cache = tool_config.get("semantic_cache", tc.semantic_cache)
                tc.ttl = tool_config.get("ttl", tc.ttl)
                tc.time_bucket_seconds = tool_config.get("time_bucket_seconds", tc.time_bucket_seconds)

        return base

    def _apply_env_overrides(self, config: CacheConfiguration) -> CacheConfiguration:
        """Apply environment variable overrides."""
        # Global enable/disable
        if env_val := os.getenv("ENABLE_TOOL_CACHE"):
            config.enabled = env_val.lower() in ("true", "1", "yes")

        # Redis
        if env_val := os.getenv("CACHE_REDIS_HOST"):
            config.redis.host = env_val
        if env_val := os.getenv("CACHE_REDIS_PORT"):
            config.redis.port = int(env_val)
        if env_val := os.getenv("CACHE_REDIS_PASSWORD"):
            config.redis.password = env_val

        # Qdrant
        if env_val := os.getenv("CACHE_QDRANT_HOST"):
            config.qdrant.host = env_val
        if env_val := os.getenv("CACHE_QDRANT_PORT"):
            config.qdrant.port = int(env_val)

        # Semantic threshold
        if env_val := os.getenv("CACHE_SEMANTIC_THRESHOLD"):
            config.semantic.similarity_threshold = float(env_val)

        # Compression
        if env_val := os.getenv("CACHE_COMPRESSION_ENABLED"):
            config.compression.enabled = env_val.lower() in ("true", "1", "yes")

        return config

    def validate(self, config: CacheConfiguration) -> list:
        """
        Validate configuration.

        Returns:
            List of validation errors (empty if valid)
        """
        errors = []

        # Validate Redis port
        if not (1 <= config.redis.port <= 65535):
            errors.append(f"Invalid Redis port: {config.redis.port}")

        # Validate Qdrant port
        if not (1 <= config.qdrant.port <= 65535):
            errors.append(f"Invalid Qdrant port: {config.qdrant.port}")

        # Validate compression level
        if not (1 <= config.compression.level <= 9):
            errors.append(f"Compression level must be 1-9, got: {config.compression.level}")

        # Validate similarity threshold
        if not (0.0 <= config.semantic.similarity_threshold <= 1.0):
            errors.append(f"Similarity threshold must be 0.0-1.0, got: {config.semantic.similarity_threshold}")

        return errors


# Singleton configuration
_config: Optional[CacheConfiguration] = None
_loader: Optional[ConfigLoader] = None


def get_config() -> CacheConfiguration:
    """Get the singleton configuration instance."""
    global _config, _loader
    if _config is None:
        _loader = ConfigLoader()
        _config = _loader.load()
    return _config


def reload_config() -> CacheConfiguration:
    """Force reload of configuration."""
    global _config, _loader
    if _loader is None:
        _loader = ConfigLoader()
    _config = _loader.load()
    return _config


def get_loader() -> ConfigLoader:
    """Get the config loader instance."""
    global _loader
    if _loader is None:
        _loader = ConfigLoader()
    return _loader
