import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { User, Mail, Phone, MapPin, Calendar, ArrowLeft, Shield, CheckCircle } from 'lucide-react';

export default function ProfilePage({ onBack }) {
  const { user, role, updateUser } = useAuth();

  const [profileData, setProfileData] = useState({
    fullName: user?.fullName || user?.FullName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
    birthDate: user?.birthDate || ''
  });

  const [profileMsg, setProfileMsg] = useState('');
  const [profileErr, setProfileErr] = useState('');
  const [loadingProfile, setLoadingProfile] = useState(false);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!profileData.fullName.trim()) {
      setProfileErr('Họ và tên không được để trống.');
      return;
    }

    setLoadingProfile(true);
    setProfileMsg('');
    setProfileErr('');
    try {
      if (user?.id) {
        await api.updateProfile(user.id, profileData);
      }
      updateUser(profileData);
      setProfileMsg('✓ Cập nhật thông tin cá nhân thành công!');
    } catch (err) {
      setProfileErr(err.message || 'Lỗi khi cập nhật thông tin');
    } finally {
      setLoadingProfile(false);
    }
  };

  return (
    <div style={{ padding: '32px', flex: 1, background: '#ffffff', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
        <button
          onClick={onBack}
          className="btn btn-outline"
          style={{ padding: '8px 12px', borderRadius: '8px' }}
        >
          <ArrowLeft size={16} />
          <span>Quay lại</span>
        </button>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>Hồ Sơ & Cài Đặt Tài Khoản</h2>
          <p style={{ color: '#64748b', fontSize: '13px' }}>Quản lý thông tin cá nhân và bảo mật tài khoản {role}</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
        {/* Profile Card */}
        <div className="card" style={{ margin: 0 }}>
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <User size={18} className="text-blue-600" />
              <span>Thông tin cá nhân</span>
            </div>
            <span className="badge badge-info">{role === 'Admin' ? 'Quản trị viên' : 'Độc giả'}</span>
          </div>

          <form onSubmit={handleUpdateProfile} style={{ padding: '24px' }}>
            {profileErr && (
              <div style={{ padding: '10px 14px', background: '#fee2e2', color: '#b91c1c', borderRadius: '6px', marginBottom: '16px', fontSize: '13px' }}>
                {profileErr}
              </div>
            )}
            {profileMsg && (
              <div style={{ padding: '10px 14px', background: '#dcfce7', color: '#15803d', borderRadius: '6px', marginBottom: '16px', fontSize: '13px' }}>
                {profileMsg}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label>Họ và tên *</label>
                <input
                  type="text"
                  required
                  value={profileData.fullName}
                  onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Tên đăng nhập (Username)</label>
                <input type="text" value={user?.username || ''} disabled />
              </div>

              <div className="form-group">
                <label>Số điện thoại</label>
                <input
                  type="text"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Ngày sinh</label>
                <input
                  type="date"
                  value={profileData.birthDate || ''}
                  onChange={(e) => setProfileData({ ...profileData, birthDate: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label>Địa chỉ</label>
                <input
                  type="text"
                  value={profileData.address}
                  onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                />
              </div>
            </div>

            <div style={{ textAlign: 'right', marginTop: '8px' }}>
              <button type="submit" disabled={loadingProfile} className="btn btn-primary">
                {loadingProfile ? 'Đang lưu...' : 'Lưu thông tin'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}