import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import './CategoryForm.css';

const CategoryForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isDefault: false,
    default: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [charCount, setCharCount] = useState(0);

  useEffect(() => {
    if (isEditMode) {
      fetchCategory();
    }
  }, [id]);

  const fetchCategory = async () => {
    try {
      const response = await axios.get(`http://localhost:8080/api/categories/${id}`, {
        withCredentials: true
      });
      setFormData(response.data);
      setCharCount(response.data.description?.length || 0);
    } catch (err) {
      setError('Không thể tải thông tin danh mục');
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === 'description') {
      setCharCount(value.length);
    }
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isEditMode) {
        await axios.put(`http://localhost:8080/api/categories/${id}`, formData, {
          withCredentials: true
        });
      } else {
        await axios.post('http://localhost:8080/api/categories', formData, {
          withCredentials: true
        });
      }
      navigate('/categories');
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể lưu thông tin danh mục');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: '800px' }}>
        <div className="page-header" style={{ marginTop: '2rem' }}>
          <h1>{isEditMode ? 'Sửa Danh Mục' : 'Thêm Danh Mục'}</h1>
          <p className="text-muted">Quản lý thông tin danh mục để tổ chức sách một cách hệ thống</p>
        </div>

        {!isEditMode && (
          <div className="alert alert-info">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="16" x2="12" y2="12"/>
              <line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
            <span>Tạo danh mục mới để quản lý sách theo chủ đề</span>
          </div>
        )}

        {error && (
          <div className="alert alert-danger">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
            <span>{error}</span>
          </div>
        )}

        <div className="form-card fade-in">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name">
                Tên Danh Mục <span className="required">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="form-control"
                placeholder="Ví dụ: Tiểu thuyết, Khoa học, Lịch sử, Kỹ năng sống..."
                required
                maxLength="100"
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">Mô Tả</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="form-control"
                placeholder="Mô tả chi tiết về danh mục, ví dụ: Các cuốn sách về lịch sử Việt Nam từ thời cổ đại đến nay..."
                rows="4"
                maxLength="500"
              ></textarea>
              <small style={{ color: '#666', marginTop: '0.25rem', display: 'block' }}>
                {charCount}/500 ký tự
              </small>
            </div>

            {!formData.default && (
              <div className="form-group">
                <div className="checkbox-group">
                  <input
                    type="checkbox"
                    id="isDefault"
                    name="isDefault"
                    checked={formData.isDefault}
                    onChange={handleChange}
                  />
                  <label htmlFor="isDefault">
                    Đặt làm danh mục mặc định (Danh mục chưa phân loại)
                  </label>
                </div>
                <small style={{ color: '#666', marginTop: '0.25rem', display: 'block' }}>
                  Các sách không thuộc danh mục nào sẽ được phân vào danh mục này khi xóa danh mục hiện tại.
                </small>
              </div>
            )}

            {formData.default && (
              <div className="form-info">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ verticalAlign: 'middle', marginRight: '0.5rem' }}>
                  <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z"/>
                  <path d="M12 6v6l4 2"/>
                </svg>
                <span>Đây là danh mục mặc định. Không thể thay đổi trạng thái này hoặc xóa danh mục.</span>
              </div>
            )}

            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={loading}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                  <polyline points="17 21 17 13 7 13 7 21"/>
                  <polyline points="7 3 7 8 15 8"/>
                </svg>
                {loading ? 'Đang lưu...' : (isEditMode ? 'Cập nhật' : 'Tạo Danh Mục')}
              </button>
              <Link to="/categories" className="btn btn-secondary">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 15l-6-6-6 6"/>
                  <path d="M5 21h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2z"/>
                </svg>
                Quay Lại
              </Link>
            </div>
          </form>
        </div>
    </div>
  );
};

export default CategoryForm;
