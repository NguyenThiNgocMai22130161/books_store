import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Checkout.css';

const Checkout = () => {
  const navigate = useNavigate();
  
  const [cartItems, setCartItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('default');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:8080/api/cart', {
        withCredentials: true
      });
      
      console.log('Checkout - Cart response:', response.data);
      
      // Backend trả về cartItems, không phải items
      setCartItems(response.data.cartItems || []);
      setTotal(response.data.total || 0);
      
      // Redirect if cart is empty
      if (!response.data.cartItems || response.data.cartItems.length === 0) {
        navigate('/cart');
      }
      
      setError('');
    } catch (err) {
      if (err.response?.status === 401) {
        navigate('/login');
      } else {
        setError(err.response?.data?.message || 'Không thể tải giỏ hàng');
      }
      console.error('Error fetching cart:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    
    try {
      setProcessing(true);
      const response = await axios.post(
        'http://localhost:8080/api/cart/payment',
        { paymentMethod },
        { withCredentials: true }
      );
      
      // Redirect to payment result or external payment gateway
      if (response.data.redirectUrl) {
        window.location.href = response.data.redirectUrl;
      } else {
        window.dispatchEvent(new Event('cart-updated'));
        navigate('/cart/payment-result', { 
          state: { 
            success: true, 
            orderId: response.data.orderId 
          } 
        });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể xử lý thanh toán');
      setProcessing(false);
    }
  };

  const handleSimulateSuccess = () => {
    window.dispatchEvent(new Event('cart-updated'));
    navigate('/cart/payment-result', { 
      state: { 
        success: true, 
        message: 'Thanh toán thành công (Sandbox)',
        orderId: 'TEST-' + Date.now()
      } 
    });
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page">

      {/* Hero Banner */}
      <div className="hero-banner">
        <div className="container">
          <div className="hero-content">
            <h1>🛒 Hoàn Tất Thanh Toán</h1>
            <p>
              <span>✅ An toàn</span>
              <span>🔐 Bảo mật</span>
              <span>⚡ Nhanh chóng</span>
            </p>
          </div>
        </div>
      </div>

      <div className="container">
        {error && (
          <div className="alert alert-danger">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" x2="9" y1="9" y2="15"/>
              <line x1="9" x2="15" y1="9" y2="15"/>
            </svg>
            <span>{error}</span>
          </div>
        )}

        <div className="checkout-wrapper fade-in">
          {/* Left Side: Order Review */}
          <div className="section-card">
            <div className="section-header">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#EE4D2D" strokeWidth="2">
                <path d="M21 8V21H3V8"/>
                <path d="M1 3H23V8H1V3Z"/>
                <path d="M10 12H14"/>
              </svg>
              <h2>Kiểm Tra Đơn Hàng</h2>
            </div>
            <div className="section-content">
              <div className="checkout-items">
                {cartItems.map((item) => (
                  item.book && (
                    <div key={item.id} className="checkout-item">
                      <img 
                        src={item.book.imageUrl || 'https://via.placeholder.com/100x140'} 
                        alt="Book Cover" 
                      />
                      <div className="item-details">
                        <h4>{item.book.title}</h4>
                        <p>Số lượng: <span className="item-quantity">{item.quantity}</span></p>
                        <p className="item-price">{item.book.price?.toLocaleString('vi-VN')} ₫</p>
                      </div>
                    </div>
                  )
                ))}
              </div>

              <div className="summary-section">
                <div className="summary-row">
                  <span>Tạm tính:</span>
                  <span>{total.toLocaleString('vi-VN')} ₫</span>
                </div>
                <div className="summary-row">
                  <span>Phí vận chuyển:</span>
                  <span style={{ color: '#27AE60', fontWeight: 700 }}>Miễn phí</span>
                </div>
                <div className="summary-divider"></div>
                <div className="summary-total">
                  <span className="summary-total-label">Tổng tiền</span>
                  <span className="summary-total-amount">{total.toLocaleString('vi-VN')} ₫</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side: Payment */}
          <div className="section-card">
            <div className="section-header">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#EE4D2D" strokeWidth="2">
                <rect x="2" y="5" width="20" height="14" rx="2"/>
                <line x1="2" y1="10" x2="22" y2="10"/>
              </svg>
              <h2>Thanh Toán</h2>
            </div>
            <div className="section-content">
              <form onSubmit={handlePayment}>
                <div className="payment-methods">
                  <label className={`payment-option ${paymentMethod === 'default' ? 'active' : ''}`}>
                    <div className="payment-icon payment-default-icon">💳</div>
                    <div className="payment-details">
                      <div className="payment-name">Thanh Toán Mặc Định</div>
                      <div className="payment-desc">Phương thức thanh toán qua cổng an toàn</div>
                    </div>
                    <input 
                      type="radio" 
                      name="paymentMethod" 
                      value="default" 
                      checked={paymentMethod === 'default'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="radio-input" 
                    />
                  </label>

                  <label className={`payment-option ${paymentMethod === 'momo' ? 'active' : ''}`}>
                    <div className="payment-icon momo-icon">📱</div>
                    <div className="payment-details">
                      <div className="payment-name">Thanh Toán MoMo</div>
                      <div className="payment-desc">Thanh toán nhanh chóng qua ứng dụng MoMo</div>
                    </div>
                    <input 
                      type="radio" 
                      name="paymentMethod" 
                      value="momo" 
                      checked={paymentMethod === 'momo'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="radio-input" 
                    />
                  </label>
                </div>

                <div className="info-box">
                  <div className="info-box-title">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="12" x2="12" y1="16" y2="12"/>
                      <line x1="12" x2="12.01" y1="8" y2="8"/>
                    </svg>
                    Chế độ Sandbox
                  </div>
                  <div className="info-box-text">
                    Bạn sẽ được chuyển hướng đến cổng thanh toán thử nghiệm. Vui lòng không sử dụng thông tin thẻ thật.
                  </div>
                </div>

                <div className="action-buttons">
                  <button 
                    type="button"
                    onClick={handleSimulateSuccess}
                    className="btn btn-success"
                    disabled={processing}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                      <polyline points="22 4 12 14.01 9 11.01"/>
                    </svg>
                    THỬ THANH TOÁN
                  </button>
                  
                  <Link to="/cart" className="btn btn-secondary">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18"/>
                      <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                    HỦY GIAO DỊCH
                  </Link>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Checkout;
