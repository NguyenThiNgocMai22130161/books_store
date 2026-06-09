/**
 * Smart Search Bar Component
 * AI-powered semantic search for books
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import aiService from '../../services/aiService';
import './SmartSearchBar.css';

const SmartSearchBar = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(false);
  const searchRef = useRef(null);
  const navigate = useNavigate();

  // Check AI service availability on mount
  useEffect(() => {
    checkAIService();
  }, []);

  // Click outside to close results
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const checkAIService = async () => {
    try {
      const health = await aiService.checkHealth();
      setAiEnabled(health.status === 'healthy');
    } catch (error) {
      setAiEnabled(false);
    }
  };

  const handleSearch = async (searchQuery) => {
    if (!searchQuery.trim() || !aiEnabled) return;

    setIsSearching(true);
    setShowResults(true);

    try {
      const response = await aiService.search(searchQuery, 5);
      setResults(response.results || []);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (query.trim().length >= 3) {
        handleSearch(query);
      } else {
        setResults([]);
        setShowResults(false);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [query]);

  const handleBookClick = (bookId) => {
    setShowResults(false);
    setQuery('');
    navigate(`/books/${bookId}`);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && query.trim()) {
      // Navigate to full search results
      navigate(`/books?search=${encodeURIComponent(query)}&ai=true`);
      setShowResults(false);
    }
  };

  return (
    <div className="smart-search-container" ref={searchRef}>
      <div className="smart-search-bar">
        <svg 
          className="search-icon" 
          width="20" 
          height="20" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        
        <input
          type="text"
          className="smart-search-input"
          placeholder={aiEnabled ? "🤖 Tìm kiếm thông minh với AI..." : "Tìm kiếm sách..."}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={!aiEnabled}
        />

        {aiEnabled && (
          <span className="ai-badge" title="AI-powered search">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V9h7V2.99c3.72 1.15 6.47 4.82 7 8.94v.06h-7z"/>
            </svg>
            AI
          </span>
        )}

        {isSearching && (
          <div className="search-spinner">
            <div className="spinner-small"></div>
          </div>
        )}

        {query && !isSearching && (
          <button 
            className="clear-button"
            onClick={() => {
              setQuery('');
              setResults([]);
              setShowResults(false);
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {showResults && results.length > 0 && (
        <div className="smart-search-results">
          <div className="results-header">
            <span>Kết quả tìm kiếm AI</span>
            <span className="results-count">{results.length} kết quả</span>
          </div>
          
          <div className="results-list">
            {results.map((book, index) => (
              <div 
                key={book.bookId}
                className="result-item"
                onClick={() => handleBookClick(book.bookId)}
              >
                <div className="result-rank">{index + 1}</div>
                <div className="result-info">
                  <h4 className="result-title">{book.title}</h4>
                  <p className="result-author">{book.author}</p>
                  <div className="result-meta">
                    <span className="result-price">
                      {book.price?.toLocaleString('vi-VN')}đ
                    </span>
                    {book.category && (
                      <span className="result-category">{book.category}</span>
                    )}
                  </div>
                </div>
                <div className="result-score">
                  <div className="score-circle" style={{
                    background: `conic-gradient(#667eea ${book.score * 360}deg, #e2e8f0 0deg)`
                  }}>
                    <div className="score-inner">
                      {(book.score * 100).toFixed(0)}%
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="results-footer">
            <button 
              className="view-all-button"
              onClick={() => {
                navigate(`/books?search=${encodeURIComponent(query)}&ai=true`);
                setShowResults(false);
              }}
            >
              Xem tất cả kết quả →
            </button>
          </div>
        </div>
      )}

      {/* No Results */}
      {showResults && !isSearching && query.trim().length >= 3 && results.length === 0 && (
        <div className="smart-search-results">
          <div className="no-results">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
              <line x1="11" y1="8" x2="11" y2="14" />
              <line x1="8" y1="11" x2="14" y2="11" />
            </svg>
            <h4>Không tìm thấy kết quả</h4>
            <p>Thử tìm kiếm với từ khóa khác</p>
          </div>
        </div>
      )}

      {/* AI Unavailable Notice */}
      {!aiEnabled && (
        <div className="ai-unavailable-notice">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          AI search tạm thời không khả dụng
        </div>
      )}
    </div>
  );
};

export default SmartSearchBar;
