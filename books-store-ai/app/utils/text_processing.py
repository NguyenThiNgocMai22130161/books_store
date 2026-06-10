"""
Text Processing Utilities
Clean and prepare text for embedding
"""

import re
from typing import Dict


def clean_text(text: str) -> str:
    """
    Clean text for embedding
    
    Args:
        text: Raw text
        
    Returns:
        Cleaned text
    """
    if not text:
        return ""
    
    # Remove HTML tags
    text = re.sub(r'<[^>]+>', '', text)
    
    # Remove extra whitespace
    text = re.sub(r'\s+', ' ', text)
    
    # Remove special characters but keep Vietnamese
    text = re.sub(r'[^\w\sÀ-ỹ.,!?-]', '', text)
    
    return text.strip()


def build_search_text(book: Dict) -> str:
    """
    Build searchable text from book data
    Combines title, author, description, category
    
    Args:
        book: Book dictionary from backend
        
    Returns:
        Combined search text
    """
    parts = []
    
    # Title
    if book.get('title'):
        parts.append(f"Tên sách: {book['title']}")
    
    # Author
    if book.get('author'):
        parts.append(f"Tác giả: {book['author']}")
    
    # Category
    if book.get('category'):
        parts.append(f"Thể loại: {book['category']}")
    
    # Description
    if book.get('description'):
        desc = clean_text(book['description'])
        # Truncate long descriptions
        if len(desc) > 2000:
            desc = desc[:2000] + "..."
        parts.append(f"Mô tả: {desc}")
    
    # Year
    if book.get('year'):
        parts.append(f"Năm: {book['year']}")
    
    # Price
    if book.get('price'):
        parts.append(f"Giá: {book['price']:,.0f}đ")
    
    # Combine all parts
    search_text = "\n".join(parts)
    
    # Ensure reasonable length (max 8000 chars)
    if len(search_text) > 8000:
        search_text = search_text[:8000]
    
    return search_text


def extract_metadata(book: Dict) -> Dict:
    """
    Extract metadata from book for scoring
    
    Args:
        book: Book dictionary
        
    Returns:
        Metadata dict with rating, reviews, etc.
    """
    return {
        'book_id': book.get('id'),
        'title': book.get('title', ''),
        'author': book.get('author', ''),
        'category': book.get('category', ''),
        'price': book.get('price', 0),
        'year': book.get('year'),
        # These would come from reviews/orders if available
        'avg_rating': 0.0,
        'total_reviews': 0,
        'total_orders': 0
    }
