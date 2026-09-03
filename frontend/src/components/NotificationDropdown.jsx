import React, { useRef, useEffect, useState } from 'react';
import { useNotifications } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import { api, notifyDataUpdated } from '../services/api';
import {
  Bell, CheckCheck, Clock, BookOpen, AlertCircle, CheckCircle, XCircle,
  MessageSquare, Check, X
} from 'lucide-react';

export default function NotificationDropdown({ isOpen, onClose }) {
  const { notifications, unreadCount, markAsRead, markAllAsRead, fetchNotifications } = useNotifications();
  const { role } = useAuth();
  const dropdownRef = useRef(null);

  const [borrowRecords, setBorrowRecords] = useState([]);
  const [confirmModal, setConfirmModal] = useState(null); // { type: 'approve'|'reject', recordId, notifId, bookTitle, readerName }
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionError, setActionError] = useState('');

  // Tải danh sách phiếu mượn để đối chiếu trạng thái hiện tại của từng yêu cầu
  const loadBorrows = async () => {
    if (role === 'Admin') {
      try {
        const res = await api.getBorrowRecords();
        setBorrowRecords(res || []);
      } catch (e) {
        // ignore
      }
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadBorrows();
    }
  }, [isOpen, role]);

  useEffect(() => {
    function handleClickOutside(e) {
      // Không đóng dropdown nếu đang thao tác trên DIV modal xác nhận
      if (confirmModal) return;
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        onClose();
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose, confirmModal]);

  if (!isOpen) return null;

  const handleConfirmAction = async () => {
    if (!confirmModal) return;
    setIsProcessing(true);
    setActionError('');
    try {
      if (confirmModal.type === 'approve') {
        await api.approveBorrow(confirmModal.recordId);
      } else {
        await api.rejectBorrow(confirmModal.recordId);
      }

      // Đánh dấu đã đọc thông báo này
      if (confirmModal.notifId) {
        await markAsRead(confirmModal.notifId);
      }

      // Phát tín hiệu cập nhật tức thì đến AdminDashboard và ReaderPortal!
      notifyDataUpdated('borrow');
      window.dispatchEvent(new CustomEvent('smartlib:data-updated', { detail: { type: 'borrow' } }));

      // Cập nhật lại thông báo và dữ liệu mượn trả
      await fetchNotifications();
      await loadBorrows();
      setConfirmModal(null);
    } catch (err) {
      setActionError(err.message || 'Có lỗi xảy ra khi xử lý yêu cầu.');
    } finally {
      setIsProcessing(false);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'borrow_request':
        return <BookOpen size={16} className="text-blue-600" />;
      case 'borrow_approved':
        return <CheckCircle size={16} className="text-green-600" />;
      case 'borrow_rejected':
        return <XCircle size={16} className="text-red-600" />;
      case 'book_returned':
        return <CheckCheck size={16} className="text-teal-600" />;
      default:
        return <AlertCircle size={16} className="text-blue-500" />;
    }
  };

  return (
    <>
      <div
        ref={dropdownRef}
        style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          left: 0,
          width: '360px',
          maxWidth: '92vw',
          background: '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.12), 0 1px 4px rgba(0,0,0,0.08)',
          border: '1px solid #e2e8f0',
          zIndex: 1000,
          overflow: 'hidden'
        }}
      >
        {/* Header Dropdown */}
        <div style={{ padding: '14px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '14px' }}>
            <MessageSquare size={16} className="text-blue-600" />
            <span>Thông báo ({unreadCount})</span>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              style={{ border: 'none', background: 'none', color: '#2563eb', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
            >
              Đọc tất cả
            </button>
          )}
        </div>

        {/* Danh sách thông báo */}
        <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
          {notifications.length === 0 ? (
            <div style={{ padding: '32px 16px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
              Chưa có thông báo nào.
            </div>
          ) : (
            notifications.map((notif) => {
              const isBorrowReq = notif.type === 'borrow_request' || notif.title?.includes('Yêu cầu mượn sách');

              // Tìm phiếu mượn tương ứng bằng ID chuẩn xác
              const targetRecordId = notif.recordId || notif.meta?.recordId || (typeof notif.meta === 'object' ? notif.meta?.recordId : null);
              let rec = null;
              if (targetRecordId) {
                rec = borrowRecords.find(r => Number(r.id) === Number(targetRecordId));
              }
              // Chỉ khi không có ID trong thông báo mới tìm record Chờ duyệt gần nhất
              if (!rec && isBorrowReq && !targetRecordId) {
                rec = borrowRecords.find(r => r.status === 'Chờ duyệt' && notif.message?.includes(r.bookTitle));
              }

              // Cho phép duyệt nếu là yêu cầu mượn đang Chờ duyệt
              const isPending = isBorrowReq && role === 'Admin' && (!rec || rec.status === 'Chờ duyệt');

              return (
                <div
                  key={notif.id}
                  onClick={() => markAsRead(notif.id)}
                  style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid #f8fafc',
                    background: notif.isRead ? '#ffffff' : '#f0f7ff',
                    cursor: 'pointer',
                    transition: 'background 0.15s',
                    display: 'flex',
                    gap: '12px',
                    alignItems: 'flex-start'
                  }}
                >
                  <div style={{ marginTop: '2px', flexShrink: 0 }}>{getIcon(notif.type)}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '13px', color: '#0f172a' }}>{notif.title}</div>
                    <div style={{ fontSize: '12.5px', color: '#475569', marginTop: '3px', lineHeight: 1.4 }}>
                      {notif.message}
                    </div>

                    <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={11} />
                      <span>{notif.createdAt ? new Date(notif.createdAt).toLocaleString('vi-VN') : 'Vừa xong'}</span>
                    </div>

                    {/* Nút Duyệt / Không duyệt ngay trong thông báo */}
                    {isPending && (
                      <div
                        style={{ display: 'flex', gap: '8px', marginTop: '10px' }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            const targetId = rec?.id || targetRecordId || notif.recordId || notif.meta?.recordId;
                            setConfirmModal({
                              type: 'approve',
                              recordId: targetId,
                              notifId: notif.id,
                              bookTitle: rec?.bookTitle || notif.bookTitle || notif.meta?.bookTitle || 'Sách mượn',
                              readerName: rec?.readerName || notif.readerName || notif.meta?.readerName || 'Độc giả'
                            });
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: '#16a34a',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '5px 12px',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.08)'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#15803d'}
                          onMouseLeave={(e) => e.currentTarget.style.background = '#16a34a'}
                        >
                          <Check size={13} /> Duyệt
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            const targetId = rec?.id || targetRecordId || notif.recordId || notif.meta?.recordId;
                            setConfirmModal({
                              type: 'reject',
                              recordId: targetId,
                              notifId: notif.id,
                              bookTitle: rec?.bookTitle || notif.bookTitle || notif.meta?.bookTitle || 'Sách mượn',
                              readerName: rec?.readerName || notif.readerName || notif.meta?.readerName || 'Độc giả'
                            });
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: '#fee2e2',
                            color: '#dc2626',
                            border: '1px solid #fecaca',
                            borderRadius: '6px',
                            padding: '5px 12px',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#fecaca'}
                          onMouseLeave={(e) => e.currentTarget.style.background = '#fee2e2'}
                        >
                          <X size={13} /> Không duyệt
                        </button>
                      </div>
                    )}

                    {/* Trạng thái đã xử lý */}
                    {isBorrowReq && rec && rec.status === 'Đang mượn' && (
                      <div style={{ marginTop: '8px', fontSize: '11.5px', fontWeight: 600, color: '#16a34a', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <CheckCircle size={13} /> Đã duyệt cho mượn
                      </div>
                    )}
                    {isBorrowReq && rec && rec.status === 'Từ chối' && (
                      <div style={{ marginTop: '8px', fontSize: '11.5px', fontWeight: 600, color: '#dc2626', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <XCircle size={13} /> Đã từ chối yêu cầu
                      </div>
                    )}
                    {isBorrowReq && rec && rec.status === 'Đã trả' && (
                      <div style={{ marginTop: '8px', fontSize: '11.5px', fontWeight: 600, color: '#0284c7', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <CheckCheck size={13} /> Đã hoàn tất trả sách
                      </div>
                    )}
                  </div>

                  {!notif.isRead && (
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#2563eb', marginTop: '6px', flexShrink: 0 }} />
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* DIV Modal xác nhận Duyệt / Không duyệt (Không dùng thông báo trình duyệt) */}
      {confirmModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.45)',
            backdropFilter: 'blur(3px)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
          onClick={() => !isProcessing && setConfirmModal(null)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              padding: '26px 28px',
              maxWidth: '430px',
              width: '100%',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
              textAlign: 'center'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                width: '54px',
                height: '54px',
                borderRadius: '50%',
                background: confirmModal.type === 'approve' ? '#dcfce7' : '#fee2e2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px auto'
              }}
            >
              {confirmModal.type === 'approve' ? (
                <CheckCircle size={28} color="#16a34a" />
              ) : (
                <XCircle size={28} color="#dc2626" />
              )}
            </div>

            <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#0f172a', margin: '0 0 8px 0' }}>
              {confirmModal.type === 'approve' ? 'Xác nhận duyệt yêu cầu mượn sách?' : 'Xác nhận từ chối yêu cầu mượn sách?'}
            </h3>

            <p style={{ fontSize: '13.5px', color: '#64748b', lineHeight: 1.6, margin: '0 0 20px 0' }}>
              {confirmModal.type === 'approve' ? (
                <>
                  Bạn có chắc chắn muốn phê duyệt cho độc giả <strong style={{ color: '#0f172a' }}>"{confirmModal.readerName}"</strong> mượn cuốn sách <strong style={{ color: '#0f172a' }}>"{confirmModal.bookTitle}"</strong>?
                </>
              ) : (
                <>
                  Bạn có chắc chắn muốn từ chối yêu cầu mượn cuốn sách <strong style={{ color: '#0f172a' }}>"{confirmModal.bookTitle}"</strong> của độc giả <strong style={{ color: '#0f172a' }}>"{confirmModal.readerName}"</strong>?
                </>
              )}
            </p>

            {actionError && (
              <div
                style={{
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  color: '#b91c1c',
                  fontSize: '13px',
                  fontWeight: 600,
                  marginBottom: '16px',
                  textAlign: 'left'
                }}
              >
                {actionError}
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => { setConfirmModal(null); setActionError(''); }}
                disabled={isProcessing}
                className="btn btn-outline"
                style={{ padding: '8px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: 600 }}
              >
                Hủy bỏ
              </button>

              <button
                type="button"
                onClick={handleConfirmAction}
                disabled={isProcessing}
                className="btn btn-primary"
                style={{
                  padding: '8px 22px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 600,
                  background: confirmModal.type === 'approve' ? '#16a34a' : '#dc2626',
                  borderColor: confirmModal.type === 'approve' ? '#16a34a' : '#dc2626'
                }}
              >
                {isProcessing ? 'Đang xử lý...' : (confirmModal.type === 'approve' ? 'Xác nhận duyệt' : 'Xác nhận từ chối')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}