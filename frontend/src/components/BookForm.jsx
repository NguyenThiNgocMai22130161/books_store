import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import './BookForm.css';

const BookForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [formData, setFormData] = useState({
    title: '',
    author: '',
    category: '',
    price: '',
    quantity: '',
    description: '',
    imageUrl: '',
    year: ''
  });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCategories();
    if (isEditMode) {
      fetchBook();
    }
  }, [id]);

  const fetchCategories = async () => {
    try {
      const response = await axios.get('http://localhost:8080/api/categories', {
        withCredentials: true
      });
      setCategories(response.data);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const fetchBook = async () => {
    try {
      const response = await axios.get(`http://localhost:8080/api/books/${id}`, {
        withCredentials: true
      });
      setFormData(response.data);
    } catch (err) {
      setError('Không thể tải thông tin sách');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Chuẩn bị data với đúng type
    const bookData = {
      ...formData,
      price: parseFloat(formData.price) || 0,
      quantity: parseInt(formData.quantity) || 0,
      year: formData.year ? parseInt(formData.year) : null
    };

    console.log('Submitting book data:', bookData);

    try {
      if (isEditMode) {
        const response = await axios.put(`http://localhost:8080/api/books/${id}`, bookData, {
          withCredentials: true
        });
        console.log('Update response:', response.data);
      } else {
        const response = await axios.post('http://localhost:8080/api/books', bookData, {
          withCredentials: true
        });
        console.log('Create response:', response.data);
      }
      navigate('/books');
    } catch (err) {
      console.error('Error submitting book:', err);
      console.error('Error response:', err.response?.data);
      setError(err.response?.data?.message || err.response?.data?.error || 'Không thể lưu thông tin sách');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <nav className="navbar">
        <div className="container">
          <Link to="/" className="navbar-brand">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
            </svg>
            Tiệm Sách
          </Link>
          <div className="navbar-nav">
            <Link to="/books">Sách</Link>
          </div>
        </div>
      </nav>

      <div className="container" style={{ maxWidth: '800px' }}>
        <div className="page-header" style={{ marginTop: '2rem' }}>
          <h1>{isEditMode ? 'Sửa Sách' : 'Thêm Sách Mới'}</h1>
          <p className="text-muted">Cập nhật thông tin chi tiết cho kho sách của bạn</p>
        </div>

        {error && (
          <div className="alert alert-danger">
            <span>{error}</span>
          </div>
        )}

        <div className="form-card fade-in">
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label htmlFor="title">Tên Sách *</label>
                <input type="text" id="title" name="title" value={formData.title} onChange={handleChange} className="form-control" required />
              </div>

              <div className="form-group">
                <label htmlFor="author">Tác Giả *</label>
                <input type="text" id="author" name="author" value={formData.author} onChange={handleChange} className="form-control" required />
              </div>

              <div className="form-group">
                <label htmlFor="category">Thể Loại *</label>
                <select id="category" name="category" value={formData.category} onChange={handleChange} className="form-control" required>
                  <option value="">-- Chọn thể loại --</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="price">Giá (VNĐ) *</label>
                <input type="number" id="price" name="price" value={formData.price} onChange={handleChange} className="form-control" required />
              </div>

              <div className="form-group">
                <label htmlFor="quantity">Số Lượng Kho</label>
                <input type="number" id="quantity" name="quantity" value={formData.quantity} onChange={handleChange} className="form-control" />
              </div>
            </div>

            <div className="form-group" style={{ marginTop: '1.5rem' }}>
              <label htmlFor="description">Mô Tả Nội Dung</label>
              <textarea id="description" name="description" value={formData.description} onChange={handleChange} className="form-control" rows="5"></textarea>
            </div>

            <div className="form-group" style={{ marginTop: '1.5rem' }}>
              <label htmlFor="imageUrl">Link Ảnh (URL)</label>
              <input type="url" id="imageUrl" name="imageUrl" value={formData.imageUrl} onChange={handleChange} className="form-control" />
              {formData.imageUrl && (
                <div className="image-preview-wrapper">
                  <p style={{ marginBottom: '0.5rem', fontSize: '0.8rem', color: '#666' }}>Xem trước hình ảnh:</p>
                  <img src={formData.imageUrl} alt="Preview" className="image-preview" />
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px solid #EEEEEE' }}>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Đang lưu...' : 'Lưu thông tin'}
              </button>
              <Link to="/books" className="btn btn-secondary">Hủy bỏ</Link>
            </div>
          </form>
        </div>
      </div>

      <footer className="footer" style={{ marginTop: '4rem' }}>
        <div className="container">
          <p>© 2026 Tiệm Sách Management System</p>
        </div>
      </footer>
    </div>
  );
};

export default BookForm;
