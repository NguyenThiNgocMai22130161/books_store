# Báo Cáo File/Folder Có Thể Xóa

## 🗑️ CÓ THỂ XÓA AN TOÀN

### 1. **Thư mục `backup_20260521_000726/`** ⚠️ QUAN TRỌNG
**Kích thước**: ~5-10MB  
**Nội dung**: Backup các React components cũ  
**Lý do xóa**: Đã có code mới trong `frontend/src/components/`

```bash
rm -rf backup_20260521_000726/
```

### 2. **Thư mục `docs/components-backup/`**
**Kích thước**: ~2-5MB  
**Nội dung**: Backup components cũ (duplicate với backup_20260521_000726)  
**Lý do xóa**: Trùng lặp với backup khác

```bash
rm -rf docs/components-backup/
```

### 3. **Thư mục `bin/`**
**Kích thước**: ~10-20MB  
**Nội dung**: Compiled classes của Eclipse/NetBeans  
**Lý do xóa**: Maven dùng `target/`, không cần `bin/`

```bash
rm -rf bin/
```

### 4. **Thư mục `target/`** (Tùy chọn)
**Kích thước**: ~50-100MB  
**Nội dung**: Compiled classes, JAR files  
**Lý do xóa**: Tự động tạo lại khi build  
**Lưu ý**: Sẽ tạo lại khi chạy `mvn clean install`

```bash
rm -rf target/
```

### 5. **Thư mục `src/main/resources/templates/`** ⚠️ QUAN TRỌNG
**Kích thước**: ~500KB  
**Nội dung**: Thymeleaf templates (HTML cũ)  
**Lý do xóa**: Đã chuyển sang React, không dùng Thymeleaf nữa

**Files**:
- `templates/book/*.html` (list.html, form.html, view.html)
- `templates/cart/*.html` (list.html, checkout.html, payment-result.html, momo-payment.html)
- `templates/order/*.html` (list.html, detail.html)
- `templates/category/*.html` (list.html, form.html)
- `templates/admin/*.html` (dashboard.html, users.html)
- `templates/user/*.html` (profile.html)
- `templates/fragments/*.html` (header.html, footer.html)
- `templates/login.html`
- `templates/register.html`
- `templates/access-denied.html`

```bash
rm -rf src/main/resources/templates/
```

### 6. **File `src/main/java/.../controller/BookController.java`** (Nếu không dùng)
**Kích thước**: ~5KB  
**Lý do xóa**: Nếu chỉ dùng `BookApiController` (REST API)

**Kiểm tra trước khi xóa**:
```bash
grep -r "BookController" src/main/java/
```

Nếu không có reference nào → Có thể xóa

### 7. **File `src/main/java/.../controller/CategoryController.java`** (Đã comment hết)
**Kích thước**: ~5KB  
**Lý do xóa**: Toàn bộ code đã bị comment, dùng `CategoryApiController` thay thế

```bash
rm src/main/java/myproject/study/books_store/controller/CategoryController.java
```

### 8. **File `src/main/java/.../controller/AdminController.java`** (Nếu không dùng)
**Kích thước**: ~3KB  
**Lý do xóa**: Nếu không có logic admin đặc biệt, chỉ dùng API controllers

**Kiểm tra trước khi xóa**:
```bash
grep -r "AdminController" src/main/java/
```

### 9. **Các file markdown dư thừa** (Root folder)
**Kích thước**: ~100KB  
**Files có thể xóa**:
- `BOOKLIST_REDESIGN.md` (Đã hoàn thành redesign)
- `DESIGN_PREVIEW.html` (Preview cũ)
- `PROJECT_READY.md` (Đã ready)
- `REDESIGN_SUMMARY.md` (Đã hoàn thành)
- `STRUCTURE_SUMMARY.md` (Có thể merge vào README)
- `SUMMARY.md` (Có thể merge vào README)
- `WHERE_ARE_MY_FILES.md` (Đã biết structure)

**Giữ lại**:
- `README.md` (Quan trọng)
- `HUONG_DAN_CHAY_DU_AN.md` (Hướng dẫn chạy)
- `QUICK_START.md` (Quick start guide)
- `ADMIN_BUTTON_UPDATE.md` (Tài liệu kỹ thuật)
- `DEBUG_ADD_TO_CART.md` (Debug guide)
- `FIX_*.md` (Tài liệu sửa lỗi)
- `WIDE_SCREEN_SUPPORT.md` (Tài liệu kỹ thuật)

```bash
rm BOOKLIST_REDESIGN.md DESIGN_PREVIEW.html PROJECT_READY.md REDESIGN_SUMMARY.md STRUCTURE_SUMMARY.md SUMMARY.md WHERE_ARE_MY_FILES.md
```

### 10. **File `.DS_Store`** (macOS)
**Kích thước**: ~6KB  
**Lý do xóa**: File hệ thống macOS, không cần trong git

```bash
find . -name ".DS_Store" -delete
```

### 11. **File `sample-books.json`** (Tùy chọn)
**Kích thước**: ~10KB  
**Lý do xóa**: Nếu đã import vào database, không cần nữa

```bash
rm sample-books.json
```

### 12. **Thư mục `.github/java-upgrade/`** (Tùy chọn)
**Kích thước**: ~50KB  
**Nội dung**: Scripts upgrade Java  
**Lý do xóa**: Nếu không dùng GitHub Actions

```bash
rm -rf .github/
```

### 13. **File `application.properties.example`**
**Kích thước**: ~2KB  
**Lý do xóa**: Nếu đã có `application.properties` thực tế

**Lưu ý**: Nên giữ lại làm template cho người khác

### 14. **Scripts không dùng**
- `cleanup-project.sh` (Nếu đã cleanup xong)
- `start-dev.sh` (Nếu không dùng)

```bash
rm cleanup-project.sh start-dev.sh
```

## ⚠️ KHÔNG NÊN XÓA

### 1. **Thư mục `frontend/`**
**Lý do**: React app chính

### 2. **Thư mục `src/main/java/`**
**Lý do**: Backend code chính

### 3. **Thư mục `src/main/resources/`** (Trừ templates)
**Lý do**: 
- `application.properties` - Config
- `static/` - Static files (nếu có)

### 4. **File `pom.xml`**
**Lý do**: Maven config

### 5. **File `.gitignore`**
**Lý do**: Git config

### 6. **Thư mục `.git/`**
**Lý do**: Git repository

### 7. **Thư mục `.vscode/`**
**Lý do**: VS Code settings (nếu dùng VS Code)

### 8. **Thư mục `docs/api/` và `docs/guides/`**
**Lý do**: Tài liệu API và hướng dẫn

## 📊 Tổng Kết

### Có thể tiết kiệm được
- **backup_20260521_000726/**: ~5-10MB
- **docs/components-backup/**: ~2-5MB
- **bin/**: ~10-20MB
- **target/**: ~50-100MB (tạo lại được)
- **templates/**: ~500KB
- **Markdown files**: ~100KB
- **Tổng**: ~70-140MB

### Script Cleanup Tổng Hợp

```bash
#!/bin/bash
# cleanup-unused-files.sh

echo "🗑️  Cleaning up unused files..."

# 1. Backup folders
echo "Removing backup folders..."
rm -rf backup_20260521_000726/
rm -rf docs/components-backup/

# 2. Build artifacts
echo "Removing build artifacts..."
rm -rf bin/
rm -rf target/

# 3. Thymeleaf templates (không dùng nữa)
echo "Removing Thymeleaf templates..."
rm -rf src/main/resources/templates/

# 4. Unused controllers
echo "Removing unused controllers..."
rm -f src/main/java/myproject/study/books_store/controller/CategoryController.java

# 5. Markdown files dư thừa
echo "Removing redundant markdown files..."
rm -f BOOKLIST_REDESIGN.md
rm -f DESIGN_PREVIEW.html
rm -f PROJECT_READY.md
rm -f REDESIGN_SUMMARY.md
rm -f STRUCTURE_SUMMARY.md
rm -f SUMMARY.md
rm -f WHERE_ARE_MY_FILES.md

# 6. macOS files
echo "Removing .DS_Store files..."
find . -name ".DS_Store" -delete

# 7. Sample data (nếu đã import)
# rm -f sample-books.json

# 8. Scripts không dùng
# rm -f cleanup-project.sh
# rm -f start-dev.sh

echo "✅ Cleanup completed!"
echo "📊 Freed up approximately 70-140MB"
```

## 🚀 Cách Sử Dụng

### Cách 1: Xóa từng thư mục/file
```bash
# Xóa backup
rm -rf backup_20260521_000726/

# Xóa templates
rm -rf src/main/resources/templates/

# Xóa bin
rm -rf bin/
```

### Cách 2: Dùng script tổng hợp
```bash
# Tạo script
cat > cleanup-unused-files.sh << 'EOF'
[paste script ở trên]
EOF

# Cho phép execute
chmod +x cleanup-unused-files.sh

# Chạy
./cleanup-unused-files.sh
```

### Cách 3: Xóa thủ công qua File Explorer
1. Mở Finder
2. Vào thư mục project
3. Xóa các folder/file theo danh sách

## ⚠️ Lưu Ý Quan Trọng

### Trước khi xóa:
1. **Commit code hiện tại** vào git
   ```bash
   git add .
   git commit -m "Before cleanup"
   ```

2. **Tạo backup toàn bộ project**
   ```bash
   cd ..
   cp -r books_store_test2 books_store_test2_backup
   ```

3. **Test lại app** sau khi xóa
   ```bash
   # Backend
   mvn clean install
   mvn spring-boot:run
   
   # Frontend
   cd frontend
   npm run dev
   ```

### Sau khi xóa:
1. **Kiểm tra app vẫn chạy được**
2. **Commit changes**
   ```bash
   git add .
   git commit -m "Cleanup unused files"
   ```

3. **Update .gitignore** để không commit lại
   ```
   # .gitignore
   target/
   bin/
   .DS_Store
   ```

## 🎯 Khuyến Nghị

### Xóa ngay (An toàn 100%)
- ✅ `backup_20260521_000726/`
- ✅ `docs/components-backup/`
- ✅ `bin/`
- ✅ `.DS_Store` files
- ✅ Markdown files dư thừa

### Xóa sau khi kiểm tra
- ⚠️ `src/main/resources/templates/` (Kiểm tra không còn dùng Thymeleaf)
- ⚠️ `CategoryController.java` (Đã comment hết)
- ⚠️ `target/` (Sẽ tạo lại khi build)

### Cân nhắc giữ lại
- 🤔 `sample-books.json` (Có thể cần import lại)
- 🤔 `application.properties.example` (Template cho người khác)
- 🤔 `docs/` (Tài liệu)

## 📝 Kết Luận

Sau khi cleanup, project sẽ:
- ✅ Nhẹ hơn ~70-140MB
- ✅ Cấu trúc rõ ràng hơn
- ✅ Dễ maintain hơn
- ✅ Không còn code/file dư thừa

**Tổng thời gian**: ~5-10 phút
