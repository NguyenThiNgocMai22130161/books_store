import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import './Register.css';

const Register = () => {
  const navigate = useNavigate();
  
  // State management
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    fullName: '',
    password: ''
  });
  
  const [errors, setErrors] = useState({
    username: null,
    email: null,
    general: null
  });
  
  const [isLoading, setIsLoading] = useState(false);

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error khi user nhập lại
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({ username: null, email: null, general: null });

    try {
      const response = await axios.post(
        'https://books-store-backend-production.up.railway.app/api/auth/register',
        formData,
        {
          headers: {
            'Content-Type': 'application/json',
          },
          withCredentials: true
        }
      );

      if (response.data.message) {
        // Registration successful
        alert(response.data.message || 'Đăng ký thành công!');
        navigate('/login?registered=true');
      }
    } catch (error) {
      console.error('Registration error:', error);
      
      if (error.response?.data?.error) {
        const errorMsg = error.response.data.error;
        
        // Check for specific errors
        if (errorMsg.includes('Tên đăng nhập')) {
          setErrors(prev => ({ ...prev, username: errorMsg }));
        } else if (errorMsg.includes('Email')) {
          setErrors(prev => ({ ...prev, email: errorMsg }));
        } else {
          setErrors(prev => ({ ...prev, general: errorMsg }));
        }
      } else {
        setErrors(prev => ({ 
          ...prev, 
          general: 'Đăng ký thất bại. Vui lòng thử lại!' 
        }));
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Google OAuth registration
  const handleGoogleRegister = () => {
    window.location.href = 'https://books-store-backend-production.up.railway.app/oauth2/authorization/google';
  };

  return (
    <div className="register-page">
      {/* Navbar */}
      <nav className="navbar">
        <div className="container" style={{ display: 'flex', justifyContent: 'center', padding: '1rem' }}>
          <Link to="/" className="navbar-brand" style={{ margin: 0, fontSize: '1.5rem' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
            </svg>
            Tiệm Sách
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <div className="auth-wrapper">
        <div className="auth-card fade-in">
          <div className="auth-header">
            <h2>Tạo tài khoản</h2>
            <p style={{ color: '#757575', fontSize: '0.9rem' }}>Khám phá kho sách khổng lồ ngay hôm nay</p>
          </div>

          {/* Error Alerts */}
          {errors.username && (
            <div className="alert alert-danger" style={{ marginBottom: '1rem', padding: '0.75rem', borderRadius: '8px', fontSize: '0.85rem' }}>
              {errors.username}
            </div>
          )}
          
          {errors.email && (
            <div className="alert alert-danger" style={{ marginBottom: '1rem', padding: '0.75rem', borderRadius: '8px', fontSize: '0.85rem' }}>
              {errors.email}
            </div>
          )}
          
          {errors.general && (
            <div className="alert alert-danger" style={{ marginBottom: '1rem', padding: '0.75rem', borderRadius: '8px', fontSize: '0.85rem' }}>
              {errors.general}
            </div>
          )}

          {/* Registration Form */}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="username">Tên đăng nhập</label>
              <input
                type="text"
                id="username"
                name="username"
                className="form-control"
                placeholder="Ví dụ: nva_2026"
                value={formData.username}
                onChange={handleChange}
                required
                disabled={isLoading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Địa chỉ Email</label>
              <input
                type="email"
                id="email"
                name="email"
                className="form-control"
                placeholder="name@company.com"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={isLoading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="fullName">Họ và tên</label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                className="form-control"
                placeholder="Nhập tên đầy đủ của bạn"
                value={formData.fullName}
                onChange={handleChange}
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
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
                minLength="6"
                disabled={isLoading}
              />
              <small style={{ color: '#999', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block' }}>
                Tối thiểu 6 ký tự
              </small>
            </div>

            <button type="submit" className="btn-register" disabled={isLoading}>
              {isLoading ? 'Đang xử lý...' : 'Đăng ký ngay'}
            </button>
          </form>

          <div className="oauth-divider">
            <span>Hoặc đăng ký bằng</span>
          </div>

          <button onClick={handleGoogleRegister} className="btn-google" disabled={isLoading}>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Tiếp tục với Google
          </button>

          <div className="auth-footer">
            Đã có tài khoản? <Link to="/login">Đăng nhập tại đây</Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <p>© 2026 Tiệm Sách Authorization System. Bảo mật bởi Spring Security.</p>
        </div>
      </footer>
    </div>
  );
};

export default Register;
