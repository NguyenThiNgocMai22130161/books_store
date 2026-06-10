"""
Cache Service
Simple in-memory cache for embeddings and search results
"""

from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
import hashlib
import json
import logging

logger = logging.getLogger(__name__)


class CacheService:
    """Simple in-memory cache with TTL"""
    
    def __init__(self, default_ttl_seconds: int = 3600):
        self._cache: Dict[str, Dict[str, Any]] = {}
        self.default_ttl = default_ttl_seconds
        self.hits = 0
        self.misses = 0
    
    def _generate_key(self, prefix: str, data: Any) -> str:
        """Generate cache key from data"""
        if isinstance(data, (dict, list)):
            data_str = json.dumps(data, sort_keys=True)
        else:
            data_str = str(data)
        
        hash_obj = hashlib.md5(data_str.encode())
        return f"{prefix}:{hash_obj.hexdigest()}"
    
    def _is_expired(self, entry: Dict) -> bool:
        """Check if cache entry is expired"""
        expires_at = entry.get("expires_at")
        if not expires_at:
            return False
        return datetime.now() > expires_at
    
    def get(self, key: str) -> Optional[Any]:
        """Get value from cache"""
        if key not in self._cache:
            self.misses += 1
            return None
        
        entry = self._cache[key]
        
        if self._is_expired(entry):
            del self._cache[key]
            self.misses += 1
            return None
        
        self.hits += 1
        logger.debug(f"Cache HIT: {key}")
        return entry["value"]
    
    def set(
        self,
        key: str,
        value: Any,
        ttl_seconds: Optional[int] = None
    ) -> None:
        """Set value in cache"""
        ttl = ttl_seconds if ttl_seconds is not None else self.default_ttl
        expires_at = datetime.now() + timedelta(seconds=ttl)
        
        self._cache[key] = {
            "value": value,
            "expires_at": expires_at,
            "created_at": datetime.now()
        }
        logger.debug(f"Cache SET: {key} (TTL: {ttl}s)")
    
    def delete(self, key: str) -> bool:
        """Delete key from cache"""
        if key in self._cache:
            del self._cache[key]
            logger.debug(f"Cache DELETE: {key}")
            return True
        return False
    
    def clear(self) -> None:
        """Clear all cache"""
        count = len(self._cache)
        self._cache.clear()
        logger.info(f"Cache CLEARED: {count} entries")
    
    def get_stats(self) -> Dict:
        """Get cache statistics"""
        total_requests = self.hits + self.misses
        hit_rate = (self.hits / total_requests * 100) if total_requests > 0 else 0
        
        return {
            "size": len(self._cache),
            "hits": self.hits,
            "misses": self.misses,
            "hit_rate": round(hit_rate, 2),
            "total_requests": total_requests
        }
    
    def cleanup_expired(self) -> int:
        """Remove expired entries"""
        expired_keys = [
            key for key, entry in self._cache.items()
            if self._is_expired(entry)
        ]
        
        for key in expired_keys:
            del self._cache[key]
        
        if expired_keys:
            logger.info(f"Cleaned up {len(expired_keys)} expired cache entries")
        
        return len(expired_keys)
    
    # Helper methods for specific use cases
    
    def get_embedding(self, text: str) -> Optional[List[float]]:
        """Get cached embedding"""
        key = self._generate_key("embed", text)
        return self.get(key)
    
    def set_embedding(
        self,
        text: str,
        embedding: List[float],
        ttl_seconds: int = 86400  # 24 hours
    ) -> None:
        """Cache embedding"""
        key = self._generate_key("embed", text)
        self.set(key, embedding, ttl_seconds)
    
    def get_search_results(
        self,
        query: str,
        filters: Optional[Dict] = None
    ) -> Optional[List[Dict]]:
        """Get cached search results"""
        cache_data = {"query": query, "filters": filters or {}}
        key = self._generate_key("search", cache_data)
        return self.get(key)
    
    def set_search_results(
        self,
        query: str,
        filters: Optional[Dict],
        results: List[Dict],
        ttl_seconds: int = 300  # 5 minutes
    ) -> None:
        """Cache search results"""
        cache_data = {"query": query, "filters": filters or {}}
        key = self._generate_key("search", cache_data)
        self.set(key, results, ttl_seconds)
    
    def get_similar_books(self, book_id: int) -> Optional[List[Dict]]:
        """Get cached similar books"""
        key = f"similar:{book_id}"
        return self.get(key)
    
    def set_similar_books(
        self,
        book_id: int,
        books: List[Dict],
        ttl_seconds: int = 1800  # 30 minutes
    ) -> None:
        """Cache similar books"""
        key = f"similar:{book_id}"
        self.set(key, books, ttl_seconds)
    
    def get_review_analysis(self, book_id: int) -> Optional[Dict]:
        """Get cached review analysis"""
        key = f"review_analysis:{book_id}"
        return self.get(key)
    
    def set_review_analysis(
        self,
        book_id: int,
        analysis: Dict,
        ttl_seconds: int = 3600  # 1 hour
    ) -> None:
        """Cache review analysis"""
        key = f"review_analysis:{book_id}"
        self.set(key, analysis, ttl_seconds)


# Global cache instance
cache_service = CacheService(default_ttl_seconds=3600)
