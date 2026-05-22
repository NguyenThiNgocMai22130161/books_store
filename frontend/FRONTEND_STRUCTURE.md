# 📁 Cấu Trúc Frontend

> Tài liệu mô tả cấu trúc thư mục frontend đã được tổ chức lại

**Ngày cập nhật**: 22/05/2026

---

## 🎯 Mục Đích

Tổ chức lại cấu trúc frontend theo **module/feature-based architecture** để:
- ✅ Dễ tìm kiếm components
- ✅ Dễ bảo trì và mở rộng
- ✅ Tách biệt rõ ràng các chức năng
- ✅ Import/Export gọn gàng hơn

---

## 📂 Cấu Trúc Thư Mục

```
frontend/
├── public/                      # Static assets
│   ├── favicon.svg
│   └── icons.svg
│
├── src/
│   ├── assets/                  # Images, fonts, etc.
│   │   ├── hero.png
│   │   ├── react.svg
│   │   └── vite.svg
│   │
│   ├── components/              # React Components (organized by feature)
│   │   │
│   │   ├── auth/               # 🔐 Authentication & Authorization
│   │   │   ├── Login.jsx
│   │   │   ├── Login.css
│   │   │   ├── Register.jsx
│   │   │   ├── Register.css
│   │   │   ├── AccessDenied.jsx
│   │   │   ├── AccessDenied.css
│   │   │   └── index.js        # Export all auth components
│   │   │
│   │   ├── books/              # 📚 Book Management
│   │   │   ├── BookList.jsx
│   │   │   ├── BookList.css
│   │   │   ├── BookDetail.jsx
│   │   │   ├── BookDetail.css
│   │   │   ├── BookForm.jsx    # Add/Edit book (Admin)
│   │   │   ├── BookForm.css
│   │   │   └── index.js
│   │   │
│   │   ├── cart/               # 🛒 Shopping Cart & Payment
│   │   │   ├── Cart.jsx
│   │   │   ├── Cart.css
│   │   │   ├── Checkout.jsx
│   │   │   ├── Checkout.css
│   │   │   ├── PaymentResult.jsx
│   │   │   ├── PaymentResult.css
│   │   │   └── index.js
│   │   │
│   │   ├── orders/             # 📋 Order Management
│   │   │   ├── OrderList.jsx
│   │   │   ├── OrderList.css
│   │   │   ├── OrderDetail.jsx
│   │   │   ├── OrderDetail.css
│   │   │   └── index.js
│   │   │
│   │   ├── admin/              # 👨‍💼 Admin Dashboard
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── AdminDashboard.css
│   │   │   ├── AdminUsers.jsx
│   │   │   ├── AdminUsers.css
│   │   │   └── index.js
│   │   │
│   │   ├── categories/         # 🏷️ Category Management
│   │   │   ├── CategoryList.jsx
│   │   │   ├── CategoryList.css
│   │   │   ├── CategoryForm.jsx
│   │   │   ├── CategoryForm.css
│   │   │   └── index.js
│   │   │
│   │   ├── user/               # 👤 User Profile
│   │   │   ├── UserProfile.jsx
│   │   │   ├── UserProfile.css
│   │   │   └── index.js
│   │   │
│   │   └── shared/             # 🔄 Shared/Common Components
│   │       ├── Navbar.jsx
│   │       ├── Navbar.css
│   │       ├── Footer.jsx
│   │       ├── Footer.css
│   │       └── index.js
│   │
│   ├── App.jsx                 # Main App component
│   ├── App.css                 # Global app styles
│   ├── main.jsx                # Entry point
│   └── index.css               # Global CSS
│
├── package.json
├── vite.config.js
├── eslint.config.js
└── FRONTEND_STRUCTURE.md       # This file
```

---

## 📦 Modules Chi Tiết

### 1. 🔐 Auth Module (`components/auth/`)

**Mục đích**: Xử lý authentication và authorization

**Components**:
- `Login.jsx` - Trang đăng nhập
- `Register.jsx` - Trang đăng ký
- `AccessDenied.jsx` - Trang lỗi 403 (không có quyền)

**Usage**:
```javascript
import { Login, Register, AccessDenied } from './components/auth';
```

---

### 2. 📚 Books Module (`components/books/`)

**Mục đích**: Quản lý sách (xem, thêm, sửa, xóa)

**Components**:
- `BookList.jsx` - Danh sách sách (có search & filter)
- `BookDetail.jsx` - Chi tiết sách
- `BookForm.jsx` - Form thêm/sửa sách (Admin only)

**Usage**:
```javascript
import { BookList, BookDetail, BookForm } from './components/books';
```

**Routes**:
- `/books` - Danh sách sách
- `/books/:id` - Chi tiết sách
- `/books/add` - Thêm sách mới (Admin)
- `/books/edit/:id` - Sửa sách (Admin)

---

### 3. 🛒 Cart Module (`components/cart/`)

**Mục đích**: Giỏ hàng và thanh toán

**Components**:
- `Cart.jsx` - Giỏ hàng (xem, cập nhật, xóa)
- `Checkout.jsx` - Trang thanh toán
- `PaymentResult.jsx` - Kết quả thanh toán

**Usage**:
```javascript
import { Cart, Checkout, PaymentResult } from './components/cart';
```

**Routes**:
- `/cart` - Giỏ hàng
- `/cart/checkout` - Thanh toán
- `/cart/payment-result` - Kết quả

**Features**:
- Thêm/xóa/cập nhật số lượng
- Thanh toán mặc định
- Thanh toán MoMo
- Sandbox mode

---

### 4. 📋 Orders Module (`components/orders/`)

**Mục đích**: Quản lý đơn hàng

**Components**:
- `OrderList.jsx` - Danh sách đơn hàng
- `OrderDetail.jsx` - Chi tiết đơn hàng

**Usage**:
```javascript
import { OrderList, OrderDetail } from './components/orders';
```

**Routes**:
- `/orders` - Lịch sử đơn hàng
- `/orders/:id` - Chi tiết đơn hàng

---

### 5. 👨‍💼 Admin Module (`components/admin/`)

**Mục đích**: Quản trị hệ thống (Admin only)

**Components**:
- `AdminDashboard.jsx` - Dashboard thống kê
- `AdminUsers.jsx` - Quản lý users

**Usage**:
```javascript
import { AdminDashboard, AdminUsers } from './components/admin';
```

**Routes**:
- `/admin` - Dashboard
- `/admin/users` - Quản lý users

**Permissions**: Chỉ ROLE_ADMIN

---

### 6. 🏷️ Categories Module (`components/categories/`)

**Mục đích**: Quản lý danh mục sách

**Components**:
- `CategoryList.jsx` - Danh sách danh mục
- `CategoryForm.jsx` - Form thêm/sửa danh mục

**Usage**:
```javascript
import { CategoryList, CategoryForm } from './components/categories';
```

**Routes**:
- `/categories` - Danh sách danh mục
- `/categories/add` - Thêm danh mục (Admin)
- `/categories/edit/:id` - Sửa danh mục (Admin)

---

### 7. 👤 User Module (`components/user/`)

**Mục đích**: Quản lý thông tin user

**Components**:
- `UserProfile.jsx` - Trang profile cá nhân

**Usage**:
```javascript
import { UserProfile } from './components/user';
```

**Routes**:
- `/profile` - Trang profile

---

### 8. 🔄 Shared Module (`components/shared/`)

**Mục đích**: Components dùng chung

**Components**:
- `Navbar.jsx` - Navigation bar (header)
- `Footer.jsx` - Footer

**Usage**:
```javascript
import { Navbar, Footer } from './components/shared';
```

**Used in**: Tất cả các pages

---

## 🎨 CSS Organization

Mỗi component có file CSS riêng:
```
ComponentName.jsx
ComponentName.css
```

**Global styles**:
- `App.css` - App-level styles
- `index.css` - Global CSS reset, variables

---

## 📝 Naming Conventions

### Files
- **Components**: PascalCase (e.g., `BookList.jsx`)
- **CSS**: PascalCase matching component (e.g., `BookList.css`)
- **Index files**: lowercase (e.g., `index.js`)

### Folders
- **Modules**: lowercase (e.g., `auth/`, `books/`)
- **Descriptive names**: Tên mô tả chức năng rõ ràng

### Components
- **Functional components**: PascalCase
- **Props**: camelCase
- **Event handlers**: `handle` prefix (e.g., `handleClick`)

---

## 🔄 Import/Export Pattern

### Export từ module (index.js):
```javascript
// components/books/index.js
export { default as BookList } from './BookList';
export { default as BookDetail } from './BookDetail';
export { default as BookForm } from './BookForm';
```

### Import trong App.jsx:
```javascript
// ✅ Good - Clean imports
import { BookList, BookDetail, BookForm } from './components/books';

// ❌ Bad - Verbose imports
import BookList from './components/books/BookList';
import BookDetail from './components/books/BookDetail';
import BookForm from './components/books/BookForm';
```

---

## 🚀 Thêm Component Mới

### Bước 1: Xác định module
Component thuộc module nào? (auth, books, cart, etc.)

### Bước 2: Tạo files
```bash
cd src/components/<module>/
touch NewComponent.jsx NewComponent.css
```

### Bước 3: Viết component
```javascript
// NewComponent.jsx
import React from 'react';
import './NewComponent.css';

const NewComponent = () => {
  return (
    <div className="new-component">
      {/* Your code */}
    </div>
  );
};

export default NewComponent;
```

### Bước 4: Export từ index.js
```javascript
// components/<module>/index.js
export { default as NewComponent } from './NewComponent';
```

### Bước 5: Import và sử dụng
```javascript
// App.jsx
import { NewComponent } from './components/<module>';
```

---

## 🔍 Tìm Component

### Theo chức năng:
- **Authentication?** → `components/auth/`
- **Sách?** → `components/books/`
- **Giỏ hàng?** → `components/cart/`
- **Đơn hàng?** → `components/orders/`
- **Admin?** → `components/admin/`
- **Danh mục?** → `components/categories/`
- **User profile?** → `components/user/`
- **Navbar/Footer?** → `components/shared/`

### Theo route:
- `/login` → `auth/Login.jsx`
- `/books` → `books/BookList.jsx`
- `/cart` → `cart/Cart.jsx`
- `/orders` → `orders/OrderList.jsx`
- `/admin` → `admin/AdminDashboard.jsx`

---

## 🛠️ Bảo Trì

### Khi refactor:
1. Tìm component trong module tương ứng
2. Sửa file component
3. Kiểm tra imports trong App.jsx
4. Test lại chức năng

### Khi thêm tính năng mới:
1. Xác định module (hoặc tạo module mới)
2. Tạo component mới
3. Export từ index.js
4. Import trong App.jsx
5. Thêm route (nếu cần)

### Khi xóa component:
1. Xóa file .jsx và .css
2. Xóa export từ index.js
3. Xóa import từ App.jsx
4. Xóa route (nếu có)

---

## 📊 So Sánh Trước/Sau

### ❌ Trước (Flat structure):
```
components/
├── Login.jsx
├── Login.css
├── Register.jsx
├── Register.css
├── BookList.jsx
├── BookList.css
├── Cart.jsx
├── Cart.css
├── ... (40+ files)
```

**Vấn đề**:
- Khó tìm kiếm
- Không rõ ràng
- Khó bảo trì
- Import dài dòng

### ✅ Sau (Module-based):
```
components/
├── auth/
│   ├── Login.jsx
│   ├── Register.jsx
│   └── index.js
├── books/
│   ├── BookList.jsx
│   ├── BookDetail.jsx
│   └── index.js
├── cart/
│   ├── Cart.jsx
│   ├── Checkout.jsx
│   └── index.js
└── ...
```

**Ưu điểm**:
- ✅ Dễ tìm kiếm
- ✅ Rõ ràng, có tổ chức
- ✅ Dễ bảo trì
- ✅ Import gọn gàng

---

## 🎯 Best Practices

### 1. One Component Per File
Mỗi file chỉ chứa 1 component chính

### 2. Co-locate Related Files
Component và CSS của nó nằm cùng folder

### 3. Use Index Files
Export tất cả components từ index.js

### 4. Descriptive Names
Tên file/folder mô tả rõ chức năng

### 5. Consistent Structure
Tất cả modules theo cùng 1 pattern

---

## 📚 Tài Liệu Liên Quan

- [README.md](../README.md) - Tài liệu chính
- [PAYMENT_TEST_GUIDE.md](../PAYMENT_TEST_GUIDE.md) - Test thanh toán
- [docs/README.md](../docs/README.md) - Tài liệu bổ sung

---

## ✅ Checklist Migration

- [x] Tạo folders theo modules
- [x] Di chuyển components vào folders tương ứng
- [x] Tạo index.js cho mỗi module
- [x] Cập nhật imports trong App.jsx
- [x] Xóa files template không cần thiết
- [x] Tạo tài liệu cấu trúc
- [ ] Test lại tất cả routes
- [ ] Test lại tất cả chức năng

---

**Last Updated**: May 22, 2026  
**Status**: ✅ Completed  
**Next**: Test lại ứng dụng để đảm bảo không có lỗi
