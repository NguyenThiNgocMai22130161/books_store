import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import './BookList.css';

const BookList = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // State management
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  
  // Filter state
  const [filters, setFilters] = useState({
    title: searchParams.get('title') || '',
    author: searchParams.get('author') || '',
    category: searchParams.get('category') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || ''
  });
  
  // Alert state
  const [alert, setAlert] = useState({
    type: null,
    message: null
  });

  // Fetch data on component mount
  useEffect(() => {
    // Sync filters state với searchParams
    setFilters({
      title: searchParams.get('title') || '',
      author: searchParams.get('author') || '',
      category: searchParams.get('category') || '',
      minPrice: searchParams.get('minPrice') || '',
      maxPrice: searchParams.get('maxPrice') || ''
    });
    
    fetchBooks();
    fetchCategories();
    fetchUserProfile();
  }, [searchParams]);

  // Fetch books with filters
  const fetchBooks = async () => {
    setIsLoading(true);
    try {
      // Đọc filters từ searchParams hoặc state filters
      const params = new URLSearchParams();
      
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

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const response = await axios.get(
        'http://localhost:8080/api/categories',
        { withCredentials: true }
      );
      setCategories(response.data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };


  // Fetch user profile
  const fetchUserProfile = async () => {
    try {
      const response = await axios.get(
        'http://localhost:8080/api/auth/profile',
        { withCredentials: true }
      );
      setUser(response.data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  // Handle filter change
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle search submit
  const handleSearch = (e) => {
    e.preventDefault();
    
    // Update URL params
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key]) {
        params.append(key, filters[key]);
      }
    });
    
    setSearchParams(params);
    fetchBooks();
  };

  // Handle reset filters
  const handleReset = () => {
    setFilters({
      title: '',
      author: '',
      category: '',
      minPrice: '',
      maxPrice: ''
    });
    setSearchParams({});
    fetchBooks();
  };

  // Handle add to cart
  const handleAddToCart = async (bookId) => {
    // Kiểm tra đăng nhập trước
    if (!user) {
      // Lưu URL hiện tại để redirect về sau khi đăng nhập
      const currentUrl = window.location.pathname + window.location.search;
      sessionStorage.setItem('redirectAfterLogin', currentUrl);
      
      setAlert({ 
        type: 'warning', 
        message: 'Vui lòng đăng nhập để thêm sách vào giỏ hàng!' 
      });
      
      // Redirect đến trang login sau 1.5 giây
      setTimeout(() => {
        window.location.href = '/login';
      }, 1500);
      return;
    }
    
    console.log('Adding to cart - bookId:', bookId, 'type:', typeof bookId);
    
    try {
      const response = await axios.post(
        'http://localhost:8080/api/cart/add',
        { bookId: String(bookId), quantity: 1 },
        {
          headers: { 'Content-Type': 'application/json' },
          withCredentials: true
        }
      );
      
      console.log('Add to cart response:', response.data);
      setAlert({ type: 'success', message: 'Đã thêm vào giỏ hàng!' });
      
      // Dispatch event to update navbar cart count immediately without reload
      window.dispatchEvent(new Event('cart-updated'));
      
      // Clear alert after 3 seconds
      setTimeout(() => setAlert({ type: null, message: null }), 3000);
    } catch (error) {
      console.error('Error adding to cart:', error);
      console.error('Error response:', error.response?.data);
      
      // Nếu lỗi 401 (Unauthorized), redirect đến login
      if (error.response?.status === 401) {
        const currentUrl = window.location.pathname + window.location.search;
        sessionStorage.setItem('redirectAfterLogin', currentUrl);
        
        setAlert({ 
          type: 'warning', 
          message: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!' 
        });
        
        setTimeout(() => {
          window.location.href = '/login';
        }, 1500);
      } else {
        setAlert({ 
          type: 'danger', 
          message: error.response?.data?.error || 'Lỗi khi thêm vào giỏ hàng!' 
        });
      }
    }
  };


  // Check if user is admin
  const isAdmin = user?.roles?.includes('ROLE_ADMIN') || user?.isAdmin;

  // Format price
  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN').format(price) + 'đ';
  };

  // Get active filters count
  const activeFiltersCount = Object.values(filters).filter(v => v).length;

  return (
    <div className="book-list-page">

      {/* Hero Banner */}
      <div className="hero-banner">
        <div className="container">
          <div className="hero-content">
            <div className="hero-text">
              <h1>📚 Khám Phá Thế Giới Sách</h1>
              <p>Bộ sưu tập sách hay nhất chỉ dành cho bạn</p>
            </div>
            <div className="hero-icon">📖</div>
          </div>
        </div>
      </div>

      <div className="container">
        {/* Page Header */}
        <div className="page-header" style={{ marginTop: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ color: '#000', marginBottom: '0.5rem' }}>📚 Danh Sách Sách</h1>
              <p className="text-muted" style={{ margin: 0 }}>Khám phá bộ sưu tập sách phong phú của chúng tôi</p>
            </div>
            {isAdmin && (
              <Link to="/books/add" className="btn btn-primary" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', whiteSpace: 'nowrap', maxWidth: '300px' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"/>
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Thêm Sách
              </Link>
            )}
          </div>
        </div>

        {/* Search & Filter Form */}
        <div className="filter-card">
          <h3>
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
            </svg>
            Tìm Kiếm & Lọc Sách
            {activeFiltersCount > 0 && (
              <span style={{ marginLeft: '0.5rem', fontSize: '0.9rem', color: '#4169e1', fontWeight: 600 }}>
                ({activeFiltersCount} bộ lọc đang kích hoạt)
              </span>
            )}
          </h3>
          
          <form onSubmit={handleSearch} className="filter-form">
            <div className="filter-grid-layout">
              <div className="form-group">
                <label htmlFor="title">Tên Sách</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  placeholder="Nhập tên sách..."
                  value={filters.title}
                  onChange={handleFilterChange}
                  className="form-control"
                />
              </div>
              <div className="form-group">
                <label htmlFor="author">Tác Giả</label>
                <input
                  type="text"
                  id="author"
                  name="author"
                  placeholder="Nhập tên tác giả..."
                  value={filters.author}
                  onChange={handleFilterChange}
                  className="form-control"
                />
              </div>
              <div className="form-group">
                <label htmlFor="category">Danh Mục</label>
                <select
                  id="category"
                  name="category"
                  value={filters.category}
                  onChange={handleFilterChange}
                  className="form-control"
                >
                  <option value="">-- Tất cả danh mục --</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="minPrice">Giá Từ (VNĐ)</label>
                <input
                  type="number"
                  id="minPrice"
                  name="minPrice"
                  placeholder="0"
                  min="0"
                  step="1000"
                  value={filters.minPrice}
                  onChange={handleFilterChange}
                  className="form-control"
                />
              </div>
              <div className="form-group">
                <label htmlFor="maxPrice">Giá Đến (VNĐ)</label>
                <input
                  type="number"
                  id="maxPrice"
                  name="maxPrice"
                  placeholder="9999999"
                  min="0"
                  step="1000"
                  value={filters.maxPrice}
                  onChange={handleFilterChange}
                  className="form-control"
                />
              </div>
              
              <div className="filter-action-group">
                <button type="button" onClick={handleReset} className="btn-filter-reset">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
                    <path d="M21 3v5h-5"/>
                    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
                    <path d="M3 21v-5h5"/>
                  </svg>
                  Đặt Lại
                </button>
                <button type="submit" className="btn-filter-search">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"/>
                    <path d="m21 21-4.35-4.35"/>
                  </svg>
                  Tìm Kiếm
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Alerts */}
        {alert.message && (
          <div className={`alert alert-${alert.type}`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {alert.type === 'success' ? (
                <>
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </>
              ) : (
                <>
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="15" x2="9" y1="9" y2="15"/>
                  <line x1="9" x2="15" y1="9" y2="15"/>
                </>
              )}
            </svg>
            <span>{alert.message}</span>
          </div>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Đang tải sách...</p>
          </div>
        ) : books.length > 0 ? (
          <div className="grid grid-3">
            <div style={{ gridColumn: '1 / -1', marginBottom: 0 }}>
              <p className="search-summary">
                <strong>{books.length}</strong> sách được tìm thấy
                {activeFiltersCount > 0 && (
                  <span> theo tiêu chí: 
                    {filters.title && <span className="highlight"> 📖 {filters.title}</span>}
                    {filters.author && <span className="highlight"> ✍️ {filters.author}</span>}
                    {filters.category && <span className="highlight"> 📂 {filters.category}</span>}
                    {filters.minPrice && <span className="highlight"> 💰 từ {formatPrice(filters.minPrice)}</span>}
                    {filters.maxPrice && <span className="highlight"> đến {formatPrice(filters.maxPrice)}</span>}
                  </span>
                )}
              </p>
            </div>

            {books.map((book, index) => (
              <div 
                key={book.id} 
                className="book-card fade-in" 
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="book-image-wrapper">
                  {book.imageUrl ? (
                    <img src={book.imageUrl} alt={book.title} className="book-image" />
                  ) : (
                    <div className="book-placeholder">
                      <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                      </svg>
                    </div>
                  )}
                </div>

                <div className="book-body">
                  <h3 className="book-title">{book.title}</h3>
                  <p className="book-author">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                    <strong>{book.author}</strong>
                  </p>
                  <p className="book-price">{formatPrice(book.price)}</p>

                  {book.description && (
                    <div className="book-description">{book.description}</div>
                  )}

                  <div className="book-actions">
                    <Link to={`/books/${book.id}`} className="btn btn-primary btn-sm">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                      </svg>
                      Xem chi tiết
                    </Link>
                    
                    {!isAdmin && (
                      <button 
                        onClick={() => handleAddToCart(book.id)} 
                        className="btn btn-success btn-sm"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="9" cy="21" r="1"/>
                          <circle cx="20" cy="21" r="1"/>
                          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                        </svg>
                        Thêm vào giỏ
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
            <h3>Không tìm thấy sách</h3>
            <p>Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
            <button onClick={handleReset} className="btn btn-primary">
              Xem tất cả sách
            </button>
          </div>
        )}
      </div>

    </div>
  );
};

export default BookList;
