import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import './BookDetail.css';

const BookDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetchBookDetail();
    fetchAuthStatus();
  }, [id]);

  const fetchAuthStatus = async () => {
    try {
      const response = await axios.get('http://localhost:8080/api/auth/status', {
        withCredentials: true
      });
      if (response.data.authenticated) {
        setUser(response.data.user);
      }
    } catch (err) {
      console.log('Not authenticated');
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
    <div>
      <nav className="navbar">
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 0 }}>
          <Link to="/" className="navbar-brand">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
            </svg>
            Tiệm Sách
          </Link>
          <div className="navbar-nav">
            <Link to="/books">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="19" x2="5" y1="12" y2="12"/>
                <polyline points="12 19 5 12 12 5"/>
              </svg>
              Quay lại danh sách
            </Link>
            <Link to="/cart">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="9" cy="21" r="1"/>
                <circle cx="20" cy="21" r="1"/>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
              </svg>
              Giỏ hàng
            </Link>
          </div>
        </div>
      </nav>

      <div className="container">
        <div className="page-header">
          <h1>
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ verticalAlign: 'middle', marginRight: '0.5rem' }}>
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
            </svg>
            Chi Tiết Sách
          </h1>
        </div>

        {successMessage && (
          <div className="alert alert-success">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            <span>{successMessage}</span>
          </div>
        )}

        {error && (
          <div className="alert alert-danger">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" x2="9" y1="9" y2="15"/>
              <line x1="9" x2="15" y1="9" y2="15"/>
            </svg>
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-2" style={{ alignItems: 'start' }}>
          {/* Image */}
          <div style={{ textAlign: 'center' }}>
            {book.imageUrl ? (
              <img src={book.imageUrl} alt="Ảnh sách" style={{ width: '100%', maxWidth: '450px', borderRadius: '16px', boxShadow: 'var(--shadow-xl)' }} />
            ) : (
              <div style={{ width: '100%', height: '500px', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                </svg>
              </div>
            )}
          </div>

          {/* Details */}
          <div className="card" style={{ padding: '2.5rem' }}>
            <h1 style={{ marginBottom: '1.5rem', fontSize: '2rem', fontWeight: 800 }}>{book.title}</h1>

            <div style={{ display: 'flex', gap: '2rem', marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
              <div style={{ flex: 1 }}>
                <span style={{ color: 'var(--accent-secondary)', fontWeight: 600, fontSize: '0.9rem' }}>Tác Giả</span>
                <p style={{ fontSize: '1.1rem', marginTop: '0.5rem', fontWeight: 600 }}>{book.author}</p>
              </div>
              {book.category && (
                <div style={{ flex: 1 }}>
                  <span style={{ color: 'var(--accent-secondary)', fontWeight: 600, fontSize: '0.9rem' }}>Thể Loại</span>
                  <p style={{ fontSize: '1.1rem', marginTop: '0.5rem' }}>{book.category}</p>
                </div>
              )}
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <span style={{ color: 'var(--accent-secondary)', fontWeight: 600, fontSize: '0.9rem' }}>Giá bán</span>
              <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--success)', marginTop: '0.5rem' }}>
                {book.price?.toLocaleString('vi-VN')} ₫
              </div>
            </div>

            <div style={{ display: 'flex', gap: '2rem', marginBottom: '1.5rem' }}>
              {book.year && (
                <div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Năm xuất bản</span>
                  <p style={{ fontSize: '1rem', marginTop: '0.25rem' }}>{book.year}</p>
                </div>
              )}
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Số lượng còn</span>
                <p style={{ fontSize: '1rem', marginTop: '0.25rem', fontWeight: 600 }}>
                  {book.quantity != null ? `${book.quantity} cuốn` : '0 cuốn'}
                </p>
              </div>
            </div>

            {book.description && (
              <div style={{ margin: '2rem 0', padding: '1.5rem', background: 'var(--bg-secondary)', borderRadius: '12px', borderLeft: '4px solid var(--accent-primary)' }}>
                <span style={{ color: 'var(--accent-secondary)', fontWeight: 600, fontSize: '0.9rem', display: 'block', marginBottom: '0.75rem' }}>Mô tả</span>
                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8 }}>{book.description}</p>
              </div>
            )}

            <div className="btn-group" style={{ marginTop: '2rem' }}>
              <Link to="/books" className="btn btn-outline">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="19" x2="5" y1="12" y2="12"/>
                  <polyline points="12 19 5 12 12 5"/>
                </svg>
                Quay lại
              </Link>
              
              {!isAdmin && user && (
                <form onSubmit={handleAddToCart} style={{ display: 'flex', flex: 1, gap: '1rem', alignItems: 'center' }}>
                  <input 
                    type="number" 
                    value={quantity} 
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    min="1"
                    style={{ width: '80px', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}
                  />
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={addingToCart}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
              <div className="btn-group" style={{ marginTop: '1rem' }}>
                <Link to={`/books/edit/${book.id}`} className="btn btn-secondary">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
                  </svg>
                  Sửa thông tin
                </Link>
                <button onClick={handleDelete} className="btn btn-danger">
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
      </div>

      <footer className="footer">
        <div className="container">
          <div className="d-flex justify-center gap-3 mb-4">
            <Link to="/books">Sách</Link>
            <Link to="/cart">Giỏ hàng</Link>
            <Link to="/orders">Lịch sử mua hàng</Link>
            <Link to="/user/profile">Tài khoản</Link>
          </div>
          <p className="mb-2">© 2026 Tiệm Sách. Được xây dựng với Spring Boot & React</p>
          <p className="text-muted" style={{ fontSize: '0.9rem' }}>Thương mại điện tử hiện đại - Mua sắm dễ dàng, tiện lợi</p>
        </div>
      </footer>
    </div>
  );
};

export default BookDetail;
