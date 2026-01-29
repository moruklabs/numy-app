#!/usr/bin/env python3
# /// script
# requires-python = ">=3.11"
# dependencies = [
#     "sentence-transformers>=2.2.0",
#     "numpy>=1.24.0",
# ]
# ///
"""
Embedding Utilities Module

Provides local embeddings using sentence-transformers for semantic caching.
Uses a lightweight model optimized for speed.
"""

import os
import numpy as np
from functools import lru_cache
from typing import List, Optional, Union


# Model configuration
DEFAULT_MODEL = "all-MiniLM-L6-v2"  # Fast, 384 dimensions, good quality
EMBEDDING_DIM = 384


class EmbeddingManager:
    """Manages local embeddings using sentence-transformers."""

    _instance: Optional["EmbeddingManager"] = None
    _model = None

    def __new__(cls):
        """Singleton pattern for efficiency."""
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    @property
    def model(self):
        """Lazy-load the embedding model."""
        if self._model is None:
            try:
                from sentence_transformers import SentenceTransformer
                model_name = os.environ.get("EMBEDDING_MODEL", DEFAULT_MODEL)
                self._model = SentenceTransformer(model_name)
            except ImportError:
                raise ImportError(
                    "sentence-transformers not installed. "
                    "Run: uv pip install sentence-transformers"
                )
        return self._model

    def embed(self, text: Union[str, List[str]]) -> np.ndarray:
        """
        Generate embeddings for text(s).

        Args:
            text: Single string or list of strings to embed

        Returns:
            numpy array of shape (n, embedding_dim)
        """
        if isinstance(text, str):
            text = [text]

        embeddings = self.model.encode(
            text,
            convert_to_numpy=True,
            normalize_embeddings=True,  # L2 normalize for cosine similarity
            show_progress_bar=False
        )

        return embeddings

    def similarity(self, embedding1: np.ndarray, embedding2: np.ndarray) -> float:
        """
        Compute cosine similarity between two embeddings.

        Since embeddings are normalized, this is just dot product.
        """
        return float(np.dot(embedding1, embedding2))

    @property
    def dimension(self) -> int:
        """Get embedding dimension."""
        return EMBEDDING_DIM


@lru_cache(maxsize=1)
def get_embedding_manager() -> EmbeddingManager:
    """Get singleton embedding manager instance."""
    return EmbeddingManager()


def embed_text(text: Union[str, List[str]]) -> np.ndarray:
    """Convenience function to embed text."""
    return get_embedding_manager().embed(text)


def compute_similarity(text1: str, text2: str) -> float:
    """Compute semantic similarity between two texts."""
    manager = get_embedding_manager()
    embeddings = manager.embed([text1, text2])
    return manager.similarity(embeddings[0], embeddings[1])


# Cache key generation for semantic content
def generate_semantic_key(content: str, prefix: str = "") -> str:
    """
    Generate a semantic-aware cache key.

    For exact matching, use content hash.
    For semantic matching, the embedding will be stored separately.
    """
    import hashlib
    key_content = f"{prefix}:{content}" if prefix else content
    return hashlib.sha256(key_content.encode()).hexdigest()
