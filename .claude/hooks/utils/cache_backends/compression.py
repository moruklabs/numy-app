#!/usr/bin/env python3
"""
Compression Utilities

Provides gzip compression/decompression for cache entries.
"""

import gzip
import json
from typing import Any, Dict, Tuple
import logging

logger = logging.getLogger(__name__)


class GzipCompressor:
    """
    Gzip compression/decompression for cache data.

    Handles JSON serialization + compression in one step.
    Tracks compression ratios for observability.
    """

    def __init__(self, level: int = 6, min_size: int = 1024):
        """
        Initialize compressor.

        Args:
            level: Gzip compression level (1-9, higher = better compression)
            min_size: Only compress if data exceeds this size in bytes
        """
        if not 1 <= level <= 9:
            raise ValueError(f"Compression level must be 1-9, got {level}")

        self.level = level
        self.min_size = min_size

    def compress(self, data: Any) -> Tuple[bytes, float]:
        """
        Compress data with gzip.

        Args:
            data: Python object to serialize and compress

        Returns:
            Tuple of (compressed_bytes, compression_ratio)
            compression_ratio = compressed_size / original_size
        """
        try:
            # Serialize to JSON
            json_str = json.dumps(data, separators=(',', ':'), ensure_ascii=False)
            json_bytes = json_str.encode('utf-8')
            original_size = len(json_bytes)

            # Skip compression if below threshold
            if original_size < self.min_size:
                # Return uncompressed with ratio 1.0 (no compression)
                return json_bytes, 1.0

            # Compress
            compressed = gzip.compress(json_bytes, compresslevel=self.level)
            compressed_size = len(compressed)

            # Calculate compression ratio
            ratio = compressed_size / original_size if original_size > 0 else 1.0

            return compressed, ratio

        except Exception as e:
            logger.error(f"Compression failed: {e}", exc_info=True)
            # Return uncompressed data on error
            json_bytes = json.dumps(data).encode('utf-8')
            return json_bytes, 1.0

    def decompress(self, data: bytes) -> Any:
        """
        Decompress gzip data and deserialize JSON.

        Args:
            data: Compressed bytes or uncompressed JSON bytes

        Returns:
            Deserialized Python object

        Raises:
            ValueError: If decompression or deserialization fails
        """
        try:
            # Try to decompress (will fail if not compressed)
            try:
                decompressed = gzip.decompress(data)
            except (gzip.BadGzipFile, OSError):
                # Data is not compressed, use as-is
                decompressed = data

            # Deserialize JSON
            json_str = decompressed.decode('utf-8')
            return json.loads(json_str)

        except Exception as e:
            logger.error(f"Decompression failed: {e}", exc_info=True)
            raise ValueError(f"Failed to decompress data: {e}")

    def is_compressed(self, data: bytes) -> bool:
        """
        Check if data is gzip compressed.

        Args:
            data: Bytes to check

        Returns:
            True if data appears to be gzip compressed
        """
        # Gzip magic number is 0x1f8b
        return len(data) >= 2 and data[0] == 0x1f and data[1] == 0x8b
