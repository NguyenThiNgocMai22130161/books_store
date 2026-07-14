"""
Text Utilities
Safe text processing with word boundary checking
"""

import re
from typing import List


def normalize_text(text: str) -> str:
    """
    Normalize text for intent detection
    
    Args:
        text: Input text
        
    Returns:
        Normalized lowercase text
    """
    if not text:
        return ""
    
    # Convert to lowercase
    text = text.lower().strip()
    
    # Normalize whitespace
    text = re.sub(r'\s+', ' ', text)
    
    return text


def contains_phrase(text: str, phrase: str, word_boundary: bool = True) -> bool:
    """
    Check if text contains phrase with optional word boundary
    
    Args:
        text: Text to search in (should be normalized)
        phrase: Phrase to search for (should be normalized)
        word_boundary: If True, use word boundary check
        
    Returns:
        True if phrase found
        
    Examples:
        >>> contains_phrase("hi there", "hi", True)
        True
        >>> contains_phrase("thiếu nhi", "hi", True)
        False
        >>> contains_phrase("xin chào bạn", "chào", True)
        True
        >>> contains_phrase("nguyễn nhật ánh chào bạn", "chào", True)
        True
    """
    if not text or not phrase:
        return False
    
    if not word_boundary:
        return phrase in text
    
    # Build regex with word boundaries
    # Use \b for ASCII, but also check space/punctuation for Unicode
    pattern = r'(?:^|[\s\W])' + re.escape(phrase) + r'(?:[\s\W]|$)'
    
    return bool(re.search(pattern, text))


def contains_any_phrase(text: str, phrases: List[str], word_boundary: bool = True) -> bool:
    """
    Check if text contains any of the phrases
    
    Args:
        text: Text to search in
        phrases: List of phrases
        word_boundary: Use word boundary check
        
    Returns:
        True if any phrase found
    """
    text_normalized = normalize_text(text)
    
    for phrase in phrases:
        phrase_normalized = normalize_text(phrase)
        if contains_phrase(text_normalized, phrase_normalized, word_boundary):
            return True
    
    return False


def extract_book_titles(text: str) -> List[str]:
    """
    Extract potential book titles from comparison queries
    
    Common patterns:
    - "So sánh TITLE1 và TITLE2"
    - "TITLE1 với TITLE2"
    - "Cuốn TITLE1 hay TITLE2"
    - "Compare TITLE1 and TITLE2"
    
    Args:
        text: Input text (can be original case)
        
    Returns:
        List of 2 titles, or empty list if extraction fails
        
    Examples:
        >>> extract_book_titles("So sánh Atomic Habits và Deep Work")
        ['Atomic Habits', 'Deep Work']
        >>> extract_book_titles("atomic habits với deep work")
        ['atomic habits', 'deep work']
        >>> extract_book_titles("so sánh 'Your Name' và 'Weathering With You'")
        ['Your Name', 'Weathering With You']
    """
    titles = []
    
    # Remove common prefixes and suffixes
    clean_text = text
    clean_text = re.sub(r'^(so\s+sánh|compare)\s+', '', clean_text, flags=re.IGNORECASE)
    clean_text = re.sub(r'\s+(khác\s+nhau|giống\s+nhau|nên\s+chọn|hay\s+hơn).*$', '', clean_text, flags=re.IGNORECASE)
    clean_text = re.sub(r'\?+$', '', clean_text)
    clean_text = clean_text.strip()
    
    # Pattern 1: Quoted titles "TITLE1" và "TITLE2"
    pattern_quoted = r'["\']([^"\']+)["\']\s+(?:và|với|hay|vs|versus|and)\s+["\']([^"\']+)["\']'
    match = re.search(pattern_quoted, clean_text, re.IGNORECASE)
    if match:
        titles = [match.group(1).strip(), match.group(2).strip()]
        return [t for t in titles if t]  # Remove empty strings
    
    # Pattern 2: Simple "X và Y" split
    # Try multiple separators
    for separator in [' và ', ' với ', ' hay ', ' vs ', ' versus ', ' and ']:
        if separator in clean_text.lower():
            # Find separator position (case-insensitive)
            pattern = re.escape(separator)
            parts = re.split(pattern, clean_text, maxsplit=1, flags=re.IGNORECASE)
            
            if len(parts) == 2:
                title1 = parts[0].strip()
                title2 = parts[1].strip()
                
                # Remove remaining question words at the end
                title2 = re.sub(r'\s+(không|chứ|nhỉ)$', '', title2, flags=re.IGNORECASE)
                
                # Remove leading articles/words
                title1 = re.sub(r'^(cuốn|quyển|sách)\s+', '', title1, flags=re.IGNORECASE)
                title2 = re.sub(r'^(cuốn|quyển|sách)\s+', '', title2, flags=re.IGNORECASE)
                
                # Only accept if both titles are meaningful (> 2 chars)
                if len(title1) > 2 and len(title2) > 2:
                    titles = [title1, title2]
                    break
    
    # Return only if we got exactly 2 titles
    if len(titles) == 2:
        return titles
    
    return []


def truncate_text(text: str, max_length: int, suffix: str = "...") -> str:
    """
    Truncate text safely
    
    Args:
        text: Text to truncate
        max_length: Maximum length
        suffix: Suffix to add if truncated
        
    Returns:
        Truncated text
    """
    if not text:
        return ""
    
    if len(text) <= max_length:
        return text
    
    # Truncate and add suffix
    truncated = text[:max_length - len(suffix)].strip()
    
    # Try to break at word boundary
    last_space = truncated.rfind(' ')
    if last_space > max_length * 0.8:  # If space is not too far back
        truncated = truncated[:last_space]
    
    return truncated + suffix


def format_price(price: float) -> str:
    """
    Format price in Vietnamese format
    
    Args:
        price: Price value
        
    Returns:
        Formatted price string
    """
    try:
        return f"{float(price):,.0f}đ"
    except (ValueError, TypeError):
        return "Chưa có giá"


def safe_get(data: dict, *keys, default=None):
    """
    Safely get value from dict with multiple possible keys
    
    Args:
        data: Dictionary
        *keys: Possible keys to try
        default: Default value if not found
        
    Returns:
        Value or default
        
    Example:
        >>> safe_get(book, 'stock', 'stockQuantity', 'quantity', default=0)
    """
    for key in keys:
        if key in data and data[key] is not None:
            return data[key]
    return default
