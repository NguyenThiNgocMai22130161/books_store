import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './TEMPLATE_COMPONENT.css';

/**
 * TEMPLATE COMPONENT - Sử dụng cho bất kỳ module nào
 * 
 * Thay thế:
 * - [MODULE_NAME] → tên module của bạn (vd: books, categories, users)
 * - [API_ENDPOINT] → endpoint API (vd: /api/books, /api/categories)
 * - Customize giao diện theo nhu cầu
 */

const TemplateComponent = () => {
  // ============================================
  // STATE MANAGEMENT
  // ============================================
  
  // Lưu dữ liệu từ API
  const [data, setData] = useState([]);
  
  // Trạng thái loading
  const [isLoading, setIsLoading] = useState(true);
  
  // Trạng thái error
  const [error, setError] = useState('');
  
  // Success message (optional)
  const [successMessage, setSuccessMessage] = useState('');

  // ============================================
  // FETCH DATA FROM API
  // ============================================
  
  useEffect(() => {
    fetchData();
  }, []); // Empty dependency array = chỉ chạy 1 lần khi component mount

  const fetchData = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      // Gọi API GET
      const response = await axios.get('http://localhost:8080/api/[MODULE_NAME]', {
        withCredentials: true // Quan trọng: gửi cookies để authenticate
      });
      
      // Lưu dữ liệu vào state
      setData(response.data);
      
      console.log('Data fetched successfully:', response.data);
      
    } catch (err) {
      // Xử lý error
      console.error('Error fetching data:', err);
      
      if (err.response) {
        // Server trả về error response
        setError(err.response.data.message || 'Không thể tải dữ liệu');
      } else if (err.request) {
        // Request được gửi nhưng không nhận được response
        setError('Không thể kết nối đến server');
      } else {
        // Lỗi khác
        setError('Đã xảy ra lỗi: ' + err.message);
      }
      
    } finally {
      // Luôn tắt loading sau khi hoàn thành
      setIsLoading(false);
    }
  };

  // ============================================
  // HANDLE DELETE (Optional)
  // ============================================
  
  const handleDelete = async (id) => {
    const confirmed = window.confirm('Bạn có chắc chắn muốn xóa?');
    
    if (confirmed) {
      try {
        await axios.delete(`http://localhost:8080/api/[MODULE_NAME]/${id}`, {
          withCredentials: true
        });
        
        setSuccessMessage('Xóa thành công!');
        
        // Refresh data
        fetchData();
        
        // Auto hide success message after 3 seconds
        setTimeout(() => setSuccessMessage(''), 3000);
        
      } catch (err) {
        setError(err.response?.data?.message || 'Không thể xóa');
        setTimeout(() => setError(''), 3000);
      }
    }
  };

  // ============================================
  // RENDER: LOADING STATE
  // ============================================
  
  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Đang tải dữ liệu...</p>
      </div>
    );
  }

  // ============================================
  // RENDER: MAIN COMPONENT
  // ============================================
  
  return (
    <div>
      {/* Navbar */}
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
            <Link to="/categories">Danh Mục</Link>
          </div>
        </div>
      </nav>

      <div className="container">
        {/* Page Header */}
        <div className="page-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1>Danh Sách [Module Name]</h1>
              <p className="text-muted">
                Tổng số: {data.length} items
              </p>
            </div>
            <Link to="/[module]/add" className="btn btn-primary">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Thêm Mới
            </Link>
          </div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="alert alert-success fade-in">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            <span>{successMessage}</span>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="alert alert-danger fade-in">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Empty State */}
        {data.length === 0 ? (
          <div className="empty-state">
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
              <line x1="9" y1="9" x2="15" y2="9"/>
              <line x1="9" y1="15" x2="15" y2="15"/>
            </svg>
            <h3>Chưa có dữ liệu</h3>
            <p>Hãy thêm mới để bắt đầu</p>
            <Link to="/[module]/add" className="btn btn-primary">
              Thêm Mới
            </Link>
          </div>
        ) : (
          <>
            {/* ============================================ */}
            {/* OPTION 1: TABLE LAYOUT */}
            {/* ============================================ */}
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Tên</th>
                    <th>Mô Tả</th>
                    <th>Trạng Thái</th>
                    <th>Hành Động</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((item) => (
                    <tr key={item.id}>
                      <td>{item.id}</td>
                      <td>{item.name}</td>
                      <td>{item.description || 'N/A'}</td>
                      <td>
                        <span className={`status-badge ${item.active ? 'status-active' : 'status-inactive'}`}>
                          {item.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <Link to={`/[module]/edit/${item.id}`} className="btn-icon btn-edit">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M12 20h9"/>
                              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19H4v-3L16.5 3.5z"/>
                            </svg>
                          </Link>
                          <button onClick={() => handleDelete(item.id)} className="btn-icon btn-delete">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="3 6 5 6 21 6"/>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ============================================ */}
            {/* OPTION 2: GRID LAYOUT */}
            {/* ============================================ */}
            <div className="grid-container">
              {data.map((item) => (
                <div key={item.id} className="card">
                  <div className="card-header">
                    <h3>{item.name}</h3>
                    <span className={`badge ${item.active ? 'badge-active' : 'badge-inactive'}`}>
                      {item.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  
                  <div className="card-body">
                    <p>{item.description || 'Không có mô tả'}</p>
                  </div>
                  
                  <div className="card-footer">
                    <Link to={`/[module]/edit/${item.id}`} className="btn btn-secondary">
                      Sửa
                    </Link>
                    <button onClick={() => handleDelete(item.id)} className="btn btn-danger">
                      Xóa
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* ============================================ */}
            {/* OPTION 3: LIST LAYOUT */}
            {/* ============================================ */}
            <div className="list-container">
              {data.map((item) => (
                <div key={item.id} className="list-item">
                  <div className="list-item-content">
                    <h4>{item.name}</h4>
                    <p>{item.description}</p>
                    <span className="list-item-meta">ID: {item.id}</span>
                  </div>
                  <div className="list-item-actions">
                    <Link to={`/[module]/view/${item.id}`} className="btn btn-primary">
                      Xem
                    </Link>
                    <Link to={`/[module]/edit/${item.id}`} className="btn btn-secondary">
                      Sửa
                    </Link>
                    <button onClick={() => handleDelete(item.id)} className="btn btn-danger">
                      Xóa
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <p>© 2026 Tiệm Sách Management System</p>
        </div>
      </footer>
    </div>
  );
};

export default TemplateComponent;
