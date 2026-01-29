#!/usr/bin/env python3
"""
Qdrant Cache Backend

Qdrant-based semantic caching for WebFetch/WebSearch tools.
Provides vector similarity search for fuzzy matching similar queries.
"""

import hashlib
import json
import time
from typing import Any, Dict, List, Optional, Tuple
from uuid import uuid4

from .base import AbstractCacheBackend, CacheResult, CacheConfig
from .compression import GzipCompressor
from .decorators import with_error_resilience, with_timing
from .observer import CacheObserver, get_observer
from .path_resolver import get_project_id

# Try to import qdrant
try:
    from qdrant_client import QdrantClient
    from qdrant_client.models import (
        Distance,
        FieldCondition,
        Filter,
        MatchValue,
        PointStruct,
        VectorParams,
        Range,
    )
    QDRANT_AVAILABLE = True
except ImportError:
    QDRANT_AVAILABLE = False
    QdrantClient = None


class QdrantBackend(AbstractCacheBackend):
    """
    Qdrant-based semantic cache backend.

    Features:
    - Vector similarity search for fuzzy matching
    - Project-aware filtering to prevent collisions
    - TTL-based filtering via timestamp metadata
    - Gzip compression for stored outputs
    - Configurable similarity threshold

    Collection: claude_cache_semantic (single collection, filtered by project_id)
    """

    # Tools that benefit from semantic caching
    SUPPORTED_TOOLS = {"WebFetch", "WebSearch", "Task"}

    # Default embedding dimension (all-MiniLM-L6-v2)
    DEFAULT_EMBEDDING_DIM = 384

    def __init__(
        self,
        config: Optional[CacheConfig] = None,
        host: str = "localhost",
        port: int = 6333,
        grpc_port: int = 6334,
        collection_name: str = "claude_cache_semantic",
        timeout: int = 10,
        similarity_threshold: float = 0.85,
        embedding_dim: int = DEFAULT_EMBEDDING_DIM,
        compressor: Optional[GzipCompressor] = None,
        observer: Optional[CacheObserver] = None
    ):
        """
        Initialize Qdrant backend.

        Args:
            config: Cache configuration
            host: Qdrant host
            port: Qdrant HTTP port
            grpc_port: Qdrant gRPC port
            collection_name: Collection name
            timeout: Connection timeout
            similarity_threshold: Minimum similarity for matches (0.0-1.0)
            embedding_dim: Embedding vector dimension
            compressor: Gzip compressor
            observer: Cache observer for logging
        """
        super().__init__(config or CacheConfig())

        self.host = host
        self.port = port
        self.grpc_port = grpc_port
        self.collection_name = collection_name
        self.timeout = timeout
        self.similarity_threshold = similarity_threshold
        self.embedding_dim = embedding_dim

        # Compression
        self.compressor = compressor or GzipCompressor(
            level=self.config.compression_level,
            min_size=self.config.compression_min_size_bytes
        )

        # Observability
        self.observer = observer or get_observer()

        # Client (lazy-initialized)
        self._client = None
        self._embedding_manager = None

    @property
    def client(self) -> Optional['QdrantClient']:
        """Get Qdrant client (lazy initialization)."""
        if not QDRANT_AVAILABLE:
            return None

        if self._client is None:
            try:
                self._client = QdrantClient(
                    host=self.host,
                    port=self.port,
                    timeout=self.timeout
                )
                # Ensure collection exists
                self._ensure_collection()
            except Exception as e:
                self.observer.log_error("connect", "Qdrant", e)
                self._client = None
                return None

        return self._client

    @property
    def embedding_manager(self):
        """Get embedding manager (lazy initialization)."""
        if self._embedding_manager is None:
            try:
                # Import from existing embedding_utils
                import sys
                from pathlib import Path
                sys.path.insert(0, str(Path(__file__).parent.parent))
                from embedding_utils import EmbeddingManager
                self._embedding_manager = EmbeddingManager()
            except Exception as e:
                self.observer.log_error("embed_init", "Qdrant", e)
                return None
        return self._embedding_manager

    @property
    def is_available(self) -> bool:
        """Check if Qdrant is available."""
        if not QDRANT_AVAILABLE:
            return False
        try:
            client = self.client
            if client is None:
                return False
            # Check collection exists
            collections = client.get_collections().collections
            return any(c.name == self.collection_name for c in collections)
        except Exception:
            return False

    def _ensure_collection(self) -> None:
        """Ensure collection exists with proper config."""
        if self._client is None:
            return

        try:
            collections = self._client.get_collections().collections
            if not any(c.name == self.collection_name for c in collections):
                self._client.create_collection(
                    collection_name=self.collection_name,
                    vectors_config=VectorParams(
                        size=self.embedding_dim,
                        distance=Distance.COSINE
                    )
                )
        except Exception as e:
            self.observer.log_error("create_collection", "Qdrant", e)

    @with_error_resilience(fallback_value=CacheResult(hit=False, key="", provider="qdrant"))
    @with_timing(threshold_ms=100)
    def lookup(
        self,
        tool_name: str,
        tool_input: Dict[str, Any],
        cwd: Optional[str] = None
    ) -> CacheResult:
        """
        Look up cached result using semantic similarity.

        Args:
            tool_name: Name of the tool
            tool_input: Tool input parameters
            cwd: Current working directory

        Returns:
            CacheResult with hit status and similarity score
        """
        if tool_name not in self.SUPPORTED_TOOLS:
            return CacheResult(hit=False, key="", provider="qdrant")

        client = self.client
        if client is None:
            return CacheResult(hit=False, key="", provider="qdrant")

        embedding_manager = self.embedding_manager
        if embedding_manager is None:
            return CacheResult(hit=False, key="", provider="qdrant")

        start_time = time.time()

        # Generate query embedding
        query_text = self._generate_query_text(tool_name, tool_input)
        if not query_text:
            return CacheResult(hit=False, key="", provider="qdrant")

        try:
            query_vector = embedding_manager.embed(query_text)[0]
        except Exception as e:
            self.observer.log_error("embed", tool_name, e)
            return CacheResult(hit=False, key="", provider="qdrant")

        project_id = get_project_id(cwd)
        ttl_cutoff = time.time() - self.config.semantic_ttl_seconds

        try:
            # Search with filters using query_points (new API in qdrant-client 1.12+)
            response = client.query_points(
                collection_name=self.collection_name,
                query=query_vector.tolist(),
                query_filter=Filter(
                    must=[
                        FieldCondition(
                            key="project_id",
                            match=MatchValue(value=project_id)
                        ),
                        FieldCondition(
                            key="tool_name",
                            match=MatchValue(value=tool_name)
                        ),
                        FieldCondition(
                            key="timestamp",
                            range=Range(gte=ttl_cutoff)
                        )
                    ]
                ),
                limit=3,
                with_payload=True
            )
            results = response.points

            latency_ms = (time.time() - start_time) * 1000

            if not results:
                self.observer.log_miss(tool_name, latency_ms, "")
                return CacheResult(hit=False, key="", provider="qdrant")

            # Check best match against threshold
            best = results[0]
            similarity = best.score

            if similarity < self.similarity_threshold:
                self.observer.log_miss(tool_name, latency_ms, "")
                return CacheResult(
                    hit=False,
                    key="",
                    provider="qdrant",
                    similarity=similarity
                )

            # Extract cached data
            payload = best.payload or {}
            output_data = payload.get("output")

            # Decompress if needed
            if isinstance(output_data, str) and output_data.startswith("compressed:"):
                try:
                    import base64
                    compressed_bytes = base64.b64decode(output_data[11:])
                    output_data = self.compressor.decompress(compressed_bytes)
                except Exception:
                    pass

            age = time.time() - payload.get("timestamp", time.time())

            result = CacheResult(
                hit=True,
                key=str(best.id),
                data=output_data,
                similarity=similarity,
                cache_type="semantic",
                provider="qdrant",
                age_seconds=age,
                compressed=payload.get("compressed", False),
                compression_ratio=payload.get("compression_ratio", 0.0)
            )

            self.observer.log_hit(
                tool_name, "qdrant", "semantic",
                latency_ms, similarity=similarity,
                key=str(best.id)
            )

            return result

        except Exception as e:
            latency_ms = (time.time() - start_time) * 1000
            self.observer.log_error("lookup", tool_name, e, latency_ms)
            return CacheResult(hit=False, key="", provider="qdrant")

    @with_error_resilience(fallback_value="")
    @with_timing(threshold_ms=200)
    def store(
        self,
        tool_name: str,
        tool_input: Dict[str, Any],
        tool_output: Any,
        success: bool = True,
        cwd: Optional[str] = None
    ) -> str:
        """
        Store tool result in Qdrant.

        Args:
            tool_name: Name of the tool
            tool_input: Tool input parameters
            tool_output: Tool output to cache
            success: Whether execution succeeded
            cwd: Current working directory

        Returns:
            Cache key (point ID)
        """
        if not success or tool_name not in self.SUPPORTED_TOOLS:
            return ""

        client = self.client
        if client is None:
            return ""

        embedding_manager = self.embedding_manager
        if embedding_manager is None:
            return ""

        start_time = time.time()

        # Generate embedding
        query_text = self._generate_query_text(tool_name, tool_input)
        if not query_text:
            return ""

        try:
            vector = embedding_manager.embed(query_text)[0]
        except Exception as e:
            self.observer.log_error("embed", tool_name, e)
            return ""

        project_id = get_project_id(cwd)
        point_id = str(uuid4())

        # Compress output if large
        compressed = False
        compression_ratio = 0.0
        output_to_store = tool_output

        if self.config.compression_enabled:
            output_json = json.dumps(tool_output)
            if len(output_json) > self.config.compression_min_size_bytes:
                try:
                    import base64
                    compressed_data, compression_ratio = self.compressor.compress(tool_output)
                    if compression_ratio < 1.0:
                        output_to_store = "compressed:" + base64.b64encode(compressed_data).decode('utf-8')
                        compressed = True
                except Exception:
                    pass

        try:
            # Create point
            point = PointStruct(
                id=point_id,
                vector=vector.tolist(),
                payload={
                    "project_id": project_id,
                    "tool_name": tool_name,
                    "input": tool_input,
                    "output": output_to_store,
                    "query_text": query_text,
                    "timestamp": time.time(),
                    "compressed": compressed,
                    "compression_ratio": compression_ratio
                }
            )

            client.upsert(
                collection_name=self.collection_name,
                points=[point]
            )

            latency_ms = (time.time() - start_time) * 1000
            self.observer.log_store(
                tool_name, "qdrant", latency_ms,
                compressed=compressed,
                compression_ratio=compression_ratio,
                key=point_id
            )

            return point_id

        except Exception as e:
            latency_ms = (time.time() - start_time) * 1000
            self.observer.log_error("store", tool_name, e, latency_ms)
            return ""

    def invalidate(self, key: str) -> bool:
        """Remove cache entry by point ID."""
        client = self.client
        if client is None:
            return False

        try:
            client.delete(
                collection_name=self.collection_name,
                points_selector=[key]
            )
            return True
        except Exception:
            return False

    def stats(self) -> Dict[str, Any]:
        """Get cache statistics."""
        client = self.client
        if client is None:
            return {
                "provider": "qdrant",
                "available": False,
                "error": "Qdrant not connected"
            }

        try:
            collection_info = client.get_collection(self.collection_name)
            project_id = get_project_id()

            # Count points for this project
            count_result = client.count(
                collection_name=self.collection_name,
                count_filter=Filter(
                    must=[
                        FieldCondition(
                            key="project_id",
                            match=MatchValue(value=project_id)
                        )
                    ]
                )
            )

            return {
                "provider": "qdrant",
                "available": True,
                "host": self.host,
                "port": self.port,
                "collection": self.collection_name,
                "total_points": collection_info.points_count,
                "project_points": count_result.count,
                "project_id": project_id,
                "status": str(collection_info.status)
            }

        except Exception as e:
            return {
                "provider": "qdrant",
                "available": False,
                "error": str(e)
            }

    def cleanup(self) -> int:
        """Remove expired entries."""
        client = self.client
        if client is None:
            return 0

        ttl_cutoff = time.time() - self.config.semantic_ttl_seconds

        try:
            # Delete old points
            result = client.delete(
                collection_name=self.collection_name,
                points_selector=Filter(
                    must=[
                        FieldCondition(
                            key="timestamp",
                            range=Range(lt=ttl_cutoff)
                        )
                    ]
                )
            )
            # Result doesn't provide count, return 0
            return 0
        except Exception:
            return 0

    def clear_project_cache(self, project_id: Optional[str] = None) -> int:
        """Clear all cache entries for a project."""
        client = self.client
        if client is None:
            return 0

        if project_id is None:
            project_id = get_project_id()

        try:
            client.delete(
                collection_name=self.collection_name,
                points_selector=Filter(
                    must=[
                        FieldCondition(
                            key="project_id",
                            match=MatchValue(value=project_id)
                        )
                    ]
                )
            )
            return 0  # Qdrant doesn't return count
        except Exception:
            return 0

    # === Private Methods ===

    def _generate_query_text(
        self,
        tool_name: str,
        tool_input: Dict[str, Any]
    ) -> Optional[str]:
        """Generate text for embedding."""
        if tool_name == "WebFetch":
            url = tool_input.get("url", "")
            prompt = tool_input.get("prompt", "")
            return f"fetch {url}: {prompt}"

        elif tool_name == "WebSearch":
            query = tool_input.get("query", "")
            domains = tool_input.get("allowed_domains", [])
            if domains:
                return f"search web for {query} on {domains}"
            return f"search web for {query}"

        elif tool_name == "Task":
            prompt = tool_input.get("prompt", "")
            description = tool_input.get("description", "")
            subagent_type = tool_input.get("subagent_type", "")
            return f"{subagent_type} agent: {description} - {prompt}"

        return None

    def close(self) -> None:
        """Close Qdrant connection."""
        if self._client is not None:
            self._client.close()
            self._client = None
