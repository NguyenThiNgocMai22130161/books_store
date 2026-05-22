# Sửa Lỗi: Không Hiển Thị Sách Từ Database

## Vấn Đề
Danh sách sách không hiển thị trên giao diện mặc dù đã có data trong database.

## Nguyên Nhân

### 1. **Frontend nhận sai cấu trúc data** ❌
```javascript
// BookList.jsx - SAI
setBooks(response.data.books || []);
```

**Vấn đề**: Frontend expect response có cấu trúc `{ books: [...] }` nhưng backend trả về array trực tiếp `[...]`

### 2. **Backend không hỗ trợ filter** ❌
```java
// BookApiController.java - TRƯỚC KHI SỬA
@GetMapping
public ResponseEntity<List<Book>> getAllBooks() {
    return ResponseEntity.ok(bookService.getAllBooks());
}
```

**Vấn đề**: API không nhận query params (title, author, category, minPrice, maxPrice) nên không thể filter

## Giải Pháp

### 1. **Sửa Frontend - BookList.jsx** ✅

**Trước:**
```javascript
const response = await axios.get(
  `http://localhost:8080/api/books?${params.toString()}`,
  { withCredentials: true }
);

setBooks(response.data.books || []); // ❌ SAI
```

**Sau:**
```javascript
const response = await axios.get(
  `http://localhost:8080/api/books?${params.toString()}`,
  { withCredentials: true }
);

setBooks(response.data || []); // ✅ ĐÚNG
```

**Lý do**: Backend trả về `List<Book>` trực tiếp, không phải object có field `books`

### 2. **Sửa Backend - BookApiController.java** ✅

**Trước:**
```java
@GetMapping
public ResponseEntity<List<Book>> getAllBooks() {
    return ResponseEntity.ok(bookService.getAllBooks());
}
```

**Sau:**
```java
@GetMapping
public ResponseEntity<List<Book>> getAllBooks(
        @RequestParam(required = false) String title,
        @RequestParam(required = false) String author,
        @RequestParam(required = false) String category,
        @RequestParam(required = false) Double minPrice,
        @RequestParam(required = false) Double maxPrice
) {
    // Nếu có bất kỳ filter nào, dùng searchBooks
    if (title != null || author != null || category != null || minPrice != null || maxPrice != null) {
        return ResponseEntity.ok(bookService.searchBooks(title, author, category, minPrice, maxPrice));
    }
    // Nếu không có filter, trả về tất cả
    return ResponseEntity.ok(bookService.getAllBooks());
}
```

**Lý do**: 
- Frontend gửi query params để filter
- Backend cần nhận và xử lý các params này
- BookService đã có method `searchBooks()` sẵn

## Cấu Trúc Data

### Backend Response
```json
[
  {
    "id": 1,
    "title": "Clean Code",
    "author": "Robert C. Martin",
    "price": 350000,
    "category": "Programming",
    "description": "...",
    "imageUrl": "...",
    "quantity": 10
  },
  {
    "id": 2,
    "title": "Design Patterns",
    "author": "Gang of Four",
    "price": 450000,
    "category": "Programming",
    "description": "...",
    "imageUrl": "...",
    "quantity": 5
  }
]
```

### Frontend Xử Lý
```javascript
// ✅ ĐÚNG
const response = await axios.get('http://localhost:8080/api/books');
setBooks(response.data); // response.data là array

// ❌ SAI
setBooks(response.data.books); // response.data không có field 'books'
```

## API Endpoints

### GET /api/books
**Mô tả**: Lấy danh sách sách, có hỗ trợ filter

**Query Parameters** (tất cả optional):
- `title` (String): Tìm theo tên sách (tìm kiếm phần từ, không phân biệt hoa thường)
- `author` (String): Tìm theo tác giả (tìm kiếm phần từ, không phân biệt hoa thường)
- `category` (String): Lọc theo danh mục (khớp chính xác)
- `minPrice` (Double): Giá tối thiểu
- `maxPrice` (Double): Giá tối đa

**Response**: `List<Book>` (array)

**Ví dụ**:
```bash
# Lấy tất cả sách
GET /api/books

# Tìm sách có tên chứa "clean"
GET /api/books?title=clean

# Tìm sách của tác giả "Martin"
GET /api/books?author=Martin

# Lọc sách theo danh mục
GET /api/books?category=Programming

# Lọc sách theo giá
GET /api/books?minPrice=100000&maxPrice=500000

# Kết hợp nhiều filter
GET /api/books?title=code&author=martin&category=Programming&minPrice=200000&maxPrice=400000
```

## BookService Logic

BookService đã có sẵn method `searchBooks()` với logic:

1. **Lấy tất cả sách** từ database
2. **Filter theo title** (nếu có): tìm kiếm phần từ, không phân biệt hoa thường
3. **Filter theo author** (nếu có): tìm kiếm phần từ, không phân biệt hoa thường
4. **Filter theo category** (nếu có): khớp chính xác
5. **Filter theo price range** (nếu có):
   - Nếu có cả minPrice và maxPrice: `minPrice <= price <= maxPrice`
   - Nếu chỉ có minPrice: `price >= minPrice`
   - Nếu chỉ có maxPrice: `price <= maxPrice`
   - Nếu không có giá trị hợp lệ: bỏ qua filter giá

**Validation giá**:
- Không null
- Lớn hơn 0
- Không phải `Double.MAX_VALUE`

## Test Cases

### 1. Hiển thị tất cả sách
```bash
# Request
GET /api/books

# Expected: Trả về tất cả sách trong database
```

### 2. Tìm kiếm theo tên
```bash
# Request
GET /api/books?title=clean

# Expected: Trả về sách có tên chứa "clean" (không phân biệt hoa thường)
```

### 3. Lọc theo giá
```bash
# Request
GET /api/books?minPrice=200000&maxPrice=500000

# Expected: Trả về sách có giá từ 200,000đ đến 500,000đ
```

### 4. Kết hợp nhiều filter
```bash
# Request
GET /api/books?category=Programming&minPrice=300000

# Expected: Trả về sách thuộc danh mục "Programming" và giá >= 300,000đ
```

## Checklist Debug

Nếu vẫn không hiển thị sách, kiểm tra:

- [ ] **Database có data không?**
  ```sql
  SELECT * FROM books;
  ```

- [ ] **Backend server đang chạy?**
  ```bash
  curl http://localhost:8080/api/books
  ```

- [ ] **Đã đăng nhập chưa?**
  - API yêu cầu authentication
  - Kiểm tra cookie session trong browser

- [ ] **Console có lỗi không?**
  - Mở DevTools → Console
  - Xem có lỗi CORS, 401, 403, 500?

- [ ] **Network tab có request không?**
  - Mở DevTools → Network
  - Xem request `/api/books` có được gửi không
  - Status code là gì? (200, 401, 403, 500?)
  - Response data là gì?

- [ ] **Frontend state có data không?**
  ```javascript
  console.log('Books:', books);
  ```

## Files Đã Sửa

1. ✅ `/frontend/src/components/BookList.jsx`
   - Sửa `response.data.books` → `response.data`

2. ✅ `/src/main/java/.../controller/BookApiController.java`
   - Thêm query params vào method `getAllBooks()`
   - Gọi `bookService.searchBooks()` khi có filter

## Kết Luận

**Vấn đề chính**: 
1. Frontend expect sai cấu trúc data
2. Backend không xử lý filter params

**Giải pháp**:
1. Sửa frontend để nhận array trực tiếp
2. Sửa backend để nhận và xử lý query params

Sau khi sửa, danh sách sách sẽ hiển thị đúng và filter cũng hoạt động!
