# Debug: Thêm Sách Vào Giỏ Hàng

## Checklist Kiểm Tra

### 1. **Nút "Thêm vào giỏ" có hiển thị không?**
- ✅ Nút chỉ hiển thị cho **user thường** (không phải admin)
- ❌ Admin không thấy nút này (admin không mua hàng)

```javascript
// BookList.jsx
{!isAdmin && (
  <button onClick={() => handleAddToCart(book.id)}>
    Thêm vào giỏ
  </button>
)}
```

### 2. **Đã đăng nhập với tài khoản USER chưa?**
- ❌ Nếu đăng nhập với admin → Không thấy nút
- ✅ Nếu đăng nhập với user thường → Thấy nút

**Kiểm tra**: Xem menu dropdown có "Dashboard Admin" không
- Có → Đang dùng admin
- Không → Đang dùng user thường

### 3. **Console có log gì không?**

#### Frontend Console (F12)
```
Adding to cart - bookId: 123, type: number
Add to cart response: {message: "Đã thêm vào giỏ hàng!"}
```

Hoặc nếu lỗi:
```
Error adding to cart: ...
Error response: {error: "..."}
```

#### Backend Terminal
```
=== CartController.addToCart ===
Request body: {bookId=123, quantity=1}
User: john_doe, isAdmin: false
BookId: 123, Quantity: 1
Successfully added to cart
```

Hoặc nếu lỗi:
```
Error adding to cart: Book not found
```

## Các Lỗi Thường Gặp

### Lỗi 1: "Tài khoản admin không thể thêm sách vào giỏ hàng!"
**Nguyên nhân**: Đang đăng nhập với tài khoản admin

**Giải pháp**: 
1. Đăng xuất
2. Đăng nhập lại với tài khoản user thường
3. Hoặc tạo tài khoản user mới

### Lỗi 2: Không thấy nút "Thêm vào giỏ"
**Nguyên nhân**: 
- Đang đăng nhập với admin
- Hoặc `isAdmin` check không đúng

**Giải pháp**:
1. Kiểm tra console: `console.log('isAdmin:', isAdmin)`
2. Kiểm tra user roles trong API response

### Lỗi 3: "Book not found"
**Nguyên nhân**: bookId không tồn tại trong database

**Giải pháp**:
1. Kiểm tra database: `SELECT * FROM books WHERE id = 123;`
2. Kiểm tra bookId có đúng không

### Lỗi 4: "User not found"
**Nguyên nhân**: Session hết hạn hoặc chưa đăng nhập

**Giải pháp**:
1. Đăng nhập lại
2. Kiểm tra cookie session

### Lỗi 5: Network Error / 401 Unauthorized
**Nguyên nhân**: 
- Backend không chạy
- Session hết hạn
- CORS issue

**Giải pháp**:
1. Kiểm tra backend đang chạy: `http://localhost:8080`
2. Đăng nhập lại
3. Kiểm tra CORS config

## Test Steps

### Test 1: Thêm sách vào giỏ (User thường)
1. **Đăng nhập** với tài khoản user thường
2. **Vào trang /books**
3. **Kiểm tra**: Có thấy nút "Thêm vào giỏ" không?
4. **Click nút "Thêm vào giỏ"** ở một cuốn sách
5. **Kiểm tra**:
   - Alert "Đã thêm vào giỏ hàng!" hiển thị
   - Cart count tăng lên (icon giỏ hàng)
   - Console log thành công

### Test 2: Admin không thể thêm vào giỏ
1. **Đăng nhập** với tài khoản admin
2. **Vào trang /books**
3. **Kiểm tra**: Không thấy nút "Thêm vào giỏ" ✅
4. **Thấy nút "Sửa" và "Xóa"** (nếu vào chi tiết sách)

### Test 3: Kiểm tra giỏ hàng
1. **Thêm vài sách** vào giỏ
2. **Click icon giỏ hàng** (navbar)
3. **Kiểm tra**: Các sách đã thêm có hiển thị không?

## API Endpoints

### POST /api/cart/add
**Request**:
```json
{
  "bookId": "123",
  "quantity": 1
}
```

**Response Success (200)**:
```json
{
  "message": "Đã thêm vào giỏ hàng!"
}
```

**Response Error (400) - Admin**:
```json
{
  "error": "Tài khoản admin không thể thêm sách vào giỏ hàng!"
}
```

**Response Error (400) - Book not found**:
```json
{
  "error": "Book not found with id: 123"
}
```

### GET /api/cart
**Response**:
```json
{
  "cartItems": [
    {
      "id": 1,
      "book": {
        "id": 123,
        "title": "Clean Code",
        "price": 350000
      },
      "quantity": 2
    }
  ],
  "total": 700000,
  "itemCount": 2
}
```

## Code Changes

### Frontend - BookList.jsx
```javascript
// ✅ Đã thêm log và convert bookId to string
const handleAddToCart = async (bookId) => {
  console.log('Adding to cart - bookId:', bookId, 'type:', typeof bookId);
  
  const response = await axios.post(
    'http://localhost:8080/api/cart/add',
    { bookId: String(bookId), quantity: 1 },  // Convert to string
    { withCredentials: true }
  );
  
  console.log('Add to cart response:', response.data);
};
```

### Backend - CartController.java
```java
// ✅ Đã thêm log và xử lý bookId type
@PostMapping("/add")
public ResponseEntity<?> addToCart(@RequestBody Map<String, Object> request,
                                  Authentication authentication) {
    System.out.println("=== CartController.addToCart ===");
    System.out.println("Request body: " + request);
    
    User user = getUserFromAuthentication(authentication);
    System.out.println("User: " + user.getUsername() + ", isAdmin: " + user.isAdmin());
    
    if (user.isAdmin()) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("error", "Tài khoản admin không thể thêm sách vào giỏ hàng!"));
    }
    
    Object bookIdObj = request.get("bookId");
    String bookId = bookIdObj != null ? String.valueOf(bookIdObj) : null;
    
    cartService.addToCart(user, bookId, quantity);
    return ResponseEntity.ok(Map.of("message", "Đã thêm vào giỏ hàng!"));
}
```

## Tạo Tài Khoản User Thường

Nếu chưa có tài khoản user thường:

### Cách 1: Đăng ký qua UI
1. Vào `/register`
2. Điền form đăng ký
3. Submit

### Cách 2: Thêm trực tiếp vào database
```sql
-- Thêm user mới (password: "password123")
INSERT INTO users (username, email, password, full_name, active) 
VALUES ('john_doe', 'john@example.com', '$2a$10$...', 'John Doe', true);

-- Thêm role USER
INSERT INTO user_roles (user_id, roles) 
VALUES (LAST_INSERT_ID(), 'ROLE_USER');
```

## Kết Luận

**Vấn đề thường gặp**:
1. ❌ Đăng nhập với admin → Không thấy nút
2. ❌ bookId type không đúng → Lỗi backend
3. ❌ Session hết hạn → 401 Unauthorized

**Giải pháp**:
1. ✅ Đăng nhập với user thường
2. ✅ Convert bookId to string
3. ✅ Thêm log để debug

Sau khi thêm log, restart backend và test lại. Gửi cho tôi log từ cả browser console và backend terminal nếu vẫn lỗi!
