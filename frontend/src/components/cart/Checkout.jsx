import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import PaymentMethods from '../payment/PaymentMethods';
import PaymentSummary from '../payment/PaymentSummary';
import './Checkout.css';

const Checkout = () => {
  const navigate = useNavigate();
  
  const [cartItems, setCartItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('vnpay');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      setLoading(true);
      const response = await axios.get('https://books-store-backend-production.up.railway.app/api/cart', {
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
  // 🔥 ĐÃ SỬA: Chạy chuẩn luồng tạo Order và xóa Giỏ hàng thông qua API Backend
  const handleSimulateMoMoSuccess = async (e) => {
    e.preventDefault(); // Chặn form submit
    
    try {
      setProcessing(true);
      setError('');

      // 1. Gọi API gửi phương thức 'momo' lên Backend để BE xử lý tạo Order và clear Cart trong DB
      const response = await axios.post(
        'https://books-store-backend-production.up.railway.app/api/cart/payment',
        { paymentMethod: 'momo' },
        { withCredentials: true }
      );
      
      console.log('Giả lập MoMo - BE Response:', response.data);

      // 2. Sau khi Backend xử lý tạo đơn và xóa giỏ hàng thành công, 
      // Điều hướng thẳng sang trang kết quả với dữ liệu thực tế từ hệ thống
      navigate('/cart/payment-result', {
        replace: true,
        state: {
          success: true,
          message: 'Giả lập: Thanh toán qua ví MoMo thành công và đã đồng bộ hệ thống!',
          orderId: response.data.orderId || ('MOMO_' + Date.now()), // Lấy mã đơn thật từ BE trả về
          orderTotal: total, // Tổng tiền thực tế từ giỏ hàng hiện tại
          paymentMethod: 'Cổng thanh toán MoMo (Giả lập)'
        }
      });

    } catch (err) {
      console.error('Lỗi khi giả lập thanh toán MoMo:', err);
      setError(err.response?.data?.message || 'Không thể tạo đơn hàng giả lập MoMo');
    } finally {
      setProcessing(false);
    }
  };
  const handlePayment = async (e) => {
    e.preventDefault();
    
    try {
      setProcessing(true);
      setError(''); // Xóa thông báo lỗi cũ nếu có

      const response = await axios.post(
        'https://books-store-backend-production.up.railway.app/api/cart/payment',
        { paymentMethod }, // Truyền 'cod' hoặc 'momo' hoặc 'default' lên Java
        { withCredentials: true }
      );
      
      console.log('Payment response từ Backend:', response.data);

      if (paymentMethod === 'vnpay') {
        if (response.data?.paymentUrl) {
          window.location.href = response.data.paymentUrl;
          return;
        }
        throw new Error('Không nhận được liên kết thanh toán từ VNPay');
      }

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
        return;
      }

      if (response.data?.redirectUrl) {
        window.location.href = response.data.redirectUrl;
      } else {
        navigate('/cart/payment-result', {
          replace: true,
          state: {
            success: true,
            message: 'Thanh toán thành công qua cổng kết nối!',
            orderId: response.data.orderId || ('COD-' + Date.now()),
            orderTotal: total,
            paymentMethod: 'Thanh toán qua VNPay'
          }
        });
      }
    } catch (err) {
      console.error('Lỗi khi xử lý thanh toán:', err);
      setError(err.response?.data?.message || err.message || 'Không thể xử lý thanh toán');
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
          <PaymentSummary cartItems={cartItems} total={total} />

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
                <PaymentMethods
                  paymentMethod={paymentMethod}
                  setPaymentMethod={setPaymentMethod}
                />

                {/* Box thông báo động tuỳ theo loại thanh toán */}
                <div className="info-box">
                  <div className="info-box-title">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="12" x2="12" y1="16" y2="12"/>
                      <line x1="12" x2="12.01" y1="8" y2="8"/>
                    </svg>
                    {paymentMethod === 'cod' ? 'Thanh toán tại nhà' : 'Lưu ý chuyển hướng'}
                  </div>
                  <div className="info-box-text">
                    {paymentMethod === 'cod' 
                      ? 'Đơn hàng sẽ được xác nhận ngay và bạn chỉ thanh toán khi nhận được sách.' 
                      : 'Bạn sẽ được chuyển hướng đến cổng thanh toán an toàn. Vui lòng không đóng trình duyệt.'}
                  </div>
                </div>

                <div className="action-buttons">
                  <button 
                    type="submit" 
                    className="btn btn-success"
                    disabled={processing}
                    style={{ backgroundColor: paymentMethod === 'cod' ? '#27AE60' : '#2563EB' }}
                  >
                    {processing ? (
                      '⏳ ĐANG XỬ LÝ HỆ THỐNG...'
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                          <polyline points="22 4 12 14.01 9 11.01"/>
                        </svg>
                        {/* Thay đổi chữ linh hoạt theo phương thức lựa chọn */}
                        {paymentMethod === 'cod' && 'ĐẶT HÀNG HOÀN TẤT (COD)'}
                        {paymentMethod === 'vnpay' && 'THANH TOÁN QUA VNPay'}
                      </>
                    )}
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