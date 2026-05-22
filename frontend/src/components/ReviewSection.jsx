import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ReviewSection.css';

const StarRating = ({ value, onChange, readonly = false }) => {
  const [hovered, setHovered] = useState(0);

  return (
    <div className="star-rating" aria-label={`Đánh giá ${value} sao`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className={`star-btn ${(hovered || value) >= star ? 'active' : ''} ${readonly ? 'readonly' : ''}`}
          onClick={() => !readonly && onChange && onChange(star)}
          onMouseEnter={() => !readonly && setHovered(star)}
          onMouseLeave={() => !readonly && setHovered(0)}
          disabled={readonly}
          aria-label={`${star} sao`}
        >
          ★
        </button>
      ))}
    </div>
  );
};

const ReviewSection = ({ bookId, user }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [userReview, setUserReview] = useState(null); // review hiện tại của user (nếu có)

  useEffect(() => {
    fetchReviews();
  }, [bookId]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`http://localhost:8080/api/reviews/book/${bookId}`, {
        withCredentials: true,
      });
      const data = res.data || [];
      setReviews(data);

      // Kiểm tra user đã đánh giá chưa
      if (user) {
        const mine = data.find((r) => r.username === user.username);
        if (mine) {
          setUserReview(mine);
          setRating(mine.rating);
          setComment(mine.comment || '');
        }
      }
    } catch (err) {
      console.error('Lỗi khi tải đánh giá:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim()) {
      setError('Vui lòng nhập nhận xét.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      if (userReview) {
        // Cập nhật review cũ
        await axios.put(
          `http://localhost:8080/api/reviews/${userReview.id}`,
          { rating, comment },
          { withCredentials: true }
        );
        setSuccess('Đã cập nhật đánh giá!');
      } else {
        // Tạo review mới
        await axios.post(
          `http://localhost:8080/api/reviews/book/${bookId}`,
          { rating, comment },
          { withCredentials: true }
        );
        setSuccess('Đã gửi đánh giá!');
      }

      setTimeout(() => setSuccess(''), 3000);
      await fetchReviews();
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể gửi đánh giá. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (reviewId) => {
    if (!window.confirm('Xóa đánh giá này?')) return;
    try {
      await axios.delete(`http://localhost:8080/api/reviews/${reviewId}`, {
        withCredentials: true,
      });
      setUserReview(null);
      setRating(5);
      setComment('');
      await fetchReviews();
    } catch (err) {
      setError('Không thể xóa đánh giá.');
    }
  };

  // Tính điểm trung bình
  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : null;

  // Đếm theo từng sao
  const starCounts = [5, 4, 3, 2, 1].map((s) => ({
    star: s,
    count: reviews.filter((r) => r.rating === s).length,
  }));

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <div className="review-section">
      <h2 className="review-section-title">
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
        Đánh giá &amp; Nhận xét
      </h2>

      {/* Tổng quan điểm */}
      {reviews.length > 0 && (
        <div className="review-summary">
          <div className="review-summary-score">
            <span className="big-score">{avgRating}</span>
            <StarRating value={Math.round(parseFloat(avgRating))} readonly />
            <span className="review-count">{reviews.length} đánh giá</span>
          </div>
          <div className="review-summary-bars">
            {starCounts.map(({ star, count }) => (
              <div key={star} className="bar-row">
                <span className="bar-label">{star} ★</span>
                <div className="bar-track">
                  <div
                    className="bar-fill"
                    style={{ width: reviews.length ? `${(count / reviews.length) * 100}%` : '0%' }}
                  />
                </div>
                <span className="bar-count">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Form gửi đánh giá */}
      {user ? (
        <div className="review-form-wrapper">
          <h3 className="review-form-title">
            {userReview ? '✏️ Chỉnh sửa đánh giá của bạn' : '✍️ Viết đánh giá'}
          </h3>

          {success && (
            <div className="review-alert review-alert-success">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              {success}
            </div>
          )}
          {error && (
            <div className="review-alert review-alert-error">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10"/><line x1="15" x2="9" y1="9" y2="15"/><line x1="9" x2="15" y1="9" y2="15"/>
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="review-form">
            <div className="form-group">
              <label className="form-label">Chọn số sao</label>
              <StarRating value={rating} onChange={setRating} />
              <span className="rating-hint">
                {['', 'Rất tệ 😞', 'Tệ 😕', 'Bình thường 😐', 'Tốt 😊', 'Xuất sắc 🤩'][rating]}
              </span>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="review-comment">Nhận xét của bạn</label>
              <textarea
                id="review-comment"
                className="review-textarea"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Chia sẻ cảm nhận của bạn về cuốn sách này..."
                rows={4}
                maxLength={1000}
              />
              <span className="char-count">{comment.length}/1000</span>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <span className="btn-spinner" />
                    Đang gửi...
                  </>
                ) : userReview ? (
                  'Cập nhật đánh giá'
                ) : (
                  'Gửi đánh giá'
                )}
              </button>
              {userReview && (
                <button
                  type="button"
                  className="btn-delete-review"
                  onClick={() => handleDelete(userReview.id)}
                >
                  Xóa đánh giá
                </button>
              )}
            </div>
          </form>
        </div>
      ) : (
        <div className="review-login-prompt">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
          <span>
            <a href="/login" className="review-login-link">Đăng nhập</a> để viết đánh giá
          </span>
        </div>
      )}

      {/* Danh sách đánh giá */}
      <div className="review-list">
        {loading ? (
          <div className="review-loading">
            <span className="review-spinner" />
            <span>Đang tải đánh giá...</span>
          </div>
        ) : reviews.length === 0 ? (
          <div className="review-empty">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
            <p>Chưa có đánh giá nào. Hãy là người đầu tiên!</p>
          </div>
        ) : (
          reviews.map((review) => (
            <div
              key={review.id}
              className={`review-item ${user && review.username === user.username ? 'review-item-mine' : ''}`}
            >
              <div className="review-item-header">
                <div className="reviewer-avatar">
                  {(review.fullName || review.username || '?')[0].toUpperCase()}
                </div>
                <div className="reviewer-info">
                  <span className="reviewer-name">
                    {review.fullName || review.username}
                    {user && review.username === user.username && (
                      <span className="badge-you">Bạn</span>
                    )}
                  </span>
                  <span className="review-date">{formatDate(review.createdAt)}</span>
                </div>
                <StarRating value={review.rating} readonly />
              </div>
              {review.comment && (
                <p className="review-comment">{review.comment}</p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ReviewSection;