# 📍 VỊ TRÍ CÁC FILES REACT

## ✅ REACT COMPONENTS - ĐÃ COPY VÀO FRONTEND!

### 📁 Vị Trí Chính (Đang Sử Dụng)

```
frontend/src/components/
```

**Đường dẫn đầy đủ:**
```
/Users/nguyenmai/Documents/doanchuyennganh/test/books_store_test2/frontend/src/components/
```

**Các files trong đó:**
- ✅ 18 JSX files (Login.jsx, Register.jsx, BookList.jsx, ...)
- ✅ 18 CSS files (Login.css, Register.css, BookDetail.css, ...)
- ✅ Template files (TEMPLATE_COMPONENT.jsx, EXAMPLE_ProductList.jsx)
- ✅ Documentation files (*.md)

**Tổng cộng:** ~40 files

---

## 📦 VỊ TRÍ BACKUP

### 1. docs/components-backup/
```
/Users/nguyenmai/Documents/doanchuyennganh/test/books_store_test2/docs/components-backup/
```
**Mục đích:** Backup components gốc sau khi cleanup

### 2. backup_YYYYMMDD_HHMMSS/react-components/
```
/Users/nguyenmai/Documents/doanchuyennganh/test/books_store_test2/backup_20260521_000726/react-components/
```
**Mục đích:** Backup tự động khi chạy cleanup script

---

## 🗂️ CẤU TRÚC FRONTEND

```
frontend/
├── node_modules/           # Dependencies
├── public/                 # Static files
├── src/
│   ├── components/        # ✅ REACT COMPONENTS Ở ĐÂY!
│   │   ├── Login.jsx
│   │   ├── Login.css
│   │   ├── Register.jsx
│   │   ├── Register.css
│   │   ├── BookList.jsx
│   │   ├── BookDetail.jsx
│   │   ├── BookDetail.css
│   │   ├── BookForm.jsx
│   │   ├── BookForm.css
│   │   ├── Cart.jsx
│   │   ├── Cart.css
│   │   ├── Checkout.jsx
│   │   ├── Checkout.css
│   │   ├── PaymentResult.jsx
│   │   ├── PaymentResult.css
│   │   ├── OrderList.jsx
│   │   ├── OrderList.css
│   │   ├── OrderDetail.jsx
│   │   ├── OrderDetail.css
│   │   ├── UserProfile.jsx
│   │   ├── UserProfile.css
│   │   ├── AdminDashboard.jsx
│   │   ├── AdminDashboard.css
│   │   ├── AdminUsers.jsx
│   │   ├── AdminUsers.css
│   │   ├── CategoryList.jsx
│   │   ├── CategoryList.css
│   │   ├── CategoryForm.jsx
│   │   ├── CategoryForm.css
│   │   ├── AccessDenied.jsx
│   │   ├── AccessDenied.css
│   │   ├── Navbar.jsx
│   │   ├── Navbar.css
│   │   ├── Footer.jsx
│   │   └── Footer.css
│   ├── App.jsx            # Main app với routes
│   ├── App.css
│   ├── main.jsx           # Entry point
│   └── index.css
├── .env                   # Environment variables
├── package.json           # Dependencies
├── vite.config.js         # Vite config
└── README.md
```

---

## 🎯 CÁCH SỬ DỤNG

### 1. Import Components trong App.jsx

```javascript
// Trong frontend/src/App.jsx
import Login from './components/Login';
import Register from './components/Register';
import BookList from './components/BookList';
// ... import các components khác
```

### 2. Chạy Frontend

```bash
cd frontend
npm run dev
```

Frontend sẽ chạy trên: **http://localhost:3000**

---

## 📝 DANH SÁCH COMPONENTS

### Authentication (3)
- ✅ Login.jsx + Login.css
- ✅ Register.jsx + Register.css
- ✅ UserProfile.jsx + UserProfile.css

### Books (3)
- ✅ BookList.jsx (CSS embedded)
- ✅ BookDetail.jsx + BookDetail.css
- ✅ BookForm.jsx + BookForm.css

### Shopping & Orders (5)
- ✅ Cart.jsx + Cart.css
- ✅ Checkout.jsx + Checkout.css
- ✅ PaymentResult.jsx + PaymentResult.css
- ✅ OrderList.jsx + OrderList.css
- ✅ OrderDetail.jsx + OrderDetail.css

### Admin (2)
- ✅ AdminDashboard.jsx + AdminDashboard.css
- ✅ AdminUsers.jsx + AdminUsers.css

### Categories (2)
- ✅ CategoryList.jsx + CategoryList.css
- ✅ CategoryForm.jsx + CategoryForm.css

### Error Pages (1)
- ✅ AccessDenied.jsx + AccessDenied.css

### Shared Components (2)
- ✅ Navbar.jsx + Navbar.css
- ✅ Footer.jsx + Footer.css

**Tổng cộng:** 18 components (36 files: 18 JSX + 18 CSS)

---

## 🔍 TÌM FILES

### Tìm tất cả JSX files
```bash
find frontend/src/components -name "*.jsx"
```

### Tìm tất cả CSS files
```bash
find frontend/src/components -name "*.css"
```

### Đếm số lượng files
```bash
ls frontend/src/components | wc -l
```

---

## ⚠️ LƯU Ý

### 1. Không Sửa Files Trong Backup
Files trong `docs/components-backup/` chỉ là backup. Nếu muốn sửa, sửa trong:
```
frontend/src/components/
```

### 2. Import Paths
Khi import trong App.jsx, dùng relative path:
```javascript
import Login from './components/Login';  // ✅ Đúng
import Login from '../components/Login'; // ❌ Sai
```

### 3. CSS Import
Mỗi component tự import CSS của nó:
```javascript
// Trong Login.jsx
import './Login.css';
```

---

## 🚀 QUICK START

### 1. Check Components
```bash
ls frontend/src/components/
```

### 2. Start Frontend
```bash
cd frontend
npm run dev
```

### 3. Open Browser
```
http://localhost:3000
```

---

## 📞 TROUBLESHOOTING

### Lỗi: Cannot find module './components/Login'

**Giải pháp:**
```bash
# Check xem file có tồn tại không
ls frontend/src/components/Login.jsx

# Nếu không có, copy lại
cp docs/components-backup/*.jsx frontend/src/components/
cp docs/components-backup/*.css frontend/src/components/
```

### Lỗi: Module not found

**Giải pháp:**
```bash
cd frontend
npm install
```

---

## ✅ CHECKLIST

- [x] Components đã copy vào `frontend/src/components/`
- [x] Có 18 JSX files
- [x] Có 18 CSS files
- [ ] App.jsx đã import components
- [ ] Frontend đã chạy được
- [ ] Test các routes

---

**Vị trí chính:** `frontend/src/components/` ✅  
**Backup:** `docs/components-backup/` 📦  
**Status:** Ready to use! 🚀
