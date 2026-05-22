# Sửa Lỗi: Tìm Kiếm & Lọc Sách Không Hoạt Động

## Vấn Đề
Form "Tìm Kiếm & Lọc Sách" không hoạt động - khi nhập filter và click "Tìm Kiếm", danh sách sách không thay đổi.

## Nguyên Nhân

### Vấn đề 1: State và URL không đồng bộ ❌
```javascript
// useEffect chỉ chạy khi searchParams thay đổi
useEffect(() => {
  fetchBooks();
}, [searchParams]);

// Nhưng fetchBooks() lại đọc từ state filters
const fetchBooks = async () => {
  const params = new URLSearchParams();
  if (filters.title) params.append('title', filters.title);  // ❌ Đọc từ state
  // ...
};
```

**Vấn đề**: 
- `searchParams` (URL) và `filters` (state) không sync
- Khi user nhập form, chỉ `filters` state thay đổi
- `fetchBooks()` đọc từ `filters` nhưng useEffect trigger bởi `searchParams`
- Kết quả: Filter không được apply

### Vấn đề 2: Không có console log để debug ❌
```javascript
const fetchBooks = async () => {
  // Không có log → Khó biết params có đúng không
  const response = await axios.get(`http://localhost:8080/api/books?${params.toString()}`);
};
```

## Giải Pháp

### 1. **Sync Filters State với SearchParams** ✅

**Thêm vào useEffect:**
```javascript
useEffect(() => {
  // Sync filters state với searchParams khi URL thay đổi
  setFilters({
    title: searchParams.get('title') || '',
    author: searchParams.get('author') || '',
    category: searchParams.get('category') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || ''
  });
  
  fetchBooks();
  fetchCategories();
  fetchCartCount();
  fetchUserProfile();
}, [searchParams]);
```

**Giải thích**: Khi URL thay đổi (sau khi click "Tìm Kiếm"), sync lại filters state để form hiển thị đúng giá trị

### 2. **Đọc Filters từ Cả SearchParams và State** ✅

**Cập nhật fetchBooks():**
```javascript
const fetchBooks = async () => {
  setIsLoading(true);
  try {
    const params = new URLSearchParams();
    
    // Ưu tiên searchParams (URL), fallback về state filters
    const titleParam = searchParams.get('title') || filters.title;
    const authorParam = searchParams.get('author') || filters.author;
    const categoryParam = searchParams.get('category') || filters.category;
    const minPriceParam = searchParams.get('minPrice') || filters.minPrice;
    const maxPriceParam = searchParams.get('maxPrice') || filters.maxPrice;
    
    if (titleParam) params.append('title', titleParam);
    if (authorParam) params.append('author', authorParam);
    if (categoryParam) params.append('category', categoryParam);
    if (minPriceParam) params.append('minPrice', minPriceParam);
    if (maxPriceParam) params.append('maxPrice', maxPriceParam);

    console.log('Fetching books with params:', params.toString());

    const response = await axios.get(
      `http://localhost:8080/api/books?${params.toString()}`,
      { withCredentials: true }
    );

    console.log('Books response:', response.data);
    setBooks(response.data || []);
  } catch (error) {
    console.error('Error fetching books:', error);
    setAlert({ type: 'danger', message: 'Lỗi khi tải danh sách sách!' });
  } finally {
    setIsLoading(false);
  }
};
```

**Giải thích**:
- Đọc từ `searchParams` (URL) trước
- Nếu không có trong URL, fallback về `filters` state
- Thêm console.log để debug

### 3. **Thêm Console Log** ✅
```javascript
console.log('Fetching books with params:', params.toString());
console.log('Books response:', response.data);
```

**Mục đích**: Debug dễ dàng hơn, xem params có đúng không

## Flow Hoạt Động

### Trước Khi Sửa ❌
```
1. User nhập form → filters state thay đổi
2. User click "Tìm Kiếm" → handleSearch() chạy
3. handleSearch() update searchParams (URL)
4. useEffect trigger vì searchParams thay đổi
5. fetchBooks() chạy NHƯNG đọc từ filters state (chưa sync)
6. API call với params cũ → Không filter
```

### Sau Khi Sửa ✅
```
1. User nhập form → filters state thay đổi
2. User click "Tìm Kiếm" → handleSearch() chạy
3. handleSearch() update searchParams (URL)
4. useEffect trigger vì searchParams thay đổi
5. useEffect sync filters state với searchParams
6. fetchBooks() chạy, đọc từ searchParams hoặc filters
7. API call với params đúng → Filter hoạt động ✅
```

## Backend API

### BookApiController.java
```java
@GetMapping
public ResponseEntity<List<Book>> getAllBooks(
    @RequestParam(required = false) String title,
    @RequestParam(required = false) String author,
    @RequestParam(required = false) String category,
    @RequestParam(required = false) Double minPrice,
    @RequestParam(required = false) Double maxPrice
) {
    if (title != null || author != null || category != null || minPrice != null || maxPrice != null) {
        return ResponseEntity.ok(bookService.searchBooks(title, author, category, minPrice, maxPrice));
    }
    return ResponseEntity.ok(bookService.getAllBooks());
}
```

**Đã có sẵn**: Backend đã hỗ trợ filter ✅

## Test Cases

### Test 1: Tìm theo tên sách
1. Nhập "Clean" vào field "Tên Sách"
2. Click "Tìm Kiếm"
3. **Expected**: Chỉ hiển thị sách có tên chứa "Clean"
4. **Check Console**: `Fetching books with params: title=Clean`

### Test 2: Lọc theo giá
1. Nhập "100000" vào "Giá Từ"
2. Nhập "500000" vào "Giá Đến"
3. Click "Tìm Kiếm"
4. **Expected**: Chỉ hiển thị sách có giá từ 100k-500k
5. **Check Console**: `Fetching books with params: minPrice=100000&maxPrice=500000`

### Test 3: Lọc theo danh mục
1. Chọn "Programming" trong dropdown "Danh Mục"
2. Click "Tìm Kiếm"
3. **Expected**: Chỉ hiển thị sách thuộc danh mục "Programming"
4. **Check Console**: `Fetching books with params: category=Programming`

### Test 4: Kết hợp nhiều filter
1. Nhập "Code" vào "Tên Sách"
2. Nhập "Martin" vào "Tác Giả"
3. Chọn "Programming" trong "Danh Mục"
4. Click "Tìm Kiếm"
5. **Expected**: Chỉ hiển thị sách thỏa mãn cả 3 điều kiện
6. **Check Console**: `Fetching books with params: title=Code&author=Martin&category=Programming`

### Test 5: Đặt lại filter
1. Nhập các filter
2. Click "Tìm Kiếm" → Danh sách filter
3. Click "Đặt Lại"
4. **Expected**: 
   - Form reset về trống
   - Hiển thị tất cả sách
   - URL không có query params
5. **Check Console**: `Fetching books with params: ` (empty)

## Debug Checklist

Nếu vẫn không hoạt động:

- [ ] **Console có log "Fetching books with params" không?**
  - Nếu không → useEffect không chạy
  - Nếu có → Xem params có đúng không

- [ ] **Params có đúng không?**
  - Mở Console → Xem log
  - Ví dụ: `title=Clean&author=Martin`

- [ ] **Network tab có request không?**
  - Mở DevTools → Network
  - Xem request `GET /api/books?title=Clean...`
  - Status code: 200 (thành công)

- [ ] **Response có data đúng không?**
  - Xem log `Books response: [...]`
  - Kiểm tra số lượng sách trả về

- [ ] **Backend có log không?**
  - Xem terminal Spring Boot
  - Kiểm tra BookService.searchBooks() có chạy không

## Files Đã Sửa

1. ✅ `/frontend/src/components/BookList.jsx`
   - Sync filters state với searchParams trong useEffect
   - Đọc filters từ cả searchParams và state trong fetchBooks()
   - Thêm console.log để debug

## Kết Luận

**Vấn đề chính**: State `filters` và URL `searchParams` không đồng bộ

**Giải pháp**:
1. Sync filters state với searchParams trong useEffect
2. Đọc filters từ cả searchParams và state
3. Thêm console.log để debug

Sau khi sửa, form tìm kiếm & lọc sẽ hoạt động đúng!
