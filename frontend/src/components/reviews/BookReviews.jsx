import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './BookReviews.css';

const BookReviews = ({ bookId, user, isAdmin }) => {
  const [reviews, setReviews] = useState([]);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [canReview, setCanReview] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [editRating, setEditRating] = useState(5);
  const [editComment, setEditComment] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    console.log('BookReviews useEffect triggered, bookId:', bookId, 'type:', typeof bookId);
    
    // Only fetch if bookId is valid
    if (!bookId || bookId === 'undefined' || bookId === undefined) {
      console.log('Invalid bookId, skipping API calls');
      return;
    }
    
    fetchReviews();
    if (user) {
      checkReviewPermission();
    }
  }, [bookId, user]);

  const fetchReviews = async () => {
    try {
      const response = await axios.get(`http://localhost:8080/api/books/${bookId}/reviews`, {
        withCredentials: true
      });
      setReviews(response.data || []);
    } catch (err) {
      console.error('Error fetching reviews:', err);
    }
  };

  const checkReviewPermission = async () => {
    try {
      const response = await axios.get(`http://localhost:8080/api/books/${bookId}/reviews/check-purchase`, {
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
      setError('');
      await axios.post(
        'http://localhost:8080/api/reviews',
        {
          bookId: bookId,
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
      setError('');
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

  return (
    <div className="detail-reviews-section">
      <h2 className="detail-reviews-title">Đánh giá từ độc giả</h2>

      {successMessage && (
        <div className="alert alert-success" style={{ marginBottom: '1rem' }}>
          {successMessage}
        </div>
      )}

      {error && (
        <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>
          {error}
        </div>
      )}
      
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

      {/* Purchase Notice */}
      {!isAdmin && user && !canReview && (
        <div style={{ marginTop: '2rem', padding: '1.5rem', background: '#f8fafc', borderRadius: '12px', border: '1.5px solid #edf2f9', display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#475569' }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4169e1" strokeWidth="2.5" style={{ flexShrink: 0 }}>
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" x2="12" y1="16" y2="12"/>
            <line x1="12" x2="12.01" y1="8" y2="8"/>
          </svg>
          <span style={{ fontSize: '0.95rem', fontWeight: 500, lineHeight: 1.5 }}>
            Bạn chỉ có thể gửi đánh giá sau khi đã mua sản phẩm này và đơn hàng được chuyển sang trạng thái.
          </span>
        </div>
      )}
    </div>
  );
};

export default BookReviews;
