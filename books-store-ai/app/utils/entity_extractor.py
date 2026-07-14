"""
Entity Extractor
Extract structured information from user messages
"""

import re
from typing import Dict, Any, Optional, List


def extract_entities(text: str) -> Dict[str, Any]:
    """
    Extract all entities from text
    
    Args:
        text: Input text
        
    Returns:
        Dict with extracted entities
    """
    entities = {}
    
    # Age
    age = extract_age(text)
    if age:
        entities['age'] = age
    
    # Quantity
    quantity = extract_quantity(text)
    if quantity:
        entities['quantity'] = quantity
    
    # Author
    author = extract_author(text)
    if author:
        entities['author'] = author
    
    # Purpose
    purpose = extract_purpose(text)
    if purpose:
        entities['purpose'] = purpose
    
    # Recipient
    recipient = extract_recipient(text)
    if recipient:
        entities['recipient'] = recipient
    
    # Difficulty level
    level = extract_difficulty_level(text)
    if level:
        entities['level'] = level
    
    # Language
    language = extract_language(text)
    if language:
        entities['language'] = language
    
    return entities


def extract_age(text: str) -> Optional[int]:
    """
    Extract age from text
    
    Examples:
    - "trẻ 8 tuổi" -> 8
    - "cho bé 10 tuổi" -> 10
    - "thiếu nhi" -> 10 (default)
    
    Args:
        text: Input text
        
    Returns:
        Age in years or None
    """
    text_lower = text.lower()
    
    # Pattern: "X tuổi"
    pattern = r'(\d+)\s*tuổi'
    match = re.search(pattern, text_lower)
    if match:
        return int(match.group(1))
    
    # Special keywords
    age_keywords = {
        'thiếu nhi': 10,
        'nhi đồng': 10,
        'trẻ em': 8,
        'trẻ nhỏ': 6,
        'học sinh': 12,
        'sinh viên': 20,
        'người lớn': 25,
        'trung niên': 40
    }
    
    for keyword, age in age_keywords.items():
        if keyword in text_lower:
            return age
    
    return None


def extract_quantity(text: str) -> Optional[int]:
    """
    Extract quantity from text
    
    Examples:
    - "3 cuốn" -> 3
    - "combo 5 quyển" -> 5
    - "mua 2 sách" -> 2
    
    Args:
        text: Input text
        
    Returns:
        Quantity or None
    """
    text_lower = text.lower()
    
    # Pattern: "X cuốn/quyển/sách"
    patterns = [
        r'(\d+)\s*(?:cuốn|quyển|sách|đầu)',
        r'combo\s+(\d+)',
        r'mua\s+(\d+)',
        r'tặng\s+(\d+)'
    ]
    
    for pattern in patterns:
        match = re.search(pattern, text_lower)
        if match:
            return int(match.group(1))
    
    return None


def extract_author(text: str) -> Optional[str]:
    """
    Extract author name from text
    
    Examples:
    - "sách của Nguyễn Nhật Ánh" -> "Nguyễn Nhật Ánh"
    - "tác giả Paulo Coelho" -> "Paulo Coelho"
    - "viết bởi Tô Hoài" -> "Tô Hoài"
    
    Args:
        text: Input text
        
    Returns:
        Author name or None
    """
    # Pattern: "của AUTHOR"
    pattern1 = r'của\s+([A-ZÀÁẢÃẠĂẮẰẲẴẶÂẤẦẨẪẬÈÉẺẼẸÊỀẾỂỄỆÌÍỈĨỊÒÓỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÙÚỦŨỤƯỨỪỬỮỰỲÝỶỸỴĐ][a-zàáảãạăắằẳẵặâấầẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ]*(?:\s+[A-ZÀÁẢÃẠĂẮẰẲẴẶÂẤẦẨẪẬÈÉẺẼẸÊỀẾỂỄỆÌÍỈĨỊÒÓỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÙÚỦŨỤƯỨỪỬỮỰỲÝỶỸỴĐ][a-zàáảãạăắằẳẵặâấầẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ]*)+)'
    match = re.search(pattern1, text)
    if match:
        return match.group(1).strip()
    
    # Pattern: "tác giả AUTHOR"
    pattern2 = r'tác\s+giả\s+([A-ZÀÁẢÃẠĂẮẰẲẴẶÂẤẦẨẪẬÈÉẺẼẸÊỀẾỂỄỆÌÍỈĨỊÒÓỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÙÚỦŨỤƯỨỪỬỮỰỲÝỶỸỴĐ][a-zàáảãạăắằẳẵặâấầẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ]*(?:\s+[A-ZÀÁẢÃẠĂẮẰẲẴẶÂẤẦẨẪẬÈÉẺẼẸÊỀẾỂỄỆÌÍỈĨỊÒÓỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÙÚỦŨỤƯỨỪỬỮỰỲÝỶỸỴĐ][a-zàáảãạăắằẳẵặâấầẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ]*)+)'
    match = re.search(pattern2, text)
    if match:
        return match.group(1).strip()
    
    # Pattern: "viết bởi AUTHOR" or "written by AUTHOR"
    pattern3 = r'(?:viết\s+bởi|written\s+by)\s+([A-ZÀÁẢÃẠĂẮẰẲẴẶÂẤẦẨẪẬÈÉẺẼẸÊỀẾỂỄỆÌÍỈĨỊÒÓỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÙÚỦŨỤƯỨỪỬỮỰỲÝỶỸỴĐ][a-zàáảãạăắằẳẵặâấầẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ]*(?:\s+[A-ZÀÁẢÃẠĂẮẰẲẴẶÂẤẦẨẪẬÈÉẺẼẸÊỀẾỂỄỆÌÍỈĨỊÒÓỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÙÚỦŨỤƯỨỪỬỮỰỲÝỶỸỴĐ][a-zàáảãạăắằẳẵặâấầẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ]*)+)'
    match = re.search(pattern3, text)
    if match:
        return match.group(1).strip()
    
    return None


def extract_purpose(text: str) -> Optional[str]:
    """
    Extract reading purpose from text
    
    Examples:
    - "làm quà" -> "gift"
    - "tặng sinh nhật" -> "gift"
    - "học tập" -> "study"
    - "giải trí" -> "entertainment"
    
    Args:
        text: Input text
        
    Returns:
        Purpose keyword or None
    """
    text_lower = text.lower()
    
    purpose_map = {
        'gift': ['làm quà', 'tặng', 'quà sinh nhật', 'quà tặng', 'biếu'],
        'study': ['học tập', 'học', 'nghiên cứu', 'tham khảo', 'ôn thi'],
        'entertainment': ['giải trí', 'thư giãn', 'đọc chơi', 'tiêu khiển'],
        'self_improvement': ['phát triển bản thân', 'nâng cao', 'cải thiện', 'tự học'],
        'work': ['công việc', 'nghề nghiệp', 'chuyên môn']
    }
    
    for purpose, keywords in purpose_map.items():
        for keyword in keywords:
            if keyword in text_lower:
                return purpose
    
    return None


def extract_recipient(text: str) -> Optional[str]:
    """
    Extract gift recipient from text
    
    Examples:
    - "tặng bạn nữ" -> "female_friend"
    - "cho con trai" -> "son"
    - "biếu sếp" -> "boss"
    
    Args:
        text: Input text
        
    Returns:
        Recipient keyword or None
    """
    text_lower = text.lower()
    
    recipient_map = {
        'female_friend': ['bạn nữ', 'bạn gái', 'người yêu nữ'],
        'male_friend': ['bạn nam', 'bạn trai', 'người yêu nam'],
        'child': ['con', 'cháu', 'em bé', 'trẻ em'],
        'son': ['con trai'],
        'daughter': ['con gái'],
        'parent': ['bố mẹ', 'ba mẹ', 'cha mẹ'],
        'boss': ['sếp', 'giám đốc', 'cấp trên'],
        'teacher': ['thầy', 'cô', 'giáo viên']
    }
    
    for recipient, keywords in recipient_map.items():
        for keyword in keywords:
            if keyword in text_lower:
                return recipient
    
    return None


def extract_difficulty_level(text: str) -> Optional[str]:
    """
    Extract difficulty/skill level from text
    
    Examples:
    - "người mới" -> "beginner"
    - "nâng cao" -> "advanced"
    
    Args:
        text: Input text
        
    Returns:
        Level keyword or None
    """
    text_lower = text.lower()
    
    if any(kw in text_lower for kw in ['người mới', 'mới bắt đầu', 'beginner', 'cơ bản', 'nhập môn', 'từ đầu']):
        return 'beginner'
    
    if any(kw in text_lower for kw in ['trung cấp', 'intermediate', 'trung bình']):
        return 'intermediate'
    
    if any(kw in text_lower for kw in ['nâng cao', 'advanced', 'chuyên sâu', 'chuyên nghiệp']):
        return 'advanced'
    
    return None


def extract_language(text: str) -> Optional[str]:
    """
    Extract language preference from text
    
    Args:
        text: Input text
        
    Returns:
        Language code or None
    """
    text_lower = text.lower()
    
    if any(kw in text_lower for kw in ['tiếng anh', 'english', 'english book']):
        return 'en'
    
    if any(kw in text_lower for kw in ['tiếng việt', 'vietnamese', 'sách việt']):
        return 'vi'
    
    return None


def extract_comparison_context(text: str) -> Optional[List[str]]:
    """
    Extract book titles for comparison
    
    Args:
        text: Input text
        
    Returns:
        List of 2 titles or None
    """
    from app.utils.text_utils import extract_book_titles
    titles = extract_book_titles(text)
    return titles if len(titles) == 2 else None
