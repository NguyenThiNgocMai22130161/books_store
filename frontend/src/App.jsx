import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Authentication Components
import { Login, Register, AccessDenied } from './components/auth';

// Book Components
import { BookList, BookDetail, BookForm } from './components/books';

// Cart & Payment Components
import { Cart, Checkout } from './components/cart';
import { PaymentResult } from './components/payment';

// Order Components
import { OrderList, OrderDetail } from './components/orders';

// Admin Components
import { AdminDashboard, AdminUsers, AdminBooks, AdminOrders } from './components/admin';

// Category Components
import { CategoryList, CategoryForm } from './components/categories';

// User Components
import { UserProfile } from './components/user';

// Wishlist Components
import { Wishlist } from './components/wishlist';

// Shared Components
import { Navbar, Footer } from './components/shared';

function App() {
  return (
    <div className="app">
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Navigate to="/books" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/access-denied" element={<AccessDenied />} />

        {/* Book Routes */}
        <Route path="/books" element={<><Navbar /><BookList /><Footer /></>} />
        <Route path="/books/:id" element={<><Navbar /><BookDetail /><Footer /></>} />
        
        {/* User Routes */}
        <Route path="/profile" element={<><Navbar /><UserProfile /><Footer /></>} />
        <Route path="/cart" element={<><Navbar /><Cart /><Footer /></>} />
        <Route path="/wishlist" element={<><Navbar /><Wishlist /><Footer /></>} />
        <Route path="/cart/checkout" element={<><Navbar /><Checkout /><Footer /></>} />
        <Route path="/cart/payment-result" element={<><Navbar /><PaymentResult /><Footer /></>} />
        <Route path="/orders" element={<><Navbar /><OrderList /><Footer /></>} />
        <Route path="/orders/:id" element={<><Navbar /><OrderDetail /><Footer /></>} />

        {/* Admin Routes */}
        <Route path="/admin" element={<><Navbar /><AdminDashboard /><Footer /></>} />
        <Route path="/admin/dashboard" element={<><Navbar /><AdminDashboard /><Footer /></>} />
        <Route path="/admin/users" element={<><Navbar /><AdminUsers /><Footer /></>} />
        <Route path="/admin/books" element={<><Navbar /><AdminBooks /><Footer /></>} />
        <Route path="/admin/orders" element={<><Navbar /><AdminOrders /><Footer /></>} />
        <Route path="/books/add" element={<><Navbar /><BookForm /><Footer /></>} />
        <Route path="/books/edit/:id" element={<><Navbar /><BookForm /><Footer /></>} />
        <Route path="/categories" element={<><Navbar /><CategoryList /><Footer /></>} />
        <Route path="/categories/add" element={<><Navbar /><CategoryForm /><Footer /></>} />
        <Route path="/categories/edit/:id" element={<><Navbar /><CategoryForm /><Footer /></>} />

        {/* OAuth2 Callback */}
        <Route path="/oauth2/callback" element={<OAuth2Callback />} />

        {/* 404 Not Found */}
        <Route path="*" element={<><Navbar /><NotFound /><Footer /></>} />
      </Routes>
    </div>
  );
}

// OAuth2 Callback Handler
const OAuth2Callback = () => {
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const success = params.get('success');
    
    if (success === 'true') {
      // Redirect to books page after successful OAuth2 login
      window.location.href = '/books';
    } else {
      // Redirect to login page with error
      window.location.href = '/login?error=oauth2_failed';
    }
  }, []);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
        <p>Đang xử lý đăng nhập...</p>
      </div>
    </div>
  );
};

// 404 Not Found Component
const NotFound = () => {
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column',
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '60vh',
      padding: '2rem',
      textAlign: 'center'
    }}>
      <h1 style={{ fontSize: '6rem', margin: 0, color: '#EE4D2D' }}>404</h1>
      <h2 style={{ fontSize: '2rem', margin: '1rem 0' }}>Không tìm thấy trang</h2>
      <p style={{ fontSize: '1.1rem', color: '#666', marginBottom: '2rem' }}>
        Trang bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.
      </p>
      <a 
        href="/books" 
        style={{
          padding: '0.75rem 2rem',
          backgroundColor: '#EE4D2D',
          color: 'white',
          textDecoration: 'none',
          borderRadius: '4px',
          fontSize: '1rem',
          fontWeight: '500'
        }}
      >
        Về trang chủ
      </a>
    </div>
  );
};

export default App;
