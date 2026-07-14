"""
Pydantic schemas for request/response models
"""

from pydantic import BaseModel, Field
from typing import List, Optional


class ChatRequest(BaseModel):
    """Chat request from user"""
    message: str = Field(..., min_length=1, max_length=500, description="User's question")
    book_id: Optional[int] = Field(None, description="Optional book context")
    session_id: Optional[str] = Field(None, description="Session ID for chat history")
    category: Optional[str] = Field(None, description="Filter by category")
    user_id: Optional[int] = Field(None, description="Optional user ID for order queries")
    
    class Config:
        json_schema_extra = {
            "example": {
                "message": "Tìm sách về lập trình Python cho người mới bắt đầu",
                "book_id": None,
                "category": "Technology",
                "user_id": None
            }
        }


class BookRecommendation(BaseModel):
    """Book recommendation in response"""
    book_id: int
    title: str
    author: str
    price: float
    category: Optional[str] = None
    score: float = Field(..., description="Relevance score")
    image_url: Optional[str] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "book_id": 33,
                "title": "Python Crash Course",
                "author": "Eric Matthes",
                "price": 450000,
                "category": "Technology",
                "score": 0.92
            }
        }


class ChatResponse(BaseModel):
    """Chat response to user"""
    answer: str = Field(..., description="AI-generated answer")
    sources: List[BookRecommendation] = Field(default=[], description="Recommended books")
    intent: str = Field(default="general", description="Detected user intent")
    session_id: Optional[str] = Field(None, description="Session ID")
    
    class Config:
        json_schema_extra = {
            "example": {
                "answer": "Tôi gợi ý cho bạn cuốn 'Python Crash Course' - một cuốn sách tuyệt vời cho người mới bắt đầu...",
                "sources": [
                    {
                        "book_id": 33,
                        "title": "Python Crash Course",
                        "author": "Eric Matthes",
                        "price": 450000,
                        "category": "Technology",
                        "score": 0.92
                    }
                ],
                "intent": "search",
                "session_id": "abc123"
            }
        }


class SearchRequest(BaseModel):
    """Semantic search request"""
    query: str = Field(..., min_length=1, max_length=200)
    top_k: int = Field(default=5, ge=1, le=20)
    category: Optional[str] = None
    min_price: Optional[float] = Field(None, ge=0)
    max_price: Optional[float] = Field(None, ge=0)
    
    class Config:
        json_schema_extra = {
            "example": {
                "query": "machine learning",
                "top_k": 5,
                "category": "Technology",
                "max_price": 500000
            }
        }


class SearchResponse(BaseModel):
    """Search results"""
    results: List[BookRecommendation]
    total: int
    query: str
    
    class Config:
        json_schema_extra = {
            "example": {
                "results": [],
                "total": 5,
                "query": "machine learning"
            }
        }


class SimilarBooksRequest(BaseModel):
    """Request for similar books"""
    book_id: int = Field(..., description="Reference book ID")
    top_k: int = Field(default=5, ge=1, le=10)


class SimilarBooksResponse(BaseModel):
    """Similar books response"""
    reference_book_id: int
    similar_books: List[BookRecommendation]
    total: int
