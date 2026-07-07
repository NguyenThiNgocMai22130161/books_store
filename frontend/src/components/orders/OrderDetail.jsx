import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './OrderDetail.css';

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchOrderDetail();
  }, [id]);

  const fetchOrderDetail = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`https://books-store-backend-production.up.railway.app/api/orders/${id}`, {
        withCredentials: true
      });
      setOrder(response.data);
      setError('');
    } catch (err) {
      if (err.response?.status === 401) {
        navigate('/login');
      } else if (err.response?.status === 404) {
        setError('Không tìm thấy đơn hàng');
      } else {
        setError(err.response?.data?.message || 'Không thể tải chi tiết đơn hàng');
      }
      console.error('Error fetching order detail:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy đơn hàng này? Hành động này không thể hoàn tác.')) {
      return;
    }

    try {
      await axios.post(
        `https://books-store-backend-production.up.railway.app/api/orders/${id}/cancel`,
        {},
        { withCredentials: true }
      );
      
      setSuccessMessage('Đã hủy đơn hàng thành công');
      setTimeout(() => {
        navigate('/orders');
      }, 2000);
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
        return 'Hoàn Tất';
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
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
        );
      case 'COMPLETED':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 6 9 17l-5-5"/>
          </svg>
        );
      case 'CANCELLED':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
          <p>Đang tải chi tiết đơn hàng...</p>
        </div>
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="container">
        <div className="alert alert-danger">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" x2="9" y1="9" y2="15"/>
            <line x1="9" x2="15" y1="9" y2="15"/>
          </svg>
          <span>{error}</span>
        </div>
        <Link to="/orders" className="btn btn-primary">Quay lại lịch sử</Link>
      </div>
    );
  }

  if (!order) {
    return null;
  }

  return (
    <div className="container fade-in">
        <div style={{ marginBottom: '1.5rem' }}>
          <Link to="/orders" className="btn btn-secondary" style={{ textDecoration: 'none' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m15 18-6-6 6-6"/>
            </svg>
            Quay lại lịch sử
          </Link>
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

        {/* Order Detail Card */}
        <div className="order-detail-container">
          {/* Order Header */}
          <div className="order-header">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="16" x2="8" y1="13" y2="13"/>
                    <line x1="16" x2="8" y1="17" y2="17"/>
                    <polyline points="10 9 9 9 8 9"/>
                  </svg>
                  Chi Tiết Đơn Hàng
                </h1>
                <p style={{ margin: '0.5rem 0 0 0', opacity: 0.9 }}>
                  Mã đơn hàng: <span className="order-code">{order.orderCode}</span>
                </p>
              </div>
              <span className={`status-badge ${getStatusBadgeClass(order.status)}`}>
                {getStatusIcon(order.status)}
                <span>{getStatusText(order.status)}</span>
              </span>
            </div>

            {/* Order Meta Information */}
            <div className="order-meta">
              <div className="meta-item">
                <div className="meta-label">Ngày Đặt</div>
                <div className="meta-value">{new Date(order.createdAt).toLocaleString('vi-VN')}</div>
              </div>
              <div className="meta-item">
                <div className="meta-label">Số Lượng Sản Phẩm</div>
                <div className="meta-value">{order.items?.length || 0}</div>
              </div>
              <div className="meta-item">
                <div className="meta-label">Phương Thức Thanh Toán</div>
                <div className="meta-value" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect width="20" height="14" x="2" y="5" rx="2"/>
                    <line x1="2" x2="22" y1="10" y2="10"/>
                  </svg>
                  <span>{order.paymentMethod}</span>
                </div>
              </div>
              <div className="meta-item">
                <div className="meta-label">Tổng Tiền</div>
                <div className="meta-value" style={{ color: '#10b981', fontWeight: 700 }}>
                  {order.totalPrice?.toLocaleString('vi-VN')} ₫
                </div>
              </div>
            </div>
          </div>

          {/* Order Content */}
          <div className="order-content">
            {/* Products Section */}
            <div className="section-title">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
              </svg>
              Chi Tiết Sản Phẩm
            </div>

            {/* Empty State */}
            {(!order.items || order.items.length === 0) ? (
              <div className="empty-state">
                <div className="empty-state-icon">📦</div>
                <h3 style={{ margin: '0.5rem 0', color: 'var(--text-color)' }}>Không có sản phẩm</h3>
                <p style={{ color: 'var(--text-muted)' }}>Đơn hàng này không có sản phẩm nào.</p>
              </div>
            ) : (
              <table className="items-table">
                <thead>
                  <tr>
                    <th style={{ width: '50px' }}></th>
                    <th>Sản Phẩm</th>
                    <th className="text-center">Số Lượng</th>
                    <th className="text-right">Đơn Giá</th>
                    <th className="text-right">Thành Tiền</th>
                    {order.status === 'COMPLETED' && <th className="text-center" style={{ width: '130px' }}>Thao Tác</th>}
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item, index) => (
                    <tr key={item.id || index} style={{ animationDelay: `${index * 0.05}s` }} className="fade-in">
                      <td>
                        {item.book?.imageUrl ? (
                          <img src={item.book.imageUrl} alt="Ảnh sách" className="item-image" />
                        ) : (
                          <div style={{ width: '60px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--hover-bg)', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                            </svg>
                          </div>
                        )}
                      </td>
                      <td>
                        <div className="item-title">{item.book?.title}</div>
                        <div className="item-author">{item.book?.author}</div>
                      </td>
                      <td className="text-center">
                        <span>{item.quantity}</span>
                      </td>
                      <td className="text-right">
                        {item.price?.toLocaleString('vi-VN')} ₫
                      </td>
                      <td className="text-right" style={{ fontWeight: 600, color: 'var(--primary)' }}>
                        {(item.price * item.quantity).toLocaleString('vi-VN')} ₫
                      </td>
                      {order.status === 'COMPLETED' && (
                        <td className="text-center">
                          <Link to={`/books/${item.book?.id}?write-review=true`} className="btn-review-item">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '0.2rem', verticalAlign: 'middle' }}>
                              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                            </svg>
                            Đánh giá
                          </Link>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Order Summary */}
            <div className="summary-card">
              <div className="section-title" style={{ marginBottom: '1rem' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" x2="12" y1="2" y2="22"/>
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                </svg>
                Tổng Kết Đơn Hàng
              </div>
              
              <div className="summary-row">
                <span className="summary-label">Tạm Tính:</span>
                <span className="summary-value">{order.totalPrice?.toLocaleString('vi-VN')} ₫</span>
              </div>
              <div className="summary-row">
                <span className="summary-label">Phí Vận Chuyển:</span>
                <span className="summary-value">Miễn phí</span>
              </div>
              <div className="summary-row" style={{ padding: '1rem 0', borderTop: '2px solid var(--border-color)' }}>
                <span className="summary-label" style={{ fontSize: '1.125rem', fontWeight: 600 }}>Tổng Cộng:</span>
                <span className="summary-value summary-total">{order.totalPrice?.toLocaleString('vi-VN')} ₫</span>
              </div>
            </div>

            {/* Actions */}
            <div className="actions-section">
              <Link to="/orders" className="btn btn-primary">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m15 18-6-6 6-6"/>
                </svg>
                Quay Lại
              </Link>
              
              {order.status === 'PENDING' && (
                <button onClick={handleCancelOrder} className="btn btn-danger">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 6h18"/>
                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                  </svg>
                  Hủy Đơn Hàng
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
  );
};

export default OrderDetail;
