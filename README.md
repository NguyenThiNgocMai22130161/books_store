# 📚 Tiệm Sách - Bookstore Management System

> Hệ thống quản lý cửa hàng sách trực tuyến với Spring Boot + React

[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.x-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-18.x-blue.svg)](https://reactjs.org/)
[![Java](https://img.shields.io/badge/Java-17+-orange.svg)](https://www.oracle.com/java/)
[![MySQL](https://img.shields.io/badge/MySQL-8.x-blue.svg)](https://www.mysql.com/)

## 📖 Mục Lục

- [Giới Thiệu](#-giới-thiệu)
- [Tính Năng](#-tính-năng)
- [Công Nghệ](#-công-nghệ-sử-dụng)
- [Yêu Cầu Hệ Thống](#-yêu-cầu-hệ-thống)
- [Cài Đặt](#-cài-đặt)
- [Chạy Ứng Dụng](#-chạy-ứng-dụng)
- [Cấu Trúc Project](#-cấu-trúc-project)
- [API Documentation](#-api-documentation)
- [Screenshots](#-screenshots)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)

## 🎯 Giới Thiệu

**Tiệm Sách** là một hệ thống quản lý cửa hàng sách trực tuyến hoàn chỉnh, được xây dựng với:
- **Backend**: Spring Boot (REST API)
- **Frontend**: React (SPA - Single Page Application)
- **Database**: MySQL
- **Authentication**: Spring Security + Session-based Auth

Hệ thống hỗ trợ 2 loại người dùng:
- **Admin**: Quản lý sách, danh mục, người dùng, đơn hàng
- **User**: Xem sách, thêm vào giỏ hàng, đặt hàng, thanh toán

## ✨ Tính Năng

### 👤 Người Dùng (User)
- ✅ Đăng ký / Đăng nhập
- ✅ Xem danh sách sách (hỗ trợ phân trang)
- ✅ Tìm kiếm & lọc sách (theo tên, tác giả, danh mục, giá)
- ✅ Xem chi tiết sách
- ✅ Thêm sách vào giỏ hàng
- ✅ Quản lý giỏ hàng (cập nhật số lượng, xóa)
- ✅ Đặt hàng & thanh toán
- ✅ Xem lịch sử đơn hàng
- ✅ Quản lý hồ sơ cá nhân

### 👨‍💼 Quản Trị Viên (Admin)
- ✅ Dashboard thống kê
- ✅ Quản lý sách (CRUD)
- ✅ Quản lý danh mục (CRUD)
- ✅ Quản lý người dùng
- ✅ Xem & quản lý đơn hàng
- ✅ Phân quyền người dùng

### 🎨 Giao Diện
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Hỗ trợ màn hình rộng (lên đến 2200px)
- ✅ Modern UI với animations
- ✅ Dark mode ready

## 🛠️ Công Nghệ Sử Dụng

### Backend
- **Framework**: Spring Boot 3.x
- **Security**: Spring Security
- **Database**: MySQL 8.x
- **ORM**: Spring Data JPA (Hibernate)
- **Build Tool**: Maven
- **Java Version**: 17+

### Frontend
- **Framework**: React 18.x
- **Build Tool**: Vite
- **HTTP Client**: Axios
- **Routing**: React Router v6
- **Styling**: CSS3 (Custom)

### Database
- **RDBMS**: MySQL 8.x
- **Tables**: users, books, categories, cart_items, orders, order_items

## 💻 Yêu Cầu Hệ Thống

### Bắt Buộc
- **Java**: JDK 17 hoặc cao hơn
- **Node.js**: v16+ và npm
- **MySQL**: 8.x
- **Maven**: 3.6+

### Tùy Chọn
- **IDE**: IntelliJ IDEA, Eclipse, VS Code
- **Git**: Để clone repository

### Kiểm Tra Phiên Bản

```bash
# Java
java -version
# Output: java version "17.x.x" hoặc cao hơn

# Node.js
node -v
# Output: v16.x.x hoặc cao hơn

# npm
npm -v
# Output: 8.x.x hoặc cao hơn

# MySQL
mysql --version
# Output: mysql Ver 8.x.x

# Maven
mvn -v
# Output: Apache Maven 3.6.x hoặc cao hơn
```

## 📥 Cài Đặt

### Bước 1: Clone Repository

```bash
git clone https://github.com/your-username/books_store_test2.git
cd books_store_test2
```

### Bước 2: Cấu Hình Database

#### 2.1. Tạo Database

```bash
# Đăng nhập MySQL
mysql -u root -p

# Tạo database
CREATE DATABASE bookstore CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# Tạo user (tùy chọn)
CREATE USER 'bookstore_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON bookstore.* TO 'bookstore_user'@'localhost';
FLUSH PRIVILEGES;

# Thoát
EXIT;
```

#### 2.2. Cấu Hình application.properties

```bash
# Copy file example
cp application.properties.example src/main/resources/application.properties

# Sửa file application.properties
nano src/main/resources/application.properties
```

**Nội dung cần sửa**:
```properties
# Database
spring.datasource.url=jdbc:mysql://localhost:3306/bookstore?useSSL=false&serverTimezone=UTC
spring.datasource.username=root
spring.datasource.password=your_mysql_password

# JPA/Hibernate
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
```

### Bước 3: Cài Đặt Dependencies

#### Backend (Maven)
```bash
mvn clean install
```

#### Frontend (npm)
```bash
cd frontend
npm install
cd ..
```

### Bước 4: Import Sample Data (Tùy chọn)

```bash
# Import sample books
mysql -u root -p bookstore < sample-books.sql
```

Hoặc sử dụng file JSON:
```bash
# Chạy app trước, sau đó import qua API
curl -X POST http://localhost:8080/api/admin/import \
  -H "Content-Type: application/json" \
  -d @sample-books.json
```

## 🚀 Chạy Ứng Dụng

### Cách 1: Chạy Riêng Biệt (Development)

#### Terminal 1: Backend
```bash
# Từ thư mục root
mvn spring-boot:run

# Hoặc
mvn clean spring-boot:run

# Backend chạy tại: http://localhost:8080
```

#### Terminal 2: Frontend
```bash
# Từ thư mục root
cd frontend
npm run dev

# Frontend chạy tại: http://localhost:5173
```

### Cách 2: Chạy Production Build

#### Build Frontend
```bash
cd frontend
npm run build
cd ..
```

#### Build & Run Backend (với frontend đã build)
```bash
# Copy frontend build vào static folder
cp -r frontend/dist/* src/main/resources/static/

# Build JAR
mvn clean package

# Run JAR
java -jar target/books-store-0.0.1-SNAPSHOT.jar

# App chạy tại: http://localhost:8080
```

### Cách 3: Sử Dụng Script (Nhanh nhất)

```bash
# Tạo script start-dev.sh
cat > start-dev.sh << 'EOF'
#!/bin/bash
echo "🚀 Starting Bookstore App..."

# Start backend
echo "📦 Starting Backend..."
mvn spring-boot:run &
BACKEND_PID=$!

# Wait for backend
sleep 10

# Start frontend
echo "🎨 Starting Frontend..."
cd frontend
npm run dev &
FRONTEND_PID=$!

echo "✅ App started!"
echo "Backend: http://localhost:8080"
echo "Frontend: http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop"

# Wait for Ctrl+C
trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait
EOF

chmod +x start-dev.sh
./start-dev.sh
```

## 🌐 Truy Cập Ứng Dụng

### URLs
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8080/api
- **H2 Console** (nếu dùng H2): http://localhost:8080/h2-console

### Tài Khoản Mặc Định

#### Admin
- **Username**: `admin`
- **Password**: `admin123`
- **Email**: `admin@bookstore.com`

#### User
- **Username**: `user`
- **Password**: `user123`
- **Email**: `user@bookstore.com`

> ⚠️ **Lưu ý**: Đổi password sau khi đăng nhập lần đầu!

## 📁 Cấu Trúc Project

```
books_store_test2/
├── src/main/java/myproject/study/books_store/
│   ├── config/              # Configuration classes
│   │   ├── SecurityConfig.java
│   │   └── WebConfig.java
│   ├── controller/          # REST Controllers
│   │   ├── AuthController.java
│   │   ├── BookApiController.java
│   │   ├── CartController.java
│   │   ├── OrderController.java
│   │   └── CategoryApiController.java
│   ├── model/               # Entity classes
│   │   ├── User.java
│   │   ├── Book.java
│   │   ├── Category.java
│   │   ├── CartItem.java
│   │   ├── Order.java
│   │   └── OrderItem.java
│   ├── repository/          # JPA Repositories
│   │   ├── UserRepository.java
│   │   ├── BookRepository.java
│   │   ├── CategoryRepository.java
│   │   ├── CartItemRepository.java
│   │   └── OrderRepository.java
│   ├── service/             # Business Logic
│   │   ├── UserService.java
│   │   ├── BookService.java
│   │   ├── CartService.java
│   │   └── OrderService.java
│   └── BooksStoreApplication.java
│
├── src/main/resources/
│   ├── application.properties
│   └── static/              # Static files (production build)
│
├── frontend/
│   ├── src/
│   │   ├── components/      # React Components
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── BookList.jsx
│   │   │   ├── BookDetail.jsx
│   │   │   ├── BookForm.jsx
│   │   │   ├── Cart.jsx
│   │   │   ├── Checkout.jsx
│   │   │   ├── OrderList.jsx
│   │   │   ├── AdminDashboard.jsx
│   │   │   └── ...
│   │   ├── App.jsx          # Main App component
│   │   ├── App.css          # Global styles
│   │   └── main.jsx         # Entry point
│   ├── public/              # Public assets
│   ├── package.json
│   └── vite.config.js
│
├── docs/                    # Documentation
│   ├── api/                 # API docs
│   ├── guides/              # Development guides
│   └── setup/               # Setup guides
│
├── pom.xml                  # Maven configuration
├── README.md                # This file
└── .gitignore
```

## 📡 API Documentation

### Base URL
```
http://localhost:8080/api
```

### Authentication Endpoints

#### POST /api/auth/register
Đăng ký tài khoản mới

**Request Body**:
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "password123",
  "fullName": "John Doe"
}
```

**Response** (201 Created):
```json
{
  "message": "Đăng ký thành công!",
  "user": {
    "userId": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "fullName": "John Doe"
  }
}
```

#### POST /api/auth/login
Đăng nhập (handled by Spring Security)

**Form Data**:
- `username`: john_doe
- `password`: password123

#### GET /api/auth/profile
Lấy thông tin user hiện tại

**Response** (200 OK):
```json
{
  "userId": 1,
  "username": "john_doe",
  "email": "john@example.com",
  "fullName": "John Doe",
  "roles": ["ROLE_USER"],
  "active": true
}
```

### Book Endpoints

#### GET /api/books
Lấy danh sách sách (có hỗ trợ filter)

**Query Parameters**:
- `title` (optional): Tìm theo tên sách
- `author` (optional): Tìm theo tác giả
- `category` (optional): Lọc theo danh mục
- `minPrice` (optional): Giá tối thiểu
- `maxPrice` (optional): Giá tối đa

**Example**:
```
GET /api/books?title=clean&category=Programming&minPrice=100000&maxPrice=500000
```

**Response** (200 OK):
```json
[
  {
    "id": 1,
    "title": "Clean Code",
    "author": "Robert C. Martin",
    "price": 350000,
    "category": "Programming",
    "description": "A Handbook of Agile Software Craftsmanship",
    "imageUrl": "https://...",
    "quantity": 10,
    "year": 2008
  }
]
```

#### GET /api/books/{id}
Lấy chi tiết sách

#### POST /api/books
Thêm sách mới (Admin only)

**Request Body**:
```json
{
  "title": "Clean Code",
  "author": "Robert C. Martin",
  "price": 350000,
  "category": "Programming",
  "description": "A Handbook of Agile Software Craftsmanship",
  "imageUrl": "https://...",
  "quantity": 10,
  "year": 2008
}
```

#### PUT /api/books/{id}
Cập nhật sách (Admin only)

#### DELETE /api/books/{id}
Xóa sách (Admin only)

### Cart Endpoints

#### GET /api/cart
Xem giỏ hàng

**Response** (200 OK):
```json
{
  "cartItems": [
    {
      "id": 1,
      "book": {
        "id": 1,
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

#### POST /api/cart/add
Thêm sách vào giỏ

**Request Body**:
```json
{
  "bookId": "1",
  "quantity": 1
}
```

#### PUT /api/cart/update/{itemId}
Cập nhật số lượng

**Request Body**:
```json
{
  "quantity": 3
}
```

#### DELETE /api/cart/remove/{itemId}
Xóa sản phẩm khỏi giỏ

### Order Endpoints

#### GET /api/orders
Xem danh sách đơn hàng

#### GET /api/orders/{id}
Xem chi tiết đơn hàng

#### POST /api/cart/payment
Thanh toán đơn hàng

**Request Body**:
```json
{
  "paymentMethod": "COD"
}
```

> 📖 **Chi tiết API**: Xem thêm tại [docs/api/API_DOCUMENTATION.md](docs/api/API_DOCUMENTATION.md)

## 📸 Screenshots

### Trang Chủ
![Home Page](docs/screenshots/home.png)

### Danh Sách Sách
![Book List](docs/screenshots/book-list.png)

### Giỏ Hàng
![Cart](docs/screenshots/cart.png)

### Admin Dashboard
![Admin Dashboard](docs/screenshots/admin-dashboard.png)

## 🐛 Troubleshooting

### Lỗi: Port 8080 đã được sử dụng

```bash
# Tìm process đang dùng port 8080
lsof -i :8080

# Kill process
kill -9 <PID>

# Hoặc đổi port trong application.properties
server.port=8081
```

### Lỗi: Cannot connect to MySQL

```bash
# Kiểm tra MySQL đang chạy
sudo systemctl status mysql  # Linux
brew services list           # macOS

# Start MySQL
sudo systemctl start mysql   # Linux
brew services start mysql    # macOS

# Kiểm tra connection
mysql -u root -p -e "SELECT 1"
```

### Lỗi: Frontend không kết nối được Backend

Kiểm tra CORS trong `SecurityConfig.java`:
```java
@Bean
public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration configuration = new CorsConfiguration();
    configuration.setAllowedOrigins(Arrays.asList("http://localhost:5173"));
    configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE"));
    configuration.setAllowCredentials(true);
    // ...
}
```

### Lỗi: npm install failed

```bash
# Xóa node_modules và package-lock.json
cd frontend
rm -rf node_modules package-lock.json

# Install lại
npm install

# Hoặc dùng npm cache clean
npm cache clean --force
npm install
```

### Lỗi: Maven build failed

```bash
# Clean và build lại
mvn clean install -U

# Skip tests nếu cần
mvn clean install -DskipTests
```

## 🧹 Cleanup Project

Nếu project có nhiều file dư thừa:

```bash
# Chạy script cleanup
./cleanup-unused-files.sh

# Hoặc quick cleanup
./cleanup-quick.sh
```

> 📖 **Chi tiết**: Xem [CLEANUP_GUIDE.md](CLEANUP_GUIDE.md)

## 📚 Tài Liệu Thêm

- [Hướng Dẫn Chạy Dự Án](HUONG_DAN_CHAY_DU_AN.md)
- [Quick Start Guide](QUICK_START.md)
- [API Documentation](docs/api/API_DOCUMENTATION.md)
- [Security Configuration](docs/guides/SECURITY_CONFIG_GUIDE.md)
- [Cleanup Guide](CLEANUP_GUIDE.md)
- [Wide Screen Support](WIDE_SCREEN_SUPPORT.md)

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- **Nguyen Mai** - *Initial work* - [GitHub](https://github.com/your-username)

## 🙏 Acknowledgments

- Spring Boot Documentation
- React Documentation
- Stack Overflow Community
- All contributors

## 📞 Contact

- **Email**: your.email@example.com
- **GitHub**: [@your-username](https://github.com/your-username)
- **LinkedIn**: [Your Name](https://linkedin.com/in/your-profile)

---

**Made with ❤️ by Nguyen Mai**

**Last Updated**: May 22, 2026

các chức năng yêu cầu:
ROLE_Admin:
1: thêm, xoá, sửa sản phẩm, đăng xuất.
2. tìm kiếm và lọc sách.
3. xem chi tiết, xem hồ sơ cá nhân.
4. Thêm xoá sửa danh mục, khi xoá danh mục, thì sản phẩm vẫn còn và hiện chỗ thể loại là chưa phân loại.
5. quản lý người dùng.
ROLE_User:
1. Đăng nhập bằng tài khoản google.
2. Tìm kiếm và lọc sách.
3. xem chi tiết, thêm vào giỏ hàng.
4. Thanh toán mặc định, có xem lịch sử mua hàng.
