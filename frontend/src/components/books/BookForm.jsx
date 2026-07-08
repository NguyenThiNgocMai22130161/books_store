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
      const response = await axios.get('https://books-store-backend-production.up.railway.app/api/categories', {
        withCredentials: true
      });
      setCategories(response.data);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const fetchBook = async () => {
    try {
      const response = await axios.get(`https://books-store-backend-production.up.railway.app/api/books/${id}`, {
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
        const response = await axios.put(`https://books-store-backend-production.up.railway.app/api/books/${id}`, bookData, {
          withCredentials: true
        });
        console.log('Update response:', response.data);
      } else {
        const response = await axios.post('https://books-store-backend-production.up.railway.app/api/books', bookData, {
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
    <div className="book-form-page">

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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem' }}>
              <div className="form-group" style={{ gridColumn: 'span 3' }}>
                <label htmlFor="title">Tên Sách *</label>
                <input type="text" id="title" name="title" value={formData.title} onChange={handleChange} className="form-control" required />
              </div>

              <div className="form-group" style={{ gridColumn: 'span 2' }}>
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
                <label htmlFor="year">Năm Xuất Bản</label>
                <input 
                  type="number" 
                  id="year" 
                  name="year" 
                  value={formData.year} 
                  onChange={handleChange} 
                  className="form-control"
                  min="1900"
                  max={new Date().getFullYear()}
                  placeholder="VD: 2024"
                />
              </div>

              <div className="form-group">
                <label htmlFor="quantity">Số Lượng Kho</label>
                <input type="number" id="quantity" name="quantity" value={formData.quantity} onChange={handleChange} className="form-control" min="0" />
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

    </div>
  );
};

export default BookForm;
