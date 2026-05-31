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
  const [paymentMethod, setPaymentMethod] = useState('cod'); // Mặc định COD
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
      
      setCartItems(response.data.cartItems || []);
      setTotal(response.data.total || 0);
      
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
      setError(''); 

      const response = await axios.post(
        'http://localhost:8080/api/cart/payment',
        { paymentMethod }, 
        { withCredentials: true }
      );
      
      console.log('Payment response từ Backend:', response.data);

      // --- TRƯỜNG HỢP 1: XỬ LÝ CHUYỂN HƯỚNG SANG VNPAY ---
      if (paymentMethod === 'vnpay') {
        const paymentUrl = response.data.paymentUrl;
        if (paymentUrl) {
          // Code này ĐÃ ĐÚNG. Chuyển hướng trực tiếp sang VNPay.
          window.location.href = paymentUrl; 
          return;
        } else {
          throw new Error('Không nhận được liên kết thanh toán từ cổng VNPay');
        }
      }
      
      // --- TRƯỜNG HỢP 2: XỬ LÝ COD ---
      if (paymentMethod === 'cod') {
        navigate('/cart/payment-result', { 
          replace: true,
          state: { 
            success: true, 
            message: 'Đặt hàng thành công! Đơn hàng của bạn đã được ghi nhận hệ thống dưới hình thức COD.', 
            orderId: response.data.orderId || ('COD-' + Date.now()),
            orderTotal: total, 
            paymentMethod: 'Thanh toán khi nhận hàng (COD)'
          } 
        });
      }

    } catch (err) {
      console.error('Lỗi khi xử lý thanh toán:', err);
      setError(err.response?.data?.message || err.message || 'Không thể xử lý giao dịch');
    } finally {
      setProcessing(false);
    }
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
            <span>{error}</span>
          </div>
        )}

        <div className="checkout-wrapper fade-in">
          {/* Cột trái: Xem lại đơn hàng */}
          <div className="section-card">
            <div className="section-header">
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

          {/* Cột phải: Chọn Phương Thức Thanh Toán */}
          <div className="section-card">
            <div className="section-header">
              <h2>Thanh Toán</h2>
            </div>
            <div className="section-content">
              <form onSubmit={handlePayment}>
                <div className="payment-methods">

                  {/* Lựa chọn COD */}
                  <label className={`payment-option ${paymentMethod === 'cod' ? 'active' : ''}`}>
                    <div className="payment-icon cod-icon">🚚</div>
                    <div className="payment-details">
                      <div className="payment-name">Thanh Toán Khi Nhận Hàng (COD)</div>
                      <div className="payment-desc">Thanh toán bằng tiền mặt khi giao hàng</div>
                    </div>
                    <input 
                      type="radio" 
                      name="paymentMethod" 
                      value="cod" 
                      checked={paymentMethod === 'cod'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="radio-input" 
                    />
                  </label>

                  {/* Lựa chọn VNPay */}
                  <label className={`payment-option ${paymentMethod === 'vnpay' ? 'active' : ''}`}>
                    <div className="payment-icon vnpay-icon" style={{ fontSize: '20px', fontWeight: 'bold', color: '#005baa' }}>🇻🇳</div>
                    <div className="payment-details">
                      <div className="payment-name">Cổng Thanh Toán VNPay</div>
                      <div className="payment-desc">Thanh toán qua ATM, Thẻ quốc tế, ứng dụng ngân hàng</div>
                    </div>
                    <input 
                      type="radio" 
                      name="paymentMethod" 
                      value="vnpay" 
                      checked={paymentMethod === 'vnpay'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="radio-input" 
                    />
                  </label>

                </div>

                <div className="info-box">
                  <div className="info-box-title">
                    {paymentMethod === 'cod' ? 'Thanh toán tại nhà' : 'Chuyển hướng VNPay Sandbox'}
                  </div>
                  <div className="info-box-text">
                    {paymentMethod === 'cod' && 'Đơn hàng sẽ được tạo lập ngay và bạn chỉ cần trả tiền khi bưu tá giao sách.'}
                    {paymentMethod === 'vnpay' && 'Bạn sẽ được chuyển sang cổng VNPay. Vui lòng sử dụng Thẻ thử nghiệm Ngân hàng NCB để thực hiện.'}
                  </div>
                </div>

                <div className="action-buttons">
                  <button 
                    type="submit" 
                    className="btn btn-success"
                    disabled={processing}
                    style={{ backgroundColor: paymentMethod === 'cod' ? '#27AE60' : '#005baa' }} 
                  >
                    {processing ? (
                      '⏳ ĐANG XỬ LÝ HỆ THỐNG...'
                    ) : (
                      <>
                        {paymentMethod === 'cod' ? 'ĐẶT HÀNG HOÀN TẤT (COD)' : 'TIẾP TỤC QUA CỔNG VNPAY'}
                      </>
                    )}
                  </button>
                  
                  <Link to="/cart" className="btn btn-secondary">
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