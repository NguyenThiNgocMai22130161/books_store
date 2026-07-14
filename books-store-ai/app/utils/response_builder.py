"""
Response Builder
Build consistent, well-formatted responses
"""

from typing import List, Dict, Any
from app.utils.text_utils import truncate_text, format_price


def build_book_list_response(books: List[Any], context: str = "") -> str:
    """
    Build formatted book list response
    
    Args:
        books: List of book objects (SearchResult or dict)
        context: Optional context message
        
    Returns:
        Formatted response string
    """
    if not books:
        return "Tôi chưa tìm thấy cuốn sách phù hợp trong dữ liệu hiện có."
    
    parts = []
    
    if context:
        parts.append(context + "\n")
    
    for i, book in enumerate(books, 1):
        # Handle both SearchResult objects and dicts
        if hasattr(book, 'title'):
            title = book.title
            author = book.author
            price = book.price
            category = getattr(book, 'category', None)
            description = getattr(book, 'description', None)
        else:
            title = book.get('title', 'Chưa có tên')
            author = book.get('author', 'Chưa rõ tác giả')
            price = book.get('price', 0)
            category = book.get('category')
            description = book.get('description')
        
        parts.append(f"\n{i}. **{title}**")
        parts.append(f"   👤 Tác giả: {author}")
        parts.append(f"   💰 Giá: {format_price(price)}")
        
        if category:
            parts.append(f"   📚 Thể loại: {category}")
        
        if description:
            desc_short = truncate_text(description, 150)
            parts.append(f"   📖 {desc_short}")
    
    return "\n".join(parts)


def build_book_detail_response(book: Dict[str, Any]) -> str:
    """
    Build detailed book information response
    
    Args:
        book: Book dictionary from backend
        
    Returns:
        Formatted response
    """
    from app.utils.text_utils import safe_get
    
    title = safe_get(book, 'title', default='Cuốn sách này')
    author = safe_get(book, 'author', default='Chưa rõ tác giả')
    price = safe_get(book, 'price', default=0)
    category = safe_get(book, 'category', default='Chưa phân loại')
    description = safe_get(book, 'description', default='Chưa có mô tả.')
    year = safe_get(book, 'year')
    quantity = safe_get(book, 'stock', 'stockQuantity', 'quantity', default=None)
    
    parts = [
        f"**{title}**",
        f"👤 Tác giả: {author}",
        f"💰 Giá: {format_price(price)}",
        f"📚 Thể loại: {category}"
    ]
    
    if year:
        parts.append(f"📅 Năm xuất bản: {year}")
    
    if quantity is not None:
        if quantity > 0:
            parts.append(f"📦 Tồn kho: {quantity} cuốn")
        else:
            parts.append("📦 Trạng thái: **Hiện đang hết hàng**")
    
    parts.append(f"\n📖 **Mô tả:** {description}")
    
    return "\n".join(parts)


def build_comparison_response(book1: Dict, book2: Dict) -> str:
    """
    Build book comparison response
    
    Args:
        book1: First book
        book2: Second book
        
    Returns:
        Formatted comparison
    """
    from app.utils.text_utils import safe_get
    
    # Extract info
    title1 = safe_get(book1, 'title', default='Sách 1')
    title2 = safe_get(book2, 'title', default='Sách 2')
    
    author1 = safe_get(book1, 'author', default='Chưa rõ')
    author2 = safe_get(book2, 'author', default='Chưa rõ')
    
    price1 = safe_get(book1, 'price', default=0)
    price2 = safe_get(book2, 'price', default=0)
    
    category1 = safe_get(book1, 'category', default='Chưa rõ')
    category2 = safe_get(book2, 'category', default='Chưa rõ')
    
    desc1 = safe_get(book1, 'description', default='')
    desc2 = safe_get(book2, 'description', default='')
    
    # Build comparison
    parts = [
        f"So sánh **{title1}** và **{title2}**:\n",
        "**📚 Thông tin cơ bản:**",
        f"• {title1}:",
        f"  - Tác giả: {author1}",
        f"  - Thể loại: {category1}",
        f"  - Giá: {format_price(price1)}",
        f"\n• {title2}:",
        f"  - Tác giả: {author2}",
        f"  - Thể loại: {category2}",
        f"  - Giá: {format_price(price2)}",
    ]
    
    # Price comparison
    parts.append("\n**💰 So sánh giá:**")
    if price1 < price2:
        diff = price2 - price1
        parts.append(f"• **{title1}** rẻ hơn {format_price(diff)}")
    elif price2 < price1:
        diff = price1 - price2
        parts.append(f"• **{title2}** rẻ hơn {format_price(diff)}")
    else:
        parts.append("• Hai cuốn có cùng mức giá")
    
    # Category comparison
    if category1 and category2 and category1 != category2:
        parts.append(f"\n**📖 Thể loại:**")
        parts.append(f"• {title1} thuộc thể loại **{category1}**")
        parts.append(f"• {title2} thuộc thể loại **{category2}**")
    
    # Description comparison
    if desc1 or desc2:
        parts.append("\n**📝 Nội dung:**")
        if desc1:
            parts.append(f"• {title1}: {truncate_text(desc1, 200)}")
        if desc2:
            parts.append(f"• {title2}: {truncate_text(desc2, 200)}")
    
    return "\n".join(parts)


def build_order_status_response(orders: List[Dict]) -> str:
    """
    Build order status response
    
    Args:
        orders: List of orders
        
    Returns:
        Formatted response
    """
    if not orders:
        return "Bạn chưa có đơn hàng nào."
    
    parts = [f"Bạn có **{len(orders)}** đơn hàng:\n"]
    
    status_map = {
        'PENDING': '⏳ Đang xử lý',
        'PROCESSING': '📦 Đang chuẩn bị',
        'SHIPPED': '🚚 Đang giao',
        'DELIVERED': '✅ Đã giao',
        'COMPLETED': '✅ Hoàn thành',
        'CANCELLED': '❌ Đã hủy'
    }
    
    for i, order in enumerate(orders[:5], 1):  # Show max 5 recent orders
        order_id = order.get('orderId', order.get('id', 'N/A'))
        status = order.get('status', 'UNKNOWN')
        total = order.get('totalAmount', order.get('total', 0))
        created_at = order.get('createdAt', order.get('orderDate', ''))
        
        status_display = status_map.get(status, status)
        
        parts.append(f"\n{i}. Đơn hàng #{order_id}")
        parts.append(f"   {status_display}")
        parts.append(f"   💰 Tổng: {format_price(total)}")
        if created_at:
            parts.append(f"   📅 Ngày đặt: {created_at}")
    
    if len(orders) > 5:
        parts.append(f"\n... và {len(orders) - 5} đơn hàng khác")
    
    return "\n".join(parts)


def build_stock_response(book: Dict) -> str:
    """
    Build stock availability response
    
    Args:
        book: Book dict
        
    Returns:
        Stock status message
    """
    from app.utils.text_utils import safe_get
    
    title = safe_get(book, 'title', default='Cuốn sách này')
    quantity = safe_get(book, 'stock', 'stockQuantity', 'quantity', default=None)
    
    if quantity is None:
        return f"Hiện tôi chưa lấy được thông tin tồn kho của **{title}**."
    
    if quantity > 20:
        return f"**{title}** hiện còn hàng ({quantity} cuốn)."
    elif quantity > 0:
        return f"**{title}** còn ít hàng (chỉ còn {quantity} cuốn)."
    else:
        return f"**{title}** hiện đang **hết hàng**. Bạn có thể đặt trước hoặc xem các sách tương tự."


def build_error_response(error_type: str = "general") -> str:
    """
    Build user-friendly error response
    
    Args:
        error_type: Type of error
        
    Returns:
        Error message
    """
    messages = {
        "not_found": "Xin lỗi, tôi không tìm thấy thông tin bạn cần.",
        "no_auth": "Bạn cần đăng nhập để xem thông tin này.",
        "backend_error": "Hiện tôi không thể kết nối với hệ thống. Vui lòng thử lại sau.",
        "invalid_request": "Tôi chưa hiểu yêu cầu của bạn. Bạn có thể nói rõ hơn được không?",
        "general": "Có lỗi xảy ra. Vui lòng thử lại."
    }
    
    return messages.get(error_type, messages["general"])
