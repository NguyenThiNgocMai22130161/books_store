/**
 * Similar Books Component
 * Shows AI-powered similar book recommendations
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import aiService from '../../services/aiService';
import './SimilarBooks.css';

const getSimilarityLevel = (score) => {
  if (score >= 0.85) return { label: '⭐ Rất phù hợp', cls: 'sim-high' };
  if (score >= 0.50) return { label: '👍 Phù hợp',     cls: 'sim-mid'  };
  return               { label: '🔍 Khá liên quan',    cls: 'sim-low'  };
};

const SimilarBooks = ({ bookId, currentTitle }) => {
  const [similarBooks, setSimilarBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (bookId) {
      fetchSimilarBooks();
    }
  }, [bookId]);

  const fetchSimilarBooks = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await aiService.getSimilarBooks(bookId, 5);

      // Normalize fields: book_id → bookId, image_url → imageUrl
      const normalized = (response.similar_books || []).map(book => ({
        ...book,
        bookId: book.book_id || book.bookId || book.id,
        imageUrl: book.image_url || book.imageUrl || null,
      }));

      setSimilarBooks(normalized);
    } catch (err) {
      console.error('Error fetching similar books:', err);
      setError('Không thể tải sách tương tự');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="similar-books-section">
        <h3 className="section-title">
          🤖 Sách Tương Tự (AI)
        </h3>
        <div className="similar-books-loading">
          <div className="spinner"></div>
          <p>Đang tìm sách tương tự...</p>
        </div>
      </div>
    );
  }

  if (error || similarBooks.length === 0) {
    return null;
  }

  return (
    <div className="similar-books-section">
      <div className="section-header">
        <h3 className="section-title">
          🤖 Sách Tương Tự với "{currentTitle}"
        </h3>
        <span className="ai-badge-small">AI Powered</span>
      </div>

      <div className="similar-books-grid">
        {similarBooks.map((book, index) => (
          <Link
            key={book.bookId || `book-${index}`}
            to={`/books/${book.bookId}`}
            className="similar-book-card"
          >
            {/* Book cover image */}
            <div className="similar-book-image-wrap">
              {book.imageUrl ? (
                <img
                  src={book.imageUrl}
                  alt={book.title}
                  className="similar-book-img"
                  onError={e => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div
                className="similar-book-img-placeholder"
                style={{ display: book.imageUrl ? 'none' : 'flex' }}
              >
                📚
              </div>

              {/* Similarity badge */}
              <div className={`similarity-badge ${getSimilarityLevel(book.score).cls}`}>
                {getSimilarityLevel(book.score).label}
              </div>
            </div>

            {/* Book info */}
            <div className="similar-book-info">
              <h4 className="similar-book-title">{book.title}</h4>
              <p className="similar-book-author">{book.author}</p>
              {book.category && (
                <span className="similar-book-category">{book.category}</span>
              )}
              <p className="similar-book-price">
                {book.price?.toLocaleString('vi-VN')}đ
              </p>
            </div>

            {/* Hover overlay */}
            <div className="card-hover-overlay">
              <span className="view-detail-text">Xem chi tiết →</span>
            </div>
          </Link>
        ))}
      </div>

      <div className="section-footer">
        <p className="ai-explanation">
          💡 Các sách này được AI gợi ý dựa trên độ tương đồng về nội dung, thể loại và đánh giá
        </p>
      </div>
    </div>
  );
};

export default SimilarBooks;
