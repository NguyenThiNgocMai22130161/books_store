import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import './Login.css';

const API = 'https://books-store-backend-production.up.railway.app';

// ─── Bước trong luồng quên mật khẩu ───────────────────────────
const FP_STEP = { EMAIL: 'email', OTP: 'otp', NEW_PW: 'newpw', DONE: 'done' };

const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // ── State đăng nhập ──────────────────────────────────────────
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [alerts, setAlerts] = useState({ error: null, success: null });
  const [isLoading, setIsLoading] = useState(false);

  // ── State quên mật khẩu ──────────────────────────────────────
  const [showForgot, setShowForgot] = useState(false);
  const [fpStep, setFpStep] = useState(FP_STEP.EMAIL);
  const [fpEmail, setFpEmail] = useState('');
  const [fpOtp, setFpOtp] = useState(['', '', '', '', '', '']);
  const [fpNewPw, setFpNewPw] = useState('');
  const [fpConfirmPw, setFpConfirmPw] = useState('');
  const [fpLoading, setFpLoading] = useState(false);
  const [fpAlert, setFpAlert] = useState({ error: null, success: null });
  const [fpCountdown, setFpCountdown] = useState(0);

  const otpRefs = useRef([]);

  // ── URL params ───────────────────────────────────────────────
  useEffect(() => {
    const error = searchParams.get('error');
    const logout = searchParams.get('logout');
    if (error) setAlerts({ error: 'Tên đăng nhập hoặc mật khẩu không đúng!', success: null });
    if (logout) setAlerts({ error: null, success: 'Đăng xuất thành công!' });
  }, [searchParams]);

  // ── Đếm ngược OTP ────────────────────────────────────────────
  useEffect(() => {
    if (fpCountdown <= 0) return;
    const t = setTimeout(() => setFpCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [fpCountdown]);

  // ── Handlers đăng nhập ───────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setAlerts({ error: null, success: null });

    try {
      const formDataEncoded = new URLSearchParams();
      formDataEncoded.append('username', formData.username);
      formDataEncoded.append('password', formData.password);

      const response = await axios.post(
        'http://localhost:8080/api/auth/login',
        `${API}/api/auth/login`,
        formDataEncoded,
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, withCredentials: true }
      );

      if (response.data.success) {
        setAlerts({ error: null, success: response.data.message || 'Đăng nhập thành công!' });
        const redirectUrl = sessionStorage.getItem('redirectAfterLogin');

        setTimeout(() => {
          if (redirectUrl) {
            sessionStorage.removeItem('redirectAfterLogin');
            navigate(redirectUrl);
          } else {
            const authorities = response.data.authorities || [];
            const roles = authorities.map(a => (typeof a === 'string' ? a : a.authority));
            navigate(roles.includes('ROLE_ADMIN') ? '/admin' : '/books');
          }
        }, 1000);
      }
    } catch (error) {
      setAlerts({
        error: error.response?.data?.message || 'Đăng nhập thất bại. Vui lòng thử lại!',
        success: null
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = 'http://localhost:8080/oauth2/authorization/google';
    window.location.href = `${API}/oauth2/authorization/google`;
  };

  // ── Helpers quên mật khẩu ────────────────────────────────────
  const resetForgot = () => {
    setShowForgot(false);
    setFpStep(FP_STEP.EMAIL);
    setFpEmail('');
    setFpOtp(['', '', '', '', '', '']);
    setFpNewPw('');
    setFpConfirmPw('');
    setFpAlert({ error: null, success: null });
    setFpCountdown(0);
  };

  // Bước 1: gửi email để nhận OTP
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setFpLoading(true);
    setFpAlert({ error: null, success: null });

    try {
      const params = new URLSearchParams();
      params.append('email', fpEmail);
      await axios.post(`${API}/api/auth/forgot-password`, params, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });
      setFpAlert({ error: null, success: 'Mã OTP đã được gửi tới email của bạn!' });
      setFpCountdown(300); // 5 phút
      setFpStep(FP_STEP.OTP);
    } catch (err) {
      setFpAlert({
        error: err.response?.data?.message || 'Không thể gửi OTP. Vui lòng kiểm tra lại email.',
        success: null
      });
    } finally {
      setFpLoading(false);
    }
  };

  // Bước 2: xác nhận OTP
  const handleVerifyOtp = (e) => {
    e.preventDefault();
    const code = fpOtp.join('');
    if (code.length < 6) {
      setFpAlert({ error: 'Vui lòng nhập đủ 6 số OTP.', success: null });
      return;
    }
    setFpAlert({ error: null, success: null });
    setFpStep(FP_STEP.NEW_PW);
  };

  // Bước 3: đặt mật khẩu mới
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (fpNewPw !== fpConfirmPw) {
      setFpAlert({ error: 'Mật khẩu xác nhận không khớp!', success: null });
      return;
    }
    if (fpNewPw.length < 6) {
      setFpAlert({ error: 'Mật khẩu phải có ít nhất 6 ký tự!', success: null });
      return;
    }

    setFpLoading(true);
    setFpAlert({ error: null, success: null });

    try {
      const params = new URLSearchParams();
      params.append('email', fpEmail);
      params.append('otp', fpOtp.join(''));
      params.append('newPassword', fpNewPw);

      await axios.post(`${API}/api/auth/reset-password`, params, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });

      setFpStep(FP_STEP.DONE);
      setFpAlert({ error: null, success: 'Đặt lại mật khẩu thành công! Vui lòng đăng nhập.' });
    } catch (err) {
      setFpAlert({
        error: err.response?.data?.message || 'OTP không hợp lệ hoặc đã hết hạn!',
        success: null
      });
    } finally {
      setFpLoading(false);
    }
  };

  // OTP input handler: tự động focus ô tiếp theo
  const handleOtpChange = (index, value) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const newOtp = [...fpOtp];
    newOtp[index] = digit;
    setFpOtp(newOtp);
    if (digit && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !fpOtp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newOtp = [...fpOtp];
    for (let i = 0; i < pasted.length; i++) newOtp[i] = pasted[i];
    setFpOtp(newOtp);
    const nextEmpty = newOtp.findIndex(v => !v);
    const focusIdx = nextEmpty === -1 ? 5 : nextEmpty;
    otpRefs.current[focusIdx]?.focus();
  };

  const formatCountdown = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // ── Render Alert helper ───────────────────────────────────────
  const AlertBox = ({ type, msg }) => {
    if (!msg) return null;
    const isDanger = type === 'error';
    return (
      <div className={`alert ${isDanger ? 'alert-danger' : 'alert-success'}`}>
        {isDanger ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" x2="9" y1="9" y2="15" /><line x1="9" x2="15" y1="9" y2="15" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        )}
        <span>{msg}</span>
      </div>
    );
  };

  // ── RENDER ───────────────────────────────────────────────────
  return (
    <div className="login-page">
      {/* Navbar */}
      <nav className="navbar">
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 0 }}>
          <Link to="/" className="navbar-brand">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
            Tiệm Sách
          </Link>
          <div className="navbar-nav">
            <Link to="/register">Đăng ký</Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="login-wrapper">
        <div className="login-grid">

          {/* Left Section */}
          <div className="login-section">
            <div className="login-header">
              <h1>{showForgot ? 'Quên mật khẩu' : 'Chào mừng quay lại'}</h1>
              <p>{showForgot
                ? 'Đặt lại mật khẩu qua mã OTP gửi về email'
                : 'Đăng nhập để tiếp tục khám phá thế giới sách'
              }</p>
            </div>
            <div className="illustration-box">
              <div className="illustration-icon">{showForgot ? '🔐' : '📚'}</div>
            </div>
          </div>

          {/* Right Section */}
          <div className="login-section">
            <div className="login-card">

              {/* ══════════════════════════════════
                  LUỒNG QUÊN MẬT KHẨU
              ══════════════════════════════════ */}
              {showForgot ? (
                <>
                  {/* Alert */}
                  <AlertBox type="error" msg={fpAlert.error} />
                  <AlertBox type="success" msg={fpAlert.success} />

                  {/* ── Bước 1: nhập email ── */}
                  {fpStep === FP_STEP.EMAIL && (
                    <form onSubmit={handleSendOtp}>
                      <p className="fp-hint">Nhập email đã đăng ký để nhận mã OTP xác thực.</p>
                      <div className="form-group">
                        <label htmlFor="fp-email">Email</label>
                        <input
                          id="fp-email"
                          type="email"
                          className="form-control"
                          placeholder="example@email.com"
                          value={fpEmail}
                          onChange={e => setFpEmail(e.target.value)}
                          required
                          autoFocus
                          disabled={fpLoading}
                        />
                      </div>
                      <button type="submit" className="btn-primary" disabled={fpLoading}>
                        {fpLoading ? (
                          <><svg className="spinner" xmlns="http://www.w3.org/2000/svg" width="18" height="18"
                            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="12" y1="2" x2="12" y2="6" /><line x1="12" y1="18" x2="12" y2="22" />
                            <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" /><line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
                            <line x1="2" y1="12" x2="6" y2="12" /><line x1="18" y1="12" x2="22" y2="12" />
                            <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" /><line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
                          </svg> Đang gửi OTP...</>
                        ) : (
                          <><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
                            fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="22" y1="2" x2="11" y2="13" />
                            <polygon points="22 2 15 22 11 13 2 9 22 2" />
                          </svg> Gửi mã OTP</>
                        )}
                      </button>
                    </form>
                  )}

                  {/* ── Bước 2: nhập OTP ── */}
                  {fpStep === FP_STEP.OTP && (
                    <form onSubmit={handleVerifyOtp}>
                      <p className="fp-hint">
                        Nhập mã 6 số đã gửi tới <strong>{fpEmail}</strong>
                        {fpCountdown > 0 && (
                          <span className="fp-countdown"> · Hết hạn sau {formatCountdown(fpCountdown)}</span>
                        )}
                      </p>

                      <div className="otp-grid">
                        {fpOtp.map((digit, i) => (
                          <input
                            key={i}
                            ref={el => otpRefs.current[i] = el}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            className={`otp-box ${digit ? 'otp-filled' : ''}`}
                            value={digit}
                            onChange={e => handleOtpChange(i, e.target.value)}
                            onKeyDown={e => handleOtpKeyDown(i, e)}
                            onPaste={i === 0 ? handleOtpPaste : undefined}
                            autoFocus={i === 0}
                          />
                        ))}
                      </div>

                      <button type="submit" className="btn-primary" style={{ marginTop: '1rem' }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
                          fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        Xác nhận OTP
                      </button>

                      <button
                        type="button"
                        className="btn-ghost"
                        onClick={() => { setFpStep(FP_STEP.EMAIL); setFpAlert({ error: null, success: null }); }}
                      >
                        ← Đổi email
                      </button>

                      {fpCountdown === 0 && (
                        <button type="button" className="btn-ghost" onClick={handleSendOtp} disabled={fpLoading}>
                          Gửi lại mã OTP
                        </button>
                      )}
                    </form>
                  )}

                  {/* ── Bước 3: mật khẩu mới ── */}
                  {fpStep === FP_STEP.NEW_PW && (
                    <form onSubmit={handleResetPassword}>
                      <p className="fp-hint">Nhập mật khẩu mới cho tài khoản của bạn.</p>

                      <div className="form-group">
                        <label htmlFor="fp-newpw">Mật khẩu mới</label>
                        <input
                          id="fp-newpw"
                          type="password"
                          className="form-control"
                          placeholder="Ít nhất 6 ký tự"
                          value={fpNewPw}
                          onChange={e => setFpNewPw(e.target.value)}
                          required
                          autoFocus
                          disabled={fpLoading}
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="fp-confirmpw">Xác nhận mật khẩu</label>
                        <input
                          id="fp-confirmpw"
                          type="password"
                          className="form-control"
                          placeholder="Nhập lại mật khẩu mới"
                          value={fpConfirmPw}
                          onChange={e => setFpConfirmPw(e.target.value)}
                          required
                          disabled={fpLoading}
                        />
                      </div>

                      <button type="submit" className="btn-primary" disabled={fpLoading}>
                        {fpLoading ? (
                          <><svg className="spinner" xmlns="http://www.w3.org/2000/svg" width="18" height="18"
                            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="12" y1="2" x2="12" y2="6" /><line x1="12" y1="18" x2="12" y2="22" />
                            <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" /><line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
                            <line x1="2" y1="12" x2="6" y2="12" /><line x1="18" y1="12" x2="22" y2="12" />
                            <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" /><line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
                          </svg> Đang xử lý...</>
                        ) : (
                          <><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
                            fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                          </svg> Đặt lại mật khẩu</>
                        )}
                      </button>
                    </form>
                  )}

                  {/* ── Bước 4: hoàn tất ── */}
                  {fpStep === FP_STEP.DONE && (
                    <div className="fp-done">
                      <div className="fp-done-icon">✅</div>
                      <h3>Đặt lại mật khẩu thành công!</h3>
                      <p>Mật khẩu của bạn đã được cập nhật. Hãy đăng nhập lại.</p>
                      <button className="btn-primary" onClick={resetForgot}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
                          fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                          <polyline points="10 17 15 12 10 7" /><line x1="15" x2="3" y1="12" y2="12" />
                        </svg>
                        Đến trang đăng nhập
                      </button>
                    </div>
                  )}

                  {/* Link quay lại đăng nhập (trừ bước done) */}
                  {fpStep !== FP_STEP.DONE && (
                    <div className="auth-links" style={{ marginTop: '1.25rem' }}>
                      <p>
                        <button className="link-btn" onClick={resetForgot}>
                          ← Quay lại đăng nhập
                        </button>
                      </p>
                    </div>
                  )}
                </>
              ) : (
                /* ══════════════════════════════════
                    FORM ĐĂNG NHẬP
                ══════════════════════════════════ */
                <>
                  {/* Error Alert */}
                  {alerts.error && (
                    <div className="alert alert-danger">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
                        fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="15" x2="9" y1="9" y2="15" /><line x1="9" x2="15" y1="9" y2="15" />
                      </svg>
                      <span>{alerts.error}</span>
                    </div>
                  )}

                  {/* Success Alert */}
                  {alerts.success && (
                    <div className="alert alert-success">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
                        fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                        <polyline points="22 4 12 14.01 9 11.01" />
                      </svg>
                      {alerts.success}
                    </div>
                  )}

                  {/* Login Form */}
                  <form onSubmit={handleSubmit}>
                    <div className="form-group">
                      <label htmlFor="username">Tên đăng nhập</label>
                      <input
                        type="text" id="username" name="username"
                        className="form-control" placeholder="Nhập tên đăng nhập"
                        value={formData.username} onChange={handleChange}
                        required autoFocus disabled={isLoading}
                      />
                    </div>

                    <div className="form-group">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                        <label htmlFor="password" style={{ marginBottom: 0 }}>Mật khẩu</label>
                        <button
                          type="button"
                          className="link-btn"
                          onClick={() => { setShowForgot(true); setAlerts({ error: null, success: null }); }}
                        >
                          Quên mật khẩu?
                        </button>
                      </div>
                      <input
                        type="password" id="password" name="password"
                        className="form-control" placeholder="Nhập mật khẩu"
                        value={formData.password} onChange={handleChange}
                        required disabled={isLoading}
                      />
                    </div>

                    <button type="submit" className="btn-primary" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <svg className="spinner" xmlns="http://www.w3.org/2000/svg" width="20" height="20"
                            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                            strokeLinecap="round" strokeLinejoin="round">
                            <line x1="12" y1="2" x2="12" y2="6" /><line x1="12" y1="18" x2="12" y2="22" />
                            <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" /><line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
                            <line x1="2" y1="12" x2="6" y2="12" /><line x1="18" y1="12" x2="22" y2="12" />
                            <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" /><line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
                          </svg>
                          Đang đăng nhập...
                        </>
                      ) : (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
                            fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                            <polyline points="10 17 15 12 10 7" /><line x1="15" x2="3" y1="12" y2="12" />
                          </svg>
                          Đăng nhập
                        </>
                      )}
                    </button>
                  </form>

                  <div className="oauth-divider"><span>Hoặc đăng nhập với</span></div>

                  <div className="oauth-buttons">
                    <button onClick={handleGoogleLogin} className="oauth-btn" disabled={isLoading}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                      </svg>
                      Google
                    </button>
                  </div>

                  <div className="auth-links">
                    <p>Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link></p>
                    <p className="text-muted" style={{ fontSize: '0.85rem', marginTop: '1rem' }}>
                      <strong>Tài khoản test:</strong><br />
                      Admin: <code style={{ background: '#F5F5F5', padding: '0.2rem 0.4rem', borderRadius: '4px' }}>admin / admin123</code><br />
                      User: <code style={{ background: '#F5F5F5', padding: '0.2rem 0.4rem', borderRadius: '4px' }}>user / user123</code>
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <p style={{ margin: '0.5rem 0' }}><strong>© 2026 Tiệm Sách</strong></p>
          <p style={{ margin: 0, fontSize: '0.85rem' }}>Được xây dựng với Spring Boot &amp; React • Thương mại điện tử hiện đại</p>
        </div>
      </footer>
    </div>
  );
};

export default Login;
