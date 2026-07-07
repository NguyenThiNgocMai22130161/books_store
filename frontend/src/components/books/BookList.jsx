import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import ChatbotWidget from '../chatbot/ChatbotWidget';
import SmartSearchBar from '../search/SmartSearchBar';
import './BookList.css';

const BookList = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // State management
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [cartItemCount, setCartItemCount] = useState(0);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const booksPerPage = 12; // Số sách mỗi trang

  // Wishlist STATE
  const [wishlist, setWishlist] = useState(new Set());
  const [wishlistLoading, setWishlistLoading] = useState(new Set());

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

  // ================= EFFECTS =================

  // Sync filters with URL params
  useEffect(() => {
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

  // Khi user thay đổi (đã đăng nhập), tải wishlist và giỏ hàng
  useEffect(() => {
    if (user) {
      fetchWishlist();
      fetchCartCount();
    }
  }, [user]);

  // Gửi số lượng wishlist và giỏ hàng lên Navbar qua Custom Event
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('wishlistUpdated', { detail: { count: wishlist.size } }));
  }, [wishlist]);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('cartUpdated', { detail: { count: cartItemCount } }));
  }, [cartItemCount]);

  // ================= FETCH FUNCTIONS =================

  const fetchBooks = async () => {
    setIsLoading(true);
    try {
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

      const response = await axios.get(`https://books-store-backend-production.up.railway.app/api/books?${params.toString()}`, { withCredentials: true });
      setBooks(response.data || []);
    } catch (error) {
      console.error('Error fetching books:', error);
      setAlert({ type: 'danger', message: 'Lỗi khi tải danh sách sách!' });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get('https://books-store-backend-production.up.railway.app/api/categories', { withCredentials: true });
      setCategories(response.data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchUserProfile = async () => {
    try {
      const response = await axios.get('https://books-store-backend-production.up.railway.app/api/auth/profile', { withCredentials: true });
      setUser(response.data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const fetchWishlist = async () => {
    try {
      const response = await axios.get('https://books-store-backend-production.up.railway.app/api/wishlist', { withCredentials: true });
      setWishlist(new Set((response.data || []).map(item => item.bookId)));
    } catch (error) {
      console.error(error);
    }
  };

  const fetchCartCount = async () => {
    try {
      const response = await axios.get('https://books-store-backend-production.up.railway.app/api/cart', { withCredentials: true });
      setCartItemCount(response.data.itemCount || 0);
    } catch (error) {
      console.error(error);
    }
  };

  // ================= WISHLIST =================

  const handleToggleWishlist = async (e, bookId) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      setAlert({ type: 'warning', message: 'Vui lòng đăng nhập' });
      return;
    }
    if (wishlistLoading.has(bookId)) return;

    setWishlistLoading(prev => new Set(prev).add(bookId));

    try {
      if (wishlist.has(bookId)) {
        await axios.delete(`https://books-store-backend-production.up.railway.app/api/wishlist/${bookId}`, { withCredentials: true });
        setWishlist(prev => {
          const s = new Set(prev);
          s.delete(bookId);
          return s;
        });
        setAlert({ type: 'success', message: 'Đã xóa khỏi yêu thích' });
      } else {
        await axios.post(`https://books-store-backend-production.up.railway.app/api/wishlist/${bookId}`, {}, { withCredentials: true });
        setWishlist(prev => new Set(prev).add(bookId));
        setAlert({ type: 'success', message: 'Đã thêm vào yêu thích ❤️' });
      }
    } catch (error) {
      console.error(error);
      setAlert({ type: 'danger', message: 'Lỗi wishlist' });
    } finally {
      setWishlistLoading(prev => {
        const s = new Set(prev);
        s.delete(bookId);
        return s;
      });
      setTimeout(() => setAlert({ type: null, message: null }), 2000);
    }
  };

  // ================= FILTERS =================

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key]) params.append(key, filters[key]);
    });
    setSearchParams(params);
    setCurrentPage(1); // Reset về trang 1 khi search
    fetchBooks();
  };

  const handleReset = () => {
    setFilters({ title: '', author: '', category: '', minPrice: '', maxPrice: '' });
    setSearchParams({});
    setCurrentPage(1); // Reset về trang 1
    fetchBooks();
  };

  // ================= CART =================

  const handleAddToCart = async (bookId) => {
    if (!user) {
      const currentUrl = window.location.pathname + window.location.search;
      sessionStorage.setItem('redirectAfterLogin', currentUrl);
      setAlert({ type: 'warning', message: 'Vui lòng đăng nhập để thêm sách vào giỏ hàng!' });
      setTimeout(() => (window.location.href = '/login'), 1500);
      return;
    }

    try {
      await axios.post(
        'https://books-store-backend-production.up.railway.app/api/cart/add',
        { bookId: String(bookId), quantity: 1 },
        { headers: { 'Content-Type': 'application/json' }, withCredentials: true }
      );
      setAlert({ type: 'success', message: 'Đã thêm vào giỏ hàng!' });
      
      // Dispatch event để Navbar cập nhật cart count
      setTimeout(() => {
        window.dispatchEvent(new Event('cart-updated'));
      }, 100);
      
      setTimeout(() => setAlert({ type: null, message: null }), 3000);
    } catch (error) {
      console.error('Error adding to cart:', error);
      if (error.response?.status === 401) {
        const currentUrl = window.location.pathname + window.location.search;
        sessionStorage.setItem('redirectAfterLogin', currentUrl);
        setAlert({ type: 'warning', message: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!' });
        setTimeout(() => (window.location.href = '/login'), 1500);
      } else {
        setAlert({ type: 'danger', message: error.response?.data?.error || 'Lỗi khi thêm vào giỏ hàng!' });
      }
    }
  };

  // ================= UTILS =================

  const isAdmin = user?.roles?.includes('ROLE_ADMIN') || user?.isAdmin;
  const formatPrice = (price) => new Intl.NumberFormat('vi-VN').format(price) + 'đ';
  const activeFiltersCount = Object.values(filters).filter(v => v).length;

  // Pagination calculations
  const indexOfLastBook = currentPage * booksPerPage;
  const indexOfFirstBook = indexOfLastBook - booksPerPage;
  const currentBooks = books.slice(indexOfFirstBook, indexOfLastBook);
  const totalPages = Math.ceil(books.length / booksPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    // Scroll đến phần danh sách sách (sau filter card)
    const bookGrid = document.querySelector('.grid.grid-3');
    if (bookGrid) {
      const offset = 100; // Khoảng cách từ top
      const elementPosition = bookGrid.getBoundingClientRect().top + window.pageYOffset;
      window.scrollTo({ 
        top: elementPosition - offset, 
        behavior: 'smooth' 
      });
    }
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pageNumbers = [];
    const maxVisiblePages = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return (
      <div className="pagination">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="pagination-btn"
        >
          ‹ Trước
        </button>

        {startPage > 1 && (
          <>
            <button onClick={() => handlePageChange(1)} className="pagination-number">
              1
            </button>
            {startPage > 2 && <span className="pagination-dots">...</span>}
          </>
        )}

        {pageNumbers.map(number => (
          <button
            key={number}
            onClick={() => handlePageChange(number)}
            className={`pagination-number ${currentPage === number ? 'active' : ''}`}
          >
            {number}
          </button>
        ))}

        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <span className="pagination-dots">...</span>}
            <button onClick={() => handlePageChange(totalPages)} className="pagination-number">
              {totalPages}
            </button>
          </>
        )}

        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="pagination-btn"
        >
          Sau ›
        </button>
      </div>
    );
  };

  // ================= RENDER =================

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
        {/* AI Smart Search Bar */}
        <div style={{ margin: '2rem 0' }}>
          <SmartSearchBar />
        </div>

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
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
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
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
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
                <input type="text" id="title" name="title" placeholder="Nhập tên sách..." value={filters.title} onChange={handleFilterChange} className="form-control" />
              </div>
              <div className="form-group">
                <label htmlFor="author">Tác Giả</label>
                <input type="text" id="author" name="author" placeholder="Nhập tên tác giả..." value={filters.author} onChange={handleFilterChange} className="form-control" />
              </div>
              <div className="form-group">
                <label htmlFor="category">Danh Mục</label>
                <select id="category" name="category" value={filters.category} onChange={handleFilterChange} className="form-control">
                  <option value="">-- Tất cả danh mục --</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="minPrice">Giá Từ (VNĐ)</label>
                <input type="number" id="minPrice" name="minPrice" placeholder="0" min="0" step="1000" value={filters.minPrice} onChange={handleFilterChange} className="form-control" />
              </div>
              <div className="form-group">
                <label htmlFor="maxPrice">Giá Đến (VNĐ)</label>
                <input type="number" id="maxPrice" name="maxPrice" placeholder="9999999" min="0" step="1000" value={filters.maxPrice} onChange={handleFilterChange} className="form-control" />
              </div>

              <div className="filter-action-group">
                <button type="button" onClick={handleReset} className="btn-filter-reset">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                    <path d="M21 3v5h-5" />
                    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                    <path d="M3 21v-5h5" />
                  </svg>
                  Đặt Lại
                </button>
                <button type="submit" className="btn-filter-search">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.35-4.35" />
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
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </>
              ) : (
                <>
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" x2="9" y1="9" y2="15" />
                  <line x1="9" x2="15" y1="9" y2="15" />
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
          <>
            <div className="grid grid-3">
              <div style={{ gridColumn: '1 / -1', marginBottom: 0 }}>
                <p className="search-summary">
                  <strong>{books.length}</strong> sách được tìm thấy
                  {totalPages > 1 && (
                    <span> - Đang xem trang <strong>{currentPage}</strong> / <strong>{totalPages}</strong></span>
                  )}
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

              {currentBooks.map((book, index) => (
              <div key={book.id} className="book-card fade-in" style={{ animationDelay: `${index * 0.05}s` }}>
                <div className="book-image-wrapper">
                  {book.imageUrl ? (
                    <img src={book.imageUrl} alt={book.title} className="book-image" />
                  ) : (
                    <div className="book-placeholder">
                      <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                      </svg>
                    </div>
                  )}

                  {/* Nút tim */}
                  {!isAdmin && (
                    <button
                      className={`wishlist-btn ${wishlist.has(book.id) ? 'wishlisted' : ''}`}
                      onClick={(e) => handleToggleWishlist(e, book.id)}
                    >
                      {wishlist.has(book.id) ? '❤️' : '🤍'}
                    </button>
                  )}
                </div>

                <div className="book-body">
                  <h3 className="book-title">{book.title}</h3>
                  <p className="book-author">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    <strong>{book.author}</strong>
                  </p>
                  <p className="book-price">{formatPrice(book.price)}</p>

                  {book.description && <div className="book-description">{book.description}</div>}

                  <div className="book-actions">
                    <Link to={`/books/${book.id}`} className="btn btn-primary btn-sm">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                      </svg>
                      Xem chi tiết
                    </Link>

                    {!isAdmin && (
                      <button onClick={() => handleAddToCart(book.id)} className="btn btn-success btn-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="9" cy="21" r="1" />
                          <circle cx="20" cy="21" r="1" />
                          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                        </svg>
                        Thêm vào giỏ
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {renderPagination()}
        </>
        ) : (
          <div className="empty-state">
            <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <h3>Không tìm thấy sách</h3>
            <p>Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
            <button onClick={handleReset} className="btn btn-primary">
              Xem tất cả sách
            </button>
          </div>
        )}
      </div>

      {/* AI Chatbot Widget - General book search assistant */}
      <ChatbotWidget />
    </div>
  );
};

export default BookList;