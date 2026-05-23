import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import './BookList.css';

const BookList = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // ================= STATE =================
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);

  const [wishlist, setWishlist] = useState(new Set());
  const [wishlistLoading, setWishlistLoading] = useState(new Set());

  const [cartItemCount, setCartItemCount] = useState(0);

  const [filters, setFilters] = useState({
    title: searchParams.get('title') || '',
    author: searchParams.get('author') || '',
    category: searchParams.get('category') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || ''
  });

  const [alert, setAlert] = useState({
    type: null,
    message: null
  });

  // ================= EFFECT =================
  useEffect(() => {
    fetchBooks();
    fetchCategories();
    fetchUserProfile().then((u) => {
      if (u) {
        fetchWishlist();
        fetchCartCount();
      }
    });
  }, [searchParams]);

  // ================= FETCH =================
  const fetchBooks = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();

      Object.keys(filters).forEach((key) => {
        if (filters[key]) params.append(key, filters[key]);
      });

      const res = await axios.get(
        `http://localhost:8080/api/books?${params.toString()}`,
        { withCredentials: true }
      );

      setBooks(res.data || []);
    } catch (err) {
      setAlert({ type: 'danger', message: 'Lỗi tải sách' });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await axios.get('http://localhost:8080/api/categories', {
        withCredentials: true
      });
      setCategories(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUserProfile = async () => {
    try {
      const res = await axios.get('http://localhost:8080/api/auth/profile', {
        withCredentials: true
      });
      setUser(res.data);
      return res.data;
    } catch {
      return null;
    }
  };

  const fetchWishlist = async () => {
    try {
      const res = await axios.get('http://localhost:8080/api/wishlist', {
        withCredentials: true
      });

      setWishlist(new Set((res.data || []).map(i => i.bookId)));
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCartCount = async () => {
    try {
      const res = await axios.get('http://localhost:8080/api/cart', {
        withCredentials: true
      });

      setCartItemCount(res.data?.itemCount || 0);
    } catch (err) {
      console.error(err);
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
        await axios.delete(
          `http://localhost:8080/api/wishlist/${bookId}`,
          { withCredentials: true }
        );

        setWishlist(prev => {
          const s = new Set(prev);
          s.delete(bookId);
          return s;
        });

        setAlert({ type: 'success', message: 'Đã xóa khỏi yêu thích' });
      } else {
        await axios.post(
          `http://localhost:8080/api/wishlist/${bookId}`,
          {},
          { withCredentials: true }
        );

        setWishlist(prev => new Set(prev).add(bookId));
        setAlert({ type: 'success', message: 'Đã thêm vào yêu thích ❤️' });
      }
    } catch (err) {
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

  // ================= FILTER =================
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleSearch = (e) => {
    e.preventDefault();

    const params = new URLSearchParams();
    Object.keys(filters).forEach(k => {
      if (filters[k]) params.append(k, filters[k]);
    });

    setSearchParams(params);
  };

  const handleReset = () => {
    setFilters({
      title: '',
      author: '',
      category: '',
      minPrice: '',
      maxPrice: ''
    });

    setSearchParams({});
  };

  // ================= CART =================
  const handleAddToCart = async (bookId) => {
    if (!user) {
      window.location.href = '/login';
      return;
    }

    try {
      await axios.post(
        'http://localhost:8080/api/cart/add',
        { bookId: String(bookId), quantity: 1 },
        { withCredentials: true }
      );

      setAlert({ type: 'success', message: 'Đã thêm vào giỏ hàng!' });

      window.dispatchEvent(new Event('cart-updated'));
      fetchCartCount();

      setTimeout(() => setAlert({ type: null, message: null }), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  const formatPrice = (price) =>
    new Intl.NumberFormat('vi-VN').format(price) + 'đ';

  const isAdmin =
    user?.roles?.includes('ROLE_ADMIN') || user?.isAdmin;

  // ================= UI =================
  return (
    <div className="book-list-page">

      {/* NAVBAR */}
      <nav className="navbar">
        <div className="container navbar-container">
          <Link to="/books" className="navbar-brand">
            📚 Tiệm Sách
          </Link>

          <div className="navbar-nav">
            <Link to="/books">Sách</Link>

            <Link to="/wishlist">
              ❤️ Yêu thích
              {wishlist.size > 0 && (
                <span className="wishlist-badge">{wishlist.size}</span>
              )}
            </Link>

            <Link to="/cart">
              🛒 Giỏ hàng
              {cartItemCount > 0 && (
                <span className="cart-badge">{cartItemCount}</span>
              )}
            </Link>
          </div>
        </div>
      </nav>

      <div className="container">

        {/* HEADER */}
        <div className="page-header">
          <h1>📚 Danh Sách Sách</h1>
          <p>Khám phá kho sách của chúng tôi</p>
        </div>

        {/* ALERT */}
        {alert.message && (
          <div className={`alert alert-${alert.type}`}>
            {alert.message}
          </div>
        )}

        {/* FILTER */}
        <div className="filter-card">
          <h3>🔎 Tìm kiếm & lọc</h3>

          <form onSubmit={handleSearch}>
            <div className="filter-grid-layout">

              <input
                name="title"
                placeholder="Tên sách"
                value={filters.title}
                onChange={handleFilterChange}
                className="modern-input"
              />

              <input
                name="author"
                placeholder="Tác giả"
                value={filters.author}
                onChange={handleFilterChange}
                className="modern-input"
              />

              <select
                name="category"
                value={filters.category}
                onChange={handleFilterChange}
                className="modern-input"
              >
                <option value="">Tất cả danh mục</option>
                {categories.map(c => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>

              <input
                name="minPrice"
                placeholder="Giá từ"
                value={filters.minPrice}
                onChange={handleFilterChange}
                className="modern-input"
              />

              <input
                name="maxPrice"
                placeholder="Giá đến"
                value={filters.maxPrice}
                onChange={handleFilterChange}
                className="modern-input"
              />

              <div className="filter-action-group">
                <button type="button" onClick={handleReset} className="btn-filter-reset">
                  Đặt lại
                </button>
                <button type="submit" className="btn-filter-search">
                  Tìm kiếm
                </button>
              </div>

            </div>
          </form>
        </div>

        {/* BOOKS */}
        {isLoading ? (
          <div className="loading-state">Đang tải...</div>
        ) : (
          <div className="books-grid">
            {books.map(book => (
              <div key={book.id} className="book-card">

                <div className="book-image-wrapper">
                  {book.imageUrl ? (
                    <img src={book.imageUrl} className="book-image" />
                  ) : (
                    <div className="book-placeholder">📘</div>
                  )}

                  {!isAdmin && (
                    <button
                      className="wishlist-btn"
                      onClick={(e) => handleToggleWishlist(e, book.id)}
                    >
                      {wishlist.has(book.id) ? '❤️' : '🤍'}
                    </button>
                  )}
                </div>

                <div className="book-body">
                  <h3 className="book-title">{book.title}</h3>
                  <p className="book-author">{book.author}</p>
                  <p className="book-price">{formatPrice(book.price)}</p>

                  <div className="book-actions">
                    <Link to={`/books/${book.id}`} className="btn btn-primary">
                      Chi tiết
                    </Link>

                    {!isAdmin && (
                      <button
                        className="btn btn-success"
                        onClick={() => handleAddToCart(book.id)}
                      >
                        Thêm giỏ
                      </button>
                    )}
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};

export default BookList;