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
  
  // Số giây đếm ngược trực quan trên giao diện
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    // 1. Kiểm tra nếu dữ liệu đã được lưu trong Router State (Do chuyển hướng nội bộ hoặc sau khi làm sạch URL)
    if (location.state && location.state.hasData) {
      setSuccess(location.state.success);
      setMessage(location.state.message);
      setOrderId(location.state.orderId);
      setOrderTotal(location.state.orderTotal);
      setPaymentMethod(location.state.paymentMethod);
      setErrorMessage(location.state.errorMessage || '');
      setLoading(false);
    } else {
      // 2. Trích xuất dữ liệu từ URL do Backend Spring Boot Redirect về lần đầu tiên
      const params = new URLSearchParams(location.search);
      const statusParam = params.get('status'); 
      const orderIdParam = params.get('orderId');
      const messageParam = params.get('message');
      const methodParam = params.get('paymentMethod');
      
      if (statusParam !== null) {
        const isSuccess = statusParam === 'success';
        const decodedMessage = messageParam ? decodeURIComponent(messageParam) : '';
        
        let displayMethod = 'Cổng thanh toán điện tử';
        if (methodParam === 'vnpay' || (orderIdParam && orderIdParam.startsWith('VNP_'))) {
          displayMethod = 'Cổng thanh toán VNPay';
        } else if (methodParam === 'momo') {
          displayMethod = 'Cổng thanh toán MoMo';
        }

        let displayError = '';
        if (statusParam === 'invalid_signature') {
          displayError = 'Hệ thống phát hiện chữ ký không khớp an toàn (Giao dịch không hợp lệ).';
        } else if (statusParam === 'cancel') {
          displayError = 'Giao dịch đã bị hủy theo yêu cầu của bạn.';
        } else if (!isSuccess) {
          displayError = 'Giao dịch không thành công. Vui lòng kiểm tra lại số dư hoặc tài khoản ngân hàng.';
        }

        // Cập nhật State hiện tại để hiển thị ngay lập tức
        setSuccess(isSuccess);
        setMessage(decodedMessage || (isSuccess ? 'Thanh toán thành công!' : 'Thanh toán thất bại.'));
        setOrderId(orderIdParam || '');
        setPaymentMethod(displayMethod);
        setErrorMessage(displayError);
        setLoading(false);

        // 💡 GIẢI PHÁP CHỐNG LẶP VÀ FIX LỖI F5: 
        // Đẩy thông tin vào Route State và ĐỔI URL thành dạng sạch (không còn ?status=...)
        // Khi user ấn F5, location.search sẽ rỗng và app sẽ ăn vào nhánh `location.state` ở trên, không bị mất data!
        navigate('/cart/payment-result', { 
          replace: true, 
          state: { 
            hasData: true,
            success: isSuccess, 
            message: decodedMessage || (isSuccess ? 'Thanh toán thành công!' : 'Thanh toán thất bại.'),
            orderId: orderIdParam || '',
            orderTotal: null, // Đơn hàng vnpay-return từ backend chưa trả kèm tổng tiền, có thể bổ sung sau nếu cần
            paymentMethod: displayMethod,
            errorMessage: displayError
          } 
        });
      } else {
        // Trường hợp người dùng tự gõ URL bừa bãi mà không qua luồng thanh toán
        setSuccess(false);
        setMessage('Không tìm thấy thông tin xác nhận kết quả giao dịch');
        setErrorMessage('Truy cập không hợp lệ hoặc phiên giao dịch đã hết hạn.');
        setLoading(false);
      }
    }
  }, [location.search, location.state, navigate]);

  // Bộ đếm ngược chuyển trang tự động
  useEffect(() => {
    if (success === null) return;

    const interval = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    const timer = setTimeout(() => {
      if (success === true) {
        navigate('/books'); // Thành công => Quay lại cửa hàng tìm mua tiếp
      } else {
        navigate('/cart');  // Thất bại => Quay lại giỏ hàng để có thể đổi phương thức/thử lại
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
        <div className="loading-spinner" style={{ textAlign: 'center', marginTop: '100px' }}>
          <div className="spinner"></div>
          <p style={{ marginTop: '15px', color: '#4b5563' }}>Đang xác nhận kết quả từ cổng thanh toán...</p>
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
        <div className="payment-result-container" style={{ maxWidth: '600px', margin: '40px auto', padding: '20px' }}>
          
          {/* Giao diện Thành công */}
          {success === true && (
            <div className="result-success" style={{ textAlign: 'center' }}>
              <div className="result-icon" style={{ fontSize: '54px', marginBottom: '10px' }}>✅</div>
              <div className="result-title" style={{ color: '#10b981', fontWeight: 'bold', fontSize: '26px' }}>Thanh Toán Thành Công!</div>
              <div className="result-message" style={{ margin: '15px 0', color: '#374151', fontSize: '16px' }}>{message}</div>
              <div className="redirect-notice" style={{ color: '#6b7280', marginBottom: '20px' }}>🎉 Tự động chuyển về Cửa hàng sau <strong>{countdown}</strong> giây...</div>
            </div>
          )}

          {/* Giao diện Thất bại */}
          {success === false && (
            <div className="result-failed" style={{ textAlign: 'center' }}>
              <div className="result-icon" style={{ fontSize: '54px', marginBottom: '10px' }}>❌</div>
              <div className="result-title" style={{ color: '#ef4444', fontWeight: 'bold', fontSize: '26px' }}>Thanh Toán Thất Bại</div>
              <div className="result-message" style={{ background: '#fef2f2', color: '#991b1b', padding: '14px', borderRadius: '6px', border: '1px solid #fee2e2', margin: '15px 0', textAlign: 'left' }}>
                {message}
              </div>
              <div className="redirect-notice" style={{ color: '#6b7280', marginBottom: '20px' }}>🔄 Hệ thống tự động đưa bạn quay lại Giỏ hàng để thử lại sau <strong>{countdown}</strong> giây...</div>
            </div>
          )}

          {errorMessage && (
            <div className="alert alert-danger" style={{ marginTop: '15px', color: '#b91c1c', background: '#fef2f2', padding: '12px', borderRadius: '6px', border: '1px solid #fee2e2', fontSize: '14px' }}>
              <span>⚠️ {errorMessage}</span>
            </div>
          )}

          {/* Chi tiết đơn hàng hiển thị động */}
          {orderId && (
            <div className="result-details" style={{ marginTop: '25px', background: '#f9fafb', padding: '25px', borderRadius: '8px', border: '1px solid #f3f4f6' }}>
              <h3 style={{ color: '#1f2937', marginTop: 0, borderBottom: '1px solid #e5e7eb', paddingBottom: '10px', fontSize: '18px' }}>📋 Chi Tiết Giao Dịch</h3>
              
              {/* SỬA LỖI GIÁ TRỊ CSS: 'space-between' thay vì 'between' */}
              <div className="result-details-row" style={{ display: 'flex', justifyContent: 'space-between', margin: '12px 0' }}>
                <span className="details-label" style={{ color: '#4b5563' }}>Mã Đơn Hàng:</span>
                <span className="details-value" style={{ fontFamily: 'monospace', fontWeight: 'bold', color: '#111827' }}>{orderId}</span>
              </div>

              <div className="result-details-row" style={{ display: 'flex', justifyContent: 'space-between', margin: '12px 0' }}>
                <span className="details-label" style={{ color: '#4b5563' }}>Thời gian phản hồi:</span>
                <span className="details-value" style={{ color: '#111827' }}>{new Date().toLocaleString('vi-VN')}</span>
              </div>

              {orderTotal ? (
                <div className="result-details-row" style={{ display: 'flex', justifyContent: 'space-between', margin: '12px 0' }}>
                  <span className="details-label" style={{ color: '#4b5563' }}>Tổng Tiền:</span>
                  <span className="details-value" style={{ color: '#b91c1c', fontWeight: 'bold' }}>{orderTotal.toLocaleString('vi-VN')} ₫</span>
                </div>
              ) : (
                <div className="result-details-row" style={{ display: 'flex', justifyContent: 'space-between', margin: '12px 0' }}>
                  <span className="details-label" style={{ color: '#4b5563' }}>Tổng Tiền:</span>
                  <span className="details-value" style={{ color: '#6b7280', fontStyle: 'italic', fontSize: '14px' }}>Xem chi tiết tại lịch sử đơn hàng</span>
                </div>
              )}

              {paymentMethod && (
                <div className="result-details-row" style={{ display: 'flex', justifyContent: 'space-between', margin: '12px 0' }}>
                  <span className="details-label" style={{ color: '#4b5563' }}>Phương Thức:</span>
                  <span className="details-value" style={{ fontWeight: '500', color: '#111827' }}>{paymentMethod}</span>
                </div>
              )}

              <div className="result-details-row" style={{ display: 'flex', justifyContent: 'space-between', margin: '12px 0' }}>
                <span className="details-label" style={{ color: '#4b5563' }}>Trạng Thái Hệ Thống:</span>
                <span className="details-value" style={{ 
                  color: success ? '#10b981' : '#ef4444', 
                  fontWeight: 'bold',
                  background: success ? '#ecfdf5' : '#fef2f2',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}>
                  {success ? 'Giao dịch hoàn tất' : 'Giao dịch thất bại'}
                </span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="result-actions" style={{ marginTop: '30px', display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <Link to="/books" className="btn btn-primary" style={{ padding: '10px 20px', borderRadius: '6px', textDecoration: 'none', backgroundColor: '#2563eb', color: '#ffffff', fontWeight: '500' }}>Tiếp tục mua sắm</Link>
            <Link to="/cart" className="btn btn-secondary" style={{ padding: '10px 20px', borderRadius: '6px', textDecoration: 'none', background: '#e5e7eb', color: '#374151', fontWeight: '500' }}>Quay lại giỏ hàng</Link>
            {success === true && (
              <Link to="/orders" className="btn btn-success" style={{ padding: '10px 20px', borderRadius: '6px', textDecoration: 'none', backgroundColor: '#10b981', color: '#ffffff', fontWeight: '500' }}>Lịch sử mua hàng</Link>
            )}
          </div>
        </div>
      </div>

      <footer className="footer" style={{ marginTop: '80px', padding: '25px 0', borderTop: '1px solid #e5e7eb', textAlign: 'center', color: '#6b7280', fontSize: '14px' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '10px' }}>
            <Link to="/books" style={{ color: '#4b5563', textDecoration: 'none' }}>Sách</Link>
            <Link to="/cart" style={{ color: '#4b5563', textDecoration: 'none' }}>Giỏ hàng</Link>
            <Link to="/orders" style={{ color: '#4b5563', textDecoration: 'none' }}>Lịch sử mua hàng</Link>
          </div>
          <p>© 2026 Tiệm Sách. Secure Payment Gateway.</p>
        </div>
      </footer>
    </div>
  );
};

export default PaymentResult;