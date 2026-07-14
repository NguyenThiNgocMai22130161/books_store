import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import adminOrderService from '../../services/adminOrderService';
import OrderDetailModal from './OrderDetailModal';
import UpdateStatusModal from './UpdateStatusModal';
import './AdminOrders.css';

const AdminOrders = () => {
  const navigate = useNavigate();
  
  // State
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Pagination
  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Filters
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Modals
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);

  // Statistics
  const [statistics, setStatistics] = useState(null);

  useEffect(() => {
    fetchOrders();
    fetchStatistics();
  }, [page, status, paymentMethod, fromDate, toDate]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError('');
      
      const params = {
        page,
        size,
        sort: 'createdAt,desc'
      };

      if (keyword) params.keyword = keyword;
      if (status) params.status = status;
      if (paymentMethod) params.paymentMethod = paymentMethod;
      if (fromDate) params.fromDate = fromDate;
      if (toDate) params.toDate = toDate;

      const response = await adminOrderService.getOrders(params);
      
      setOrders(response.content || []);
      setTotalPages(response.totalPages || 0);
      setTotalElements(response.totalElements || 0);
      
    } catch (err) {
      console.error('Fetch orders error:', err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        navigate('/login');
      } else {
        setError(err.response?.data?.error || 'Không thể tải danh sách đơn hàng');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const stats = await adminOrderService.getStatistics();
      setStatistics(stats);
    } catch (err) {
      console.error('Fetch statistics error:', err);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(0);
    fetchOrders();
  };

  const handleResetFilters = () => {
    setKeyword('');
    setStatus('');
    setPaymentMethod('');
    setFromDate('');
    setToDate('');
    setPage(0);
  };

  const handleViewDetail = async (orderId) => {
    try {
      const orderDetail = await adminOrderService.getOrderDetail(orderId);
      setSelectedOrder(orderDetail);
      setShowDetailModal(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Không thể tải chi tiết đơn hàng');
    }
  };

  const handleUpdateStatus = (order) => {
    setSelectedOrder(order);
    setShowStatusModal(true);
  };

  const handleStatusUpdated = () => {
    setSuccessMessage('Cập nhật trạng thái thành công!');
    setTimeout(() => setSuccessMessage(''), 3000);
    fetchOrders();
    fetchStatistics();
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price || 0);
  };

  const formatDateTime = (dateTime) => {
    if (!dateTime) return 'N/A';
    return new Date(dateTime).toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      PENDING: { label: 'Chờ xác nhận', color: '#f59e0b' },
      CONFIRMED: { label: 'Đã xác nhận', color: '#3b82f6' },
      PROCESSING: { label: 'Đang xử lý', color: '#8b5cf6' },
      SHIPPING: { label: 'Đang giao', color: '#06b6d4' },
      DELIVERED: { label: 'Đã giao', color: '#10b981' },
      CANCELLED: { label: 'Đã hủy', color: '#ef4444' },
      PAID: { label: 'Đã thanh toán', color: '#10b981' },
      FAILED: { label: 'Thất bại', color: '#ef4444' }
    };

    const statusInfo = statusMap[status] || { label: status, color: '#6b7280' };
    
    return (
      <span
        className="status-pill"
        style={{ 
          backgroundColor: `${statusInfo.color}15`,
          color: statusInfo.color,
          border: `1px solid ${statusInfo.color}40`
        }}
      >
        {statusInfo.label}
      </span>
    );
  };

  if (loading && orders.length === 0) {
    return (
      <div className="container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Đang tải danh sách đơn hàng...</p>
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
                <path d="M6 2L3 6v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6l-3-4H6zM3 6h18M16 10a4 4 0 1 1-8 0"/>
              </svg>
            </div>
            <div>
              <h1 style={{ margin: 0 }}>Quản Lý Đơn Hàng</h1>
              <p className="text-muted">Tổng cộng: {totalElements} đơn hàng</p>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="dashboard-grid" style={{ marginBottom: '2rem' }}>
          <div className="stats-card">
            <div className="stats-icon" style={{ color: '#f59e0b', background: 'rgba(245, 158, 11, 0.1)' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            <div className="stats-content">
              <p className="stats-label">Chờ xác nhận</p>
              <p className="stats-value">{statistics.pendingOrders || 0}</p>
            </div>
          </div>

          <div className="stats-card">
            <div className="stats-icon" style={{ color: '#3b82f6', background: 'rgba(59, 130, 246, 0.1)' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </div>
            <div className="stats-content">
              <p className="stats-label">Đang xử lý</p>
              <p className="stats-value">{(statistics.confirmedOrders || 0) + (statistics.processingOrders || 0)}</p>
            </div>
          </div>

          <div className="stats-card">
            <div className="stats-icon" style={{ color: '#06b6d4', background: 'rgba(6, 182, 212, 0.1)' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
              </svg>
            </div>
            <div className="stats-content">
              <p className="stats-label">Đang giao</p>
              <p className="stats-value">{statistics.shippingOrders || 0}</p>
            </div>
          </div>

          <div className="stats-card">
            <div className="stats-icon" style={{ color: '#10b981', background: 'rgba(16, 185, 129, 0.1)' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 6L9 17l-5-5"/>
              </svg>
            </div>
            <div className="stats-content">
              <p className="stats-label">Đã giao</p>
              <p className="stats-value">{statistics.deliveredOrders || 0}</p>
            </div>
          </div>

          <div className="stats-card">
            <div className="stats-icon" style={{ color: '#10b981', background: 'rgba(16, 185, 129, 0.1)' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
              </svg>
            </div>
            <div className="stats-content">
              <p className="stats-label">Doanh thu</p>
              <p className="stats-value" style={{ fontSize: '1.3rem' }}>{formatPrice(statistics.totalRevenue || 0)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      {successMessage && (
        <div className="alert alert-success">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
          <span>{successMessage}</span>
        </div>
      )}

      {error && (
        <div className="alert alert-danger">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><line x1="15" x2="9" y1="9" y2="15"/><line x1="9" x2="15" y1="9" y2="15"/>
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Filters */}
      <div className="filters-card">
        <form onSubmit={handleSearch}>
          <div className="filter-row">
            <div className="filter-group">
              <label>Tìm kiếm</label>
              <input
                type="text"
                placeholder="Mã đơn, tên khách hàng, email..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="filter-input"
              />
            </div>

            <div className="filter-group">
              <label>Trạng thái</label>
              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(0);
                }}
                className="filter-select"
              >
                <option value="">Tất cả</option>
                <option value="PENDING">Chờ xác nhận</option>
                <option value="CONFIRMED">Đã xác nhận</option>
                <option value="PROCESSING">Đang xử lý</option>
                <option value="SHIPPING">Đang giao</option>
                <option value="DELIVERED">Đã giao</option>
                <option value="CANCELLED">Đã hủy</option>
                <option value="PAID">Đã thanh toán</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Thanh toán</label>
              <select
                value={paymentMethod}
                onChange={(e) => {
                  setPaymentMethod(e.target.value);
                  setPage(0);
                }}
                className="filter-select"
              >
                <option value="">Tất cả</option>
                <option value="COD">COD</option>
                <option value="MOMO">MoMo</option>
                <option value="BANK">Chuyển khoản</option>
              </select>
            </div>
          </div>

          <div className="filter-row">
            <div className="filter-group">
              <label>Từ ngày</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => {
                  setFromDate(e.target.value);
                  setPage(0);
                }}
                className="filter-input"
              />
            </div>

            <div className="filter-group">
              <label>Đến ngày</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => {
                  setToDate(e.target.value);
                  setPage(0);
                }}
                className="filter-input"
              />
            </div>

            <div className="filter-group" style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
              <button type="submit" className="btn btn-primary">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
                Tìm kiếm
              </button>
              <button type="button" onClick={handleResetFilters} className="btn btn-secondary">
                Xóa bộ lọc
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Orders Table */}
      <div className="orders-card">
        {orders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '5rem 0' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#EEEEEE" strokeWidth="1" style={{ marginBottom: '1rem' }}>
              <path d="M6 2L3 6v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6l-3-4H6zM3 6h18M16 10a4 4 0 1 1-8 0"/>
            </svg>
            <p className="text-muted">Không tìm thấy đơn hàng nào.</p>
          </div>
        ) : (
          <>
            <table className="table">
              <thead>
                <tr>
                  <th>Mã đơn</th>
                  <th>Khách hàng</th>
                  <th>Ngày đặt</th>
                  <th>Sản phẩm</th>
                  <th>Tổng tiền</th>
                  <th>Thanh toán</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td>
                      <span style={{ fontWeight: 600, color: '#EE4D2D' }}>
                        {order.orderCode}
                      </span>
                    </td>
                    <td>
                      <div>
                        <div style={{ fontWeight: 600 }}>{order.customerName}</div>
                        <div style={{ fontSize: '0.85rem', color: '#a9abbd' }}>{order.customerEmail}</div>
                      </div>
                    </td>
                    <td>{formatDateTime(order.createdAt)}</td>
                    <td>{order.itemCount} sản phẩm</td>
                    <td style={{ fontWeight: 600, color: '#EE4D2D' }}>
                      {formatPrice(order.totalAmount)}
                    </td>
                    <td>
                      <span className="payment-badge">
                        {order.paymentMethod || 'N/A'}
                      </span>
                    </td>
                    <td>{getStatusBadge(order.status)}</td>
                    <td>
                      <div className="action-btns">
                        <button
                          onClick={() => handleViewDetail(order.id)}
                          className="btn-icon"
                          title="Xem chi tiết"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                          </svg>
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(order)}
                          className="btn-icon"
                          style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}
                          title="Cập nhật trạng thái"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pagination">
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="pagination-btn"
                >
                  ← Trước
                </button>
                
                <span className="pagination-info">
                  Trang {page + 1} / {totalPages}
                </span>

                <button
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="pagination-btn"
                >
                  Sau →
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modals */}
      {showDetailModal && selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedOrder(null);
          }}
        />
      )}

      {showStatusModal && selectedOrder && (
        <UpdateStatusModal
          order={selectedOrder}
          onClose={() => {
            setShowStatusModal(false);
            setSelectedOrder(null);
          }}
          onSuccess={handleStatusUpdated}
        />
      )}
    </div>
  );
};

export default AdminOrders;
