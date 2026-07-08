import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import BookReviews from '../reviews/BookReviews';
import ChatbotWidget from '../chatbot/ChatbotWidget';
import SimilarBooks from '../ai/SimilarBooks';
import AskAIButton from '../ai/AskAIButton';
import './BookDetail.css';

const BookDetail = () => {
  const { id } = useParams();
  console.log('BookDetail rendered, id from useParams:', id, 'type:', typeof id);
  const navigate = useNavigate();
  const location = useLocation();

  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [user, setUser] = useState(null);

  // Reset state when navigating to a different book
  useEffect(() => {
    setBook(null);
    setLoading(true);
    setError('');
    setSuccessMessage('');
  }, [location.pathname]);

  useEffect(() => {
    if (id) {
      fetchBookDetail();
      fetchAuthStatus();
    }
  }, [id]);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('write-review') === 'true') {
      const timer = setTimeout(() => {
        const reviewSection = document.querySelector('.detail-reviews-section');
        if (reviewSection) {
          reviewSection.scrollIntoView({ behavior: 'smooth' });
        }
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [location.search, loading]);

  const fetchAuthStatus = async () => {
    try {
      const response = await axios.get('http://localhost:8080/api/auth/profile', {
        withCredentials: true
      });
      setUser(response.data);
    } catch (err) {
      console.log('Not authenticated');
      setUser(null);
    }
  };

  const fetchBookDetail = async () => {
    // Guard: don't fetch if id is invalid
    if (!id || id === 'undefined') {
      console.error('fetchBookDetail called with invalid id:', id);
      setError('ID sách không hợp lệ');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('Fetching book with id:', id);
      const response = await axios.get(`http://localhost:8080/api/books/${id}`, {
        withCredentials: true
      });
      console.log('=== BOOK DETAIL DEBUG ===');
      console.log('Book data:', response.data);
      console.log('Year field:', response.data.year);
      console.log('========================');
      setBook(response.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể tải thông tin sách');
      console.error('Error fetching book:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (e) => {
    e.preventDefault();

    if (!user) {
      // Lưu URL hiện tại để redirect về sau khi đăng nhập
      const currentUrl = window.location.pathname;
      sessionStorage.setItem('redirectAfterLogin', currentUrl);

      setError('Vui lòng đăng nhập để thêm sách vào giỏ hàng!');

      // Redirect đến trang login sau 1.5 giây
      setTimeout(() => {
        navigate('/login');
      }, 1500);
      return;
    }

    try {
      setAddingToCart(true);
      await axios.post(
        'http://localhost:8080/api/cart/add',
        { bookId: id, quantity },
        { withCredentials: true }
      );
      setSuccessMessage('Đã thêm vào giỏ hàng!');

      // Dispatch event to update navbar cart count immediately without reload
      // Thêm delay nhỏ để đảm bảo backend đã cập nhật xong
      setTimeout(() => {
        window.dispatchEvent(new Event('cart-updated'));
      }, 100);

      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      // Nếu lỗi 401 (Unauthorized), redirect đến login
      if (err.response?.status === 401) {
        const currentUrl = window.location.pathname;
        sessionStorage.setItem('redirectAfterLogin', currentUrl);

        setError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!');

        setTimeout(() => {
          navigate('/login');
        }, 1500);
      } else {
        setError(err.response?.data?.error || err.response?.data?.message || 'Không thể thêm vào giỏ hàng');
      }
    } finally {
      setAddingToCart(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa sách này?')) {
      return;
    }

    try {
      await axios.delete(`http://localhost:8080/api/books/${id}`, {
        withCredentials: true
      });
      navigate('/books');
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể xóa sách');
    }
  };

  const isAdmin = user?.roles?.includes('ROLE_ADMIN');

  if (loading) {
    return (
      <div className="container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Đang tải...</p>
        </div>
      </div>
    );
  }

  if (error && !book) {
    return (
      <div className="container">
        <div className="alert alert-danger">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" x2="9" y1="9" y2="15" />
            <line x1="9" x2="15" y1="9" y2="15" />
          </svg>
          <span>{error}</span>
        </div>
        <Link to="/books" className="btn btn-primary">Quay lại danh sách</Link>
      </div>
    );
  }

  if (!book) {
    return null;
  }

  return (
    <div className="book-detail-page">
      <div className="container">
        {successMessage && (
          <div className="alert alert-success" style={{ marginBottom: '2rem' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <span>{successMessage}</span>
          </div>
        )}

        {error && (
          <div className="alert alert-danger" style={{ marginBottom: '2rem' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" x2="9" y1="9" y2="15" />
              <line x1="9" x2="15" y1="9" y2="15" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <div className="detail-grid">
          {/* Left Column: Image wrapper */}
          <div className="book-cover-wrapper">
            {book.imageUrl ? (
              <img src={book.imageUrl} alt={book.title} className="detail-book-image" />
            ) : (
              <div className="detail-book-placeholder">
                <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                </svg>
              </div>
            )}
          </div>

          {/* Right Column: Details Card */}
          <div className="detail-card">
            <h1 className="detail-title">{book.title}</h1>

            <div className="detail-meta-group">
              <div className="detail-meta-item">
                <span className="detail-meta-label">Tác Giả</span>
                <span className="detail-meta-value">{book.author}</span>
              </div>
              {book.category && (
                <div className="detail-meta-item">
                  <span className="detail-meta-label">Thể Loại</span>
                  <span className="detail-meta-value">{book.category}</span>
                </div>
              )}
              {book.year && (
                <div className="detail-meta-item">
                  <span className="detail-meta-label">Năm Xuất Bản</span>
                  <span className="detail-meta-value">{book.year}</span>
                </div>
              )}
            </div>

            <div className="detail-price-section">
              <span className="detail-meta-label">Giá bán</span>
              <div className="detail-price-value">
                {book.price?.toLocaleString('vi-VN')} <span className="currency-symbol">đ</span>
              </div>
            </div>

            <div className="detail-stock-section">
              <span className="detail-meta-label">Số lượng còn</span>
              <span className="detail-stock-value">
                {book.quantity != null ? `${book.quantity} cuốn` : '0 cuốn'}
              </span>
            </div>

            <div className="detail-actions">
              <Link to="/books" className="btn-back">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: '0.25rem' }}>
                  <line x1="19" x2="5" y1="12" y2="12" />
                  <polyline points="12 19 5 12 12 5" />
                </svg>
                Quay lại
              </Link>

              {!isAdmin && user && (
                <form onSubmit={handleAddToCart} className="add-to-cart-form">
                  <div className="qty-picker">
                    <button
                      type="button"
                      onClick={() => setQuantity(q => Math.max(1, q - 1))}
                      className="qty-picker-btn"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      min="1"
                      className="qty-picker-input"
                    />
                    <button
                      type="button"
                      onClick={() => setQuantity(q => q + 1)}
                      className="qty-picker-btn"
                    >
                      +
                    </button>
                  </div>
                  <button type="submit" className="btn-add-cart" disabled={addingToCart}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <circle cx="9" cy="21" r="1" />
                      <circle cx="20" cy="21" r="1" />
                      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                    </svg>
                    {addingToCart ? 'Đang thêm...' : 'Thêm vào giỏ hàng'}
                  </button>
                </form>
              )}
            </div>

            {isAdmin && (
              <div className="admin-detail-actions">
                <Link to={`/books/edit/${book.id}`} className="btn-admin-edit">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                  </svg>
                  Sửa thông tin
                </Link>
                <button onClick={handleDelete} className="btn-admin-delete">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                  Xóa sách
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Full Width Description Section */}
        {book.description && (
          <div className="detail-description-full">
            <h2 className="detail-desc-title">Mô tả sách</h2>
            <div className="detail-desc-content">
              {book.description.split('\n').map((paragraph, index) => (
                <p key={index} className="detail-desc-paragraph">{paragraph}</p>
              ))}
            </div>
          </div>
        )}

        {/* AI Quick Questions Section */}
        <div className="ai-quick-questions-section">
          <h3 className="ai-questions-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '8px' }}>
              <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z" />
            </svg>
            Hỏi AI về sách này
          </h3>
          <AskAIButton
            question="Sách này phù hợp cho người mới bắt đầu không?"
            bookId={parseInt(id)}
            category={book?.category}
            style="primary"
            size="medium"
          />

          <AskAIButton
            question="Có sách nào tương tự với sách này không?"
            bookId={parseInt(id)}
            category={book?.category}
            style="secondary"
            size="medium"
          />

          <AskAIButton
            question="Tại sao nên đọc sách này?"
            bookId={parseInt(id)}
            category={book?.category}
            style="outline"
            size="medium"
          />
        </div>

        {/* Reviews Section */}
        {id && <BookReviews bookId={id} user={user} isAdmin={isAdmin} />}

        {/* AI Similar Books Section */}
        {id && <SimilarBooks bookId={parseInt(id)} currentTitle={book?.title} />}
      </div>

      {/* AI Chatbot Widget with book context */}
      {id && <ChatbotWidget bookId={parseInt(id)} category={book?.category} />}
    </div>
  );
};

export default BookDetail;
