import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Cart.css';

const Cart = () => {
  const navigate = useNavigate();
  
  const [cartItems, setCartItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchCart(true); // Show spinner only on initial load
  }, []);

  const fetchCart = async (showSpinner = false) => {
    try {
      if (showSpinner) setLoading(true);
      console.log('Fetching cart...');
      
      const response = await axios.get('https://books-store-backend-production.up.railway.app/api/cart', {
        withCredentials: true
      });
      
      console.log('Cart response:', response.data);
      
      // Backend trả về cartItems, không phải items
      setCartItems(response.data.cartItems || []);
      setTotal(response.data.total || 0);
      setError('');
      
      console.log('Cart items:', response.data.cartItems);
    } catch (err) {
      if (err.response?.status === 401) {
        navigate('/login');
      } else {
        setError(err.response?.data?.message || 'Không thể tải giỏ hàng');
      }
      console.error('Error fetching cart:', err);
    } finally {
      if (showSpinner) setLoading(false);
    }
  };

  const handleUpdateQuantity = async (itemId, newQuantity) => {
    if (newQuantity < 1) return;

    // Optimistic Update: Update state instantly for fluid user experience
    const oldItems = [...cartItems];
    const oldTotal = total;

    const updatedItems = cartItems.map(item => {
      if (item.id === itemId) {
        return { ...item, quantity: newQuantity };
      }
      return item;
    });
    setCartItems(updatedItems);

    // Calculate optimistic total
    const newTotal = updatedItems.reduce((sum, item) => sum + (item.book?.price * item.quantity || 0), 0);
    setTotal(newTotal);

    try {
      console.log('Updating quantity - itemId:', itemId, 'newQuantity:', newQuantity);
      
      await axios.put(
        `https://books-store-backend-production.up.railway.app/api/cart/update/${itemId}`,
        { quantity: newQuantity },
        { withCredentials: true }
      );
      
      // Update navbar count immediately
      window.dispatchEvent(new Event('cart-updated'));

      // Silent background sync
      const response = await axios.get('https://books-store-backend-production.up.railway.app/api/cart', {
        withCredentials: true
      });
      setCartItems(response.data.cartItems || []);
      setTotal(response.data.total || 0);
    } catch (err) {
      console.error('Error updating quantity:', err);
      setError(err.response?.data?.error || 'Không thể cập nhật số lượng');
      
      // Rollback to previous state on failure
      setCartItems(oldItems);
      setTotal(oldTotal);
    }
  };

  const handleRemoveItem = async (itemId) => {
    if (!window.confirm('Xóa sản phẩm này?')) {
      return;
    }

    // Optimistic Update: Remove state instantly
    const oldItems = [...cartItems];
    const oldTotal = total;

    const updatedItems = cartItems.filter(item => item.id !== itemId);
    setCartItems(updatedItems);

    const newTotal = updatedItems.reduce((sum, item) => sum + (item.book?.price * item.quantity || 0), 0);
    setTotal(newTotal);

    try {
      await axios.delete(`https://books-store-backend-production.up.railway.app/api/cart/remove/${itemId}`, {
        withCredentials: true
      });
      
      window.dispatchEvent(new Event('cart-updated'));

      // Silent background sync
      const response = await axios.get('https://books-store-backend-production.up.railway.app/api/cart', {
        withCredentials: true
      });
      setCartItems(response.data.cartItems || []);
      setTotal(response.data.total || 0);
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể xóa sản phẩm');
      // Rollback on failure
      setCartItems(oldItems);
      setTotal(oldTotal);
    }
  };

  const handleClearCart = async () => {
    if (!window.confirm('Xóa toàn bộ giỏ hàng?')) {
      return;
    }

    // Optimistic Update
    const oldItems = [...cartItems];
    const oldTotal = total;

    setCartItems([]);
    setTotal(0);

    try {
      await axios.delete('https://books-store-backend-production.up.railway.app/api/cart/clear', {
        withCredentials: true
      });
      
      window.dispatchEvent(new Event('cart-updated'));

      // Silent background sync
      const response = await axios.get('https://books-store-backend-production.up.railway.app/api/cart', {
        withCredentials: true
      });
      setCartItems(response.data.cartItems || []);
      setTotal(response.data.total || 0);
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể xóa giỏ hàng');
      // Rollback on failure
      setCartItems(oldItems);
      setTotal(oldTotal);
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Đang tải giỏ hàng...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
        <div className="page-header" style={{ marginTop: '2rem' }}>
          <h1>Giỏ hàng của bạn</h1>
          <p className="text-muted">Kiểm tra lại các sản phẩm trước khi thanh toán</p>
        </div>

        {successMessage && (
          <div className="alert alert-success">
{/*             <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"> */}
{/*               <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/> */}
{/*               <polyline points="22 4 12 14.01 9 11.01"/> */}
{/*             </svg> */}
            <span>{successMessage}</span>
          </div>
        )}

        {error && (
          <div className="alert alert-danger">
{/*             <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"> */}
{/*               <circle cx="12" cy="12" r="10"/> */}
{/*               <line x1="15" x2="9" y1="9" y2="15"/> */}
{/*               <line x1="9" x2="15" y1="9" y2="15"/> */}
{/*             </svg> */}
            <span>{error}</span>
          </div>
        )}

        <div className="cart-container fade-in">
          {cartItems.length === 0 ? (
            <div className="empty-state-cart">
              <svg xmlns="" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                <circle cx="9" cy="21" r="1"/>
                <circle cx="20" cy="21" r="1"/>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
              </svg>
              <h3>Giỏ hàng đang trống</h3>
              <p className="text-muted" style={{ marginBottom: '2rem' }}>Có vẻ như bạn chưa chọn được cuốn sách nào ưng ý.</p>
              <Link to="/books" className="btn btn-primary">Khám phá cửa hàng ngay</Link>
            </div>
          ) : (
            <>
              {cartItems.map((item) => (
                item.book && (
                  <div key={item.id} className="cart-item">
                    <div className="cart-item-image">
                      {item.book.imageUrl ? (
                        <img src={item.book.imageUrl} alt="Sách" />
                      ) : (
                        <div style={{ width: '100px', height: '130px', background: '#F9F9F9', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px' }}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#EEEEEE" strokeWidth="2">
                            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                          </svg>
                        </div>
                      )}
                    </div>

                    <div className="cart-item-info">
                      <div className="title">{item.book.title}</div>
                      <div className="author">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                          <circle cx="12" cy="7" r="4"/>
                        </svg>
                        <span>{item.book.author}</span>
                      </div>
                    </div>

                    <div className="cart-item-price">
                      {item.book.price?.toLocaleString('vi-VN')} ₫
                    </div>

                    <div className="quantity-control">
                      <button 
                        onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                      >
                        -
                      </button>
                      <input 
                        type="number" 
                        className="quantity-input" 
                        value={item.quantity}
                        onChange={(e) => {
                          const newQty = parseInt(e.target.value) || 1;
                          if (newQty > 0) {
                            handleUpdateQuantity(item.id, newQty);
                          }
                        }}
                        min="1"
                      />
                      <button onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}>
                        +
                      </button>
                    </div>

                    <div className="cart-item-remove">
                      <button 
                        onClick={() => handleRemoveItem(item.id)}
                        className="btn-remove"
                        title="Xóa khỏi giỏ hàng"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6"/>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                )
              ))}

              <div className="cart-summary">
                <div className="summary-row">
                  <div className="total-label">Tổng cộng tạm tính:</div>
                  <div className="total-amount">{total.toLocaleString('vi-VN')} ₫</div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem' }}>
                  <button 
                    onClick={handleClearCart}
                    className="btn btn-secondary" 
                    style={{ background: 'transparent', border: '1px solid #EEEEEE', color: '#000000' }}
                  >
                    Xóa tất cả
                  </button>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <Link to="/books" className="btn btn-secondary" style={{ background: 'transparent', border: '1px solid #EEEEEE', color: '#000000' }}>
                      Tiếp tục mua sắm
                    </Link>
                    <Link to="/cart/checkout" className="btn btn-primary" style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem' }}>
                      Thanh toán ngay
                    </Link>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
    </div>
  );
};

export default Cart;
