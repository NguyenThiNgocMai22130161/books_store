# 📘 Hướng Dẫn Sử Dụng Template Component

## 🎯 Mục Đích

Template này giúp bạn nhanh chóng tạo một React component với:
- ✅ useEffect để gọi API
- ✅ axios để fetch data
- ✅ useState để quản lý state (data, loading, error)
- ✅ Map dữ liệu vào giao diện
- ✅ 3 layout options: Table, Grid, List

---

## 🚀 Cách Sử Dụng

### Bước 1: Copy Template

```bash
cp TEMPLATE_COMPONENT.jsx YourComponent.jsx
cp TEMPLATE_COMPONENT.css YourComponent.css
```

### Bước 2: Thay Thế Placeholders

Tìm và thay thế các placeholder sau:

| Placeholder | Thay bằng | Ví dụ |
|-------------|-----------|-------|
| `[MODULE_NAME]` | Tên module của bạn | `books`, `categories`, `users` |
| `[API_ENDPOINT]` | API endpoint | `/api/books`, `/api/categories` |
| `TemplateComponent` | Tên component | `BookList`, `CategoryList` |
| `TEMPLATE_COMPONENT` | Tên file CSS | `BookList`, `CategoryList` |

---

## 📝 Ví Dụ Cụ Thể

### Ví Dụ 1: Books List Component

#### 1. Đổi tên file
```bash
mv TEMPLATE_COMPONENT.jsx BookList.jsx
mv TEMPLATE_COMPONENT.css BookList.css
```

#### 2. Thay thế trong BookList.jsx

**Trước:**
```javascript
import './TEMPLATE_COMPONENT.css';

const TemplateComponent = () => {
  const response = await axios.get('http://localhost:8080/api/[MODULE_NAME]', {
```

**Sau:**
```javascript
import './BookList.css';

const BookList = () => {
  const response = await axios.get('http://localhost:8080/api/books', {
```

#### 3. Customize data mapping

**Trước:**
```javascript
{data.map((item) => (
  <tr key={item.id}>
    <td>{item.id}</td>
    <td>{item.name}</td>
    <td>{item.description || 'N/A'}</td>
```

**Sau (cho Books):**
```javascript
{data.map((book) => (
  <tr key={book.id}>
    <td>{book.id}</td>
    <td>{book.title}</td>
    <td>{book.author}</td>
    <td>{book.price.toLocaleString('vi-VN')} đ</td>
```

---

### Ví Dụ 2: Categories List Component

#### 1. Đổi tên file
```bash
mv TEMPLATE_COMPONENT.jsx CategoryList.jsx
mv TEMPLATE_COMPONENT.css CategoryList.css
```

#### 2. Thay thế trong CategoryList.jsx

```javascript
import './CategoryList.css';

const CategoryList = () => {
  const [categories, setCategories] = useState([]);
  
  const fetchData = async () => {
    const response = await axios.get('http://localhost:8080/api/categories', {
      withCredentials: true
    });
    setCategories(response.data);
  };
  
  // Map data
  {categories.map((category) => (
    <div key={category.id} className="card">
      <h3>{category.name}</h3>
      <p>{category.description}</p>
    </div>
  ))}
```

---

## 🎨 Chọn Layout

Template cung cấp 3 layout options. Chọn 1 và xóa 2 cái còn lại:

### Option 1: Table Layout (Tốt cho Admin)
```javascript
<div className="table-container">
  <table className="table">
    <thead>
      <tr>
        <th>ID</th>
        <th>Name</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      {data.map((item) => (
        <tr key={item.id}>
          <td>{item.id}</td>
          <td>{item.name}</td>
          <td>
            <button>Edit</button>
            <button>Delete</button>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
```

**Khi nào dùng:**
- Admin dashboard
- Quản lý users
- Hiển thị nhiều columns
- Cần sort/filter

---

### Option 2: Grid Layout (Tốt cho Products)
```javascript
<div className="grid-container">
  {data.map((item) => (
    <div key={item.id} className="card">
      <div className="card-header">
        <h3>{item.name}</h3>
      </div>
      <div className="card-body">
        <p>{item.description}</p>
      </div>
      <div className="card-footer">
        <button>View</button>
        <button>Edit</button>
      </div>
    </div>
  ))}
</div>
```

**Khi nào dùng:**
- Product catalog
- Image galleries
- Card-based UI
- E-commerce

---

### Option 3: List Layout (Tốt cho Mobile)
```javascript
<div className="list-container">
  {data.map((item) => (
    <div key={item.id} className="list-item">
      <div className="list-item-content">
        <h4>{item.name}</h4>
        <p>{item.description}</p>
      </div>
      <div className="list-item-actions">
        <button>View</button>
        <button>Edit</button>
      </div>
    </div>
  ))}
</div>
```

**Khi nào dùng:**
- Mobile-first design
- Simple lists
- News feeds
- Activity logs

---

## 🔧 Customize State

### Thêm State Mới

```javascript
// Thêm state cho pagination
const [currentPage, setCurrentPage] = useState(1);
const [totalPages, setTotalPages] = useState(1);

// Thêm state cho search
const [searchTerm, setSearchTerm] = useState('');

// Thêm state cho filter
const [selectedCategory, setSelectedCategory] = useState('all');
```

### Thêm Query Parameters

```javascript
const fetchData = async () => {
  const response = await axios.get('http://localhost:8080/api/books', {
    params: {
      page: currentPage,
      search: searchTerm,
      category: selectedCategory
    },
    withCredentials: true
  });
  setData(response.data.items);
  setTotalPages(response.data.totalPages);
};
```

---

## 🎯 Customize Data Mapping

### Ví Dụ: Books với Image

```javascript
{books.map((book) => (
  <div key={book.id} className="card">
    <img src={book.imageUrl} alt={book.title} />
    <h3>{book.title}</h3>
    <p>Tác giả: {book.author}</p>
    <p className="price">{book.price.toLocaleString('vi-VN')} đ</p>
    <button onClick={() => addToCart(book.id)}>
      Thêm vào giỏ
    </button>
  </div>
))}
```

### Ví Dụ: Users với Roles

```javascript
{users.map((user) => (
  <tr key={user.id}>
    <td>{user.username}</td>
    <td>{user.email}</td>
    <td>
      {user.roles.map((role, idx) => (
        <span key={idx} className="role-badge">
          {role}
        </span>
      ))}
    </td>
    <td>
      <span className={`status ${user.active ? 'active' : 'inactive'}`}>
        {user.active ? 'Active' : 'Inactive'}
      </span>
    </td>
  </tr>
))}
```

---

## 🔄 Thêm Chức Năng

### 1. Search Function

```javascript
const [searchTerm, setSearchTerm] = useState('');

// Trong JSX
<input
  type="text"
  placeholder="Tìm kiếm..."
  value={searchTerm}
  onChange={(e) => setSearchTerm(e.target.value)}
/>

// Filter data
const filteredData = data.filter(item =>
  item.name.toLowerCase().includes(searchTerm.toLowerCase())
);

// Map filtered data
{filteredData.map((item) => (...))}
```

### 2. Sort Function

```javascript
const [sortBy, setSortBy] = useState('name');
const [sortOrder, setSortOrder] = useState('asc');

const sortedData = [...data].sort((a, b) => {
  if (sortOrder === 'asc') {
    return a[sortBy] > b[sortBy] ? 1 : -1;
  } else {
    return a[sortBy] < b[sortBy] ? 1 : -1;
  }
});
```

### 3. Pagination

```javascript
const [currentPage, setCurrentPage] = useState(1);
const itemsPerPage = 10;

const indexOfLastItem = currentPage * itemsPerPage;
const indexOfFirstItem = indexOfLastItem - itemsPerPage;
const currentItems = data.slice(indexOfFirstItem, indexOfLastItem);

// Pagination controls
<div className="pagination">
  <button onClick={() => setCurrentPage(prev => prev - 1)} disabled={currentPage === 1}>
    Previous
  </button>
  <span>Page {currentPage}</span>
  <button onClick={() => setCurrentPage(prev => prev + 1)}>
    Next
  </button>
</div>
```

---

## 🐛 Error Handling

### Các Loại Error

```javascript
try {
  const response = await axios.get(url);
  setData(response.data);
} catch (err) {
  if (err.response) {
    // Server trả về error (4xx, 5xx)
    if (err.response.status === 404) {
      setError('Không tìm thấy dữ liệu');
    } else if (err.response.status === 401) {
      setError('Bạn cần đăng nhập');
      navigate('/login');
    } else if (err.response.status === 403) {
      setError('Bạn không có quyền truy cập');
    } else {
      setError(err.response.data.message || 'Lỗi server');
    }
  } else if (err.request) {
    // Request được gửi nhưng không nhận response
    setError('Không thể kết nối đến server');
  } else {
    // Lỗi khác
    setError('Đã xảy ra lỗi: ' + err.message);
  }
}
```

---

## 📱 Responsive Design

Template đã responsive sẵn. Customize thêm nếu cần:

```css
/* Mobile */
@media (max-width: 480px) {
  .grid-container {
    grid-template-columns: 1fr;
  }
  
  .table {
    font-size: 0.85rem;
  }
}

/* Tablet */
@media (max-width: 768px) {
  .grid-container {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Desktop */
@media (min-width: 1200px) {
  .grid-container {
    grid-template-columns: repeat(4, 1fr);
  }
}
```

---

## ✅ Checklist

Sau khi customize, check lại:

- [ ] Đã đổi tên component
- [ ] Đã đổi API endpoint
- [ ] Đã customize data mapping
- [ ] Đã chọn layout phù hợp
- [ ] Đã test loading state
- [ ] Đã test error handling
- [ ] Đã test empty state
- [ ] Đã test responsive
- [ ] Đã xóa code không dùng
- [ ] Đã update import paths

---

## 🎓 Best Practices

1. **Always use withCredentials**
   ```javascript
   axios.get(url, { withCredentials: true })
   ```

2. **Handle all states**
   - Loading state
   - Error state
   - Empty state
   - Success state

3. **Clean up effects**
   ```javascript
   useEffect(() => {
     let isMounted = true;
     
     const fetchData = async () => {
       const data = await fetch();
       if (isMounted) {
         setData(data);
       }
     };
     
     fetchData();
     
     return () => {
       isMounted = false;
     };
   }, []);
   ```

4. **Use meaningful variable names**
   - `books` thay vì `data`
   - `isLoadingBooks` thay vì `loading`
   - `bookError` thay vì `error`

5. **Add loading indicators**
   - Spinner cho full page load
   - Skeleton cho individual items
   - Disable buttons khi loading

---

## 📚 Tài Liệu Tham Khảo

- [React Hooks](https://react.dev/reference/react)
- [Axios Documentation](https://axios-http.com/)
- [React Router](https://reactrouter.com/)

---

**Happy Coding!** 🚀
