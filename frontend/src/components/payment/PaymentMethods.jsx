import React from 'react';
import './PaymentMethods.css';

const PaymentMethods = ({ 
  paymentMethod, 
  setPaymentMethod, 
  processing, 
  onSimulateMoMo 
}) => {
  return (
    <div className="payment-methods">
      {/* COD Option */}
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

      {/* MoMo Option */}
      <label className={`payment-option ${paymentMethod === 'momo' ? 'active' : ''}`}>
        <div className="payment-icon momo-icon">📱</div>
        <div className="payment-details">
          <div className="payment-name">Thanh Toán MoMo</div>
          <div className="payment-desc">Thanh toán qua ví điện tử MoMo</div>
          
          {onSimulateMoMo && (
            <button 
              type="button" 
              onClick={onSimulateMoMo} 
              className="btn-test-momo"
              disabled={processing}
            >
              {processing ? '🔄 Đang tạo đơn...' : '⚡ Click để Giả lập MoMo Thành Công'}
            </button>
          )}
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

      {/* Credit Card Option */}
      <label className={`payment-option ${paymentMethod === 'default' ? 'active' : ''}`}>
        <div className="payment-icon payment-default-icon">💳</div>
        <div className="payment-details">
          <div className="payment-name">Thẻ Tín Dụng / Ghi Nợ</div>
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
    </div>
  );
};

export default PaymentMethods;
