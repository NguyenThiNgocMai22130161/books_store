import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState({
    totalUsers: 0,
    totalBooks: 0,
    totalCategories: 0,
    activeUsers: 0,
    adminUsers: 0,
    booksInStock: 0,
    outOfStockBooks: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Kiểm tra trạng thái đăng nhập trước
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      console.log('Checking auth status...');
      const authResponse = await axios.get('https://books-store-backend-production.up.railway.app/api/auth/status', {
        withCredentials: true
      });
      
      console.log('Auth status:', authResponse.data);
      
      if (authResponse.data.authenticated) {
        // Nếu đã đăng nhập, fetch dashboard data
        fetchDashboardData();
      } else {
        // Nếu chưa đăng nhập, redirect to login
        console.log('Not authenticated, redirecting to login');
        navigate('/login');
      }
    } catch (err) {
      console.error('Auth check error:', err);
      navigate('/login');
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching dashboard data...');
      
      const response = await axios.get('https://books-store-backend-production.up.railway.app/api/admin/dashboard', {
        withCredentials: true
      });
      
      console.log('Dashboard response:', response.data);
      setDashboardData(response.data);
    } catch (err) {
      console.error('Dashboard error:', err);
      console.error('Error response:', err.response?.data);
      console.error('Error status:', err.response?.status);
      
      // Nếu lỗi 401/403, hiển thị dữ liệu mặc định thay vì redirect
      if (err.response?.status === 401 || err.response?.status === 403) {
        console.log('Auth error, showing default data');
        setDashboardData({
          totalUsers: 0,
          totalBooks: 0,
          totalCategories: 0,
          activeUsers: 0,
          adminUsers: 0,
          booksInStock: 0,
          outOfStockBooks: 0
        });
        setError('Vui lòng đăng nhập để xem dữ liệu thực tế');
      } else {
        setError(`Không thể tải dữ liệu dashboard: ${err.response?.data?.message || err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Đang tải dữ liệu dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="alert alert-danger" style={{ marginTop: '2rem' }}>
          <p>{error}</p>
          <button onClick={fetchDashboardData} className="btn btn-primary">
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
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
          </div>
        </div>

        <div className="dashboard-grid">
          <div className="dashboard-card">
            <div className="card-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <h3>Tổng người dùng</h3>
            <div className="number">{dashboardData.totalUsers}</div>
            <div className="sub-stats">
              <span>Hoạt động: {dashboardData.activeUsers}</span>
              <span>Admin: {dashboardData.adminUsers}</span>
            </div>
            <Link to="/admin/users" className="action-link">Quản lý tài khoản →</Link>
          </div>

          <div className="dashboard-card">
            <div className="card-icon" style={{ color: '#10b981', background: 'rgba(16, 185, 129, 0.1)' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
              </svg>
            </div>
            <h3>Tổng số đầu sách</h3>
            <div className="number">{dashboardData.totalBooks}</div>
            <div className="sub-stats">
              <span>Còn hàng: {dashboardData.booksInStock}</span>
              <span>Hết hàng: {dashboardData.outOfStockBooks}</span>
            </div>
            <Link to="/admin/books" className="action-link" style={{ color: '#10b981' }}>Kho sách hệ thống →</Link>
          </div>

          <div className="dashboard-card">
            <div className="card-icon" style={{ color: '#8b5cf6', background: 'rgba(139, 92, 246, 0.1)' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 19a2 2 0 0 1-2.414-.646l-5.106-6.564A2 2 0 0 0 9.172 11H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5a2 2 0 0 0 1.972 1.568"/>
              </svg>
            </div>
            <h3>Danh Mục Sách</h3>
            <div className="number">{dashboardData.totalCategories}</div>
            <div className="sub-stats">
              <span>Đang hoạt động</span>
            </div>
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
            <div className="sub-stats">
              <span>Thêm nội dung mới</span>
            </div>
            <Link to="/books/add" className="action-link" style={{ color: '#f59e0b' }}>Thêm sách mới ngay →</Link>
          </div>
        </div>
    </div>
  );
};

export default AdminDashboard;
