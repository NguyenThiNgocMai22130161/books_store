import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [totalUsers, setTotalUsers] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await axios.get('http://localhost:8080/api/admin/dashboard', {
        withCredentials: true
      });
      setTotalUsers(response.data.totalUsers || 0);
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="container"><div className="loading-spinner"><div className="spinner"></div></div></div>;
  }

  return (
    <div>
      <nav className="navbar">
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 0 }}>
          <Link to="/" className="navbar-brand">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
            </svg>
            Admin Panel
          </Link>
          <div className="navbar-nav">
            <Link to="/">Trang chủ</Link>
            <Link to="/books">Sách</Link>
          </div>
        </div>
      </nav>

      <div className="container fade-in">
        <div className="page-header" style={{ marginTop: '3rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, minWidth: '250px' }}>
              <div style={{ padding: '10px', background: 'rgba(238, 77, 45, 0.1)', borderRadius: '10px' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#EE4D2D" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
                </svg>
              </div>
              <div>
                <h1 style={{ margin: 0 }}>Bảng Điều Khiển</h1>
                <p className="text-muted">Chào mừng trở lại, Quản trị viên</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <Link to="/categories" className="btn btn-primary">Danh Mục</Link>
              <Link to="/books/add" className="btn btn-success">Thêm Sách</Link>
            </div>
          </div>
        </div>

        <div className="dashboard-grid">
          <div className="dashboard-card">
            <div className="card-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <h3>Người dùng</h3>
            <div className="number">{totalUsers}</div>
            <Link to="/admin/users" className="action-link">Quản lý tài khoản →</Link>
          </div>

          <div className="dashboard-card">
            <div className="card-icon" style={{ color: '#10b981', background: 'rgba(16, 185, 129, 0.1)' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
              </svg>
            </div>
            <h3>Tổng số đầu sách</h3>
            <div className="number">248</div>
            <Link to="/books" className="action-link" style={{ color: '#10b981' }}>Kho sách hệ thống →</Link>
          </div>

          <div className="dashboard-card">
            <div className="card-icon" style={{ color: '#8b5cf6', background: 'rgba(139, 92, 246, 0.1)' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 19a2 2 0 0 1-2.414-.646l-5.106-6.564A2 2 0 0 0 9.172 11H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5a2 2 0 0 0 1.972 1.568"/>
              </svg>
            </div>
            <h3>Danh Mục Sách</h3>
            <div className="number">12</div>
            <Link to="/categories" className="action-link" style={{ color: '#8b5cf6' }}>Quản lý danh mục →</Link>
          </div>

          <div className="dashboard-card">
            <div className="card-icon" style={{ color: '#f59e0b', background: 'rgba(245, 158, 11, 0.1)' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </div>
            <h3>Tác vụ nhanh</h3>
            <div className="number">+</div>
            <Link to="/books/add" className="action-link" style={{ color: '#f59e0b' }}>Thêm sách mới ngay →</Link>
          </div>
        </div>

        <div className="quick-actions-panel">
          <h2 style={{ fontSize: '1.25rem' }}>📋 Lối tắt quản trị</h2>
          <div className="action-list">
            <Link to="/admin/users" className="action-item">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#EE4D2D" strokeWidth="2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><polyline points="17 11 19 13 23 9"/>
              </svg>
              Phê duyệt người dùng
            </Link>
            <Link to="/books/add" className="action-item">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              Cập nhật kho sách
            </Link>
            <Link to="/categories/add" className="action-item">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2">
                <path d="M22 19a2 2 0 0 1-2.414-.646l-5.106-6.564A2 2 0 0 0 9.172 11H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5a2 2 0 0 0 1.972 1.568"/>
              </svg>
              Thêm danh mục mới
            </Link>
          </div>
        </div>
      </div>

      <footer className="footer" style={{ marginTop: '5rem' }}>
        <div className="container">
          <p>© 2026 Admin Control Panel. Spring Security 6.x & OAuth2.0.</p>
        </div>
      </footer>
    </div>
  );
};

export default AdminDashboard;
