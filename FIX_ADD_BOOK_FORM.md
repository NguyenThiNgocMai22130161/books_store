# Sửa Lỗi: Không Thêm Được Sách Mới (Admin)

## Vấn Đề
Admin không thể thêm sách mới qua form `/books/add`

## Nguyên Nhân Đã Phát Hiện

### 1. **Categories không hiển thị đúng** ❌
```javascript
// BookForm.jsx - SAI
{categories.map((cat, idx) => (
  <option key={idx} value={cat}>{cat}</option>
))}
```

**Vấn đề**: 
- API `/api/categories` trả về array of objects: `[{ id: 1, name: "Programming", description: "..." }, ...]`
- Nhưng code đang dùng `cat` như string
- Kết quả: `<option value="[object Object]">[object Object]</option>`

### 2. **Data type không đúng** ❌
```javascript
// BookForm.jsx - SAI
await axios.post('http://localhost:8080/api/books', formData, ...);
```

**Vấn đề**:
- Form input trả về string: `price: "350000"`, `quantity: "10"`
- Backend expect number: `price: 350000`, `quantity: 10`
- Validation có thể fail hoặc lưu sai data

### 3. **Error message không rõ ràng** ❌
```javascript
// BookForm.jsx - SAI
setError(err.response?.data?.message || 'Không thể lưu thông tin sách');
```

**Vấn đề**: Không log error ra console, khó debug

## Giải Pháp

### 1. **Sửa Categories Select** ✅

**Trước:**
```javascript
{categories.map((cat, idx) => (
  <option key={idx} value={cat}>{cat}</option>
))}
```

**Sau:**
```javascript
{categories.map((cat) => (
  <option key={cat.id} value={cat.name}>{cat.name}</option>
))}
```

**Giải thích**:
- `cat` là object có `{ id, name, description }`
- Dùng `cat.id` làm key (unique)
- Dùng `cat.name` làm value và display text

### 2. **Convert Data Type Trước Khi Submit** ✅

**Trước:**
```javascript
await axios.post('http://localhost:8080/api/books', formData, ...);
```

**Sau:**
```javascript
const bookData = {
  ...formData,
  price: parseFloat(formData.price) || 0,
  quantity: parseInt(formData.quantity) || 0,
  year: formData.year ? parseInt(formData.year) : null
};

await axios.post('http://localhost:8080/api/books', bookData, ...);
```

**Giải thích**:
- `parseFloat(formData.price)`: Convert string → number (decimal)
- `parseInt(formData.quantity)`: Convert string → integer
- `|| 0`: Default value nếu parse fail
- `year ? ... : null`: Cho phép null nếu không nhập

### 3. **Thêm Console Log Để Debug** ✅

```javascript
const handleSubmit = async (e) => {
  e.preventDefault();
  
  const bookData = { ... };
  console.log('Submitting book data:', bookData); // ✅ Log data trước khi gửi
  
  try {
    const response = await axios.post(...);
    console.log('Create response:', response.data); // ✅ Log response thành công
    navigate('/books');
  } catch (err) {
    console.error('Error submitting book:', err); // ✅ Log error
    console.error('Error response:', err.response?.data); // ✅ Log error detail
    setError(err.response?.data?.message || err.response?.data?.error || 'Không thể lưu thông tin sách');
  }
};
```

## Cấu Trúc Data

### Category Object (từ API)
```json
{
  "id": 1,
  "name": "Programming",
  "description": "Sách về lập trình",
  "isDefault": false
}
```

### Book Object (gửi lên backend)
```json
{
  "title": "Clean Code",
  "author": "Robert C. Martin",
  "price": 350000,          // ✅ Number, không phải string
  "quantity": 10,           // ✅ Number, không phải string
  "year": 2008,             // ✅ Number hoặc null
  "category": "Programming", // ✅ String (tên category)
  "description": "...",
  "imageUrl": "https://..."
}
```

## Backend Validation

### Book Model
```java
@Entity
@Table(name = "books")
public class Book {
    @NotBlank(message = "Ten sach khong duoc de trong")
    private String title;
    
    @NotBlank(message = "Tac gia khong duoc de trong")
    private String author;
    
    @NotNull(message = "Gia khong duoc de trong")
    @Min(value = 0, message = "Gia phai lon hon hoac bang 0")
    private Double price;  // ✅ Phải là number
    
    private Integer year;
    private String category;
    private String imageUrl;
    private String description;
    private Integer quantity = 0;  // ✅ Phải là number
}
```

**Required fields**:
- `title` (String, not blank)
- `author` (String, not blank)
- `price` (Double, not null, >= 0)

**Optional fields**:
- `year` (Integer, có thể null)
- `category` (String)
- `imageUrl` (String)
- `description` (String)
- `quantity` (Integer, default = 0)

## API Endpoint

### POST /api/books
**Mô tả**: Tạo sách mới (chỉ Admin)

**Headers**:
```
Content-Type: application/json
Cookie: JSESSIONID=...
```

**Request Body**:
```json
{
  "title": "Clean Code",
  "author": "Robert C. Martin",
  "price": 350000,
  "quantity": 10,
  "year": 2008,
  "category": "Programming",
  "description": "A Handbook of Agile Software Craftsmanship",
  "imageUrl": "https://example.com/clean-code.jpg"
}
```

**Response Success (200)**:
```json
{
  "id": 123,
  "title": "Clean Code",
  "author": "Robert C. Martin",
  "price": 350000,
  "quantity": 10,
  "year": 2008,
  "category": "Programming",
  "description": "A Handbook of Agile Software Craftsmanship",
  "imageUrl": "https://example.com/clean-code.jpg"
}
```

**Response Error (400)**:
```json
{
  "message": "Ten sach khong duoc de trong",
  "error": "Bad Request"
}
```

**Response Error (403)**:
```json
{
  "message": "Access Denied",
  "error": "Forbidden"
}
```

## Checklist Debug

Nếu vẫn không thêm được sách, kiểm tra:

### 1. **Đã đăng nhập với tài khoản Admin?** ✅
```sql
-- Kiểm tra user có role ADMIN không
SELECT u.username, ur.roles 
FROM users u 
JOIN user_roles ur ON u.user_id = ur.user_id 
WHERE u.username = 'your_username';
```

### 2. **Categories có data không?** ✅
```sql
-- Kiểm tra categories trong database
SELECT * FROM categories;
```

Nếu không có, thêm categories:
```sql
INSERT INTO categories (name, description, is_default) VALUES
('Programming', 'Sách về lập trình', false),
('Fiction', 'Tiểu thuyết', false),
('Science', 'Khoa học', false),
('Uncategorized', 'Chưa phân loại', true);
```

### 3. **Console có lỗi không?** ✅
- Mở DevTools → Console
- Xem log "Submitting book data:" → Kiểm tra data type
- Xem log "Error response:" → Kiểm tra lỗi từ backend

### 4. **Network request thành công không?** ✅
- Mở DevTools → Network
- Submit form → Xem request `POST /api/books`
- Status code: 200 (thành công), 400 (validation error), 403 (không có quyền)
- Response: Xem error message

### 5. **Backend có log lỗi không?** ✅
- Xem terminal chạy Spring Boot
- Tìm exception hoặc error message

## Test Cases

### Test 1: Thêm sách với đầy đủ thông tin
```javascript
{
  title: "Clean Code",
  author: "Robert C. Martin",
  price: 350000,
  quantity: 10,
  year: 2008,
  category: "Programming",
  description: "A Handbook of Agile Software Craftsmanship",
  imageUrl: "https://example.com/clean-code.jpg"
}
```
**Expected**: Thành công, redirect về `/books`, sách xuất hiện trong danh sách

### Test 2: Thêm sách với thông tin tối thiểu
```javascript
{
  title: "Test Book",
  author: "Test Author",
  price: 100000,
  category: "Programming"
}
```
**Expected**: Thành công, các field optional để trống

### Test 3: Thêm sách thiếu required field
```javascript
{
  title: "",  // ❌ Thiếu title
  author: "Test Author",
  price: 100000
}
```
**Expected**: Validation error, hiển thị message "Ten sach khong duoc de trong"

### Test 4: Thêm sách với giá âm
```javascript
{
  title: "Test Book",
  author: "Test Author",
  price: -100  // ❌ Giá âm
}
```
**Expected**: Validation error, hiển thị message "Gia phai lon hon hoac bang 0"

## Files Đã Sửa

1. ✅ `/frontend/src/components/BookForm.jsx`
   - Sửa categories select: `cat.name` thay vì `cat`
   - Convert data type: `parseFloat(price)`, `parseInt(quantity)`
   - Thêm console log để debug
   - Cải thiện error handling

## Kết Luận

**Vấn đề chính**:
1. Categories render sai (object thay vì string)
2. Data type không đúng (string thay vì number)
3. Thiếu logging để debug

**Giải pháp**:
1. Dùng `cat.name` để lấy tên category
2. Convert string → number trước khi submit
3. Thêm console.log để debug

Sau khi sửa, form thêm sách sẽ hoạt động đúng!
