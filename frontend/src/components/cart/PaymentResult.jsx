import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './PaymentResult.css';

const PaymentResult = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [success, setSuccess] = useState(null);
  const [message, setMessage] = useState('');
  const [orderId, setOrderId] = useState('');
  const [orderTotal, setOrderTotal] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Notify navbar that cart has updated/cleared after online payment transaction
    window.dispatchEvent(new Event('cart-updated'));

    // Check if data passed via state (from simulate)
    if (location.state) {
      setSuccess(location.state.success);
      setMessage(location.state.message || (location.state.success ? 'Thanh toán thành công!' : 'Thanh toán thất bại'));
      setOrderId(location.state.orderId || '');
      setOrderTotal(location.state.orderTotal);
      setPaymentMethod(location.state.paymentMethod || 'N/A');
      setLoading(false);
    } else {
      // Check URL params (from real payment gateway callback)
      const params = new URLSearchParams(location.search);
      const successParam = params.get('success');
      const orderIdParam = params.get('orderId');
      const messageParam = params.get('message');
      
      if (successParam !== null) {
        setSuccess(successParam === 'true');
        setMessage(messageParam || (successParam === 'true' ? 'Thanh toán thành công!' : 'Thanh toán thất bại'));
        setOrderId(orderIdParam || '');
        setLoading(false);
      } else {
        // No data available
        setSuccess(false);
        setMessage('Không thể xác nhận kết quả thanh toán');
        setErrorMessage('Vui lòng kiểm tra lại hoặc liên hệ hỗ trợ');
        setLoading(false);
      }
    }

    // Auto-redirect after 10 seconds if successful
    if (success) {
      const timer = setTimeout(() => {
        navigate('/books');
      }, 10000);
      
      return () => clearTimeout(timer);
    }
  }, [location, success, navigate]);

  if (loading) {
    return (
      <div className="container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Đang xác nhận thanh toán...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-result-page">

      <div className="container">
        <div className="payment-result-container">
          {/* Success State */}
          {success === true && (
            <div className="result-success">
              <div className="result-icon">✅</div>
              <div className="result-title">Thanh Toán Thành Công!</div>
              <div className="result-message">{message}</div>
            </div>
          )}

          {/* Failed State */}
          {success === false && (
            <div className="result-failed">
              <div className="result-icon">❌</div>
              <div className="result-title">Thanh Toán Thất Bại</div>
              <div className="result-message">{message}</div>
            </div>
          )}

          {/* Error Messages */}
          {errorMessage && (
            <div className="alert alert-danger">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" x2="9" y1="9" y2="15"/>
                <line x1="9" x2="15" y1="9" y2="15"/>
              </svg>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Order Details (if successful) */}
          {success === true && orderId && (
            <div className="result-details">
              <h3 style={{ color: '#000000', marginTop: 0 }}>📋 Chi Tiết Đơn Hàng</h3>
              <div className="result-details-row">
                <span className="details-label">Mã Đơn Hàng:</span>
                <span className="details-value">{orderId}</span>
              </div>
              {orderTotal && (
                <div className="result-details-row">
                  <span className="details-label">Tổng Tiền:</span>
                  <span className="details-value">{orderTotal.toLocaleString('vi-VN')} ₫</span>
                </div>
              )}
              {paymentMethod && (
                <div className="result-details-row">
                  <span className="details-label">Phương Thức:</span>
                  <span className="details-value">{paymentMethod}</span>
                </div>
              )}
              <div className="result-details-row">
                <span className="details-label">Trạng Thái:</span>
                <span className="details-value" style={{ color: '#10b981' }}>Hoàn Tất</span>
              </div>
            </div>
          )}

          {/* Order Details (basic) */}
          {orderId && !orderTotal && (
            <div className="result-details">
              <p><strong>Mã đơn hàng:</strong> <span>{orderId}</span></p>
              <p><strong>Thời gian:</strong> <span>{new Date().toLocaleString('vi-VN')}</span></p>
              <p><strong>Trạng thái:</strong> 
                <span style={{ color: success ? '#10b981' : '#ef4444', marginLeft: '0.5rem' }}>
                  {success ? 'Thành công' : 'Thất bại'}
                </span>
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="result-actions">
            <Link to="/books" className="btn btn-primary">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ verticalAlign: 'middle', marginRight: '0.5rem' }}>
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
              </svg>
              Tiếp tục mua sắm
            </Link>
            <Link to="/cart" className="btn btn-secondary">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ verticalAlign: 'middle', marginRight: '0.5rem' }}>
                <circle cx="9" cy="21" r="1"/>
                <circle cx="20" cy="21" r="1"/>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
              </svg>
              Xem giỏ hàng
            </Link>
            {success === true && (
              <Link to="/orders" className="btn btn-primary">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ verticalAlign: 'middle', marginRight: '0.5rem' }}>
                  <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
                  <rect x="8" y="2" width="8" height="4"/>
                  <path d="M9 14h6M9 10h6"/>
                </svg>
                Lịch sử mua hàng
              </Link>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};

export default PaymentResult;
