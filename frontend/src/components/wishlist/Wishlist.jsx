import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './Wishlist.css';

const Wishlist = () => {

  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);

  // ===============================
  // FETCH WISHLIST
  // ===============================

  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {

    try {

      const response = await axios.get(
        'http://localhost:8080/api/wishlist',
        {
          withCredentials: true
        }
      );

      console.log("Wishlist data:", response.data);

      setWishlist(response.data || []);

    } catch (error) {

      console.error('Wishlist error:', error);

    } finally {

      setLoading(false);

    }
  };

  // ===============================
  // REMOVE WISHLIST
  // ===============================

  const removeWishlist = async (bookId) => {
    try {
      await axios.delete(
        `http://localhost:8080/api/wishlist/${bookId}`,
        { withCredentials: true }
      );
      setWishlist(prev => prev.filter(item => item.bookId !== bookId));
    } catch (error) {
      console.error('Remove wishlist error:', error);
    }
  };

  // ===============================
  // ADD TO CART
  // ===============================

  const handleAddToCart = async (bookId) => {
    try {
      await axios.post(
        'http://localhost:8080/api/cart/add',
        { bookId: String(bookId), quantity: 1 },
        { headers: { 'Content-Type': 'application/json' }, withCredentials: true }
      );
    } catch (error) {
      console.error('Add cart error:', error);
    }
  };

  // ===============================
  // LOADING
  // ===============================

  if (loading) {

    return (

      <div className="wishlist-loading">

        <div className="spinner"></div>

        <p>Đang tải danh sách yêu thích...</p>

      </div>

    );
  }

  // ===============================
  // UI
  // ===============================

  return (

    <div className="wishlist-page">

      <div className="container">

        <h1 className="wishlist-title">
          ❤️ Danh sách yêu thích
        </h1>

        {wishlist.length === 0 ? (

          <div className="wishlist-empty">

            <h3>Chưa có sách yêu thích</h3>

            <Link
              to="/books"
              className="btn-shop"
            >
              Khám phá sách
            </Link>

          </div>

        ) : (

          <div className="wishlist-grid">

            {wishlist.map(item => (

              <Link
                to={`/books/${item.bookId}`}
                className="wishlist-card"
                key={item.bookId}
              >

                {/* IMAGE */}
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="wishlist-image"
                />

                {/* BODY */}
                <div className="wishlist-body">

                  <h3 className="wishlist-book-title">
                    {item.title}
                  </h3>

                  <div className="wishlist-meta">
                    <p className="wishlist-author">
                      {item.author}
                    </p>
                    <div className="wishlist-price">
                      {new Intl.NumberFormat('vi-VN').format(item.price)}đ
                    </div>
                  </div>

                  {/* ACTIONS */}
                  <div className="wishlist-actions">

                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        handleAddToCart(item.bookId);
                      }}
                      className="btn-cart"
                    >
                      Thêm vào giỏ
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        removeWishlist(item.bookId);
                      }}
                      className="btn-remove"
                    >
                      Loại bỏ
                    </button>

                  </div>

                </div>

              </Link>

            ))}

          </div>

        )}

      </div>

    </div>
  );
};

export default Wishlist;