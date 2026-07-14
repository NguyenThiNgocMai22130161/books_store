import React, { useState } from 'react';
import adminOrderService from '../../services/adminOrderService';
import './AdminOrders.css';

const UpdateStatusModal = ({ order, onClose, onSuccess }) => {
  const [newStatus, setNewStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Define valid next statuses based on current status
  const getAvailableStatuses = (currentStatus) => {
    const transitions = {
      PENDING: [
        { value: 'CONFIRMED', label: '✓ Xác nhận đơn hàng' },
        { value: 'CANCELLED', label: '✗ Hủy đơn hàng' }
      ],
      CONFIRMED: [
        { value: 'PROCESSING', label: '⚙ Chuyển sang xử lý' },
        { value: 'CANCELLED', label: '✗ Hủy đơn hàng' }
      ],
      PROCESSING: [
        { value: 'SHIPPING', label: '🚚 Chuyển sang đang giao' }
      ],
      SHIPPING: [
        { value: 'DELIVERED', label: '✓ Đánh dấu đã giao' }
      ],
      PAID: [
        { value: 'CONFIRMED', label: '✓ Xác nhận đơn hàng' },
        { value: 'PROCESSING', label: '⚙ Chuyển sang xử lý' }
      ]
    };

    return transitions[currentStatus] || [];
  };

  const availableStatuses = getAvailableStatuses(order.status);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!newStatus) {
      setError('Vui lòng chọn trạng thái mới');
      return;
    }

    // Confirm critical actions
    if (newStatus === 'CANCELLED') {
      const confirmCancel = window.confirm(
        'Bạn có chắc chắn muốn hủy đơn hàng này? Hành động này sẽ hoàn kho nếu đơn chưa được xử lý.'
      );
      if (!confirmCancel) return;
    }

    if (newStatus === 'DELIVERED') {
      const confirmDeliver = window.confirm(
        'Xác nhận đơn hàng đã được giao thành công?'
      );
      if (!confirmDeliver) return;
    }

    try {
      setLoading(true);
      setError('');

      await adminOrderService.updateOrderStatus(order.id, newStatus);
      
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Update status error:', err);
      setError(err.response?.data?.error || 'Không thể cập nhật trạng thái');
    } finally {
      setLoading(false);
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
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

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content" style={{ maxWidth: '500px' }}>
        <div className="modal-header">
          <h2>Cập nhật trạng thái đơn hàng</h2>
          <button onClick={onClose} className="modal-close" disabled={loading}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ 
                padding: '1rem', 
                background: '#f9fafb', 
                borderRadius: '8px',
                marginBottom: '1.5rem'
              }}>
                <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                  Mã đơn hàng
                </div>
                <div style={{ fontWeight: 600, color: '#EE4D2D' }}>
                  {order.orderCode}
                </div>
                <div style={{ 
                  fontSize: '0.875rem', 
                  color: '#6b7280', 
                  marginTop: '0.75rem',
                  marginBottom: '0.25rem'
                }}>
                  Trạng thái hiện tại
                </div>
                <div style={{ fontWeight: 600, color: '#1f2937' }}>
                  {getStatusLabel(order.status)}
                </div>
              </div>

              {availableStatuses.length === 0 ? (
                <div style={{ 
                  padding: '1rem', 
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '8px',
                  color: '#dc2626',
                  fontSize: '0.875rem'
                }}>
                  ⚠️ Đơn hàng này không thể thay đổi trạng thái. 
                  Đơn hàng đã {getStatusLabel(order.status).toLowerCase()}.
                </div>
              ) : (
                <>
                  <label style={{ 
                    display: 'block', 
                    fontSize: '0.875rem', 
                    fontWeight: 500,
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Chọn trạng thái mới <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {availableStatuses.map((statusOption) => (
                      <label 
                        key={statusOption.value}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: '1rem',
                          border: newStatus === statusOption.value 
                            ? '2px solid #EE4D2D' 
                            : '1px solid #e5e7eb',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          background: newStatus === statusOption.value 
                            ? 'rgba(238, 77, 45, 0.05)' 
                            : 'white',
                          transition: 'all 0.2s'
                        }}
                      >
                        <input
                          type="radio"
                          name="status"
                          value={statusOption.value}
                          checked={newStatus === statusOption.value}
                          onChange={(e) => {
                            setNewStatus(e.target.value);
                            setError('');
                          }}
                          style={{ marginRight: '0.75rem' }}
                        />
                        <span style={{ fontWeight: 500, color: '#1f2937' }}>
                          {statusOption.label}
                        </span>
                      </label>
                    ))}
                  </div>

                  {newStatus === 'CANCELLED' && (
                    <div style={{ 
                      marginTop: '1rem',
                      padding: '0.875rem', 
                      background: 'rgba(245, 158, 11, 0.1)',
                      border: '1px solid rgba(245, 158, 11, 0.3)',
                      borderRadius: '8px',
                      fontSize: '0.8125rem',
                      color: '#92400e'
                    }}>
                      <strong>Lưu ý:</strong> Hủy đơn hàng sẽ tự động hoàn kho nếu đơn đang ở trạng thái 
                      Chờ xác nhận hoặc Đã xác nhận.
                    </div>
                  )}

                  {newStatus === 'DELIVERED' && (
                    <div style={{ 
                      marginTop: '1rem',
                      padding: '0.875rem', 
                      background: 'rgba(16, 185, 129, 0.1)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      borderRadius: '8px',
                      fontSize: '0.8125rem',
                      color: '#065f46'
                    }}>
                      <strong>Lưu ý:</strong> Đây là trạng thái cuối cùng của đơn hàng. 
                      Sau khi đánh dấu đã giao, không thể thay đổi trạng thái nữa.
                    </div>
                  )}
                </>
              )}
            </div>

            {error && (
              <div style={{ 
                padding: '0.875rem', 
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '8px',
                color: '#dc2626',
                fontSize: '0.875rem',
                marginTop: '1rem'
              }}>
                {error}
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button 
              type="button" 
              onClick={onClose} 
              className="btn btn-secondary"
              disabled={loading}
            >
              Hủy bỏ
            </button>
            {availableStatuses.length > 0 && (
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={loading || !newStatus}
              >
                {loading ? (
                  <>
                    <div className="spinner" style={{ 
                      width: '16px', 
                      height: '16px', 
                      borderWidth: '2px',
                      marginRight: '0.5rem'
                    }}></div>
                    Đang cập nhật...
                  </>
                ) : (
                  'Xác nhận cập nhật'
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdateStatusModal;
