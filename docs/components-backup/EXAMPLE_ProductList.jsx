import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './ProductList.css';

/**
 * VÍ DỤ CỤ THỂ: Product List Component
 * Đã customize từ TEMPLATE_COMPONENT.jsx
 */

const ProductList = () => {
  // ============================================
  // STATE MANAGEMENT
  // ============================================
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Additional states for features
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categories, setCategories] = useState([]);

  // ============================================
  // FETCH DATA
  // ============================================
  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [selectedCategory]); // Re-fetch khi category thay đổi

  const fetchProducts = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const response = await axios.get('http://localhost:8080/api/books', {
        params: {
          category: selectedCategory !== 'all' ? selectedCategory : undefined
        },
        withCredentials: true
      });
      
      setProducts(response.data);
      console.log('Products loaded:', response.data.length);
      
    } catch (err) {
      console.error('Error:', err);
      setError(err.response?.data?.message || 'Không thể tải danh sách sản phẩm');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get('http://localhost:8080/api/categories', {
        withCredentials: true
      });
      setCategories(response.data);
    } catch (err) {
      console.error('Error loading categories:', err);
    }
  };

  // ============================================
  // SEARCH & FILTER
  // ============================================
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.author.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // ============================================
  // ACTIONS
  // ============================================
  const handleAddToCart = async (productId) => {
    try {
      await axios.post(`http://localhost:8080/api/cart/add/${productId}`, {
        quantity: 1
      }, {
        withCredentials: true
      });
      
      setSuccessMessage('Đã thêm vào giỏ hàng!');
      setTimeout(() => setSuccessMessage(''), 3000);
      
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể thêm vào giỏ hàng');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) {
      try {
        await axios.delete(`http://localhost:8080/api/books/${id}`, {
          withCredentials: true
        });
        
        setSuccessMessage('Xóa sản phẩm thành công!');
        fetchProducts(); // Refresh list
        setTimeout(() => setSuccessMessage(''), 3000);
        
      } catch (err) {
        setError(err.response?.data?.message || 'Không thể xóa sản phẩm');
        setTimeout(() => setError(''), 3000);
      }
    }
  };

  // ============================================
  // LOADING STATE
  // ============================================
  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Đang tải sản phẩm...</p>
      </div>
    );
  }

  // ============================================
  // RENDER
  // ============================================
  return (
    <div>
      {/* Navbar */}
      <nav className="navbar">
        <div className="container">
          <Link to="/" className="navbar-brand">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
            </svg>
            Tiệm Sách
          </Link>
          <div className="navbar-nav">
            <Link to="/books">Sách</Link>
            <Link to="/cart">Giỏ hàng</Link>
            <Link to="/orders">Đơn hàng</Link>
          </div>
        </div>
      </nav>

      <div className="container">
        {/* Page Header */}
        <div className="page-header">
          <h1>Danh Sách Sản Phẩm</h1>
          <p className="text-muted">
            Tìm thấy {filteredProducts.length} sản phẩm
          </p>
        </div>

        {/* Success/Error Messages */}
        {successMessage && (
          <div className="alert alert-success fade-in">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            <span>{successMessage}</span>
          </div>
        )}

        {error && (
          <div className="alert alert-danger fade-in">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Search & Filter Bar */}
        <div className="filter-bar">
          <div className="search-box">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              type="text"
              placeholder="Tìm kiếm sách theo tên hoặc tác giả..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="category-select"
          >
            <option value="all">Tất cả thể loại</option>
            {categories.map((cat, idx) => (
              <option key={idx} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Empty State */}
        {filteredProducts.length === 0 ? (
          <div className="empty-state">
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
            <h3>Không tìm thấy sản phẩm</h3>
            <p>Thử tìm kiếm với từ khóa khác hoặc chọn thể loại khác</p>
            <button onClick={() => { setSearchTerm(''); setSelectedCategory('all'); }} className="btn btn-primary">
              Xóa bộ lọc
            </button>
          </div>
        ) : (
          /* Product Grid */
          <div className="product-grid">
            {filteredProducts.map((product) => (
              <div key={product.id} className="product-card">
                {/* Product Image */}
                <div className="product-image">
                  <img 
                    src={product.imageUrl || '/placeholder-book.jpg'} 
                    alt={product.title}
                    onError={(e) => e.target.src = '/placeholder-book.jpg'}
                  />
                  {product.quantity === 0 && (
                    <div className="out-of-stock-badge">Hết hàng</div>
                  )}
                </div>

                {/* Product Info */}
                <div className="product-info">
                  <h3 className="product-title">
                    <Link to={`/books/${product.id}`}>
                      {product.title}
                    </Link>
                  </h3>
                  
                  <p className="product-author">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                    {product.author}
                  </p>

                  <p className="product-category">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                    </svg>
                    {product.category}
                  </p>

                  <div className="product-footer">
                    <div className="product-price">
                      {product.price.toLocaleString('vi-VN')} đ
                    </div>
                    
                    <div className="product-actions">
                      <button 
                        onClick={() => handleAddToCart(product.id)}
                        className="btn btn-primary btn-sm"
                        disabled={product.quantity === 0}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="8" cy="21" r="1"/>
                          <circle cx="19" cy="21" r="1"/>
                          <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>
                        </svg>
                        {product.quantity === 0 ? 'Hết hàng' : 'Thêm'}
                      </button>
                      
                      {/* Admin only */}
                      <Link to={`/books/edit/${product.id}`} className="btn btn-secondary btn-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 20h9"/>
                          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19H4v-3L16.5 3.5z"/>
                        </svg>
                      </Link>
                      
                      <button onClick={() => handleDelete(product.id)} className="btn btn-danger btn-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6"/>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <p>© 2026 Tiệm Sách Management System</p>
        </div>
      </footer>
    </div>
  );
};

export default ProductList;
