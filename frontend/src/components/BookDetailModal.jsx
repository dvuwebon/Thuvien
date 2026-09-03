import React from 'react';
import { X, BookOpen, User, Tag, Layers, QrCode, BookMarked, Edit2, Trash2 } from 'lucide-react';
import { exportApi } from '../services/exportApi';

export default function BookDetailModal({ book, isOpen, onClose, onBorrow, onEdit, onDelete, isAdmin }) {
  if (!isOpen || !book) return null;

  const qty = Number(book.quantity) || 1;
  const borrowed = Number(book.borrowed) || 0;
  const available = Math.max(0, qty - borrowed);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ width: '640px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span>Thông tin chi tiết sách</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: '24px' }}>
            {/* Image Column */}
            <div>
              <div
                style={{
                  width: '100%',
                  height: '240px',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  background: '#f8fafc',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid #e2e8f0',
                  padding: '8px'
                }}
              >
                {book.imageUrl ? (
                  <img src={book.imageUrl} alt={book.title} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.12))' }} />
                ) : (
                  <BookOpen size={48} className="text-slate-400" />
                )}
              </div>

              {/* QR Code */}
              <div style={{ marginTop: '16px', textAlign: 'center', background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <img
                  src={exportApi.getBookQrUrl(book.id)}
                  alt="QR Code"
                  style={{ width: '90px', height: '90px', margin: '0 auto', display: 'block' }}
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, display: 'block', marginTop: '4px' }}>
                  Mã QR Sách #{book.id}
                </span>
              </div>
            </div>

            {/* Info Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <span className="badge badge-info" style={{ marginBottom: '6px' }}>{book.category}</span>
                <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', lineHeight: 1.3 }}>{book.title}</h2>
                <p style={{ fontSize: '13.5px', color: '#64748b', marginTop: '4px' }}>Tác giả: <strong>{book.author}</strong></p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div>
                  <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Tổng số lượng</div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>{qty} cuốn</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Sẵn sàng cho mượn</div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: available > 0 ? '#16a34a' : '#ef4444' }}>
                    {available} cuốn
                  </div>
                </div>
              </div>

              <div>
                <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Mô tả tóm tắt:</h4>
                <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.6, maxHeight: '140px', overflowY: 'auto', background: '#ffffff', padding: '10px', borderRadius: '6px', border: '1px solid #f1f5f9' }}>
                  {book.desc || 'Chưa có thông tin mô tả chi tiết cho cuốn sách này.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            {isAdmin && (
              <div style={{ display: 'flex', gap: '8px' }}>
                {onEdit && (
                  <button
                    onClick={() => { onClose(); onEdit(book); }}
                    className="btn btn-outline"
                    style={{ color: '#2563eb', borderColor: '#bfdbfe', fontSize: '12.5px', padding: '6px 12px' }}
                    title="Chỉnh sửa thông tin cuốn sách này"
                  >
                    <Edit2 size={14} /> Sửa sách
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={() => { onClose(); onDelete(book); }}
                    className="btn btn-outline"
                    style={{ color: '#ef4444', borderColor: '#fecaca', fontSize: '12.5px', padding: '6px 12px' }}
                    title="Xóa cuốn sách này khỏi kho dữ liệu"
                  >
                    <Trash2 size={14} /> Xóa sách
                  </button>
                )}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={onClose} className="btn btn-outline">Đóng</button>
            {!isAdmin && available > 0 && (
              <button
                onClick={() => {
                  onClose();
                  onBorrow(book);
                }}
                className="btn btn-primary"
              >
                <BookMarked size={16} />
                <span>Đăng ký mượn cuốn này</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}