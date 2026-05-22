# 🚀 HƯỚNG DẪN CHẠY DỰ ÁN BOOKS STORE

## 📋 YÊU CẦU HỆ THỐNG

### Backend (Spring Boot)
- ✅ Java 17 hoặc cao hơn
- ✅ Maven (hoặc dùng Maven Wrapper có sẵn: `./mvnw`)
- ✅ MySQL Database

### Frontend (React + Vite)
- ✅ Node.js 16+ và npm
- ✅ Dependencies đã được cài đặt (react-router-dom, axios)

---

## 🗄️ BƯỚC 1: CẤU HÌNH DATABASE

### 1.1. Tạo Database MySQL

```sql
CREATE DATABASE books_store CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 1.2. Cấu hình kết nối

Tạo file `application.properties` trong thư mục `src/main/resources/`:

```bash
cp application.properties.example src/main/resources/application.properties
```

Hoặc tạo file mới với nội dung:

```properties
# Database Configuration
spring.datasource.url=jdbc:mysql://localhost:3306/books_store?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true
spring.datasource.username=root
spring.datasource.password=your_password_here

# JPA/Hibernate
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.format_sql=true
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.MySQL8Dialect

# Server Port
server.port=8080

# OAuth2 Google (Optional - nếu dùng Google Login)
spring.security.oauth2.client.registration.google.client-id=your-client-id
spring.security.oauth2.client.registration.google.client-secret=your-client-secret
spring.security.oauth2.client.registration.google.scope=profile,email
```

**⚠️ LƯU Ý:** Thay đổi `your_password_here` thành mật khẩu MySQL của bạn!

---

## 🎯 BƯỚC 2: CHẠY BACKEND (Spring Boot)

### Option 1: Dùng Maven Wrapper (Khuyến nghị)

```bash
# Từ thư mục gốc của dự án
./mvnw clean install
./mvnw spring-boot:run
```

### Option 2: Dùng Maven

```bash
mvn clean install
mvn spring-boot:run
```

### Option 3: Chạy từ IDE (IntelliJ IDEA / Eclipse)

1. Mở project trong IDE
2. Tìm file `BooksStoreApplication.java`
3. Click chuột phải → Run

### ✅ Kiểm tra Backend đã chạy

Backend sẽ chạy trên: **http://localhost:8080**

Kiểm tra API:
```bash
curl http://localhost:8080/api/books
```

Hoặc mở trình duyệt: http://localhost:8080/api/books

---

## 🎨 BƯỚC 3: CHẠY FRONTEND (React)

### 3.1. Di chuyển vào thư mục frontend

```bash
cd frontend
```

### 3.2. Cài đặt dependencies (nếu chưa cài)

```bash
npm install
```

### 3.3. Chạy development server

```bash
npm run dev
```

### ✅ Kiểm tra Frontend đã chạy

Frontend sẽ chạy trên: **http://localhost:5173** (hoặc port khác nếu 5173 đã bị chiếm)

Mở trình duyệt và truy cập: http://localhost:5173

---

## 🔗 BƯỚC 4: KIỂM TRA TÍCH HỢP BE + FE

### 4.1. Mở 2 Terminal

**Terminal 1 - Backend:**
```bash
# Từ thư mục gốc
./mvnw spring-boot:run
```

**Terminal 2 - Frontend:**
```bash
# Từ thư mục gốc
cd frontend
npm run dev
```

### 4.2. Test các chức năng

1. **Đăng nhập:**
   - URL: http://localhost:5173/login
   - Tài khoản test:
     - Admin: `admin` / `admin123`
     - User: `user` / `user123`

2. **Xem danh sách sách:**
   - URL: http://localhost:5173/books

3. **Giỏ hàng:**
   - URL: http://localhost:5173/cart

4. **Admin Dashboard:**
   - URL: http://localhost:5173/admin
   - (Cần đăng nhập với tài khoản admin)

---

## 📝 CÁC LỆNH HỮU ÍCH

### Backend Commands

```bash
# Build project
./mvnw clean install

# Run backend
./mvnw spring-boot:run

# Run tests
./mvnw test

# Package to JAR
./mvnw package
```

### Frontend Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint
```

---

## 🐛 TROUBLESHOOTING

### Lỗi: Port 8080 đã được sử dụng

**Giải pháp 1:** Tắt ứng dụng đang chạy trên port 8080

```bash
# macOS/Linux
lsof -ti:8080 | xargs kill -9

# Windows
netstat -ano | findstr :8080
taskkill /PID <PID> /F
```

**Giải pháp 2:** Đổi port trong `application.properties`

```properties
server.port=8081
```

### Lỗi: Cannot connect to MySQL

**Kiểm tra:**
1. MySQL đã chạy chưa?
   ```bash
   # macOS
   brew services list
   
   # Linux
   sudo systemctl status mysql
   ```

2. Username/password đúng chưa?
3. Database `books_store` đã tạo chưa?

### Lỗi: CORS Error khi gọi API

**Kiểm tra:**
- Backend đã chạy trên port 8080?
- SecurityConfig đã cấu hình CORS đúng chưa?
- Frontend đang gọi đúng URL: `http://localhost:8080/api/...`

### Lỗi: Module not found (React)

```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

---

## 🎯 WORKFLOW PHÁT TRIỂN

### 1. Khởi động dự án hàng ngày

```bash
# Terminal 1: Backend
./mvnw spring-boot:run

# Terminal 2: Frontend
cd frontend && npm run dev
```

### 2. Khi thay đổi code Backend

- Spring Boot tự động reload (Spring DevTools)
- Nếu không reload, restart lại backend

### 3. Khi thay đổi code Frontend

- Vite tự động hot reload
- Không cần restart

### 4. Khi thay đổi dependencies

**Backend:**
```bash
./mvnw clean install
```

**Frontend:**
```bash
cd frontend
npm install
```

---

## 📊 KIẾN TRÚC DỰ ÁN

```
┌─────────────────────────────────────────────────────────┐
│                    BROWSER                              │
│              http://localhost:5173                      │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ HTTP Requests
                     │ (axios with credentials)
                     ▼
┌─────────────────────────────────────────────────────────┐
│              REACT FRONTEND (Vite)                      │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Components: Login, BookList, Cart, etc.        │  │
│  │  Router: react-router-dom                       │  │
│  │  HTTP Client: axios                             │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ REST API Calls
                     │ /api/books, /api/auth, etc.
                     ▼
┌─────────────────────────────────────────────────────────┐
│         SPRING BOOT BACKEND (Port 8080)                 │
│  ┌──────────────────────────────────────────────────┐  │
│  │  @RestController                                 │  │
│  │  - BookController                                │  │
│  │  - AuthController                                │  │
│  │  - CartController                                │  │
│  │  - OrderController                               │  │
│  │  - AdminController                               │  │
│  │  - CategoryController                            │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Spring Security                                 │  │
│  │  - JWT/Session Authentication                    │  │
│  │  - CORS Configuration                            │  │
│  │  - OAuth2 (Google)                               │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Service Layer                                   │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Repository (JPA)                                │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ JDBC
                     ▼
┌─────────────────────────────────────────────────────────┐
│              MySQL DATABASE                             │
│              books_store                                │
└─────────────────────────────────────────────────────────┘
```

---

## 🔐 TÀI KHOẢN TEST

### Admin Account
- **Username:** `admin`
- **Password:** `admin123`
- **Quyền:** Quản lý sách, categories, users, orders

### User Account
- **Username:** `user`
- **Password:** `user123`
- **Quyền:** Xem sách, mua hàng, xem đơn hàng

---

## 📚 API ENDPOINTS

### Authentication
- `POST /api/auth/login` - Đăng nhập
- `POST /api/auth/register` - Đăng ký
- `POST /api/auth/logout` - Đăng xuất
- `GET /api/auth/status` - Kiểm tra trạng thái đăng nhập

### Books
- `GET /api/books` - Danh sách sách
- `GET /api/books/{id}` - Chi tiết sách
- `POST /api/books` - Tạo sách mới (Admin)
- `PUT /api/books/{id}` - Cập nhật sách (Admin)
- `DELETE /api/books/{id}` - Xóa sách (Admin)

### Cart
- `GET /api/cart` - Xem giỏ hàng
- `POST /api/cart/add` - Thêm vào giỏ
- `PUT /api/cart/update/{id}` - Cập nhật số lượng
- `DELETE /api/cart/remove/{id}` - Xóa khỏi giỏ

### Orders
- `GET /api/orders` - Danh sách đơn hàng
- `GET /api/orders/{id}` - Chi tiết đơn hàng
- `POST /api/orders/checkout` - Đặt hàng

### Categories
- `GET /api/categories` - Danh sách danh mục
- `POST /api/categories` - Tạo danh mục (Admin)
- `PUT /api/categories/{id}` - Cập nhật danh mục (Admin)
- `DELETE /api/categories/{id}` - Xóa danh mục (Admin)

### Admin
- `GET /api/admin/dashboard` - Dashboard
- `GET /api/admin/users` - Quản lý users

---

## ✅ CHECKLIST TRƯỚC KHI CHẠY

- [ ] MySQL đã cài đặt và đang chạy
- [ ] Database `books_store` đã được tạo
- [ ] File `application.properties` đã cấu hình đúng
- [ ] Java 17+ đã cài đặt
- [ ] Node.js 16+ đã cài đặt
- [ ] Dependencies frontend đã cài (`npm install`)
- [ ] Port 8080 (backend) và 5173 (frontend) không bị chiếm

---

## 🎉 HOÀN THÀNH!

Sau khi làm theo các bước trên, bạn sẽ có:

✅ Backend chạy trên: **http://localhost:8080**  
✅ Frontend chạy trên: **http://localhost:5173**  
✅ Tích hợp hoàn chỉnh giữa React và Spring Boot  
✅ Sẵn sàng phát triển và test các tính năng

---

## 📞 HỖ TRỢ

Nếu gặp vấn đề, kiểm tra:
1. Console log của Backend (Terminal 1)
2. Console log của Frontend (Terminal 2)
3. Browser DevTools → Console tab
4. Browser DevTools → Network tab (xem API calls)

**Happy Coding! 🚀**
