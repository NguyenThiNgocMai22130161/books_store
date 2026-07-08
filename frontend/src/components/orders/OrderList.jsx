import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './OrderList.css';

const OrderList = () => {
  const navigate = useNavigate();
  
  const [orders, setOrders] = useState([]);
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchOrders();
  }, []);


  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:8080/api/orders', {
        withCredentials: true
      });
      
      const ordersData = response.data.orders || response.data || [];
      setOrders(ordersData);
      
      // Calculate statistics
      setTotalOrders(ordersData.length);
      
      const total = ordersData.reduce((sum, order) => sum + (order.totalPrice || 0), 0);
      setTotalSpent(total);
      
      const completed = ordersData.filter(o => o.status === 'COMPLETED').length;
      setCompletedCount(completed);
      
      const pending = ordersData.filter(o => o.status === 'PENDING').length;
      setPendingCount(pending);
      
      setError('');
    } catch (err) {
      if (err.response?.status === 401) {
        navigate('/login');
      } else {
        setError(err.response?.data?.message || 'Không thể tải danh sách đơn hàng');
      }
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy đơn hàng này?')) {
      return;
    }

    try {
      await axios.post(
        `http://localhost:8080/api/orders/${orderId}/cancel`,
        {},
        { withCredentials: true }
      );
      
      setSuccessMessage('Đã hủy đơn hàng thành công');
      setTimeout(() => setSuccessMessage(''), 3000);
      
      // Refresh orders
      await fetchOrders();
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể hủy đơn hàng');
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'PENDING':
        return 'status-pending';
      case 'COMPLETED':
        return 'status-completed';
      case 'CANCELLED':
        return 'status-cancelled';
      default:
        return '';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'PENDING':
        return 'Chờ Xử Lý';
      case 'COMPLETED':
        return 'Đã Nhận';
      case 'CANCELLED':
        return 'Đã Hủy';
      default:
        return status;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'PENDING':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
        );
      case 'COMPLETED':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 6 9 17l-5-5"/>
          </svg>
        );
      case 'CANCELLED':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" x2="9" y1="9" y2="15"/>
            <line x1="9" x2="15" y1="9" y2="15"/>
          </svg>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Đang tải đơn hàng...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="order-list-page">

      <div className="container fade-in">
        <div className="page-header" style={{ marginBottom: '2rem' }}>
          <h1>
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ verticalAlign: 'middle', marginRight: '0.5rem' }}>
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" x2="8" y1="13" y2="13"/>
              <line x1="16" x2="8" y1="17" y2="17"/>
              <polyline points="10 9 9 9 8 9"/>
            </svg>
            Lịch Sử Đơn Hàng
          </h1>
          <p className="text-muted">Theo dõi và quản lý tất cả đơn hàng của bạn</p>
        </div>

        {successMessage && (
          <div className="alert alert-success">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            <span>{successMessage}</span>
          </div>
        )}

        {error && (
          <div className="alert alert-danger">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" x2="9" y1="9" y2="15"/>
              <line x1="9" x2="15" y1="9" y2="15"/>
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Statistics */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📦</div>
            <div className="stat-number">{totalOrders}</div>
            <div className="stat-label">Tổng Đơn Hàng</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">💰</div>
            <div className="stat-number">{totalSpent.toLocaleString('vi-VN')} ₫</div>
            <div className="stat-label">Tổng Chi Tiêu</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-number">{completedCount}</div>
            <div className="stat-label">Đã Hoàn Tất</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">⏳</div>
            <div className="stat-number">{pendingCount}</div>
            <div className="stat-label">Đang Xử Lý</div>
          </div>
        </div>

        {/* Orders Section */}
        <div style={{ background: 'var(--card-bg)', borderRadius: '12px', padding: '1.5rem', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ verticalAlign: 'middle', marginRight: '0.5rem' }}>
                <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
                <line x1="16" x2="16" y1="2" y2="6"/>
                <line x1="8" x2="8" y1="2" y2="6"/>
                <line x1="3" x2="21" y1="10" y2="10"/>
              </svg>
              Danh Sách Đơn Hàng
            </h3>
            <span className="text-muted" style={{ fontSize: '0.875rem' }}>
              Hiển thị <strong>{orders.length}</strong> đơn hàng
            </span>
          </div>

          {/* Empty State */}
          {orders.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📭</div>
              <h3>Chưa Có Đơn Hàng</h3>
              <p>Bạn chưa có đơn hàng nào. Hãy bắt đầu mua sắm và khám phá những cuốn sách hay!</p>
              <Link to="/books" className="btn btn-primary">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ verticalAlign: 'middle', marginRight: '0.5rem' }}>
                  <path d="m19 21-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                </svg>
                🛍️ Mua Sách Ngay
              </Link>
            </div>
          ) : (
            <div className="table-container">
              <table className="orders-table">
                <thead>
                  <tr>
                    <th>Mã Đơn</th>
                    <th>Ngày Đặt</th>
                    <th>Số Lượng</th>
                    <th>Tổng Tiền</th>
                    <th>Thanh Toán</th>
                    <th>Trạng Thái</th>
                    <th>Hành Động</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order, index) => (
                    <tr key={order.id} style={{ animationDelay: `${index * 0.05}s` }}>
                      <td style={{ fontWeight: 600, color: 'var(--primary)' }}>{order.orderCode}</td>
                      <td>{new Date(order.createdAt).toLocaleString('vi-VN')}</td>
                      <td style={{ textAlign: 'center' }}>{order.items?.length || 0}</td>
                      <td style={{ fontWeight: 600 }}>{order.totalPrice?.toLocaleString('vi-VN')} ₫</td>
                      <td>
                        <span className="payment-badge">
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect width="20" height="14" x="2" y="5" rx="2"/>
                            <line x1="2" x2="22" y1="10" y2="10"/>
                          </svg>
                          <span>{order.paymentMethod}</span>
                        </span>
                      </td>
                      <td>
                        <span className={`status-badge ${getStatusBadgeClass(order.status)}`}>
                          {getStatusIcon(order.status)}
                          <span>{getStatusText(order.status)}</span>
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <Link to={`/orders/${order.id}`} className="btn btn-primary btn-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
                              <circle cx="12" cy="12" r="3"/>
                            </svg>
                            Xem
                          </Link>
                          {order.status === 'PENDING' && (
                            <button 
                              onClick={() => handleCancelOrder(order.id)}
                              className="btn btn-danger btn-sm"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M3 6h18"/>
                                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                              </svg>
                              Hủy
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderList;
