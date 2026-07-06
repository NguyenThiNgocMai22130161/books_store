import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './AdminBooks.css';

const AdminBooks = () => {
  const navigate = useNavigate();
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState('title');
  const [sortOrder, setSortOrder] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [booksPerPage] = useState(10);

  useEffect(() => {
    fetchBooks();
    fetchCategories();
  }, []);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      const response = await axios.get('https://books-store-backend-production.up.railway.app/api/books', {
        withCredentials: true
      });
      setBooks(response.data);
    } catch (err) {
      console.error('Error fetching books:', err);
      setError('Không thể tải danh sách sách');
      if (err.response?.status === 401 || err.response?.status === 403) {
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get('https://books-store-backend-production.up.railway.app/api/categories', {
        withCredentials: true
      });
      setCategories(response.data);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const handleDeleteBook = async (bookId, bookTitle) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa sách "${bookTitle}"?`)) {
      try {
        await axios.delete(`https://books-store-backend-production.up.railway.app/api/books/${bookId}`, {
          withCredentials: true
        });
        setBooks(books.filter(book => book.id !== bookId));
        alert('Xóa sách thành công!');
      } catch (err) {
        console.error('Error deleting book:', err);
        alert('Lỗi khi xóa sách: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleCategoryFilter = (e) => {
    setSelectedCategory(e.target.value);
    setCurrentPage(1);
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };

  // Filter and sort books
  const filteredBooks = books.filter(book => {
    const matchesSearch = book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         book.author.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === '' || book.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const sortedBooks = [...filteredBooks].sort((a, b) => {
    let aValue = a[sortBy];
    let bValue = b[sortBy];
    
    if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }
    
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  // Pagination
  const indexOfLastBook = currentPage * booksPerPage;
  const indexOfFirstBook = indexOfLastBook - booksPerPage;
  const currentBooks = sortedBooks.slice(indexOfFirstBook, indexOfLastBook);
  const totalPages = Math.ceil(sortedBooks.length / booksPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  if (loading) {
    return (
      <div className="container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Đang tải danh sách sách...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container fade-in">
      {/* Header */}
      <div className="page-header" style={{ marginTop: '3rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, minWidth: '250px' }}>
            <div style={{ padding: '10px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '10px' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
              </svg>
            </div>
            <div>
              <h1 style={{ margin: 0 }}>Quản Lý Kho Sách</h1>
              <p className="text-muted">Tổng cộng {books.length} đầu sách trong hệ thống</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Link to="/admin/dashboard" className="btn btn-secondary">← Dashboard</Link>
            <Link to="/books/add" className="btn btn-success">+ Thêm Sách Mới</Link>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="filters-section">
        <div className="search-filters">
          <div className="search-box">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              type="text"
              placeholder="Tìm kiếm theo tên sách hoặc tác giả..."
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>
          
          <select value={selectedCategory} onChange={handleCategoryFilter} className="category-filter">
            <option value="">Tất cả danh mục</option>
            {categories.map(category => (
              <option key={category.id} value={category.name}>{category.name}</option>
            ))}
          </select>
        </div>

        <div className="results-info">
          <span>Hiển thị {currentBooks.length} / {sortedBooks.length} sách</span>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="alert alert-danger">
          <p>{error}</p>
          <button onClick={fetchBooks} className="btn btn-primary">Thử lại</button>
        </div>
      )}

      {/* Books Table */}
      <div className="books-table-container">
        <table className="books-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('title')} className="sortable">
                Tên Sách
                {sortBy === 'title' && (
                  <span className="sort-indicator">
                    {sortOrder === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </th>
              <th onClick={() => handleSort('author')} className="sortable">
                Tác Giả
                {sortBy === 'author' && (
                  <span className="sort-indicator">
                    {sortOrder === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </th>
              <th onClick={() => handleSort('category')} className="sortable">
                Danh Mục
                {sortBy === 'category' && (
                  <span className="sort-indicator">
                    {sortOrder === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </th>
              <th onClick={() => handleSort('price')} className="sortable">
                Giá
                {sortBy === 'price' && (
                  <span className="sort-indicator">
                    {sortOrder === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </th>
              <th onClick={() => handleSort('quantity')} className="sortable">
                Số Lượng
                {sortBy === 'quantity' && (
                  <span className="sort-indicator">
                    {sortOrder === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </th>
              <th onClick={() => handleSort('year')} className="sortable">
                Năm XB
                {sortBy === 'year' && (
                  <span className="sort-indicator">
                    {sortOrder === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </th>
              <th>Trạng Thái</th>
              <th>Thao Tác</th>
            </tr>
          </thead>
          <tbody>
            {currentBooks.length === 0 ? (
              <tr>
                <td colSpan="8" className="no-data">
                  {searchTerm || selectedCategory ? 'Không tìm thấy sách nào phù hợp' : 'Chưa có sách nào trong hệ thống'}
                </td>
              </tr>
            ) : (
              currentBooks.map(book => (
                <tr key={book.id}>
                  <td className="book-title">
                    <div className="book-info">
                      {book.imageUrl && (
                        <img src={book.imageUrl} alt={book.title} className="book-thumbnail" />
                      )}
                      <div>
                        <strong>{book.title}</strong>
                        {book.description && (
                          <p className="book-description">{book.description.substring(0, 100)}...</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>{book.author}</td>
                  <td>
                    <span className="category-badge">{book.category || 'Chưa phân loại'}</span>
                  </td>
                  <td className="price">{book.price?.toLocaleString('vi-VN')} VNĐ</td>
                  <td className="quantity">
                    <span className={`quantity-badge ${book.quantity === 0 ? 'out-of-stock' : book.quantity < 10 ? 'low-stock' : 'in-stock'}`}>
                      {book.quantity || 0}
                    </span>
                  </td>
                  <td>{book.year || 'N/A'}</td>
                  <td>
                    <span className={`status-badge ${book.quantity > 0 ? 'available' : 'unavailable'}`}>
                      {book.quantity > 0 ? 'Còn hàng' : 'Hết hàng'}
                    </span>
                  </td>
                  <td className="actions">
                    <Link to={`/books/${book.id}`} className="btn-action btn-view" title="Xem chi tiết">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    </Link>
                    <Link to={`/books/edit/${book.id}`} className="btn-action btn-edit" title="Chỉnh sửa">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    </Link>
                    <button 
                      onClick={() => handleDeleteBook(book.id, book.title)}
                      className="btn-action btn-delete" 
                      title="Xóa"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        <line x1="10" y1="11" x2="10" y2="17"/>
                        <line x1="14" y1="11" x2="14" y2="17"/>
                      </svg>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button 
            onClick={() => paginate(currentPage - 1)} 
            disabled={currentPage === 1}
            className="pagination-btn"
          >
            ← Trước
          </button>
          
          {[...Array(totalPages)].map((_, index) => (
            <button
              key={index + 1}
              onClick={() => paginate(index + 1)}
              className={`pagination-btn ${currentPage === index + 1 ? 'active' : ''}`}
            >
              {index + 1}
            </button>
          ))}
          
          <button 
            onClick={() => paginate(currentPage + 1)} 
            disabled={currentPage === totalPages}
            className="pagination-btn"
          >
            Sau →
          </button>
        </div>
      )}

      {/* Statistics */}
      <div className="books-stats">
        <div className="stat-card">
          <h4>Tổng số sách</h4>
          <span className="stat-number">{books.length}</span>
        </div>
        <div className="stat-card">
          <h4>Còn hàng</h4>
          <span className="stat-number in-stock">{books.filter(book => book.quantity > 0).length}</span>
        </div>
        <div className="stat-card">
          <h4>Hết hàng</h4>
          <span className="stat-number out-of-stock">{books.filter(book => book.quantity === 0).length}</span>
        </div>
        <div className="stat-card">
          <h4>Sắp hết</h4>
          <span className="stat-number low-stock">{books.filter(book => book.quantity > 0 && book.quantity < 10).length}</span>
        </div>
      </div>
    </div>
  );
};

export default AdminBooks;