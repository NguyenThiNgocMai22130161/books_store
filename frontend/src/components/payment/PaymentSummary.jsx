import React from 'react';
import './PaymentSummary.css';

const PaymentSummary = ({ cartItems, total }) => {
  return (
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
                  alt={item.book.title} 
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
  );
};

export default PaymentSummary;
