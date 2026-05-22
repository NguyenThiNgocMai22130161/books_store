import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './AdminUsers.css';

const AdminUsers = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:8080/api/admin/users', {
        withCredentials: true
      });
      setUsers(response.data);
      setError('');
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        navigate('/login');
      } else {
        setError(err.response?.data?.message || 'Không thể tải danh sách người dùng');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await axios.put(
        `http://localhost:8080/api/admin/users/${userId}/role`,
        { role: newRole },
        { withCredentials: true }
      );
      setSuccessMessage('Đã cập nhật quyền người dùng');
      setTimeout(() => setSuccessMessage(''), 3000);
      await fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể cập nhật quyền');
    }
  };

  const handleToggleActive = async (userId, isActive) => {
    try {
      const endpoint = isActive ? 'deactivate' : 'activate';
      await axios.put(
        `http://localhost:8080/api/admin/users/${userId}/${endpoint}`,
        {},
        { withCredentials: true }
      );
      setSuccessMessage(isActive ? 'Đã vô hiệu hóa tài khoản' : 'Đã kích hoạt tài khoản');
      setTimeout(() => setSuccessMessage(''), 3000);
      await fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể thay đổi trạng thái');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Xóa vĩnh viễn người dùng này?')) return;

    try {
      await axios.delete(`http://localhost:8080/api/admin/users/${userId}`, {
        withCredentials: true
      });
      setSuccessMessage('Đã xóa người dùng');
      setTimeout(() => setSuccessMessage(''), 3000);
      await fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể xóa người dùng');
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <nav className="navbar">
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 0 }}>
          <Link to="/" className="navbar-brand">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            User Manager
          </Link>
          <div className="navbar-nav">
            <Link to="/admin">Quay lại Dashboard</Link>
          </div>
        </div>
      </nav>

      <div className="container fade-in">
        <div className="page-header" style={{ marginTop: '3rem' }}>
          <h1>👥 Danh sách người dùng</h1>
          <p className="text-muted">Tổng cộng: {users.length} tài khoản</p>
        </div>

        {successMessage && (
          <div className="alert alert-success">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            <span>{successMessage}</span>
          </div>
        )}

        {error && (
          <div className="alert alert-danger">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><line x1="15" x2="9" y1="9" y2="15"/><line x1="9" x2="15" y1="9" y2="15"/>
            </svg>
            <span>{error}</span>
          </div>
        )}

        <div className="users-card">
          {users.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '5rem 0' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#EEEEEE" strokeWidth="1" style={{ marginBottom: '1rem' }}>
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="17" y1="8" x2="23" y2="14"/><line x1="23" y1="8" x2="17" y2="14"/>
              </svg>
              <p className="text-muted">Không tìm thấy người dùng nào trong hệ thống.</p>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Người dùng</th>
                  <th>Email</th>
                  <th>Quyền hạn</th>
                  <th>Trạng thái</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.userId || user.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{user.fullName || user.username}</div>
                      <div style={{ fontSize: '0.8rem', color: '#a9abbd' }}>@{user.username}</div>
                    </td>
                    <td>{user.email}</td>
                    <td>
                      {user.roles && user.roles.map((role, idx) => (
                        <span key={idx} className="role-badge">{role.replace('ROLE_', '')}</span>
                      ))}
                    </td>
                    <td>
                      <span className={user.active ? 'status-pill status-active' : 'status-pill status-inactive'}>
                        {user.active ? 'Hoạt động' : 'Đang khóa'}
                      </span>
                    </td>
                    <td>
                      <div className="action-btns">
                        <select 
                          className="admin-select" 
                          value={user.roles?.includes('ROLE_ADMIN') ? 'ADMIN' : 'USER'}
                          onChange={(e) => handleRoleChange(user.userId || user.id, e.target.value)}
                        >
                          <option value="USER">User</option>
                          <option value="ADMIN">Admin</option>
                        </select>

                        <button 
                          onClick={() => handleToggleActive(user.userId || user.id, user.active)}
                          className="btn-icon" 
                          style={{ background: user.active ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)', color: user.active ? '#f59e0b' : '#10b981' }}
                          title={user.active ? 'Vô hiệu hóa' : 'Kích hoạt'}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                          </svg>
                        </button>

                        <button 
                          onClick={() => handleDeleteUser(user.userId || user.id)}
                          className="btn-icon" 
                          style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div style={{ background: 'rgba(238, 77, 45, 0.1)', borderLeft: '4px solid #EE4D2D', padding: '1.5rem', borderRadius: '8px', margin: '3rem 0' }}>
          <h4 style={{ color: '#EE4D2D', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
            Ghi chú quản trị
          </h4>
          <ul style={{ color: '#a9abbd', fontSize: '0.9rem', marginLeft: '1.2rem' }}>
            <li>Thay đổi quyền (Admin/User) sẽ có hiệu lực ngay trong phiên làm việc tiếp theo của người dùng.</li>
            <li>Vô hiệu hóa tài khoản sẽ ngăn chặn người dùng đăng nhập nhưng không xóa dữ liệu của họ.</li>
            <li>Hành động xóa là vĩnh viễn và không thể hoàn tác.</li>
          </ul>
        </div>
      </div>

      <footer className="footer">
        <div className="container">
          <p>© 2026 Admin Panel - Hệ thống quản lý bảo mật nâng cao.</p>
        </div>
      </footer>
    </div>
  );
};

export default AdminUsers;
