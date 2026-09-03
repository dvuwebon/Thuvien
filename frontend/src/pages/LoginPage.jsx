import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { BookOpen, User, Lock, Mail, Phone, Calendar, MapPin, ArrowRight, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Login state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Register state
  const [regData, setRegData] = useState({
    fullName: '',
    username: '',
    password: '',
    confirmPassword: '',
    phone: '',
    email: '',
    birthDate: '',
    address: ''
  });

  const handleQuickFill = (u, p) => {
    setUsername(u);
    setPassword(p);
    setError('');
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await login(username, password);
    } catch (err) {
      setError(err.message || 'Tên đăng nhập hoặc mật khẩu không chính xác!');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!regData.fullName || !regData.username || !regData.password || !regData.phone) {
      setError('Vui lòng điền đầy đủ các thông tin bắt buộc (*).');
      return;
    }
    if (regData.password !== regData.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }
    if (regData.password.length < 3) {
      setError('Mật khẩu phải có ít nhất 3 ký tự.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await register({
        fullName: regData.fullName,
        username: regData.username,
        password: regData.password,
        phone: regData.phone,
        email: regData.email || null,
        birthDate: regData.birthDate || null,
        address: regData.address || null
      });
      setSuccessMsg('Đăng ký thành công! Đang chuyển hướng...');
    } catch (err) {
      setError(err.message || 'Đăng ký thất bại. Vui lòng thử lại.');
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px'
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.08), 0 0 1px 1px rgba(0, 0, 0, 0.04)',
          width: '100%',
          maxWidth: mode === 'login' ? '450px' : '560px',
          padding: '36px',
          border: '1px solid #e2e8f0',
          transition: 'max-width 0.25s ease'
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              margin: '0 auto 14px'
            }}
          >
            <BookOpen size={28} />
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px' }}>
            Smart<span style={{ color: '#2563eb' }}>Lib</span>
          </h1>
          <p style={{ fontSize: '13.5px', color: '#64748b', marginTop: '4px' }}>
            Hệ thống Quản lý Thư viện Thông minh
          </p>
        </div>

        {/* Tab switcher */}
        <div
          style={{
            display: 'flex',
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            padding: '4px',
            marginBottom: '24px',
            gap: '4px'
          }}
        >
          <button
            type="button"
            onClick={() => { setMode('login'); setError(''); setSuccessMsg(''); }}
            style={{
              flex: 1,
              padding: '9px',
              border: 'none',
              borderRadius: '8px',
              background: mode === 'login' ? '#ffffff' : 'transparent',
              color: mode === 'login' ? '#2563eb' : '#64748b',
              fontWeight: 700,
              fontSize: '13.5px',
              cursor: 'pointer',
              boxShadow: mode === 'login' ? '0 2px 4px rgba(0,0,0,0.06)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            Đăng nhập
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setError(''); setSuccessMsg(''); }}
            style={{
              flex: 1,
              padding: '9px',
              border: 'none',
              borderRadius: '8px',
              background: mode === 'register' ? '#ffffff' : 'transparent',
              color: mode === 'register' ? '#2563eb' : '#64748b',
              fontWeight: 700,
              fontSize: '13.5px',
              cursor: 'pointer',
              boxShadow: mode === 'register' ? '0 2px 4px rgba(0,0,0,0.06)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            Đăng ký độc giả mới
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div style={{ padding: '12px 16px', background: '#fee2e2', color: '#b91c1c', borderRadius: '8px', marginBottom: '18px', fontSize: '13px', fontWeight: 600 }}>
            {error}
          </div>
        )}
        {successMsg && (
          <div style={{ padding: '12px 16px', background: '#dcfce7', color: '#15803d', borderRadius: '8px', marginBottom: '18px', fontSize: '13px', fontWeight: 600 }}>
            {successMsg}
          </div>
        )}

        {/* LOGIN FORM */}
        {mode === 'login' ? (
          <form onSubmit={handleLoginSubmit}>
            <div className="form-group">
              <label>Tên đăng nhập</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  required
                  placeholder="admin hoặc reader"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Mật khẩu</label>
              <input
                type="password"
                required
                placeholder="Nhập mật khẩu (123)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ width: '100%', padding: '12px', fontSize: '15px', marginTop: '8px' }}
            >
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>

            {/* Quick Login Demo Badges */}
            <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #f1f5f9' }}>
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, marginBottom: '8px', textAlign: 'center' }}>
                Chọn nhanh tài khoản mẫu để thử nghiệm:
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => handleQuickFill('admin', '123')}
                  className="btn btn-outline"
                  style={{ padding: '8px', fontSize: '12px', borderColor: '#bfdbfe', background: '#eff6ff', color: '#1d4ed8' }}
                >
                  <ShieldCheck size={14} />
                  <span>Admin (admin / 123)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFill('reader', '123')}
                  className="btn btn-outline"
                  style={{ padding: '8px', fontSize: '12px', borderColor: '#bbf7d0', background: '#f0fdf4', color: '#15803d' }}
                >
                  <User size={14} />
                  <span>Độc giả (reader / 123)</span>
                </button>
              </div>
            </div>
          </form>
        ) : (
          /* REGISTER FORM */
          <form onSubmit={handleRegisterSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label>Họ và tên *</label>
                <input
                  type="text"
                  required
                  placeholder="Nguyễn Văn A"
                  value={regData.fullName}
                  onChange={(e) => setRegData({ ...regData, fullName: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Tên đăng nhập *</label>
                <input
                  type="text"
                  required
                  placeholder="username..."
                  value={regData.username}
                  onChange={(e) => setRegData({ ...regData, username: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Số điện thoại *</label>
                <input
                  type="text"
                  required
                  placeholder="0912 345 678"
                  value={regData.phone}
                  onChange={(e) => setRegData({ ...regData, phone: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Mật khẩu *</label>
                <input
                  type="password"
                  required
                  placeholder="Ít nhất 3 ký tự"
                  value={regData.password}
                  onChange={(e) => setRegData({ ...regData, password: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Xác nhận mật khẩu *</label>
                <input
                  type="password"
                  required
                  placeholder="Nhập lại mật khẩu"
                  value={regData.confirmPassword}
                  onChange={(e) => setRegData({ ...regData, confirmPassword: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  placeholder="email@example.com"
                  value={regData.email}
                  onChange={(e) => setRegData({ ...regData, email: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Ngày sinh</label>
                <input
                  type="date"
                  value={regData.birthDate}
                  onChange={(e) => setRegData({ ...regData, birthDate: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label>Địa chỉ</label>
                <input
                  type="text"
                  placeholder="Hà Nội, TP.HCM..."
                  value={regData.address}
                  onChange={(e) => setRegData({ ...regData, address: e.target.value })}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ width: '100%', padding: '12px', fontSize: '15px', marginTop: '14px' }}
            >
              {loading ? 'Đang tạo tài khoản...' : 'Đăng ký tài khoản'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}