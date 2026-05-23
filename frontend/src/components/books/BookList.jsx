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
  const [cartItemCount, setCartItemCount] = useState(0);
  const [user, setUser] = useState(null);

  // Wishlist
  const [wishlist, setWishlist] = useState(new Set());
  const [wishlistLoading, setWishlistLoading] = useState(new Set());

  // Filters
  const [filters, setFilters] = useState({
    title: searchParams.get('title') || '',
    author: searchParams.get('author') || '',
    category: searchParams.get('category') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || ''
  });

  // Alert
  const [alert, setAlert] = useState({
    type: null,
    message: null
  });

  // ================= EFFECT =================

  useEffect(() => {
    fetchBooks();
    fetchCategories();
    fetchCartCount();

    fetchUserProfile().then((u) => {
      if (u) {
        fetchWishlist();
      }
    });
  }, [searchParams]);

  // ================= FETCH =================

  const fetchBooks = async () => {
    setIsLoading(true);

    try {
      const params = new URLSearchParams();

      Object.keys(filters).forEach((key) => {
        if (filters[key]) {
          params.append(key, filters[key]);
        }
      });

      const response = await axios.get(
        `http://localhost:8080/api/books?${params.toString()}`,
        {
          withCredentials: true
        }
      );

      setBooks(response.data || []);
    } catch (error) {
      console.error(error);

      setAlert({
        type: 'danger',
        message: 'Lỗi tải sách'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get(
        'http://localhost:8080/api/categories',
        {
          withCredentials: true
        }
      );

      setCategories(response.data || []);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchCartCount = async () => {
    try {
      const response = await axios.get(
        'http://localhost:8080/api/cart',
        {
          withCredentials: true
        }
      );

      setCartItemCount(response.data.itemCount || 0);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchUserProfile = async () => {
    try {
      const response = await axios.get(
        'http://localhost:8080/api/auth/profile',
        {
          withCredentials: true
        }
      );

      setUser(response.data);

      return response.data;
    } catch (error) {
      return null;
    }
  };

  const fetchWishlist = async () => {
    try {
      const response = await axios.get(
        'http://localhost:8080/api/wishlist',
        {
          withCredentials: true
        }
      );

      setWishlist(
        new Set(
          (response.data || []).map((item) => item.bookId)
        )
      );
    } catch (error) {
      console.error(error);
    }
  };

  // ================= WISHLIST =================

  const handleToggleWishlist = async (e, bookId) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      setAlert({
        type: 'warning',
        message: 'Vui lòng đăng nhập'
      });

      return;
    }

    if (wishlistLoading.has(bookId)) return;

    setWishlistLoading((prev) => new Set(prev).add(bookId));

    try {
      if (wishlist.has(bookId)) {
        await axios.delete(
          `http://localhost:8080/api/wishlist/${bookId}`,
          {
            withCredentials: true
          }
        );

        setWishlist((prev) => {
          const s = new Set(prev);
          s.delete(bookId);
          return s;
        });

        setAlert({
          type: 'success',
          message: 'Đã xóa khỏi yêu thích'
        });
      } else {
        await axios.post(
          `http://localhost:8080/api/wishlist/${bookId}`,
          {},
          {
            withCredentials: true
          }
        );

        setWishlist((prev) => new Set(prev).add(bookId));

        setAlert({
          type: 'success',
          message: 'Đã thêm vào yêu thích ❤️'
        });
      }
    } catch (error) {
      console.error(error);

      setAlert({
        type: 'danger',
        message: 'Lỗi wishlist'
      });
    } finally {
      setWishlistLoading((prev) => {
        const s = new Set(prev);
        s.delete(bookId);
        return s;
      });

      setTimeout(() => {
        setAlert({
          type: null,
          message: null
        });
      }, 2000);
    }
  };

  // ================= FILTER =================

  const handleFilterChange = (e) => {
    const { name, value } = e.target;

    setFilters((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSearch = (e) => {
    e.preventDefault();

    const params = new URLSearchParams();

    Object.keys(filters).forEach((key) => {
      if (filters[key]) {
        params.append(key, filters[key]);
      }
    });

    setSearchParams(params);
  };

  const handleReset = () => {
    const reset = {
      title: '',
      author: '',
      category: '',
      minPrice: '',
      maxPrice: ''
    };

    setFilters(reset);
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
        {
          bookId: String(bookId),
          quantity: 1
        },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          withCredentials: true
        }
      );

      setAlert({
        type: 'success',
        message: 'Đã thêm vào giỏ hàng'
      });

      fetchCartCount();
    } catch (error) {
      console.error(error);
    }
  };

  // ================= OTHER =================

  const isAdmin =
    user?.roles?.includes('ROLE_ADMIN') ||
    user?.isAdmin;

  const formatPrice = (price) => {
    return (
      new Intl.NumberFormat('vi-VN').format(price) + 'đ'
    );
  };

  // ================= UI =================

  return (
    <div className="book-list-page">

      {/* NAVBAR */}
      <nav className="navbar">
        <div className="container navbar-container">

          <Link
            to="/books"
            className="navbar-brand"
          >
            📚 Tiệm Sách
          </Link>

          <div className="navbar-nav">

            <Link to="/books">
              Sách
            </Link>

            {/* WISHLIST */}
            <Link
              to="/wishlist"
              className="wishlist-nav"
            >
              ❤️ Yêu thích

              {wishlist.size > 0 && (
                <span className="wishlist-badge">
                  {wishlist.size}
                </span>
              )}
            </Link>

            {/* CART */}
            <Link to="/cart">
              🛒 Giỏ hàng

              {cartItemCount > 0 && (
                <span className="cart-badge">
                  {cartItemCount}
                </span>
              )}
            </Link>

          </div>
        </div>
      </nav>

      {/* CONTENT */}
      <div className="container">

        {/* HEADER */}
        <div className="page-header">
          <h1>📚 Danh Sách Sách</h1>
          <p>
            Khám phá kho sách của chúng tôi
          </p>
        </div>

        {/* ALERT */}
        {alert.message && (
          <div className={`alert alert-${alert.type}`}>
            {alert.message}
          </div>
        )}

        {/* FILTER */}
        <div className="modern-filter-card">

          <h2 className="filter-title">
            🔎 Tìm Kiếm & Lọc Sách
          </h2>

          <form
            onSubmit={handleSearch}
            className="modern-filter-form"
          >

            {/* ROW 1 */}
            <div className="modern-filter-row">

              <div className="modern-form-group">
                <label>Tên Sách</label>

                <input
                  type="text"
                  name="title"
                  placeholder="Nhập tên sách..."
                  value={filters.title}
                  onChange={handleFilterChange}
                  className="modern-input"
                />
              </div>

              <div className="modern-form-group">
                <label>Tác Giả</label>

                <input
                  type="text"
                  name="author"
                  placeholder="Nhập tên tác giả..."
                  value={filters.author}
                  onChange={handleFilterChange}
                  className="modern-input"
                />
              </div>

            </div>

            {/* ROW 2 */}
            <div className="modern-filter-row row-3">

              <div className="modern-form-group">
                <label>Giá Từ (VNĐ)</label>

                <input
                  type="number"
                  name="minPrice"
                  placeholder="0"
                  value={filters.minPrice}
                  onChange={handleFilterChange}
                  className="modern-input"
                />
              </div>

              <div className="modern-form-group">
                <label>Giá Đến (VNĐ)</label>

                <input
                  type="number"
                  name="maxPrice"
                  placeholder="9999999"
                  value={filters.maxPrice}
                  onChange={handleFilterChange}
                  className="modern-input"
                />
              </div>

              <div className="modern-form-group">
                <label>Danh Mục</label>

                <select
                  name="category"
                  value={filters.category}
                  onChange={handleFilterChange}
                  className="modern-input"
                >
                  <option value="">
                    -- Tất cả danh mục --
                  </option>

                  {categories.map((cat) => (
                    <option
                      key={cat.id}
                      value={cat.name}
                    >
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

            </div>

            {/* BUTTON */}
            <div className="modern-filter-buttons">

              <button
                type="submit"
                className="modern-search-btn"
              >
                🔍 Tìm Kiếm
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="modern-reset-btn"
              >
                ↻ Đặt Lại
              </button>

            </div>

          </form>
        </div>

        {/* BOOKS */}
        {isLoading ? (
          <div className="loading-state">
            Đang tải...
          </div>
        ) : (
          <div className="grid grid-3">

            {books.map((book) => (

              <div
                key={book.id}
                className="book-card"
              >

                {/* IMAGE */}
                <div className="book-image-wrapper">

                  <img
                    src={book.imageUrl}
                    alt={book.title}
                    className="book-image"
                  />

                  {/* HEART */}
                  {!isAdmin && (
                    <button
                      className={`wishlist-btn ${
                        wishlist.has(book.id)
                          ? 'wishlisted'
                          : ''
                      }`}
                      onClick={(e) =>
                        handleToggleWishlist(
                          e,
                          book.id
                        )
                      }
                    >
                      {wishlist.has(book.id)
                        ? '❤️'
                        : '🤍'}
                    </button>
                  )}

                </div>

                {/* BODY */}
                <div className="book-body">

                  <h3 className="book-title">
                    {book.title}
                  </h3>

                  <p className="book-author">
                    {book.author}
                  </p>

                  <p className="book-price">
                    {formatPrice(book.price)}
                  </p>

                  <div className="book-actions">

                    <Link
                      to={`/books/${book.id}`}
                      className="btn btn-primary"
                    >
                      Chi tiết
                    </Link>

                    {!isAdmin && (
                      <button
                        onClick={() =>
                          handleAddToCart(book.id)
                        }
                        className="btn btn-success"
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