import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import './BookList.css';

const BookList = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // ── State ──────────────────────────────────────────────────────────────
  const [books, setBooks]               = useState([]);
  const [categories, setCategories]     = useState([]);
  const [isLoading, setIsLoading]       = useState(true);
  const [cartItemCount, setCartItemCount] = useState(0);
  const [user, setUser]                 = useState(null);
  const [wishlist, setWishlist]         = useState(new Set());   // Set<bookId>
  const [wishlistLoading, setWishlistLoading] = useState(new Set()); // đang xử lý id nào

  const [filters, setFilters] = useState({
    title:    searchParams.get('title')    || '',
    author:   searchParams.get('author')   || '',
    category: searchParams.get('category') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
  });

  const [alert, setAlert] = useState({ type: null, message: null });

  // ── Helpers ────────────────────────────────────────────────────────────
  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert({ type: null, message: null }), 3000);
  };

  const formatPrice = (price) =>
    new Intl.NumberFormat('vi-VN').format(price) + 'đ';

  const activeFiltersCount = Object.values(filters).filter(Boolean).length;

  // ── Fetch helpers ──────────────────────────────────────────────────────
  const fetchBooks = useCallback(async (overrideParams) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      const src = overrideParams || filters;
      if (src.title)    params.append('title',    src.title);
      if (src.author)   params.append('author',   src.author);
      if (src.category) params.append('category', src.category);
      if (src.minPrice) params.append('minPrice', src.minPrice);
      if (src.maxPrice) params.append('maxPrice', src.maxPrice);

      const response = await axios.get(
        `http://localhost:8080/api/books?${params.toString()}`,
        { withCredentials: true }
      );
      setBooks(response.data || []);
    } catch {
      showAlert('danger', 'Lỗi khi tải danh sách sách!');
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  const fetchCategories = async () => {
    try {
      const res = await axios.get('http://localhost:8080/api/categories', { withCredentials: true });
      setCategories(res.data || []);
    } catch {}
  };

  const fetchCartCount = async () => {
    try {
      const res = await axios.get('http://localhost:8080/api/cart', { withCredentials: true });
      setCartItemCount(res.data.itemCount || 0);
    } catch {}
  };

  const fetchUserProfile = async () => {
    try {
      const res = await axios.get('http://localhost:8080/api/auth/profile', { withCredentials: true });
      setUser(res.data);
      return res.data;
    } catch {
      return null;
    }
  };

  const fetchWishlist = async () => {
    try {
      const res = await axios.get('http://localhost:8080/api/wishlist', { withCredentials: true });
      const ids = new Set((res.data || []).map((item) => item.bookId));
      setWishlist(ids);
    } catch {}
  };

  // ── Mount ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const newFilters = {
      title:    searchParams.get('title')    || '',
      author:   searchParams.get('author')   || '',
      category: searchParams.get('category') || '',
      minPrice: searchParams.get('minPrice') || '',
      maxPrice: searchParams.get('maxPrice') || '',
    };
    setFilters(newFilters);

    fetchBooks(newFilters);
    fetchCategories();
    fetchCartCount();
    fetchUserProfile().then((u) => {
      if (u) fetchWishlist();
    });
  }, [searchParams]);

  // ── Handlers ───────────────────────────────────────────────────────────
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v) params.append(k, v); });
    setSearchParams(params);
  };

  const handleReset = () => {
    const empty = { title: '', author: '', category: '', minPrice: '', maxPrice: '' };
    setFilters(empty);
    setSearchParams({});
  };

  const handleAddToCart = async (bookId) => {
    try {
      await axios.post(
        'http://localhost:8080/api/cart/add',
        { bookId: String(bookId), quantity: 1 },
        { headers: { 'Content-Type': 'application/json' }, withCredentials: true }
      );
      showAlert('success', 'Đã thêm vào giỏ hàng!');
      fetchCartCount();
    } catch (err) {
      showAlert('danger', err.response?.data?.error || 'Lỗi khi thêm vào giỏ hàng!');
    }
  };

  const handleToggleWishlist = async (e, bookId) => {
    e.preventDefault(); // tránh navigate khi click trên card
    e.stopPropagation();

    if (!user) {
      showAlert('danger', 'Vui lòng đăng nhập để lưu yêu thích!');
      return;
    }

    // Ngăn double-click
    if (wishlistLoading.has(bookId)) return;
    setWishlistLoading((prev) => new Set(prev).add(bookId));

    try {
      if (wishlist.has(bookId)) {
        await axios.delete(`http://localhost:8080/api/wishlist/${bookId}`, { withCredentials: true });
        setWishlist((prev) => {
          const s = new Set(prev); s.delete(bookId); return s;
        });
        showAlert('success', 'Đã xóa khỏi danh sách yêu thích');
      } else {
        await axios.post(`http://localhost:8080/api/wishlist/${bookId}`, {}, { withCredentials: true });
        setWishlist((prev) => new Set(prev).add(bookId));
        showAlert('success', 'Đã thêm vào danh sách yêu thích ❤️');
      }
    } catch {
      showAlert('danger', 'Không thể cập nhật danh sách yêu thích');
    } finally {
      setWishlistLoading((prev) => { const s = new Set(prev); s.delete(bookId); return s; });
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post('http://localhost:8080/api/auth/logout', {}, { withCredentials: true });
      window.location.href = '/login?logout=true';
    } catch {}
  };

  const isAdmin = user?.roles?.includes('ROLE_ADMIN') || user?.isAdmin;

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="book-list-page">

      {/* ── Navbar ── */}
      <nav className="navbar">
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 0 }}>
          <Link to="/" className="navbar-brand">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
            </svg>
            Tiệm Sách
          </Link>

          <div className="navbar-nav">
            <Link to="/books" className="active">Sách</Link>
            <Link to="/cart" style={{ position: 'relative' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
              </svg>
              Giỏ hàng
              {cartItemCount > 0 && <span className="cart-badge">{cartItemCount}</span>}
            </Link>

            <div className="dropdown">
              <a href="#" onClick={(e) => e.preventDefault()}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                {user ? (user.fullName || user.username) : 'Tài khoản'}
              </a>
              <ul className="dropdown-menu">
                {user ? (
                  <>
                    <li><Link to="/profile">Hồ sơ cá nhân</Link></li>
                    <li><Link to="/orders">Lịch sử mua hàng</Link></li>
                    {isAdmin && (
                      <>
                        <li><Link to="/admin">Dashboard Admin</Link></li>
                        <li><Link to="/admin/users">Quản lý người dùng</Link></li>
                      </>
                    )}
                    <li>
                      <a href="#" onClick={(e) => { e.preventDefault(); handleLogout(); }}>
                        Đăng xuất
                      </a>
                    </li>
                  </>
                ) : (
                  <>
                    <li><Link to="/login">Đăng nhập</Link></li>
                    <li><Link to="/register">Đăng ký</Link></li>
                  </>
                )}
              </ul>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Hero Banner ── */}
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

        {/* ── Page Header ── */}
        <div className="page-header" style={{ marginTop: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ color: '#000', marginBottom: '0.5rem' }}>📚 Danh Sách Sách</h1>
              <p className="text-muted" style={{ margin: 0 }}>Khám phá bộ sưu tập sách phong phú của chúng tôi</p>
            </div>
            {isAdmin && (
              <Link to="/books/add" className="btn btn-primary" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', whiteSpace: 'nowrap' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Thêm Sách
              </Link>
            )}
          </div>
        </div>

        {/* ── Filter ── */}
        <div className="filter-card">
          <h3>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
            </svg>
            Tìm Kiếm &amp; Lọc Sách
            {activeFiltersCount > 0 && (
              <span style={{ marginLeft: '0.5rem', fontSize: '0.9rem', color: '#EE4D2D' }}>
                ({activeFiltersCount} bộ lọc)
              </span>
            )}
          </h3>

          <form onSubmit={handleSearch} className="filter-form">
            <div className="filter-row">
              <div className="form-group">
                <label htmlFor="title">Tên Sách</label>
                <input type="text" id="title" name="title" placeholder="Nhập tên sách..."
                  value={filters.title} onChange={handleFilterChange} className="form-control" />
              </div>
              <div className="form-group">
                <label htmlFor="author">Tác Giả</label>
                <input type="text" id="author" name="author" placeholder="Nhập tên tác giả..."
                  value={filters.author} onChange={handleFilterChange} className="form-control" />
              </div>
            </div>

            <div className="filter-row">
              <div className="form-group">
                <label htmlFor="minPrice">Giá Từ (VNĐ)</label>
                <input type="number" id="minPrice" name="minPrice" placeholder="0" min="0" step="1000"
                  value={filters.minPrice} onChange={handleFilterChange} className="price-input" />
              </div>
              <div className="form-group">
                <label htmlFor="maxPrice">Giá Đến (VNĐ)</label>
                <input type="number" id="maxPrice" name="maxPrice" placeholder="9999999" min="0" step="1000"
                  value={filters.maxPrice} onChange={handleFilterChange} className="price-input" />
              </div>
              <div className="form-group">
                <label htmlFor="category">Danh Mục</label>
                <select id="category" name="category" value={filters.category}
                  onChange={handleFilterChange} className="form-control">
                  <option value="">-- Tất cả danh mục --</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="filter-buttons">
              <button type="submit" className="btn-with-icon btn-primary">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
                Tìm Kiếm
              </button>
              <button type="button" onClick={handleReset} className="btn-with-icon btn-secondary">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
                  <path d="M21 3v5h-5"/>
                  <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
                  <path d="M3 21v-5h5"/>
                </svg>
                Đặt Lại
              </button>
            </div>
          </form>
        </div>

        {/* ── Alert ── */}
        {alert.message && (
          <div className={`alert alert-${alert.type}`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {alert.type === 'success' ? (
                <><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></>
              ) : (
                <><circle cx="12" cy="12" r="10"/><line x1="15" x2="9" y1="9" y2="15"/><line x1="9" x2="15" y1="9" y2="15"/></>
              )}
            </svg>
            <span>{alert.message}</span>
          </div>
        )}

        {/* ── Loading ── */}
        {isLoading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Đang tải sách...</p>
          </div>

        ) : books.length > 0 ? (
          <div className="grid grid-3">

            {/* Search summary */}
            <div style={{ gridColumn: '1 / -1', marginBottom: 0 }}>
              <p className="search-summary">
                <strong>{books.length}</strong> sách được tìm thấy
                {activeFiltersCount > 0 && (
                  <span> theo tiêu chí:
                    {filters.title    && <span className="highlight">📖 {filters.title}</span>}
                    {filters.author   && <span className="highlight">✍️ {filters.author}</span>}
                    {filters.category && <span className="highlight">📂 {filters.category}</span>}
                    {filters.minPrice && <span className="highlight">💰 từ {formatPrice(filters.minPrice)}</span>}
                    {filters.maxPrice && <span className="highlight">đến {formatPrice(filters.maxPrice)}</span>}
                  </span>
                )}
              </p>
            </div>

            {/* Book cards */}
            {books.map((book, index) => (
              <div
                key={book.id}
                className="book-card fade-in"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                {/* ── Ảnh bìa + nút yêu thích ── */}
                <div style={{ position: 'relative', overflow: 'hidden' }}>
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

                  {/* Nút ❤️ yêu thích — chỉ hiện khi không phải admin */}
                  {!isAdmin && (
                    <button
                      className={`wishlist-btn ${wishlist.has(book.id) ? 'wishlisted' : ''}`}
                      onClick={(e) => handleToggleWishlist(e, book.id)}
                      disabled={wishlistLoading.has(book.id)}
                      title={wishlist.has(book.id) ? 'Xóa khỏi yêu thích' : 'Thêm vào yêu thích'}
                      aria-label={wishlist.has(book.id) ? 'Xóa khỏi yêu thích' : 'Thêm vào yêu thích'}
                    >
                      {wishlistLoading.has(book.id) ? (
                        <span className="wishlist-spinner" />
                      ) : wishlist.has(book.id) ? (
                        '❤️'
                      ) : (
                        '🤍'
                      )}
                    </button>
                  )}
                </div>

                {/* ── Body ── */}
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
                          <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
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
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <h3>Không tìm thấy sách</h3>
            <p>Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
            <button onClick={handleReset} className="btn btn-primary">Xem tất cả sách</button>
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <footer>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <p style={{ margin: '0.5rem 0' }}><strong>© 2026 Tiệm Sách</strong></p>
          <p style={{ margin: 0, fontSize: '0.85rem' }}>Được xây dựng với Spring Boot &amp; React • Thương mại điện tử hiện đại</p>
        </div>
      </footer>
    </div>
  );
};

export default BookList;