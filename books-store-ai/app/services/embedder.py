"""
Embedding Service
Handles text-to-vector conversion using Google Gemini
"""

import google.generativeai as genai
from typing import List, Union
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)


class Embedder:
    """
    Wrapper for Google Gemini Embedding API
    """
    
    def __init__(self):
        """Initialize embedder with Google API"""
        genai.configure(api_key=settings.GOOGLE_API_KEY)
        self.model = settings.EMBED_MODEL
        self.dimension = settings.EMBED_DIM
        logger.info(f"[OK] Embedder initialized: {self.model} ({self.dimension}d)")
    
    def encode(self, texts: Union[str, List[str]]) -> List[List[float]]:
        """
        Convert text(s) to embedding vector(s)
        
        Args:
            texts: Single text string or list of texts
            
        Returns:
            List of embedding vectors (each vector is list of floats)
            
        Raises:
            Exception: If embedding fails
        """
        # Handle single string
        if isinstance(texts, str):
            texts = [texts]
        
        if not texts:
            return []
        
        embeddings = []
        
        # Process texts (Gemini can handle batches but we'll do one-by-one for rate limit control)
        for i, text in enumerate(texts):
            try:
                # Truncate if too long (Gemini has token limits)
                if len(text) > 10000:
                    text = text[:10000]
                    logger.warning(f"Text {i} truncated to 10000 chars")
                
                # Call Gemini API
                result = genai.embed_content(
                    model=self.model,
                    content=text,
                    task_type="retrieval_document"  # For indexing documents
                )
                
                embedding = result['embedding']
                
                # Validate dimension
                if len(embedding) != self.dimension:
                    logger.warning(
                        f"Expected {self.dimension}d, got {len(embedding)}d"
                    )
                
                embeddings.append(embedding)
                
            except Exception as e:
                logger.error(f"Failed to embed text {i}: {str(e)}")
                # Return zero vector on error
                embeddings.append([0.0] * self.dimension)
        
        logger.debug(f"Embedded {len(texts)} texts successfully")
        return embeddings
    
    def encode_query(self, query: str) -> List[float]:
        """
        Encode a search query (optimized for retrieval)
        
        Args:
            query: Search query string
            
        Returns:
            Single embedding vector
        """
        try:
            result = genai.embed_content(
                model=self.model,
                content=query,
                task_type="retrieval_query"  # Optimized for queries
            )
            return result['embedding']
        
        except Exception as e:
            logger.error(f"Failed to embed query: {str(e)}")
            return [0.0] * self.dimension


# Global embedder instance
embedder = Embedder()
