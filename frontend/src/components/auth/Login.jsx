import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // State management
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });

  const [alerts, setAlerts] = useState({
    error: null,
    success: null
  });

  const [isLoading, setIsLoading] = useState(false);

  // Check for URL parameters (error, logout)
  useEffect(() => {
    const error = searchParams.get('error');
    const logout = searchParams.get('logout');

    if (error) {
      setAlerts({
        error: 'Tên đăng nhập hoặc mật khẩu không đúng!',
        success: null
      });
    }

    if (logout) {
      setAlerts({
        error: null,
        success: 'Đăng xuất thành công!'
      });
    }
  }, [searchParams]);

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setAlerts({ error: null, success: null });

    try {
      // Create form data for x-www-form-urlencoded
      const formDataEncoded = new URLSearchParams();
      formDataEncoded.append('username', formData.username);
      formDataEncoded.append('password', formData.password);

      const response = await axios.post(
        'https://books-store-backend-production.up.railway.app/api/auth/login',
        formDataEncoded,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          withCredentials: true
        }
      );
      console.log('LOGIN RESPONSE:', response.data);

      if (response.data.success) {
        // Login successful
        setAlerts({
          error: null,
          success: response.data.message || 'Đăng nhập thành công!'
        });

        // Kiểm tra xem có URL redirect không
        const redirectUrl = sessionStorage.getItem('redirectAfterLogin');

        // Redirect sau 1 giây
        setTimeout(() => {
          if (redirectUrl) {
            // Xóa redirect URL khỏi sessionStorage
            sessionStorage.removeItem('redirectAfterLogin');
            // Redirect về trang trước đó
            navigate(redirectUrl);
            // } else {
            //   // Mặc định redirect về trang sách
            //   navigate('/books');
            // }
          } else {
            const authorities = response.data.authorities || [];

            const roles = authorities.map(a => {
              if (typeof a === 'string') return a;
              return a.authority;
            });

            if (roles.includes('ROLE_ADMIN')) {
              navigate('/admin');
            } else {
              navigate('/books');
            }
          }
        }, 1000);
      }
    } catch (error) {
      console.error('Login error:', error);
      setAlerts({
        error: error.response?.data?.message || 'Đăng nhập thất bại. Vui lòng thử lại!',
        success: null
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Google OAuth login
  const handleGoogleLogin = () => {
    window.location.href = 'https://books-store-backend-production.up.railway.app/oauth2/authorization/google';
  };

  return (
    <div className="login-page">
      {/* Navbar */}
      <nav className="navbar">
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 0 }}>
          <Link to="/" className="navbar-brand">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
            Tiệm Sách
          </Link>
          <div className="navbar-nav">
            <Link to="/register">Đăng ký</Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="login-wrapper">
        <div className="login-grid">
          {/* Left Section: Heading */}
          <div className="login-section">
            <div className="login-header">
              <h1>Chào mừng quay lại</h1>
              <p>Đăng nhập để tiếp tục khám phá thế giới sách</p>
            </div>

            <div className="illustration-box">
              <div className="illustration-icon">📚</div>
            </div>
          </div>

          {/* Right Section: Login Form */}
          <div className="login-section">
            <div className="login-card">

              {/* Error Alert */}
              {alerts.error && (
                <div className="alert alert-danger">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="15" x2="9" y1="9" y2="15" />
                    <line x1="9" x2="15" y1="9" y2="15" />
                  </svg>
                  <span>{alerts.error}</span>
                </div>
              )}

              {/* Success Alert */}
              {alerts.success && (
                <div className="alert alert-success">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                  {alerts.success}
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="username">Tên đăng nhập</label>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    className="form-control"
                    placeholder="Nhập tên đăng nhập"
                    value={formData.username}
                    onChange={handleChange}
                    required
                    autoFocus
                    disabled={isLoading}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="password">Mật khẩu</label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    className="form-control"
                    placeholder="Nhập mật khẩu"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    disabled={isLoading}
                  />
                </div>

                <button type="submit" className="btn-primary" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <svg className="spinner" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="2" x2="12" y2="6" />
                        <line x1="12" y1="18" x2="12" y2="22" />
                        <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
                        <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
                        <line x1="2" y1="12" x2="6" y2="12" />
                        <line x1="18" y1="12" x2="22" y2="12" />
                        <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" />
                        <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
                      </svg>
                      Đang đăng nhập...
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                        <polyline points="10 17 15 12 10 7" />
                        <line x1="15" x2="3" y1="12" y2="12" />
                      </svg>
                      Đăng nhập
                    </>
                  )}
                </button>
              </form>

              <div className="oauth-divider">
                <span>Hoặc đăng nhập với</span>
              </div>

              <div className="oauth-buttons">
                <button onClick={handleGoogleLogin} className="oauth-btn" disabled={isLoading}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Google
                </button>
              </div>

              <div className="auth-links">
                <p>Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link></p>
                <p className="text-muted" style={{ fontSize: '0.85rem', marginTop: '1rem' }}>
                  <strong>Tài khoản test:</strong><br />
                  Admin: <code style={{ background: '#F5F5F5', padding: '0.2rem 0.4rem', borderRadius: '4px' }}>admin / admin123</code><br />
                  User: <code style={{ background: '#F5F5F5', padding: '0.2rem 0.4rem', borderRadius: '4px' }}>user / user123</code>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <p style={{ margin: '0.5rem 0' }}><strong>© 2026 Tiệm Sách</strong></p>
          <p style={{ margin: 0, fontSize: '0.85rem' }}>Được xây dựng với Spring Boot & React • Thương mại điện tử hiện đại</p>
        </div>
      </footer>
    </div>
  );
};

export default Login;
