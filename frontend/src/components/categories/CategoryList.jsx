import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './CategoryList.css';

const CategoryList = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axios.get('http://localhost:8080/api/categories', {
        withCredentials: true
      });
      setCategories(response.data);
    } catch (err) {
      setErrorMessage('Không thể tải danh sách danh mục');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, isDefault) => {
    if (isDefault) {
      alert('Không thể xóa danh mục mặc định!');
      return;
    }

    const confirmed = window.confirm(
      '⚠️ Bạn có chắc chắn muốn xóa danh mục này?\n\nCác sách trong danh mục này sẽ được chuyển sang danh mục chưa phân loại.\n\nHành động này không thể hoàn tác!'
    );

    if (confirmed) {
      try {
        await axios.delete(`http://localhost:8080/api/categories/${id}`, {
          withCredentials: true
        });
        setSuccessMessage('Xóa danh mục thành công!');
        fetchCategories();
        setTimeout(() => setSuccessMessage(''), 3000);
      } catch (err) {
        setErrorMessage(err.response?.data?.message || 'Không thể xóa danh mục');
        setTimeout(() => setErrorMessage(''), 3000);
      }
    }
  };

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner"></div>
        <p>Đang tải danh mục...</p>
      </div>
    );
  }

  return (
    <div>
      <nav className="navbar">
        <div className="container">
          <Link to="/" className="navbar-brand">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
            </svg>
            Tiệm Sách
          </Link>
          <div className="navbar-nav">
            <Link to="/books">Sách</Link>
            <Link to="/categories" className="active">Danh Mục</Link>
            <Link to="/login" className="text-muted">Đăng xuất</Link>
          </div>
        </div>
      </nav>

      <div className="container">
        <div className="page-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1>
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ verticalAlign: 'middle', marginRight: '0.5rem' }}>
                  <path d="M22 19a2 2 0 0 1-2.414-.646l-5.106-6.564A2 2 0 0 0 9.172 11H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5a2 2 0 0 0 1.972 1.568"/>
                  <path d="M14 12v8m4-4l4-4m0 0l-4-4"/>
                </svg>
                Quản Lý Danh Mục
              </h1>
              <p className="text-muted">
                {categories.length} danh mục | Tổ chức và quản lý các danh mục sách
              </p>
            </div>
            <Link to="/categories/add" className="btn btn-primary">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Thêm Danh Mục Mới
            </Link>
          </div>
        </div>

        {successMessage && (
          <div className="alert alert-success fade-in">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="alert alert-danger fade-in">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
            <span>{errorMessage}</span>
          </div>
        )}

        {categories.length === 0 ? (
          <div className="empty-state">
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
              <line x1="9" y1="9" x2="15" y2="9"/>
              <line x1="9" y1="15" x2="15" y2="15"/>
            </svg>
            <h3>Chưa có danh mục nào</h3>
            <p>Hãy tạo danh mục mới để bắt đầu quản lý sách của bạn</p>
            <Link to="/categories/add" className="btn btn-primary">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Tạo Danh Mục Đầu Tiên
            </Link>
          </div>
        ) : (
          <div className="category-grid">
            {categories.map((category) => (
              <div key={category.id} className="category-card">
                <div className="category-header">
                  <h3 className="category-name">{category.name}</h3>
                  {category.default ? (
                    <span className="category-badge badge-default">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                      </svg>
                      Mặc Định
                    </span>
                  ) : (
                    <span className="category-badge badge-normal">Bình Thường</span>
                  )}
                </div>

                {category.description ? (
                  <div className="category-description">{category.description}</div>
                ) : (
                  <div className="category-description empty">Không có mô tả</div>
                )}

                <div className="action-buttons">
                  <Link to={`/categories/edit/${category.id}`} className="btn-sm btn-edit">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 20h9"/>
                      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19H4v-3L16.5 3.5z"/>
                    </svg>
                    Sửa
                  </Link>
                  {category.default ? (
                    <button className="btn-sm" disabled>
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="12" y1="8" x2="12" y2="12"/>
                        <line x1="12" y1="16" x2="12.01" y2="16"/>
                      </svg>
                      Không xóa
                    </button>
                  ) : (
                    <button onClick={() => handleDelete(category.id, category.default)} className="btn-sm btn-delete">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        <line x1="10" y1="11" x2="10" y2="17"/>
                        <line x1="14" y1="11" x2="14" y2="17"/>
                      </svg>
                      Xóa
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <footer className="footer">
        <div className="container">
          <div className="footer-links">
            <Link to="/books">Sách</Link>
            <Link to="/cart">Giỏ hàng</Link>
            <Link to="/orders">Lịch sử mua hàng</Link>
            <Link to="/user/profile">Tài khoản</Link>
          </div>
          <p>© 2026 Tiệm Sách. Quản lý danh mục sách.</p>
        </div>
      </footer>
    </div>
  );
};

export default CategoryList;
