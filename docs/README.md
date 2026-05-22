# 📚 Tài Liệu Dự Án - Bookstore Management System

> Tài liệu hướng dẫn chi tiết cho hệ thống quản lý cửa hàng sách

## 📖 Mục Lục

- [Bắt Đầu Nhanh](#-bắt-đầu-nhanh)
- [Cấu Trúc Tài Liệu](#-cấu-trúc-tài-liệu)
- [Hướng Dẫn Cài Đặt](#-hướng-dẫn-cài-đặt)
- [Hướng Dẫn Phát Triển](#-hướng-dẫn-phát-triển)
- [API Documentation](#-api-documentation)
- [Troubleshooting](#-troubleshooting)

---

## 🚀 Bắt Đầu Nhanh

### Người Dùng Mới

Nếu bạn là người mới và muốn chạy project lần đầu:

1. **Đọc README chính**: [../README.md](../README.md) - Hướng dẫn đầy đủ về cài đặt và chạy project
2. **Kiểm tra yêu cầu hệ thống**: Java 17+, Node.js 16+, MySQL 8.x
3. **Làm theo hướng dẫn cài đặt**: Từng bước một trong README chính

### Nhà Phát Triển

Nếu bạn đã quen với project và muốn bắt đầu phát triển:

1. **Setup môi trường**: Đọc `setup/START_HERE.md`
2. **Cấu hình React**: Chạy `setup/setup-react-app.sh`
3. **Xem trạng thái project**: Đọc `guides/PROJECT_STATUS.md`

### Chạy Nhanh (Quick Start)

```bash
# 1. Clone repository
git clone <repository-url>
cd books_store_test2

# 2. Cấu hình database
mysql -u root -p
CREATE DATABASE bookstore;
EXIT;

# 3. Cấu hình application.properties
cp application.properties.example src/main/resources/application.properties
# Sửa username/password MySQL trong file

# 4. Cài đặt dependencies
mvn clean install
cd frontend && npm install && cd ..

# 5. Chạy backend (Terminal 1)
mvn spring-boot:run

# 6. Chạy frontend (Terminal 2)
cd frontend && npm run dev
```

**Truy cập**: http://localhost:5173

---

## 📁 Cấu Trúc Tài Liệu

```
docs/
├── README.md                    # File này - Tổng quan tài liệu
│
├── setup/                       # 🔧 Hướng dẫn cài đặt
│   ├── START_HERE.md           # Bắt đầu từ đây
│   ├── SETUP_REACT_APP.md      # Cài đặt React frontend
│   └── setup-react-app.sh      # Script tự động setup
│
├── guides/                      # 📖 Hướng dẫn phát triển
│   ├── PROJECT_STATUS.md       # Trạng thái hiện tại của project
│   ├── REFACTORING_SUMMARY.md  # Tóm tắt các refactoring đã làm
│   ├── SECURITY_CONFIG_GUIDE.md # Cấu hình bảo mật
│   └── PROJECT_STRUCTURE_REVIEW.md # Review cấu trúc project
│
├── api/                         # 🌐 API Documentation
│   └── (Sẽ được thêm vào)
│
└── components-backup/           # 💾 Backup components cũ
    └── (Thymeleaf templates cũ)
```

---

## 🔧 Hướng Dẫn Cài Đặt

### 1. Cài Đặt Lần Đầu

**Đọc chi tiết**: [../README.md](../README.md) - Phần "Cài Đặt"

**Tóm tắt các bước**:
1. Clone repository
2. Cài đặt Java 17+, Node.js 16+, MySQL 8.x
3. Tạo database `bookstore`
4. Cấu hình `application.properties`
5. Cài đặt dependencies (Maven + npm)
6. Chạy ứng dụng

### 2. Setup React Frontend

**Đọc chi tiết**: [setup/SETUP_REACT_APP.md](setup/SETUP_REACT_APP.md)

```bash
# Chạy script tự động
./docs/setup/setup-react-app.sh
```

Script này sẽ:
- Kiểm tra Node.js và npm
- Cài đặt dependencies
- Cấu hình Vite
- Tạo file .env
- Chạy development server

### 3. Cấu Hình Database

**Tạo database**:
```sql
CREATE DATABASE bookstore CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

**Import sample data** (tùy chọn):
```bash
mysql -u root -p bookstore < sample-books.sql
```

**Cấu hình connection**:
```properties
# src/main/resources/application.properties
spring.datasource.url=jdbc:mysql://localhost:3306/bookstore
spring.datasource.username=root
spring.datasource.password=your_password
spring.jpa.hibernate.ddl-auto=update
```

---

## 📖 Hướng Dẫn Phát Triển

### Trạng Thái Project

**Đọc**: [guides/PROJECT_STATUS.md](guides/PROJECT_STATUS.md)

Tài liệu này bao gồm:
- ✅ Các tính năng đã hoàn thành
- 🚧 Các tính năng đang phát triển
- 📋 Các tính năng sắp làm
- 🐛 Các bug đã biết

### Cấu Hình Bảo Mật

**Đọc**: [guides/SECURITY_CONFIG_GUIDE.md](guides/SECURITY_CONFIG_GUIDE.md)

Tài liệu này giải thích:
- Spring Security configuration
- CORS setup
- Session management
- Role-based access control (RBAC)
- Authentication flow

### Refactoring Summary

**Đọc**: [guides/REFACTORING_SUMMARY.md](guides/REFACTORING_SUMMARY.md)

Tài liệu này ghi lại:
- Các thay đổi lớn trong codebase
- Migration từ Thymeleaf sang React
- Cải tiến performance
- Code cleanup

### Cấu Trúc Project

**Đọc**: [guides/PROJECT_STRUCTURE_REVIEW.md](guides/PROJECT_STRUCTURE_REVIEW.md)

Tài liệu này mô tả:
- Cấu trúc thư mục backend
- Cấu trúc thư mục frontend
- Naming conventions
- Best practices

---

## 🌐 API Documentation

### Base URL
```
http://localhost:8080/api
```

### Endpoints Chính

#### Authentication
- `POST /api/auth/register` - Đăng ký
- `POST /api/auth/login` - Đăng nhập
- `GET /api/auth/profile` - Lấy thông tin user
- `POST /api/auth/logout` - Đăng xuất

#### Books
- `GET /api/books` - Danh sách sách (có filter)
- `GET /api/books/{id}` - Chi tiết sách
- `POST /api/books` - Thêm sách (Admin)
- `PUT /api/books/{id}` - Cập nhật sách (Admin)
- `DELETE /api/books/{id}` - Xóa sách (Admin)

#### Cart
- `GET /api/cart` - Xem giỏ hàng
- `POST /api/cart/add` - Thêm vào giỏ
- `PUT /api/cart/update/{itemId}` - Cập nhật số lượng
- `DELETE /api/cart/remove/{itemId}` - Xóa khỏi giỏ

#### Orders
- `GET /api/orders` - Danh sách đơn hàng
- `GET /api/orders/{id}` - Chi tiết đơn hàng
- `POST /api/cart/payment` - Thanh toán

#### Categories
- `GET /api/categories` - Danh sách danh mục
- `POST /api/categories` - Thêm danh mục (Admin)
- `PUT /api/categories/{id}` - Cập nhật danh mục (Admin)
- `DELETE /api/categories/{id}` - Xóa danh mục (Admin)

#### Admin
- `GET /api/admin/users` - Danh sách users
- `PUT /api/admin/users/{id}/role` - Đổi role user
- `GET /api/admin/dashboard` - Dashboard statistics

### Chi Tiết API

**Xem đầy đủ**: [../README.md](../README.md) - Phần "API Documentation"

Bao gồm:
- Request/Response examples
- Query parameters
- Error codes
- Authentication requirements

---

## 🐛 Troubleshooting

### Lỗi Thường Gặp

#### 1. Port 8080 đã được sử dụng

```bash
# macOS/Linux
lsof -i :8080
kill -9 <PID>

# Hoặc đổi port
# application.properties: server.port=8081
```

#### 2. Cannot connect to MySQL

```bash
# Kiểm tra MySQL
mysql -u root -p -e "SELECT 1"

# Start MySQL (macOS)
brew services start mysql

# Start MySQL (Linux)
sudo systemctl start mysql
```

#### 3. Frontend không kết nối Backend

**Kiểm tra**:
- Backend đang chạy tại `http://localhost:8080`
- CORS đã được cấu hình trong `SecurityConfig.java`
- Axios baseURL đúng trong frontend

**Fix**:
```java
// SecurityConfig.java
configuration.setAllowedOrigins(Arrays.asList("http://localhost:5173"));
configuration.setAllowCredentials(true);
```

#### 4. npm install failed

```bash
cd frontend
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

#### 5. Maven build failed

```bash
mvn clean install -U
# Hoặc skip tests
mvn clean install -DskipTests
```

#### 6. Sách không hiển thị từ database

**Nguyên nhân**: Frontend expect `response.data.books` nhưng backend trả về `response.data` (array)

**Fix**: Đã sửa trong `BookList.jsx`
```javascript
setBooks(response.data || []);
```

#### 7. Thêm sách vào giỏ không hoạt động

**Kiểm tra**:
- User đã đăng nhập chưa
- User không phải Admin (Admin không thể thêm vào giỏ)
- BookId được gửi đúng format

**Debug**: Xem console log trong browser và backend

#### 8. Giỏ hàng không hiển thị sản phẩm

**Nguyên nhân**: Frontend expect `response.data.items` nhưng backend trả về `response.data.cartItems`

**Fix**: Đã sửa trong `Cart.jsx`
```javascript
setCartItems(response.data.cartItems || []);
```

### Xem Thêm

**Troubleshooting đầy đủ**: [../README.md](../README.md) - Phần "Troubleshooting"

---

## 🧹 Cleanup Project

Nếu project có nhiều file dư thừa:

```bash
# Interactive cleanup (recommended)
./cleanup-unused-files.sh

# Quick cleanup
./cleanup-quick.sh
```

**Đọc chi tiết**: [../CLEANUP_GUIDE.md](../CLEANUP_GUIDE.md)

---

## 📚 Tài Liệu Liên Quan

### Trong Project
- [README Chính](../README.md) - Hướng dẫn đầy đủ
- [Frontend README](../frontend/README.md) - Tài liệu React app
- [Quick Start Guide](../QUICK_START.md) - Hướng dẫn nhanh
- [Hướng Dẫn Chạy Dự Án](../HUONG_DAN_CHAY_DU_AN.md) - Tiếng Việt
- [Cleanup Guide](../CLEANUP_GUIDE.md) - Dọn dẹp project
- [Wide Screen Support](../WIDE_SCREEN_SUPPORT.md) - Hỗ trợ màn hình rộng

### Tài Liệu Kỹ Thuật
- [Spring Boot Docs](https://spring.io/projects/spring-boot)
- [React Docs](https://react.dev/)
- [Vite Docs](https://vitejs.dev/)
- [MySQL Docs](https://dev.mysql.com/doc/)

---

## 🎯 Roadmap

### Đã Hoàn Thành ✅
- [x] Authentication & Authorization
- [x] Book management (CRUD)
- [x] Cart functionality
- [x] Order management
- [x] Search & Filter
- [x] Admin dashboard
- [x] Responsive design
- [x] Wide screen support (up to 2200px)

### Đang Phát Triển 🚧
- [ ] Payment gateway integration
- [ ] Email notifications
- [ ] Advanced search (full-text)
- [ ] Book reviews & ratings
- [ ] Wishlist feature

### Kế Hoạch Tương Lai 📋
- [ ] Mobile app (React Native)
- [ ] Real-time notifications
- [ ] Analytics dashboard
- [ ] Multi-language support
- [ ] Dark mode
- [ ] Export reports (PDF, Excel)

---

## 🤝 Đóng Góp

Chúng tôi hoan nghênh mọi đóng góp! Vui lòng:

1. Fork repository
2. Tạo feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Tạo Pull Request

**Đọc thêm**: [../README.md](../README.md) - Phần "Contributing"

---

## 📞 Liên Hệ & Hỗ Trợ

### Cần Trợ Giúp?

1. **Đọc tài liệu**: Kiểm tra README và docs trước
2. **Xem Troubleshooting**: Phần troubleshooting có thể giải quyết vấn đề
3. **Tạo Issue**: Nếu vẫn gặp vấn đề, tạo issue trên GitHub
4. **Liên hệ trực tiếp**: Email hoặc LinkedIn

### Thông Tin Liên Hệ

- **Email**: your.email@example.com
- **GitHub**: [@your-username](https://github.com/your-username)
- **LinkedIn**: [Your Name](https://linkedin.com/in/your-profile)

---

## 📝 Ghi Chú

### Tài Khoản Mặc Định

**Admin**:
- Username: `admin`
- Password: `admin123`

**User**:
- Username: `user`
- Password: `user123`

> ⚠️ **Quan trọng**: Đổi password sau khi đăng nhập lần đầu!

### Lưu Ý Khi Phát Triển

1. **Admin không thể thêm vào giỏ hàng** - Đây là business rule
2. **Backend trả về array trực tiếp** - Không wrap trong object
3. **Categories là objects** - Có cấu trúc `{id, name, description}`
4. **Form inputs trả về strings** - Phải convert sang number trước khi gửi backend
5. **Role checking**: Dùng `ROLE_ADMIN` không phải `ADMIN`

---

**Made with ❤️ by Nguyen Mai**

**Last Updated**: May 22, 2026

**Version**: 1.0.0
