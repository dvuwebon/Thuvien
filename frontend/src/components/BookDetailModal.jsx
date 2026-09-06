import React, { useState, useEffect } from 'react';
import { X, BookOpen, User, Tag, Layers, QrCode, BookMarked, Edit2, Trash2, Download } from 'lucide-react';
import QRCode from 'qrcode';
import { exportApi } from '../services/exportApi';

export default function BookDetailModal({ book, isOpen, onClose, onBorrow, onEdit, onDelete, isAdmin }) {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');

  useEffect(() => {
    if (book) {
      const qrPayload = `SMARTLIB-BOOK-ID:${book.id}|${book.title}|Tác giả:${book.author || 'Chưa rõ'}|Thể loại:${book.category || 'Khác'}`;
      QRCode.toDataURL(qrPayload, {
        width: 220,
        margin: 1,
        color: {
          dark: '#1e40af',
          light: '#ffffff'
        }
      })
        .then(url => setQrCodeDataUrl(url))
        .catch(err => {
          console.error('Lỗi tạo mã QR client-side:', err);
          setQrCodeDataUrl(`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(qrPayload)}`);
        });
    }
  }, [book]);

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
              <div style={{ marginTop: '16px', textAlign: 'center', background: '#f8fafc', padding: '12px 10px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <div style={{ background: '#ffffff', padding: '6px', borderRadius: '8px', display: 'inline-block', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0' }}>
                  {qrCodeDataUrl ? (
                    <img
                      src={qrCodeDataUrl}
                      alt={`Mã QR Sách #${book.id}`}
                      style={{ width: '96px', height: '96px', display: 'block' }}
                    />
                  ) : (
                    <div style={{ width: '96px', height: '96px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                      <QrCode size={36} />
                    </div>
                  )}
                </div>
                <span style={{ fontSize: '11.5px', color: '#0f172a', fontWeight: 700, display: 'block', marginTop: '6px' }}>
                  Mã QR Sách #{book.id}
                </span>
                {qrCodeDataUrl && (
                  <a
                    href={qrCodeDataUrl}
                    download={`SmartLib_QR_Sach_${book.id}.png`}
                    style={{
                      fontSize: '11px',
                      color: '#2563eb',
                      fontWeight: 600,
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      marginTop: '4px',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      background: '#eff6ff'
                    }}
                    title="Nhấp để tải ảnh mã QR (PNG) về máy"
                  >
                    <Download size={11} /> Tải mã QR
                  </a>
                )}
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