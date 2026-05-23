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
  
  // Thêm state để hiển thị số giây đếm ngược trực quan trên giao diện
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    if (location.state) {
      setSuccess(location.state.success);
      setMessage(location.state.message || (location.state.success ? 'Thanh toán thành công!' : 'Thanh toán thất bại'));
      setOrderId(location.state.orderId || '');
      setOrderTotal(location.state.orderTotal);
      setPaymentMethod(location.state.paymentMethod || 'N/A');
      setLoading(false);
    } else {
      const params = new URLSearchParams(location.search);
      const statusParam = params.get('status'); 
      const orderIdParam = params.get('orderId');
      const messageParam = params.get('message');
      
      if (statusParam !== null) {
        const isSuccess = statusParam === 'success';
        setSuccess(isSuccess);
        
        const decodedMessage = messageParam ? decodeURIComponent(messageParam) : '';
        setMessage(decodedMessage || (isSuccess ? 'Thanh toán thành công!' : 'Thanh toán thất bại'));
        setOrderId(orderIdParam || '');
        setPaymentMethod('Cổng thanh toán MoMo'); 
        setLoading(false);

        // Đẩy vào state để giữ thông tin khi F5
        navigate('/cart/payment-result', { 
          replace: true, 
          state: { 
            success: isSuccess, 
            message: decodedMessage || (isSuccess ? 'Thanh toán thành công!' : 'Thanh toán thất bại'),
            orderId: orderIdParam || '',
            paymentMethod: 'Cổng thanh toán MoMo'
          } 
        });
      } else {
        setSuccess(false);
        setMessage('Không thể xác nhận kết quả thanh toán');
        setErrorMessage('Vui lòng kiểm tra lại hoặc liên hệ hỗ trợ');
        setLoading(false);
      }
    }
  }, [location.search, location.state, navigate]);

  // 🔥 ĐỒNG HỒ ĐẾM NGƯỢC XỊN: Thành công về "Cửa hàng", Thất bại về "Giỏ hàng" để thanh toán lại
  useEffect(() => {
    if (success === null) return;

    const interval = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    const timer = setTimeout(() => {
      if (success === true) {
        navigate('/books'); // Thành công => đi mua tiếp
      } else {
        navigate('/cart');  // Thất bại => về giỏ hàng cày lại đơn
      }
    }, 10000);
    
    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [success, navigate]);

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
    <div>
      <nav className="navbar">
        <div className="container">
          <Link to="/" className="navbar-brand">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
            </svg>
            <span className="brand-text">Tiệm Sách</span>
          </Link>
          <div className="navbar-nav desktop-nav">
            <Link to="/" className="nav-link">Trang chủ</Link>
            <Link to="/books" className="nav-link">Sách</Link>
            <Link to="/cart" className="nav-link cart-link">Giỏ hàng</Link>
          </div>
        </div>
      </nav>

      <div className="container">
        <div className="payment-result-container">
          
          {/* 🟢 Giao diện Thành công */}
          {success === true && (
            <div className="result-success">
              <div className="result-icon">✅</div>
              <div className="result-title">Thanh Toán Thành Công!</div>
              <div className="result-message">{message}</div>
              <div className="redirect-notice">🎉 Tự động chuyển về Trang chủ sách sau <strong>{countdown}</strong> giây...</div>
            </div>
          )}

          {/* 🔴 Giao diện Thất bại nâng cấp nhìn chuyên nghiệp hơn hẳn */}
          {success === false && (
            <div className="result-failed">
              <div className="result-icon">❌</div>
              <div className="result-title" style={{ color: '#ef4444' }}>Thanh Toán Thất Bại hoặc Bị Hủy</div>
              <div className="result-message" style={{ background: '#fef2f2', color: '#991b1b', padding: '10px', borderRadius: '6px', border: '1px solid #fee2e2' }}>
                {message}
              </div>
              <div className="redirect-notice" style={{ color: '#6b7280' }}>🔄 Hệ thống tự động đưa bạn quay lại Giỏ hàng để thử lại sau <strong>{countdown}</strong> giây...</div>
            </div>
          )}

          {errorMessage && (
            <div className="alert alert-danger">
              <span>{errorMessage}</span>
            </div>
          )}

          {/* 📋 Chi tiết đơn hàng hiển thị chi tiết đầy đủ cho cả hai bên */}
          {orderId && (
            <div className="result-details" style={{ marginTop: '20px' }}>
              <h3 style={{ color: '#000000', marginTop: 0, borderBottom: '1px solid #eee', paddingBottom: '8px' }}>📋 Chi Tiết Giao Dịch</h3>
              
              <div className="result-details-row">
                <span className="details-label">Mã Đơn Hàng:</span>
                <span className="details-value" style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{orderId}</span>
              </div>

              <div className="result-details-row">
                <span className="details-label">Thời gian:</span>
                <span className="details-value">{new Date().toLocaleString('vi-VN')}</span>
              </div>

              {/* Nếu luồng MoMo callback không có tổng tiền, ta hiển thị trạng thái "Liên hệ kiểm tra đơn" hoặc ẩn dòng tổng tiền một cách tinh tế */}
              {orderTotal ? (
                <div className="result-details-row">
                  <span className="details-label">Tổng Tiền:</span>
                  <span className="details-value" style={{ color: '#b91c1c', fontWeight: 'bold' }}>{orderTotal.toLocaleString('vi-VN')} ₫</span>
                </div>
              ) : (
                <div className="result-details-row">
                  <span className="details-label">Tổng Tiền:</span>
                  <span className="details-value" style={{ color: '#6b7280', fontStyle: 'italic' }}>Xem chi tiết trong lịch sử đơn</span>
                </div>
              )}

              {paymentMethod && (
                <div className="result-details-row">
                  <span className="details-label">Phương Thức:</span>
                  <span className="details-value">{paymentMethod}</span>
                </div>
              )}

              <div className="result-details-row">
                <span className="details-label">Trạng Thái Hệ Thống:</span>
                <span className="details-value" style={{ 
                  color: success ? '#10b981' : '#ef4444', 
                  fontWeight: 'bold',
                  background: success ? '#ecfdf5' : '#fef2f2',
                  padding: '2px 8px',
                  borderRadius: '4px'
                }}>
                  {success ? 'Giao dịch hoàn tất' : 'Giao dịch thất bại'}
                </span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="result-actions" style={{ marginTop: '25px' }}>
            <Link to="/books" className="btn btn-primary">Tiếp tục mua sắm</Link>
            <Link to="/cart" className="btn btn-secondary">Quay lại giỏ hàng</Link>
            {success === true && (
              <Link to="/orders" className="btn btn-primary" style={{ backgroundColor: '#10b981' }}>Lịch sử mua hàng</Link>
            )}
          </div>
        </div>
      </div>

      <footer className="footer">
        <div className="container">
          <div className="d-flex justify-center gap-3 mb-4">
            <Link to="/books">Sách</Link>
            <Link to="/cart">Giỏ hàng</Link>
            <Link to="/orders">Lịch sử mua hàng</Link>
          </div>
          <p>© 2026 Tiệm Sách. Secure Payment Gateway.</p>
        </div>
      </footer>
    </div>
  );
};

export default PaymentResult;