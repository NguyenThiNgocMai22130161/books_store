# Cập Nhật Nút "Thêm Sách" Cho Admin - HOÀN CHỈNH

## Tóm Tắt
Đã cập nhật và xác minh các React component để hiển thị nút "Thêm Sách" chỉ dành cho Admin, tương tự như logic `sec:authorize='hasRole("ADMIN")'` trong Thymeleaf.

## ✅ Kiểm Tra Backend API

### BookApiController.java
```java
@RestController
@RequestMapping("/api/books")
@PreAuthorize("hasAnyRole('USER', 'ADMIN')")
public class BookApiController {
    
    // ✅ ĐÚNG: POST /api/books để tạo sách mới
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Book> createBook(@RequestBody Book book) {
        return ResponseEntity.ok(bookService.saveBook(book));
    }
    
    // ✅ ĐÚNG: PUT /api/books/{id} để cập nhật
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Book> updateBook(@PathVariable String id, @RequestBody Book bookDetails) {
        Book updatedBook = bookService.updateBook(id, bookDetails);
        return updatedBook != null ? ResponseEntity.ok(updatedBook) : ResponseEntity.notFound().build();
    }
    
    // ✅ ĐÚNG: DELETE /api/books/{id} để xóa
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteBook(@PathVariable String id) {
        bookService.deleteBook(id);
        return ResponseEntity.ok().build();
    }
}
```

**Kết luận Backend**: ✅ Đã đúng - không có route GET `/api/books/add`

## ✅ Kiểm Tra Frontend Components

### 1. BookList.jsx - Nút "Thêm Sách"
```javascript
// ✅ ĐÚNG: Chỉ là Link, không gọi axios
{isAdmin && (
  <Link to="/books/add" className="btn btn-primary">
    <svg>...</svg>
    Thêm Sách Mới
  </Link>
)}
```

**Kết luận**: ✅ Đúng - chỉ là link điều hướng, không gọi API

### 2. BookForm.jsx - Form thêm/sửa sách
```javascript
const handleSubmit = async (e) => {
  e.preventDefault();
  
  try {
    if (isEditMode) {
      // ✅ ĐÚNG: PUT /api/books/{id}
      await axios.put(`http://localhost:8080/api/books/${id}`, formData, {
        withCredentials: true
      });
    } else {
      // ✅ ĐÚNG: POST /api/books
      await axios.post('http://localhost:8080/api/books', formData, {
        withCredentials: true
      });
    }
    navigate('/books');
  } catch (err) {
    setError(err.response?.data?.message || 'Không thể lưu thông tin sách');
  }
};
```

**Kết luận**: ✅ Đúng - gọi POST `/api/books` khi submit form

### 3. App.jsx - Routes
```javascript
// ✅ ĐÃ SỬA: Thống nhất route
<Route path="/books/add" element={<><Navbar /><BookForm /><Footer /></>} />
<Route path="/books/edit/:id" element={<><Navbar /><BookForm /><Footer /></>} />
```

**Trước đây**: `/admin/books/new` (không khớp với Link)  
**Bây giờ**: `/books/add` (khớp với Link trong BookList)

### 4. BookDetail.jsx - Nút Edit
```javascript
// ✅ ĐÚNG: Link đến /books/edit/:id
{isAdmin && (
  <Link to={`/books/edit/${book.id}`} className="btn btn-secondary">
    Sửa
  </Link>
)}
```

**Kết luận**: ✅ Đúng - route khớp với App.jsx

## Các Thay Đổi Đã Thực Hiện

### 1. **BookList.jsx** ✅
- **Cập nhật**: Sửa logic kiểm tra admin từ `user?.authorities?.some(...)` thành `user?.roles?.includes('ROLE_ADMIN') || user?.isAdmin`
- **Xác nhận**: Nút "Thêm Sách" chỉ là `<Link>`, không gọi axios ✅

### 2. **Navbar.jsx** ✅
- **Cập nhật**: Sửa logic kiểm tra admin từ `user?.roles?.includes('ADMIN')` thành `user?.roles?.includes('ROLE_ADMIN') || user?.isAdmin`

### 3. **App.jsx** ✅
- **Cập nhật**: Đổi route từ `/admin/books/new` thành `/books/add` để khớp với Link
- **Cập nhật**: Đổi route từ `/admin/books/edit/:id` thành `/books/edit/:id`
- **Cập nhật**: Đổi route categories tương tự

### 4. **BookForm.jsx** ✅
- **Xác nhận**: Đã gọi đúng `POST /api/books` khi thêm mới ✅
- **Xác nhận**: Đã gọi đúng `PUT /api/books/{id}` khi cập nhật ✅

### 5. **BookDetail.jsx** ✅
- **Xác nhận**: Đã dùng đúng `user?.roles?.includes('ROLE_ADMIN')` ✅
- **Xác nhận**: Link edit đúng route `/books/edit/:id` ✅

## Flow Hoàn Chỉnh

### Thêm Sách Mới (Admin)
1. User đăng nhập với role ADMIN
2. Vào trang `/books` → Thấy nút "Thêm Sách Mới"
3. Click nút → Điều hướng đến `/books/add` (không gọi API)
4. Điền form → Submit → Gọi `POST /api/books` với data
5. Backend kiểm tra `@PreAuthorize("hasRole('ADMIN')")` → Cho phép
6. Lưu sách → Redirect về `/books`

### Sửa Sách (Admin)
1. Vào trang `/books/:id` → Thấy nút "Sửa"
2. Click nút → Điều hướng đến `/books/edit/:id`
3. Form tự động load data sách → Sửa → Submit
4. Gọi `PUT /api/books/:id` với data mới
5. Backend kiểm tra `@PreAuthorize("hasRole('ADMIN')")` → Cho phép
6. Cập nhật sách → Redirect về `/books`

### User Thường Cố Truy Cập
1. User thường vào `/books` → Không thấy nút "Thêm Sách"
2. Nếu cố gõ URL `/books/add` → Vào được trang form
3. Nhưng khi submit → Backend từ chối với 403 Forbidden
4. Vì `@PreAuthorize("hasRole('ADMIN')")` không pass

## Cách Hoạt Động

### Backend API
```java
// AuthController.java - GET /api/auth/profile
@GetMapping("/profile")
public ResponseEntity<?> userProfile(Authentication authentication) {
    // Trả về User object với field 'roles' (Set<Role>)
    return userService.findByUsername(username)
        .map(user -> ResponseEntity.ok((Object) user))
        ...
}
```

### User Model
```java
// User.java
@ElementCollection(fetch = FetchType.EAGER)
@CollectionTable(name = "user_roles", joinColumns = @JoinColumn(name = "user_id"))
@Enumerated(EnumType.STRING)
private Set<Role> roles = new HashSet<>();

public boolean isAdmin() {
    return roles.contains(Role.ROLE_ADMIN);
}
```

### Frontend Logic
```javascript
// BookList.jsx
useEffect(() => {
  fetchUserProfile(); // Gọi API /api/auth/profile
}, []);

const fetchUserProfile = async () => {
  const response = await axios.get('http://localhost:8080/api/auth/profile', {
    withCredentials: true
  });
  setUser(response.data); // response.data có field 'roles'
};

// Kiểm tra admin
const isAdmin = user?.roles?.includes('ROLE_ADMIN') || user?.isAdmin;

// Hiển thị nút
{isAdmin && (
  <Link to="/books/add" className="btn btn-primary">
    Thêm Sách Mới
  </Link>
)}
```

## Kết Quả

### Khi User Thường Đăng Nhập
- ❌ Không thấy nút "Thêm Sách Mới"
- ❌ Không thấy menu "Dashboard Admin" và "Quản lý người dùng"
- ✅ Thấy nút "Thêm vào giỏ" ở mỗi sách
- ❌ Nếu cố truy cập `/books/add` → Form hiển thị nhưng submit bị từ chối (403)

### Khi Admin Đăng Nhập
- ✅ Thấy nút "Thêm Sách Mới" ở góc phải trên danh sách
- ✅ Thấy menu "Dashboard Admin" và "Quản lý người dùng" trong dropdown
- ❌ Không thấy nút "Thêm vào giỏ" (admin không mua hàng)
- ✅ Thấy nút "Sửa" và "Xóa" ở trang chi tiết sách
- ✅ Có thể truy cập `/books/add` và submit thành công

## Lưu Ý Bảo Mật

### Frontend (UI Only)
- Frontend chỉ ẩn/hiện UI, không phải bảo mật thực sự
- User có thể inspect và thay đổi code JavaScript
- User thường vẫn có thể gõ URL `/books/add` vào browser

### Backend (Bảo Mật Thực Sự) ✅
- Backend PHẢI có `@PreAuthorize("hasRole('ADMIN')")` trên các endpoint quan trọng
- Ngay cả khi user thường vào được form, submit sẽ bị từ chối
- Đây là lớp bảo mật thực sự, không thể bypass

## Test Checklist

- [ ] Đăng nhập với user thường → Không thấy nút "Thêm Sách"
- [ ] Đăng nhập với admin → Thấy nút "Thêm Sách"
- [ ] Click nút "Thêm Sách" → Chuyển đến `/books/add` (không gọi API)
- [ ] Điền form và submit → Gọi `POST /api/books` (không phải GET)
- [ ] User thường cố truy cập `/books/add` → Form hiển thị
- [ ] User thường submit form → Backend từ chối (403 Forbidden)
- [ ] Admin submit form → Thành công, sách được tạo
- [ ] Click "Sửa" ở BookDetail → Chuyển đến `/books/edit/:id`
- [ ] Submit form sửa → Gọi `PUT /api/books/:id`

## Files Đã Sửa

1. ✅ `/frontend/src/components/BookList.jsx` - Sửa logic kiểm tra admin
2. ✅ `/frontend/src/components/Navbar.jsx` - Sửa logic kiểm tra admin
3. ✅ `/frontend/src/App.jsx` - Thống nhất routes

## Files Đã Xác Nhận Đúng

- ✅ `/src/main/java/.../controller/BookApiController.java` - POST /api/books đúng
- ✅ `/frontend/src/components/BookForm.jsx` - Gọi POST /api/books đúng
- ✅ `/frontend/src/components/BookDetail.jsx` - Logic admin và route đúng

## Kết Luận

✅ **Backend**: Đã đúng - POST `/api/books` để tạo sách, có `@PreAuthorize`  
✅ **Frontend**: Đã đúng - Nút "Thêm Sách" chỉ là Link, không gọi axios  
✅ **Routes**: Đã thống nhất - `/books/add` và `/books/edit/:id`  
✅ **Security**: Đầy đủ - Frontend ẩn UI, Backend kiểm tra quyền
