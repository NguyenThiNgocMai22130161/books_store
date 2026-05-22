# 🚀 Hướng Dẫn Setup React App

## 📋 Tình Trạng Hiện Tại

✅ **Backend (Spring Boot)** - Đã sẵn sàng
- REST API controllers đã refactor xong
- Chạy trên `http://localhost:8080`

✅ **React Components** - Đã convert xong
- 20 components trong folder `react-components/`
- Tất cả đã có JSX + CSS

❌ **React App** - CHƯA CÓ
- Cần tạo React app để chạy components
- Cần setup routing, build tools

---

## 🎯 Các Bước Setup

### Option 1: Tạo React App Mới (Khuyến Nghị)

#### Bước 1: Tạo React App với Vite

```bash
# Di chuyển vào thư mục dự án
cd /Users/nguyenmai/Documents/doanchuyennganh/test/books_store_test2

# Tạo React app với Vite (nhanh hơn Create React App)
npm create vite@latest frontend -- --template react

# Hoặc dùng Create React App (cách cũ)
# npx create-react-app frontend
```

#### Bước 2: Di chuyển vào folder frontend

```bash
cd frontend
```

#### Bước 3: Cài đặt dependencies

```bash
# Cài đặt dependencies cơ bản
npm install

# Cài đặt thêm React Router và Axios
npm install react-router-dom axios
```

#### Bước 4: Copy React Components

```bash
# Copy tất cả components từ react-components/ vào src/components/
mkdir -p src/components
cp ../react-components/*.jsx src/components/
cp ../react-components/*.css src/components/
```

#### Bước 5: Tạo file App.jsx với Router

Tạo file `src/App.jsx`:

```javascript
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Auth
import Login from './components/Login';
import Register from './components/Register';
import UserProfile from './components/UserProfile';

// Books
import BookList from './components/BookList';
import BookDetail from './components/BookDetail';
import BookForm from './components/BookForm';

// Shopping
import Cart from './components/Cart';
import Checkout from './components/Checkout';
import PaymentResult from './components/PaymentResult';

// Orders
import OrderList from './components/OrderList';
import OrderDetail from './components/OrderDetail';

// Admin
import AdminDashboard from './components/AdminDashboard';
import AdminUsers from './components/AdminUsers';

// Categories
import CategoryList from './components/CategoryList';
import CategoryForm from './components/CategoryForm';

// Error
import AccessDenied from './components/AccessDenied';

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <Navbar />
        <Routes>
          {/* Home */}
          <Route path="/" element={<Navigate to="/books" replace />} />
          
          {/* Auth */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/user/profile" element={<UserProfile />} />
          
          {/* Books */}
          <Route path="/books" element={<BookList />} />
          <Route path="/books/:id" element={<BookDetail />} />
          <Route path="/books/add" element={<BookForm />} />
          <Route path="/books/edit/:id" element={<BookForm />} />
          
          {/* Shopping */}
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/payment-result" element={<PaymentResult />} />
          
          {/* Orders */}
          <Route path="/orders" element={<OrderList />} />
          <Route path="/orders/:id" element={<OrderDetail />} />
          
          {/* Admin */}
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          
          {/* Categories */}
          <Route path="/categories" element={<CategoryList />} />
          <Route path="/categories/add" element={<CategoryForm />} />
          <Route path="/categories/edit/:id" element={<CategoryForm />} />
          
          {/* Error */}
          <Route path="/access-denied" element={<AccessDenied />} />
          
          {/* 404 */}
          <Route path="*" element={<Navigate to="/books" replace />} />
        </Routes>
        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;
```

#### Bước 6: Tạo file .env

Tạo file `frontend/.env`:

```bash
VITE_API_URL=http://localhost:8080
```

Hoặc nếu dùng Create React App:

```bash
REACT_APP_API_URL=http://localhost:8080
```

#### Bước 7: Configure Proxy (Optional)

Tạo file `frontend/vite.config.js` (nếu dùng Vite):

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      }
    }
  }
})
```

#### Bước 8: Chạy Frontend

```bash
# Trong folder frontend/
npm run dev

# Hoặc nếu dùng Create React App
# npm start
```

Frontend sẽ chạy trên: `http://localhost:3000`

---

### Option 2: Setup Nhanh với Script

Tớ sẽ tạo một script tự động setup cho bạn:

```bash
#!/bin/bash

# setup-react-app.sh

echo "🚀 Setting up React App..."

# Tạo React app với Vite
npm create vite@latest frontend -- --template react

# Di chuyển vào frontend
cd frontend

# Cài đặt dependencies
echo "📦 Installing dependencies..."
npm install
npm install react-router-dom axios

# Tạo folder components
mkdir -p src/components

# Copy components
echo "📁 Copying React components..."
cp ../react-components/*.jsx src/components/ 2>/dev/null || true
cp ../react-components/*.css src/components/ 2>/dev/null || true

# Tạo .env
echo "⚙️ Creating .env file..."
echo "VITE_API_URL=http://localhost:8080" > .env

echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. cd frontend"
echo "2. Create src/App.jsx with routes"
echo "3. npm run dev"
```

---

## 🔧 Cấu Trúc Thư Mục Sau Khi Setup

```
books_store_test2/
├── src/                          # Backend (Spring Boot)
│   └── main/
│       ├── java/
│       └── resources/
├── react-components/             # Components đã convert (backup)
│   ├── Login.jsx
│   ├── Register.jsx
│   └── ...
├── frontend/                     # React App MỚI
│   ├── node_modules/
│   ├── public/
│   ├── src/
│   │   ├── components/          # Copy từ react-components/
│   │   │   ├── Login.jsx
│   │   │   ├── Login.css
│   │   │   └── ...
│   │   ├── App.jsx              # Main app với routes
│   │   └── main.jsx             # Entry point
│   ├── .env                     # Environment variables
│   ├── package.json
│   └── vite.config.js
├── pom.xml                      # Backend config
└── README.md
```

---

## 🚀 Chạy Cả BE + FE

### Terminal 1: Chạy Backend

```bash
# Trong folder gốc
cd /Users/nguyenmai/Documents/doanchuyennganh/test/books_store_test2

# Chạy Spring Boot
./mvnw spring-boot:run

# Hoặc
mvn spring-boot:run
```

Backend chạy trên: `http://localhost:8080`

### Terminal 2: Chạy Frontend

```bash
# Trong folder frontend
cd /Users/nguyenmai/Documents/doanchuyennganh/test/books_store_test2/frontend

# Chạy React app
npm run dev
```

Frontend chạy trên: `http://localhost:3000`

---

## 🧪 Test

1. Mở browser: `http://localhost:3000`
2. Bạn sẽ thấy trang BookList
3. Test login: `http://localhost:3000/login`
4. Test register: `http://localhost:3000/register`

---

## ⚠️ Lưu Ý Quan Trọng

### 1. CORS Configuration

Backend đã được config CORS trong `SecurityConfig.java`:

```java
.cors(cors -> cors.configurationSource(request -> {
    CorsConfiguration config = new CorsConfiguration();
    config.setAllowedOrigins(Arrays.asList(
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:8080"
    ));
    config.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
    config.setAllowCredentials(true);
    return config;
}))
```

### 2. Credentials

Tất cả API calls phải có `withCredentials: true`:

```javascript
axios.get('http://localhost:8080/api/books', {
  withCredentials: true
});
```

### 3. Environment Variables

Trong components, thay:

```javascript
// Thay vì hardcode
const response = await axios.get('http://localhost:8080/api/books');

// Dùng env variable
const API_URL = import.meta.env.VITE_API_URL; // Vite
// hoặc
const API_URL = process.env.REACT_APP_API_URL; // Create React App

const response = await axios.get(`${API_URL}/api/books`);
```

---

## 🐛 Troubleshooting

### Lỗi: CORS Error

**Giải pháp:**
- Check backend đã chạy chưa
- Check CORS config trong SecurityConfig.java
- Check port frontend (phải là 3000, 3001, hoặc 8080)

### Lỗi: 401 Unauthorized

**Giải pháp:**
- Check `withCredentials: true` trong axios
- Check session cookies
- Login lại

### Lỗi: Module not found

**Giải pháp:**
```bash
cd frontend
npm install
```

### Lỗi: Port already in use

**Giải pháp:**
```bash
# Kill process trên port 3000
lsof -ti:3000 | xargs kill -9

# Hoặc dùng port khác
npm run dev -- --port 3001
```

---

## 📚 Next Steps

Sau khi setup xong:

1. ✅ Test tất cả routes
2. ✅ Test authentication flow
3. ✅ Test CRUD operations
4. ✅ Test responsive design
5. ✅ Add error boundaries
6. ✅ Add loading states
7. ✅ Optimize performance
8. ✅ Build production

---

## 🎯 Production Build

```bash
# Trong folder frontend/
npm run build

# Output sẽ ở frontend/dist/
# Deploy folder dist/ lên hosting
```

---

**Bạn cần tớ tạo script tự động setup không?** 🚀
