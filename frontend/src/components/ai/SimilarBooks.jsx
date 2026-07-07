/**
 * Similar Books Component
 * Shows AI-powered similar book recommendations
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import aiService from '../../services/aiService';
import './SimilarBooks.css';

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
      const response = await aiService.getSimilarBooks(bookId, 6);
      console.log('=== SIMILAR BOOKS RESPONSE ===');
      console.log('Response:', response);
      console.log('Similar books:', response.similar_books);
      console.log('First book:', response.similar_books?.[0]);
      console.log('==============================');
      
      // Transform book_id to bookId for consistency
      const booksWithCamelCase = (response.similar_books || []).map(book => ({
        ...book,
        bookId: book.book_id || book.bookId || book.id
      }));
      
      setSimilarBooks(booksWithCamelCase);
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
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z" />
          </svg>
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
    return null; // Don't show section if error or no results
  }

  return (
    <div className="similar-books-section">
      <div className="section-header">
        <h3 className="section-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z" />
          </svg>
          🤖 Sách Tương Tự với "{currentTitle}"
        </h3>
        <span className="ai-badge-small">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z" />
          </svg>
          AI Powered
        </span>
      </div>
      <div className="similar-books-grid">
        {similarBooks.map((book, index) => (
          <Link
            key={book.bookId || `book-${index}`}
            to={`/books/${book.bookId}`}
            className="similar-book-card"
          >
            <div className="book-card-content">
              <div className="book-info">
                <h4 className="book-title">{book.title}</h4>
                <p className="book-author">{book.author}</p>
                {book.category && (
                  <span className="book-category">{book.category}</span>
                )}
                <p className="book-price">
                  {book.price?.toLocaleString('vi-VN')}đ
                </p>
              </div>

              <div className="similarity-score">
                <svg className="score-ring" width="60" height="60">
                  <circle
                    cx="30"
                    cy="30"
                    r="25"
                    fill="none"
                    stroke="#e2e8f0"
                    strokeWidth="4"
                  />
                  <circle
                    cx="30"
                    cy="30"
                    r="25"
                    fill="none"
                    stroke="url(#gradient)"
                    strokeWidth="4"
                    strokeDasharray={`${2 * Math.PI * 25}`}
                    strokeDashoffset={`${2 * Math.PI * 25 * (1 - book.score)}`}
                    transform="rotate(-90 30 30)"
                    strokeLinecap="round"
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#667eea" />
                      <stop offset="100%" stopColor="#764ba2" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="score-text">
                  {(book.score * 100).toFixed(0)}%
                </div>
              </div>
            </div>

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
