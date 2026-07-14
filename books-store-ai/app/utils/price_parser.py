"""
Price Parser
Extract price ranges from Vietnamese text
"""

import re
from typing import Optional, Tuple


def parse_price_range(text: str) -> Tuple[Optional[float], Optional[float]]:
    """
    Parse price range from text
    
    Supports:
    - "dưới 200k" -> (None, 200000)
    - "trên 500 nghìn" -> (500000, None)
    - "từ 100k đến 300k" -> (100000, 300000)
    - "khoảng 1 triệu" -> (900000, 1100000) ± 10%
    - "1,5 triệu" -> (1400000, 1600000)
    - "200.000 đồng" -> (180000, 220000)
    - "tầm 300k" -> (270000, 330000)
    - "không quá 500k" -> (None, 500000)
    
    Args:
        text: Input text
        
    Returns:
        (min_price, max_price) tuple
    """
    text = text.lower()
    
    # Pattern: "từ X đến Y" or "X đến Y"
    pattern_range = r'(?:từ\s+)?([0-9.,]+)\s*(k|nghìn|ngàn|triệu|tr|đ|đồng)?\s*(?:đến|tới|-)\s*([0-9.,]+)\s*(k|nghìn|ngàn|triệu|tr|đ|đồng)?'
    match = re.search(pattern_range, text)
    if match:
        min_val = _parse_number(match.group(1), match.group(2))
        max_val = _parse_number(match.group(3), match.group(4))
        return (min_val, max_val)
    
    # Pattern: "dưới X" or "không quá X" or "X trở xuống"
    pattern_max = r'(?:dưới|không\s+quá|tối\s+đa|max)\s+([0-9.,]+)\s*(k|nghìn|ngàn|triệu|tr|đ|đồng)?'
    match = re.search(pattern_max, text)
    if match:
        max_val = _parse_number(match.group(1), match.group(2))
        return (None, max_val)
    
    # Pattern: "X trở xuống"
    pattern_max2 = r'([0-9.,]+)\s*(k|nghìn|ngàn|triệu|tr|đ|đồng)?\s+(?:trở\s+xuống|trở\s+lại)'
    match = re.search(pattern_max2, text)
    if match:
        max_val = _parse_number(match.group(1), match.group(2))
        return (None, max_val)
    
    # Pattern: "trên X" or "trên X trở lên"
    pattern_min = r'(?:trên|trở\s+lên|từ)\s+([0-9.,]+)\s*(k|nghìn|ngàn|triệu|tr|đ|đồng)?(?:\s+(?:trở\s+lên|trở\s+lại))?'
    match = re.search(pattern_min, text)
    if match:
        min_val = _parse_number(match.group(1), match.group(2))
        return (min_val, None)
    
    # Pattern: "khoảng X" or "tầm X" - give ±10% range
    pattern_approx = r'(?:khoảng|tầm|tầm khoảng|khoảng tầm)\s+([0-9.,]+)\s*(k|nghìn|ngàn|triệu|tr|đ|đồng)?'
    match = re.search(pattern_approx, text)
    if match:
        val = _parse_number(match.group(1), match.group(2))
        if val:
            margin = val * 0.1
            return (val - margin, val + margin)
    
    # Pattern: Single number with unit (give ±10% range)
    pattern_single = r'([0-9.,]+)\s*(k|nghìn|ngàn|triệu|tr|đ|đồng)\b'
    match = re.search(pattern_single, text)
    if match:
        val = _parse_number(match.group(1), match.group(2))
        if val and val >= 1000:  # Only if reasonable price
            margin = val * 0.1
            return (val - margin, val + margin)
    
    return (None, None)


def _parse_number(num_str: str, unit: Optional[str]) -> Optional[float]:
    """
    Parse number with unit to float
    
    Args:
        num_str: Number string (may have . or , separators)
        unit: Unit (k, nghìn, triệu, etc)
        
    Returns:
        Parsed number or None
    """
    if not num_str:
        return None
    
    try:
        # Remove separators
        num_str = num_str.replace('.', '').replace(',', '.')
        value = float(num_str)
        
        # Apply multiplier based on unit
        if unit:
            unit = unit.lower()
            if unit in ['k', 'nghìn', 'ngàn']:
                value *= 1000
            elif unit in ['triệu', 'tr']:
                value *= 1000000
            elif unit in ['đ', 'đồng']:
                # Already in correct unit
                pass
        else:
            # No unit - assume it's already in VND
            # But if < 1000, likely meant as thousands
            if value < 1000:
                value *= 1000
        
        return value
    except (ValueError, AttributeError):
        return None


def has_budget_mention(text: str) -> bool:
    """
    Check if text mentions budget/price
    
    Args:
        text: Input text
        
    Returns:
        True if budget mentioned
    """
    keywords = [
        'ngân sách', 'giá', 'tiền', 'đồng', 'k', 'nghìn', 'triệu',
        'dưới', 'trên', 'khoảng', 'tầm', 'từ', 'đến',
        'budget', 'price', 'cost', 'cheap', 'expensive',
        'rẻ', 'đắt', 'mắc', 'không quá', 'tối đa'
    ]
    
    text_lower = text.lower()
    return any(keyword in text_lower for keyword in keywords)
