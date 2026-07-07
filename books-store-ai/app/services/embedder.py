"""
Lightweight Embedding Service
No Gemini, no HuggingFace, no heavy model.
Creates deterministic 384d hashing vectors for search.
"""

from typing import List, Union
import logging
import re
import hashlib
import math
from app.core.config import settings

logger = logging.getLogger(__name__)


class Embedder:
    def __init__(self):
        self.dimension = int(settings.EMBED_DIM)
        logger.info(f"[OK] Lightweight hash embedder initialized ({self.dimension}d)")

    def _tokenize(self, text: str) -> List[str]:
        text = text.lower()
        tokens = re.findall(r"[\wÀ-ỹ]+", text, flags=re.UNICODE)
        return [t for t in tokens if len(t) > 1]

    def _hash_vector(self, text: str) -> List[float]:
        vector = [0.0] * self.dimension
        tokens = self._tokenize(text)

        for token in tokens:
            h = hashlib.md5(token.encode("utf-8")).hexdigest()
            idx = int(h[:8], 16) % self.dimension
            sign = 1.0 if int(h[8:10], 16) % 2 == 0 else -1.0
            vector[idx] += sign

        norm = math.sqrt(sum(x * x for x in vector))
        if norm > 0:
            vector = [x / norm for x in vector]

        return vector

    def encode(self, texts: Union[str, List[str]]) -> List[List[float]]:
        if isinstance(texts, str):
            texts = [texts]

        if not texts:
            return []

        return [self._hash_vector(text) for text in texts]

    def encode_query(self, query: str) -> List[float]:
        return self._hash_vector(query)


embedder = Embedder()
