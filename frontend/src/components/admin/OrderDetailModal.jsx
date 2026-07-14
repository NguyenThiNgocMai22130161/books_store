import React from 'react';
import './AdminOrders.css';

const OrderDetailModal = ({ order, onClose }) => {
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

  const getStatusLabel = (status) => {
    const statusMap = {
      PENDING: 'Chờ xác nhận',
      CONFIRMED: 'Đã xác nhận',
      PROCESSING: 'Đang xử lý',
      SHIPPING: 'Đang giao',
      DELIVERED: 'Đã giao',
      CANCELLED: 'Đã hủy',
      PAID: 'Đã thanh toán',
      FAILED: 'Thất bại'
    };
    return statusMap[status] || status;
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content">
        <div className="modal-header">
          <h2>Chi tiết đơn hàng #{order.orderCode}</h2>
          <button onClick={onClose} className="modal-close">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="modal-body">
          {/* Order Info */}
          <div className="detail-section">
            <h3>Thông tin đơn hàng</h3>
            <div className="detail-row">
              <div className="detail-item">
                <div className="detail-label">Mã đơn hàng</div>
                <div className="detail-value" style={{ color: '#EE4D2D', fontWeight: 600 }}>
                  {order.orderCode}
                </div>
              </div>
              <div className="detail-item">
                <div className="detail-label">Trạng thái</div>
                <div className="detail-value">{getStatusLabel(order.status)}</div>
              </div>
            </div>

            <div className="detail-row">
              <div className="detail-item">
                <div className="detail-label">Ngày đặt hàng</div>
                <div className="detail-value">{formatDateTime(order.createdAt)}</div>
              </div>
              <div className="detail-item">
                <div className="detail-label">Cập nhật lần cuối</div>
                <div className="detail-value">{formatDateTime(order.updatedAt)}</div>
              </div>
            </div>

            <div className="detail-row">
              <div className="detail-item">
                <div className="detail-label">Phương thức thanh toán</div>
                <div className="detail-value">{order.paymentMethod || 'N/A'}</div>
              </div>
              <div className="detail-item">
                <div className="detail-label">Tổng số sản phẩm</div>
                <div className="detail-value">{order.totalItems} sản phẩm</div>
              </div>
            </div>
          </div>

          {/* Customer Info */}
          <div className="detail-section">
            <h3>Thông tin khách hàng</h3>
            <div className="detail-row">
              <div className="detail-item">
                <div className="detail-label">Tên khách hàng</div>
                <div className="detail-value">{order.customerName || 'N/A'}</div>
              </div>
              <div className="detail-item">
                <div className="detail-label">Username</div>
                <div className="detail-value">{order.customerUsername || 'N/A'}</div>
              </div>
            </div>

            <div className="detail-row">
              <div className="detail-item">
                <div className="detail-label">Email</div>
                <div className="detail-value">{order.customerEmail || 'N/A'}</div>
              </div>
              <div className="detail-item">
                <div className="detail-label">ID khách hàng</div>
                <div className="detail-value">#{order.customerId}</div>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className="detail-section">
            <h3>Danh sách sản phẩm</h3>
            <ul className="order-items-list">
              {order.items && order.items.map((item, index) => (
                <li key={index} className="order-item">
                  {item.bookImageUrl && (
                    <img 
                      src={item.bookImageUrl} 
                      alt={item.bookTitle}
                      className="order-item-image"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  )}
                  <div className="order-item-info">
                    <div className="order-item-title">{item.bookTitle}</div>
                    <div className="order-item-author">Tác giả: {item.bookAuthor}</div>
                    <div className="order-item-details">
                      <span>Đơn giá: {formatPrice(item.price)}</span>
                      <span>×</span>
                      <span>Số lượng: {item.quantity}</span>
                      <span>=</span>
                      <span style={{ fontWeight: 600, color: '#EE4D2D' }}>
                        {formatPrice(item.totalPrice)}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="order-total">
              <span className="order-total-label">Tổng tiền:</span>
              <span className="order-total-value">{formatPrice(order.totalAmount)}</span>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="btn btn-secondary">
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailModal;
