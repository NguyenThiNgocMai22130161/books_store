# Tóm Tắt Refactoring Controllers

## Mục đích
Chuyển đổi từ Spring MVC Controllers (Thymeleaf templates) sang REST API Controllers (JSON responses) để hỗ trợ React frontend.

## Các thay đổi chính

### 1. **AdminController** → `/api/admin`
- ✅ Đổi từ `@Controller` sang `@RestController`
- ✅ Thay đổi base path: `/admin` → `/api/admin`
- ✅ Xóa tất cả tham số `Model` và `RedirectAttributes`
- ✅ Thay đổi kiểu trả về từ `String` sang `ResponseEntity<?>`
- ✅ Trả về JSON với HTTP status codes chuẩn

**Endpoints:**
- `GET /api/admin/dashboard` - Lấy thống kê dashboard
- `GET /api/admin/users` - Lấy danh sách users
- `PUT /api/admin/users/{userId}/role` - Cập nhật role
- `PUT /api/admin/users/{userId}/activate` - Kích hoạt user
- `PUT /api/admin/users/{userId}/deactivate` - Vô hiệu hóa user
- `DELETE /api/admin/users/{userId}` - Xóa user

### 2. **AuthController** → `/api/auth`
- ✅ Đổi từ `@Controller` sang `@RestController`
- ✅ Thay đổi base path: `/` → `/api/auth`
- ✅ Xóa các view endpoints (`/login`, `/register` pages)
- ✅ Thêm API endpoints cho authentication

**Endpoints:**
- `POST /api/auth/register` - Đăng ký user mới
- `GET /api/auth/profile` - Lấy thông tin profile
- `GET /api/auth/check-username` - Kiểm tra username tồn tại
- `GET /api/auth/check-email` - Kiểm tra email tồn tại
- `POST /api/auth/logout` - Đăng xuất

### 3. **BookController** → `/api/books`
- ✅ Đổi từ `@Controller` sang `@RestController`
- ✅ Thay đổi base path: `/books` → `/api/books`
- ✅ Sử dụng RESTful HTTP methods (GET, POST, PUT, DELETE)
- ✅ Trả về JSON responses với pagination support

**Endpoints:**
- `GET /api/books` - Lấy danh sách sách (có hỗ trợ search & filter)
- `POST /api/books` - Thêm sách mới (ADMIN)
- `GET /api/books/{id}` - Lấy chi tiết sách
- `PUT /api/books/{id}` - Cập nhật sách (ADMIN)
- `DELETE /api/books/{id}` - Xóa sách (ADMIN)

### 4. **CategoryController** → `/api/categories`
- ✅ Đổi từ `@Controller` sang `@RestController`
- ✅ Thay đổi base path: `/categories` → `/api/categories`
- ✅ RESTful endpoints với CRUD operations

**Endpoints:**
- `GET /api/categories` - Lấy danh sách categories
- `POST /api/categories` - Thêm category mới (ADMIN)
- `GET /api/categories/{id}` - Lấy chi tiết category
- `PUT /api/categories/{id}` - Cập nhật category (ADMIN)
- `DELETE /api/categories/{id}` - Xóa category (ADMIN)

### 5. **CartController** → `/api/cart`
- ✅ Đổi từ `@Controller` sang `@RestController`
- ✅ Thay đổi base path: `/cart` → `/api/cart`
- ✅ Refactor tất cả payment methods để trả về JSON
- ✅ Giữ nguyên logic MoMo payment integration

**Endpoints:**
- `GET /api/cart` - Xem giỏ hàng
- `POST /api/cart/add` - Thêm sản phẩm vào giỏ
- `PUT /api/cart/update/{itemId}` - Cập nhật số lượng
- `DELETE /api/cart/remove/{itemId}` - Xóa item khỏi giỏ
- `DELETE /api/cart/clear` - Xóa toàn bộ giỏ hàng
- `GET /api/cart/checkout` - Lấy thông tin checkout
- `POST /api/cart/payment` - Xử lý thanh toán
- `POST /api/cart/payment/momo` - Thanh toán qua MoMo
- `GET /api/cart/payment/return` - MoMo callback
- `POST /api/cart/payment/direct` - Thanh toán trực tiếp
- `POST /api/cart/payment/simulate-success` - Test payment

### 6. **OrderController** → `/api/orders`
- ✅ Đổi từ `@Controller` sang `@RestController`
- ✅ Thay đổi base path: `/orders` → `/api/orders`
- ✅ Trả về JSON với order details và statistics

**Endpoints:**
- `GET /api/orders` - Lấy danh sách đơn hàng của user
- `GET /api/orders/{orderId}` - Xem chi tiết đơn hàng
- `POST /api/orders/{orderId}/cancel` - Hủy đơn hàng
- `GET /api/orders/admin/all` - Admin xem tất cả đơn hàng

## Cấu trúc Response JSON

### Success Response
```json
{
  "message": "Thành công!",
  "data": { ... }
}
```

### Error Response
```json
{
  "error": "Mô tả lỗi"
}
```

### List Response
```json
{
  "items": [...],
  "total": 100,
  "page": 1,
  "pageSize": 20
}
```

## HTTP Status Codes

- `200 OK` - Request thành công
- `201 Created` - Tạo resource thành công
- `400 Bad Request` - Dữ liệu không hợp lệ
- `401 Unauthorized` - Chưa đăng nhập
- `403 Forbidden` - Không có quyền truy cập
- `404 Not Found` - Không tìm thấy resource
- `500 Internal Server Error` - Lỗi server

## Lưu ý quan trọng

1. **Authentication**: Tất cả endpoints vẫn sử dụng Spring Security authentication hiện tại
2. **Authorization**: Các endpoint ADMIN vẫn giữ nguyên `@PreAuthorize("hasRole('ADMIN')")`
3. **CORS**: Cần cấu hình CORS trong `SecurityConfig` để React frontend có thể gọi API
4. **Validation**: Vẫn sử dụng `@Valid` và `BindingResult` cho validation
5. **OAuth2**: Vẫn hỗ trợ Google OAuth2 login

## Các bước tiếp theo

1. ✅ Cấu hình CORS trong `SecurityConfig.java`
2. ✅ Cập nhật React frontend để gọi các API endpoints mới
3. ✅ Test tất cả endpoints với Postman/Thunder Client
4. ✅ Xóa các Thymeleaf templates không còn sử dụng (nếu muốn)
5. ✅ Cập nhật documentation/README

## Ví dụ cấu hình CORS

Thêm vào `SecurityConfig.java`:

```java
@Bean
public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration configuration = new CorsConfiguration();
    configuration.setAllowedOrigins(Arrays.asList("http://localhost:3000")); // React dev server
    configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
    configuration.setAllowedHeaders(Arrays.asList("*"));
    configuration.setAllowCredentials(true);
    
    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/api/**", configuration);
    return source;
}
```

## Testing với cURL

### Lấy danh sách sách
```bash
curl -X GET http://localhost:8080/api/books
```

### Thêm sách mới (cần authentication)
```bash
curl -X POST http://localhost:8080/api/books \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Book",
    "author": "Test Author",
    "price": 100000,
    "quantity": 10
  }'
```

### Thêm vào giỏ hàng
```bash
curl -X POST http://localhost:8080/api/cart/add \
  -H "Content-Type: application/json" \
  -d '{
    "bookId": "123",
    "quantity": 2
  }'
```

---

**Refactored by:** Kiro AI Assistant  
**Date:** May 20, 2026  
**Status:** ✅ Completed - Ready for React integration
