#!/usr/bin/env python3
# /// script
# requires-python = ">=3.11"
# dependencies = [
#     "faiss-cpu>=1.7.4",
#     "numpy>=1.24.0",
# ]
# ///
"""
Vector Store Module

Provides FAISS-based vector storage for semantic caching.
Supports both in-memory and persistent storage.
"""

import json
import os
import numpy as np
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass, field
from datetime import datetime


@dataclass
class VectorEntry:
    """Represents a cached entry with its vector and metadata."""
    key: str
    vector: np.ndarray
    metadata: Dict[str, Any]
    timestamp: float
    tool_name: str = ""
    ttl_seconds: int = 3600  # Default 1 hour TTL


class FAISSVectorStore:
    """
    FAISS-based vector store for semantic caching.

    Supports:
    - Fast approximate nearest neighbor search
    - Persistent storage to disk
    - TTL-based expiration
    - Metadata storage alongside vectors
    """

    def __init__(
        self,
        dimension: int = 384,
        store_path: Optional[Path] = None,
        similarity_threshold: float = 0.85
    ):
        """
        Initialize the vector store.

        Args:
            dimension: Vector dimension (default 384 for MiniLM)
            store_path: Path to persist the index (None for in-memory)
            similarity_threshold: Minimum similarity for cache hit
        """
        self.dimension = dimension
        self.store_path = Path(store_path) if store_path else None
        self.similarity_threshold = similarity_threshold

        self._index = None
        self._metadata: Dict[int, VectorEntry] = {}
        self._key_to_id: Dict[str, int] = {}
        self._next_id = 0

        # Load existing index if available
        if self.store_path:
            self._load()

    @property
    def index(self):
        """Lazy-load FAISS index."""
        if self._index is None:
            try:
                import faiss
                # Use IndexFlatIP for cosine similarity (vectors should be normalized)
                self._index = faiss.IndexFlatIP(self.dimension)
            except ImportError:
                raise ImportError(
                    "faiss-cpu not installed. "
                    "Run: uv pip install faiss-cpu"
                )
        return self._index

    def add(
        self,
        key: str,
        vector: np.ndarray,
        metadata: Dict[str, Any],
        tool_name: str = "",
        ttl_seconds: int = 3600
    ) -> int:
        """
        Add a vector to the store.

        Args:
            key: Unique identifier for the entry
            vector: Embedding vector (will be normalized)
            metadata: Associated metadata (tool output, etc.)
            tool_name: Name of the tool that generated this
            ttl_seconds: Time-to-live in seconds

        Returns:
            Internal ID of the stored entry
        """
        # Normalize vector for cosine similarity
        vector = vector.astype(np.float32)
        norm = np.linalg.norm(vector)
        if norm > 0:
            vector = vector / norm

        # Check if key exists and update
        if key in self._key_to_id:
            old_id = self._key_to_id[key]
            # FAISS doesn't support updates, so we mark old as expired
            if old_id in self._metadata:
                self._metadata[old_id].ttl_seconds = -1  # Mark expired

        # Add to FAISS index
        vector_2d = vector.reshape(1, -1)
        self.index.add(vector_2d)

        # Store metadata
        entry_id = self._next_id
        self._next_id += 1

        self._metadata[entry_id] = VectorEntry(
            key=key,
            vector=vector,
            metadata=metadata,
            timestamp=datetime.now().timestamp(),
            tool_name=tool_name,
            ttl_seconds=ttl_seconds
        )
        self._key_to_id[key] = entry_id

        # Auto-save if persistent
        if self.store_path:
            self._save()

        return entry_id

    def search(
        self,
        query_vector: np.ndarray,
        tool_name: Optional[str] = None,
        k: int = 5
    ) -> List[Tuple[VectorEntry, float]]:
        """
        Search for similar vectors.

        Args:
            query_vector: Query embedding
            tool_name: Filter by tool name (optional)
            k: Number of results to return

        Returns:
            List of (entry, similarity) tuples, sorted by similarity
        """
        if self.index.ntotal == 0:
            return []

        # Normalize query vector
        query_vector = query_vector.astype(np.float32)
        norm = np.linalg.norm(query_vector)
        if norm > 0:
            query_vector = query_vector / norm

        query_2d = query_vector.reshape(1, -1)

        # Search FAISS index
        k = min(k, self.index.ntotal)
        similarities, indices = self.index.search(query_2d, k)

        results = []
        current_time = datetime.now().timestamp()

        for similarity, idx in zip(similarities[0], indices[0]):
            if idx < 0:  # FAISS returns -1 for empty slots
                continue

            entry = self._metadata.get(idx)
            if entry is None:
                continue

            # Check TTL
            age = current_time - entry.timestamp
            if entry.ttl_seconds > 0 and age > entry.ttl_seconds:
                continue

            # Filter by tool name if specified
            if tool_name and entry.tool_name != tool_name:
                continue

            # Check similarity threshold
            if similarity >= self.similarity_threshold:
                results.append((entry, float(similarity)))

        return results

    def get_by_key(self, key: str) -> Optional[VectorEntry]:
        """Get entry by exact key match."""
        entry_id = self._key_to_id.get(key)
        if entry_id is None:
            return None

        entry = self._metadata.get(entry_id)
        if entry is None:
            return None

        # Check TTL
        current_time = datetime.now().timestamp()
        age = current_time - entry.timestamp
        if entry.ttl_seconds > 0 and age > entry.ttl_seconds:
            return None

        return entry

    def delete(self, key: str) -> bool:
        """Mark entry as deleted (expired)."""
        entry_id = self._key_to_id.get(key)
        if entry_id is None:
            return False

        entry = self._metadata.get(entry_id)
        if entry:
            entry.ttl_seconds = -1  # Mark expired
            del self._key_to_id[key]

        if self.store_path:
            self._save()

        return True

    def cleanup_expired(self) -> int:
        """Remove expired entries. Returns count of removed entries."""
        current_time = datetime.now().timestamp()
        removed = 0

        expired_keys = []
        for key, entry_id in self._key_to_id.items():
            entry = self._metadata.get(entry_id)
            if entry:
                age = current_time - entry.timestamp
                if entry.ttl_seconds > 0 and age > entry.ttl_seconds:
                    expired_keys.append(key)
                    removed += 1

        for key in expired_keys:
            self.delete(key)

        return removed

    def _save(self) -> None:
        """Persist index and metadata to disk."""
        if not self.store_path:
            return

        self.store_path.mkdir(parents=True, exist_ok=True)

        # Save FAISS index
        import faiss
        index_path = self.store_path / "index.faiss"
        faiss.write_index(self.index, str(index_path))

        # Save metadata (convert numpy arrays to lists for JSON)
        metadata_path = self.store_path / "metadata.json"
        serializable_metadata = {}
        for entry_id, entry in self._metadata.items():
            serializable_metadata[str(entry_id)] = {
                "key": entry.key,
                "vector": entry.vector.tolist(),
                "metadata": entry.metadata,
                "timestamp": entry.timestamp,
                "tool_name": entry.tool_name,
                "ttl_seconds": entry.ttl_seconds
            }

        state = {
            "metadata": serializable_metadata,
            "key_to_id": self._key_to_id,
            "next_id": self._next_id
        }

        with open(metadata_path, "w") as f:
            json.dump(state, f)

    def _load(self) -> None:
        """Load index and metadata from disk."""
        if not self.store_path or not self.store_path.exists():
            return

        index_path = self.store_path / "index.faiss"
        metadata_path = self.store_path / "metadata.json"

        if not index_path.exists() or not metadata_path.exists():
            return

        try:
            import faiss
            self._index = faiss.read_index(str(index_path))

            with open(metadata_path, "r") as f:
                state = json.load(f)

            self._key_to_id = state.get("key_to_id", {})
            self._next_id = state.get("next_id", 0)

            # Restore metadata
            for entry_id_str, entry_data in state.get("metadata", {}).items():
                entry_id = int(entry_id_str)
                self._metadata[entry_id] = VectorEntry(
                    key=entry_data["key"],
                    vector=np.array(entry_data["vector"], dtype=np.float32),
                    metadata=entry_data["metadata"],
                    timestamp=entry_data["timestamp"],
                    tool_name=entry_data.get("tool_name", ""),
                    ttl_seconds=entry_data.get("ttl_seconds", 3600)
                )
        except Exception as e:
            # If loading fails, start fresh
            self._index = None
            self._metadata = {}
            self._key_to_id = {}
            self._next_id = 0

    @property
    def size(self) -> int:
        """Get number of entries in the store."""
        return len(self._key_to_id)

    def stats(self) -> Dict[str, Any]:
        """Get store statistics."""
        tool_counts = {}
        for entry in self._metadata.values():
            tool_counts[entry.tool_name] = tool_counts.get(entry.tool_name, 0) + 1

        return {
            "total_entries": self.size,
            "index_size": self.index.ntotal if self._index else 0,
            "tool_counts": tool_counts,
            "dimension": self.dimension,
            "similarity_threshold": self.similarity_threshold
        }


# Singleton instance for the default store
_default_store: Optional[FAISSVectorStore] = None


def get_vector_store(store_path: Optional[Path] = None) -> FAISSVectorStore:
    """Get or create the default vector store."""
    global _default_store

    if _default_store is None:
        if store_path is None:
            from .path_utils import get_logs_dir
            store_path = get_logs_dir() / "vector_cache"

        _default_store = FAISSVectorStore(store_path=store_path)

    return _default_store
