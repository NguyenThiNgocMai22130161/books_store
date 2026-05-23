import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import './BookDetail.css';

const BookDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [user, setUser] = useState(null);

  // Review states
  const [reviews, setReviews] = useState([]);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [canReview, setCanReview] = useState(false);

  // Edit review states
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [editRating, setEditRating] = useState(5);
  const [editComment, setEditComment] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    fetchBookDetail();
    fetchAuthStatus();
    fetchReviews();
    checkReviewPermission();
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

  const fetchReviews = async () => {
    try {
      const response = await axios.get(`http://localhost:8080/api/books/${id}/reviews`, {
        withCredentials: true
      });
      setReviews(response.data || []);
    } catch (err) {
      console.error('Error fetching reviews:', err);
    }
  };

  const checkReviewPermission = async () => {
    try {
      const response = await axios.get(`http://localhost:8080/api/books/${id}/reviews/check-purchase`, {
        withCredentials: true
      });
      setCanReview(response.data.canReview || false);
    } catch (err) {
      console.error('Error checking review permission:', err);
      setCanReview(false);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!user) {
      setError('Vui lòng đăng nhập để gửi đánh giá!');
      return;
    }
    if (!reviewComment.trim()) {
      setError('Vui lòng nhập nội dung đánh giá!');
      return;
    }
    try {
      setSubmittingReview(true);
      await axios.post(
        'http://localhost:8080/api/reviews',
        {
          bookId: id,
          rating: reviewRating,
          comment: reviewComment
        },
        { withCredentials: true }
      );
      setReviewComment('');
      setReviewRating(5);
      setSuccessMessage('Đăng đánh giá thành công!');
      fetchReviews();
      checkReviewPermission();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Lỗi khi gửi đánh giá');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa đánh giá này?')) {
      return;
    }
    try {
      await axios.delete(`http://localhost:8080/api/admin/reviews/${reviewId}`, {
        withCredentials: true
      });
      setSuccessMessage('Đã xóa đánh giá thành công!');
      fetchReviews();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Lỗi khi xóa đánh giá');
    }
  };

  const handleStartEdit = (rev) => {
    setEditingReviewId(rev.id);
    setEditRating(rev.rating);
    setEditComment(rev.comment);
  };

  const handleCancelEdit = () => {
    setEditingReviewId(null);
    setEditRating(5);
    setEditComment('');
  };

  const handleUpdateReview = async (reviewId) => {
    if (!editComment.trim()) {
      setError('Vui lòng nhập nội dung đánh giá!');
      return;
    }
    try {
      setSavingEdit(true);
      await axios.put(
        `http://localhost:8080/api/reviews/${reviewId}`,
        { rating: editRating, comment: editComment },
        { withCredentials: true }
      );
      setSuccessMessage('Cập nhật đánh giá thành công!');
      setEditingReviewId(null);
      fetchReviews();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Lỗi khi cập nhật đánh giá');
    } finally {
      setSavingEdit(false);
    }
  };

  const fetchBookDetail = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:8080/api/books/${id}`, {
        withCredentials: true
      });
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
        `http://localhost:8080/api/cart/add/${id}`,
        { quantity },
        { withCredentials: true }
      );
      setSuccessMessage('Đã thêm vào giỏ hàng!');
      // Dispatch event to update navbar cart count immediately without reload
      window.dispatchEvent(new Event('cart-updated'));
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
        setError(err.response?.data?.message || 'Không thể thêm vào giỏ hàng');
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
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" x2="9" y1="9" y2="15"/>
            <line x1="9" x2="15" y1="9" y2="15"/>
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
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            <span>{successMessage}</span>
          </div>
        )}

        {error && (
          <div className="alert alert-danger" style={{ marginBottom: '2rem' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" x2="9" y1="9" y2="15"/>
              <line x1="9" x2="15" y1="9" y2="15"/>
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
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
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
                  <line x1="19" x2="5" y1="12" y2="12"/>
                  <polyline points="12 19 5 12 12 5"/>
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
                      <circle cx="9" cy="21" r="1"/>
                      <circle cx="20" cy="21" r="1"/>
                      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
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
                    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
                  </svg>
                  Sửa thông tin
                </Link>
                <button onClick={handleDelete} className="btn-admin-delete">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
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

        {/* Reviews Section */}
        <div className="detail-reviews-section">
          <h2 className="detail-reviews-title">Đánh giá từ độc giả</h2>
          
          {/* Review List */}
          <div className="reviews-list">
            {reviews.length === 0 ? (
              <div className="reviews-empty-state">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" style={{ marginBottom: '1rem' }}>
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
                <p style={{ fontWeight: 600, color: '#64748b' }}>Chưa có đánh giá nào cho cuốn sách này.</p>
                {!isAdmin && user && <p className="subtext" style={{ fontSize: '0.9rem', color: '#94a3b8', marginTop: '0.25rem' }}>Hãy là người đầu tiên chia sẻ cảm nhận của bạn về cuốn sách này!</p>}
              </div>
            ) : (
              reviews.map((rev) => (
                <div key={rev.id} className={`review-item ${editingReviewId === rev.id ? 'review-item--editing' : ''}`}>
                  <div className="review-user-avatar">
                    {(rev.fullName || rev.username || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div className="review-item-content">
                    <div className="review-item-header">
                      <span className="review-user-name">{rev.fullName || rev.username}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span className="review-date">
                          {new Date(rev.createdAt).toLocaleDateString('vi-VN')}
                        </span>
                        {rev.updatedAt && rev.updatedAt !== rev.createdAt && (
                          <span className="review-edited-badge">đã chỉnh sửa</span>
                        )}
                      </div>
                    </div>

                    {editingReviewId === rev.id ? (
                      /* ── Inline Edit Mode ── */
                      <div className="review-edit-form">
                        <div className="review-edit-stars">
                          <span className="rating-label">Đánh giá lại:</span>
                          <div className="interactive-stars">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <span
                                key={i}
                                onClick={() => setEditRating(i + 1)}
                                className={`interactive-star ${i < editRating ? 'active' : ''}`}
                              >
                                ★
                              </span>
                            ))}
                          </div>
                          <span className="rating-desc">
                            {editRating === 5 ? 'Tuyệt vời' : editRating === 4 ? 'Hài lòng' : editRating === 3 ? 'Bình thường' : editRating === 2 ? 'Tạm được' : 'Kém'}
                          </span>
                        </div>
                        <textarea
                          rows="3"
                          value={editComment}
                          onChange={(e) => setEditComment(e.target.value)}
                          className="form-control review-edit-textarea"
                          placeholder="Chỉnh sửa nội dung đánh giá của bạn..."
                          disabled={savingEdit}
                        />
                        <div className="review-edit-actions">
                          <button
                            onClick={() => handleUpdateReview(rev.id)}
                            className="btn-save-edit"
                            disabled={savingEdit}
                          >
                            {savingEdit ? (
                              <><span className="spinner-xs"/>Đang lưu...</>
                            ) : (
                              <><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6 9 17l-5-5"/></svg>Lưu thay đổi</>
                            )}
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="btn-cancel-edit"
                            disabled={savingEdit}
                          >
                            Hủy
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* ── Display Mode ── */
                      <>
                        <div className="review-stars">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <span key={i} className={`star ${i < rev.rating ? 'filled' : 'empty'}`}>
                              ★
                            </span>
                          ))}
                          {rev.isVerifiedPurchase && (
                            <span className="verified-badge">
                              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ marginRight: '0.15rem' }}>
                                <polyline points="20 6 9 17 4 12"/>
                              </svg>
                              Đã mua hàng
                            </span>
                          )}
                        </div>
                        <p className="review-text">{rev.comment}</p>
                      </>
                    )}
                  </div>

                  <div className="review-action-btns">
                    {/* Edit button – chỉ hiện với chủ nhân đánh giá, không trong chế độ chỉnh sửa */}
                    {!isAdmin && user && rev.userId === user.userId && editingReviewId !== rev.id && (
                      <button
                        onClick={() => handleStartEdit(rev)}
                        className="btn-edit-review"
                        title="Chỉnh sửa đánh giá"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: '0.2rem' }}>
                          <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
                        </svg>
                        Sửa
                      </button>
                    )}
                    {/* Delete button – admin only */}
                    {isAdmin && (
                      <button 
                        onClick={() => handleDeleteReview(rev.id)} 
                        className="btn-delete-review"
                        title="Xóa đánh giá ác ý"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: '0.25rem' }}>
                          <polyline points="3 6 5 6 21 6"/>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        </svg>
                        Xóa
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Leave a Review Form */}
          {!isAdmin && user && canReview && (
            <div className="leave-review-box">
              <h3>Chia sẻ cảm nhận của bạn</h3>
              <form onSubmit={handleSubmitReview} className="review-form">
                <div className="rating-select-group">
                  <span className="rating-label">Chất lượng tác phẩm:</span>
                  <div className="interactive-stars">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span 
                        key={i} 
                        onClick={() => setReviewRating(i + 1)}
                        className={`interactive-star ${i < reviewRating ? 'active' : ''}`}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                  <span className="rating-desc">
                    {reviewRating === 5 ? 'Tuyệt vời' : 
                     reviewRating === 4 ? 'Hài lòng' : 
                     reviewRating === 3 ? 'Bình thường' : 
                     reviewRating === 2 ? 'Tạm được' : 'Kém'}
                  </span>
                </div>

                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                  <label htmlFor="reviewComment" className="form-label" style={{ fontWeight: 600, color: '#475569', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Nhận xét chi tiết</label>
                  <textarea
                    id="reviewComment"
                    rows="3"
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Hãy viết nhận xét của bạn về nội dung, hình ảnh hay chất lượng in ấn của cuốn sách..."
                    className="form-control"
                    disabled={submittingReview}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button 
                    type="submit" 
                    className="btn-submit-review"
                    disabled={submittingReview}
                  >
                    {submittingReview ? 'Đang gửi...' : 'Gửi đánh giá'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Purchase Notice for logged in users who cannot review */}
          {!isAdmin && user && !canReview && (
            <div style={{ marginTop: '2rem', padding: '1.5rem', background: '#f8fafc', borderRadius: '12px', border: '1.5px solid #edf2f9', display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#475569' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4169e1" strokeWidth="2.5" style={{ flexShrink: 0 }}>
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" x2="12" y1="16" y2="12"/>
                <line x1="12" x2="12.01" y1="8" y2="8"/>
              </svg>
              <span style={{ fontSize: '0.95rem', fontWeight: 500, lineHeight: 1.5 }}>
                Bạn chỉ có thể gửi đánh giá sau khi đã mua sản phẩm này và đơn hàng được chuyển sang trạng thái **Đã nhận (COMPLETED)**.
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookDetail;
