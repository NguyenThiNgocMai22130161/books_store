import React from 'react';
import { Link } from 'react-router-dom';
import './AccessDenied.css';

const AccessDenied = () => {
  return (
    <div>
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
            <Link to="/logout">Đăng Xuất</Link>
          </div>
        </div>
      </nav>

      <div className="container">
        <div className="error-container">
          <div className="error-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <div className="error-code">🚫</div>
          <h1 className="error-message">Truy Cập Bị Từ Chối</h1>
          <div className="error-description">
            <p>Bạn không có quyền truy cập vào trang này.</p>
            <p>Vui lòng liên hệ quản trị viên nếu bạn cho rằng đây là một lỗi.</p>
          </div>
          <div className="error-actions">
            <Link to="/books" className="btn btn-primary">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="19" y1="12" x2="5" y2="12"/>
                <polyline points="12 19 5 12 12 5"/>
              </svg>
              Quay Lại Trang Chủ
            </Link>
            <Link to="/login" className="btn btn-secondary">
              Đăng Nhập Lại
            </Link>
          </div>
        </div>
      </div>

      <footer className="footer">
        <div className="container">
          <p>© 2026 Tiệm Sách Management System</p>
        </div>
      </footer>
    </div>
  );
};

export default AccessDenied;
