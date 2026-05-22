# ⚡ QUICK START - Books Store

## 🎯 Chạy Nhanh Dự Án (3 Bước)

### Bước 1: Cấu hình Database

```bash
# Tạo database MySQL
mysql -u root -p
CREATE DATABASE books_store CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
exit;
```

Kiểm tra file `src/main/resources/application.properties` và sửa password MySQL:

```properties
spring.datasource.password=your_password_here
```

### Bước 2: Chạy Backend

```bash
./mvnw spring-boot:run
```

✅ Backend chạy trên: **http://localhost:8080**

### Bước 3: Chạy Frontend (Terminal mới)

```bash
cd frontend
npm run dev
```

✅ Frontend chạy trên: **http://localhost:5173**

---

## 🚀 Hoặc Dùng Script Tự Động

```bash
./start-dev.sh
```

Chọn option 3 để chạy cả Backend và Frontend!

---

## 🔐 Tài Khoản Test

**Admin:**
- Username: `admin`
- Password: `admin123`

**User:**
- Username: `user`
- Password: `user123`

---

## 📖 Hướng Dẫn Chi Tiết

Xem file: **[HUONG_DAN_CHAY_DU_AN.md](./HUONG_DAN_CHAY_DU_AN.md)**

---

## 🎯 Các URL Quan Trọng

| Service | URL | Mô tả |
|---------|-----|-------|
| Frontend | http://localhost:5173 | React App |
| Backend API | http://localhost:8080/api | REST API |
| Login | http://localhost:5173/login | Trang đăng nhập |
| Books | http://localhost:5173/books | Danh sách sách |
| Admin | http://localhost:5173/admin | Admin Dashboard |

---

## 🐛 Lỗi Thường Gặp

### Port 8080 đã được sử dụng

```bash
# macOS
lsof -ti:8080 | xargs kill -9
```

### Cannot connect to MySQL

Kiểm tra MySQL đã chạy:
```bash
brew services list
```

Khởi động MySQL:
```bash
brew services start mysql
```

### Module not found (Frontend)

```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

---

**Happy Coding! 🚀**
