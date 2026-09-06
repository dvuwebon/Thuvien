import React, { useState, useEffect } from 'react';
import { X, BookOpen, User, Phone, MapPin, Calendar, Clock, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const formatReaderCode = (id) => {
  if (!id) return 'DG-001';
  const num = id === 2 ? 1 : (typeof id === 'number' ? id - 1 : parseInt(id) || 1);
  return `DG-${String(Math.max(1, num)).padStart(3, '0')}`;
};

export default function BorrowModal({ isOpen, onClose, onConfirm, book, readers, isAdmin }) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    bookId: null,
    readerId: null,
    readerCode: '',
    readerName: '',
    phone: '',
    email: '',
    address: '',
    borrowType: 'Mượn về nhà',
    status: 'Chờ duyệt'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (book) {
      setIsSuccess(false);
      if (isAdmin) {
        const firstR = readers && readers.length > 0 ? readers[0] : null;
        setFormData({
          bookId: book.id,
          bookTitle: book.title,
          readerId: firstR ? firstR.id : null,
          readerCode: firstR ? formatReaderCode(firstR.id) : 'DG-001',
          readerName: firstR ? firstR.fullName : '',
          phone: firstR ? firstR.phone : '',
          email: firstR ? firstR.email : '',
          address: firstR ? firstR.address : '',
          borrowType: 'Mượn về nhà',
          status: 'Đang mượn' // Admin creates borrow directly approved
        });
      } else {
        const defaultName = (user?.fullName && user.fullName !== 'Độc giả') 
          ? user.fullName 
          : (user?.username === 'reader' ? 'Trần Thị Mai' : (user?.fullName || user?.username || 'Trần Thị Mai'));
        setFormData({
          bookId: book.id,
          bookTitle: book.title,
          readerId: user ? user.id : 2,
          readerCode: user ? formatReaderCode(user.id) : 'DG-001',
          readerName: defaultName,
          phone: user?.phone || '0901 234 567',
          email: user?.email || 'mai.tran@smartlib.edu.vn',
          address: user?.address || 'Khu KTX Sinh viên Mễ Trì, Thanh Xuân, Hà Nội',
          borrowType: 'Mượn về nhà',
          status: 'Chờ duyệt'
        });
      }
    }
    setError('');
  }, [book, user, isAdmin, readers, isOpen]);

  if (!isOpen || !book) return null;

  const handleClose = () => {
    setIsSuccess(false);
    setError('');
    onClose();
  };

  const handleReaderSelect = (rId) => {
    const selected = (readers || []).find(r => r.id === parseInt(rId));
    if (selected) {
      setFormData(prev => ({
        ...prev,
        readerId: selected.id,
        readerCode: formatReaderCode(selected.id),
        readerName: selected.fullName,
        phone: selected.phone || '',
        email: selected.email || '',
        address: selected.address || ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const finalName = (formData.readerName || '').trim() || (user?.fullName || 'Trần Thị Mai');
    setLoading(true);
    setError('');
    try {
      const payload = {
        ...formData,
        bookId: Number(book.id),
        bookTitle: book.title,
        readerName: finalName,
        readerId: Number(formData.readerId || user?.id || 2)
      };
      await onConfirm(payload);
      setIsSuccess(true);
    } catch (err) {
      setError(err.message || 'Lỗi khi gửi yêu cầu mượn sách');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" style={{ width: '580px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span>{isSuccess ? 'Xác nhận thành công' : (isAdmin ? 'Tạo phiếu cho mượn sách' : 'Đăng ký mượn sách')}</span>
          <button onClick={handleClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
            <X size={20} />
          </button>
        </div>

        {isSuccess ? (
          <div style={{ padding: '36px 24px', textAlign: 'center' }}>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: '#dcfce7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px auto'
              }}
            >
              <CheckCircle size={32} color="#16a34a" />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: '0 0 10px 0' }}>
              {isAdmin ? 'Lập phiếu mượn thành công!' : 'Đã gửi yêu cầu mượn sách!'}
            </h3>
            <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.6, margin: '0 0 24px 0' }}>
              {isAdmin ? (
                <>Đã tạo thành công phiếu mượn cuốn sách <strong style={{ color: '#0f172a' }}>"{book.title}"</strong> cho độc giả <strong style={{ color: '#0f172a' }}>{formData.readerName}</strong>.</>
              ) : (
                <>Yêu cầu mượn cuốn sách <strong style={{ color: '#0f172a' }}>"{book.title}"</strong> của bạn đã được gửi thành công. Vui lòng chờ thủ thư phê duyệt!</>
              )}
            </p>
            <button
              type="button"
              onClick={handleClose}
              className="btn btn-primary"
              style={{ padding: '9px 36px', borderRadius: '10px', fontSize: '14px', fontWeight: 700 }}
            >
              Đồng ý
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && (
              <div style={{ padding: '10px 14px', background: '#fee2e2', color: '#b91c1c', borderRadius: '6px', marginBottom: '16px', fontSize: '13px', fontWeight: 600 }}>
                {error}
              </div>
            )}

            {/* Book Summary Card */}
            <div style={{ display: 'flex', gap: '14px', padding: '14px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '18px' }}>
              <div style={{ width: '48px', height: '64px', borderRadius: '6px', overflow: 'hidden', background: '#ffffff', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2px', flexShrink: 0 }}>
                {book.imageUrl ? (
                  <img src={book.imageUrl} alt={book.title} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                ) : (
                  <BookOpen size={24} className="text-slate-400" style={{ margin: '20px auto', display: 'block' }} />
                )}
              </div>
              <div>
                <span className="badge badge-info" style={{ fontSize: '11px', marginBottom: '2px' }}>{book.category}</span>
                <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>{book.title}</h4>
                <p style={{ fontSize: '12px', color: '#64748b' }}>Tác giả: {book.author}</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              {isAdmin && readers && readers.length > 0 && (
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label>Chọn độc giả từ danh sách</label>
                  <select
                    value={formData.readerId || ''}
                    onChange={(e) => handleReaderSelect(e.target.value)}
                  >
                    {readers.map(r => (
                      <option key={r.id} value={r.id}>{r.fullName} ({r.phone || r.email || r.username})</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="form-group">
                <label>Mã độc giả *</label>
                <input
                  type="text"
                  required
                  value={formData.readerCode || (user ? formatReaderCode(user.id) : 'DG-001')}
                  disabled
                  style={{
                    background: '#f1f5f9',
                    cursor: 'not-allowed',
                    fontWeight: 700,
                    color: '#2563eb'
                  }}
                />
              </div>

              {!isAdmin && (
                <div className="form-group">
                  <label>Họ và tên độc giả *</label>
                  <input
                    type="text"
                    required
                    value={formData.readerName}
                    onChange={(e) => setFormData({ ...formData, readerName: e.target.value })}
                    placeholder="Họ và tên..."
                    style={{ fontWeight: 600 }}
                  />
                </div>
              )}

              <div className="form-group">
                <label>Số điện thoại</label>
                <input
                  type="text"
                  placeholder="0912..."
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Hình thức mượn</label>
                <select
                  value={formData.borrowType}
                  onChange={(e) => setFormData({ ...formData, borrowType: e.target.value })}
                >
                  <option value="Mượn về nhà">Mượn về nhà (Hạn 14 ngày)</option>
                  <option value="Mượn tại thư viện">Mượn đọc tại chỗ (Trong ngày)</option>
                </select>
              </div>

              <div className="form-group">
                <label>Địa chỉ</label>
                <input
                  type="text"
                  placeholder="Địa chỉ liên hệ..."
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={handleClose} className="btn btn-outline">Hủy</button>
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? 'Đang xử lý...' : (isAdmin ? 'Xác nhận cho mượn' : 'Gửi yêu cầu mượn')}
            </button>
          </div>
        </form>
      )}
      </div>
    </div>
  );
}