import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './Wishlist.css';

const Wishlist = () => {

  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWishlist();
  }, []);

  // ===============================
  // FETCH WISHLIST
  // ===============================

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

      console.log("Deleting bookId:", bookId);

      await axios.delete(
        `http://localhost:8080/api/wishlist/${bookId}`,
        {
          withCredentials: true
        }
      );

      // Update UI immediately
      setWishlist(prev =>
        prev.filter(item => item.bookId !== bookId)
      );

      console.log("Delete success");

    } catch (error) {

      console.error('Remove wishlist error:', error);

      if (error.response) {
        console.log(error.response.data);
        console.log(error.response.status);
      }

      alert('Xóa thất bại!');
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

              <div
                className="wishlist-card"
                key={item.bookId}
              >

                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="wishlist-image"
                />

                <div className="wishlist-body">

                  <h3 className="wishlist-book-title">
                    {item.title}
                  </h3>

                  <p className="wishlist-author">
                    {item.author}
                  </p>

                  <div className="wishlist-price">
                    {new Intl.NumberFormat('vi-VN')
                      .format(item.price)}đ
                  </div>

                  <div className="wishlist-actions">

                    <Link
                      to={`/books/${item.bookId}`}
                      className="btn-detail"
                    >
                      Xem chi tiết
                    </Link>

                    <button
                      type="button"
                      onClick={() => removeWishlist(item.bookId)}
                      className="btn-remove"
                    >
                      Xóa ❤️
                    </button>

                  </div>

                </div>

              </div>

            ))}

          </div>

        )}

      </div>

    </div>
  );
};

export default Wishlist;