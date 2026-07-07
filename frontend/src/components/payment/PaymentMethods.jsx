import React from 'react';
import './PaymentMethods.css';

const PaymentMethods = ({ paymentMethod, setPaymentMethod }) => {
  return (
    <div className="payment-methods">
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

      <label className={`payment-option ${paymentMethod === 'vnpay' ? 'active' : ''}`}>
        <div className="payment-icon payment-default-icon">🏦</div>
        <div className="payment-details">
          <div className="payment-name">Thanh Toán Qua VNPay</div>
          <div className="payment-desc">Thanh toán an toàn qua cổng VNPay</div>
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
  );
};

export default PaymentMethods;
