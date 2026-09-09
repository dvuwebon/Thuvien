import React, { useState, useEffect } from 'react';
import { X, CheckCircle, ShieldCheck, QrCode, CreditCard, Clock, AlertTriangle, ExternalLink, RefreshCw } from 'lucide-react';
import { api } from '../services/api';

export default function VNPayPaymentModal({ isOpen, onClose, reader, fine, amount, onPaymentSuccess, onSuccess }) {
  const [activeTab, setActiveTab] = useState('qr'); // 'qr' | 'card'
  const [loading, setLoading] = useState(false);
  const [paymentData, setPaymentData] = useState(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [successInfo, setSuccessInfo] = useState(null);
  const [countdown, setCountdown] = useState(900); // 15 phút

  const payAmount = Number(amount || fine?.fineAmount || 10000);
  const readerId = reader?.id || fine?.readerId || 2;
  const readerName = reader?.fullName || fine?.readerName || 'Độc giả';

  useEffect(() => {
    if (isOpen) {
      setPaymentSuccess(false);
      setSuccessInfo(null);
      setCountdown(900);
      setLoading(true);

      const orderInfo = `SMARTLIB NOP PHAT DG-${String(readerId).padStart(3, '0')}`;
      api.createVNPayPayment({
        fineId: fine?.id,
        readerId,
        amount: payAmount,
        orderInfo
      }).then(res => {
        setPaymentData(res);
      }).catch(err => {
        console.error('Error creating VNPay payment:', err);
      }).finally(() => {
        setLoading(false);
      });
    }
  }, [isOpen, fine, readerId, payAmount]);

  // Đếm ngược thời gian hết hạn giao dịch (15 phút)
  useEffect(() => {
    if (!isOpen || countdown <= 0 || paymentSuccess) return;
    const timer = setInterval(() => {
      setCountdown(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen, countdown, paymentSuccess]);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleConfirmPayment = async () => {
    setLoading(true);
    try {
      const res = await api.verifyVNPayPayment({
        fineId: fine?.id || paymentData?.fineId,
        readerId,
        transactionRef: paymentData?.txnRef || `VNP${Date.now()}`,
        amount: payAmount,
        status: 'SUCCESS'
      });

      setPaymentSuccess(true);
      setSuccessInfo(res);
      if (onPaymentSuccess) {
        onPaymentSuccess(res);
      }
      if (onSuccess) {
        onSuccess(res);
      }
    } catch (e) {
      alert('Lỗi xác nhận thanh toán: ' + (e.message || ''));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(5px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '520px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          fontFamily: "'Inter', system-ui, sans-serif"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* VNPay Header */}
        <div
          style={{
            background: 'linear-gradient(135deg, #005baa 0%, #003e7e 100%)',
            color: '#ffffff',
            padding: '18px 22px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'relative'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                background: '#ffffff',
                padding: '4px 10px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <span style={{ color: '#ed1c24', fontWeight: 900, fontSize: '18px', letterSpacing: '-0.5px' }}>
                VNPAY
              </span>
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '15px' }}>Cổng Thanh Toán Trực Tuyến</div>
              <div style={{ fontSize: '11.5px', color: '#bfdbfe', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <ShieldCheck size={13} />
                <span>Bảo mật chuẩn Quốc tế PCI-DSS 256-bit</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.15)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              color: '#ffffff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        {paymentSuccess ? (
          /* Trạng thái thanh toán thành công */
          <div style={{ padding: '36px 28px', textAlign: 'center' }}>
            <div
              style={{
                width: '68px',
                height: '68px',
                borderRadius: '50%',
                background: '#dcfce7',
                color: '#16a34a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px'
              }}
            >
              <CheckCircle size={44} strokeWidth={2.5} />
            </div>

            <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: '0 0 6px' }}>
              Thanh Toán VNPay Thành Công!
            </h3>
            <p style={{ color: '#15803d', fontSize: '14px', fontWeight: 700, margin: '0 0 20px' }}>
              🎉 Tài khoản thư viện của bạn đã được TỰ ĐỘNG MỞ KHÓA!
            </p>

            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '16px',
                textAlign: 'left',
                fontSize: '13px',
                marginBottom: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Mã giao dịch VNPay:</span>
                <strong style={{ color: '#0f172a' }}>{successInfo?.transactionRef || paymentData?.txnRef}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Số tiền đã thanh toán:</span>
                <strong style={{ color: '#16a34a', fontSize: '15px' }}>{payAmount.toLocaleString('vi-VN')} đ</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Độc giả nộp phạt:</span>
                <strong style={{ color: '#0f172a' }}>{readerName} (DG-{String(readerId).padStart(3, '0')})</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Trạng thái tài khoản:</span>
                <span style={{ color: '#16a34a', fontWeight: 800 }}>✓ Đang hoạt động bình thường</span>
              </div>
            </div>

            <button
              onClick={() => {
                if (onPaymentSuccess && successInfo) onPaymentSuccess(successInfo);
                if (onSuccess && successInfo) onSuccess(successInfo);
                onClose();
              }}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                color: '#ffffff',
                border: 'none',
                padding: '12px',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(22, 163, 74, 0.3)'
              }}
            >
              Hoàn tất & Tiếp tục mượn sách
            </button>
          </div>
        ) : (
          /* Giao diện thanh toán */
          <div style={{ padding: '20px 24px 24px 24px' }}>
            {/* Tóm tắt đơn thanh toán */}
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '14px 18px',
                marginBottom: '16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div>
                <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
                  Nộp phạt quá hạn thư viện
                </div>
                <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
                  {readerName} <span style={{ color: '#64748b', fontWeight: 500 }}>(DG-{String(readerId).padStart(3, '0')})</span>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Số tiền cần nộp</div>
                <div style={{ fontSize: '19px', fontWeight: 900, color: '#dc2626' }}>
                  {payAmount.toLocaleString('vi-VN')} đ
                </div>
              </div>
            </div>

            {/* Tabs lựa chọn phương thức */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8px',
                marginBottom: '18px',
                background: '#f1f5f9',
                padding: '4px',
                borderRadius: '10px'
              }}
            >
              <button
                type="button"
                onClick={() => setActiveTab('qr')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '8px',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: activeTab === 'qr' ? 700 : 500,
                  background: activeTab === 'qr' ? '#ffffff' : 'transparent',
                  color: activeTab === 'qr' ? '#005baa' : '#64748b',
                  boxShadow: activeTab === 'qr' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <QrCode size={16} />
                <span>Quét mã VNPay-QR</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('card')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '8px',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: activeTab === 'card' ? 700 : 500,
                  background: activeTab === 'card' ? '#ffffff' : 'transparent',
                  color: activeTab === 'card' ? '#005baa' : '#64748b',
                  boxShadow: activeTab === 'card' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <CreditCard size={16} />
                <span>Thẻ ATM / Sandbox</span>
              </button>
            </div>

            {/* TAB 1: VNPay QR */}
            {activeTab === 'qr' && (
              <div style={{ textAlign: 'center' }}>
                <div
                  style={{
                    background: '#ffffff',
                    border: '2px dashed #005baa',
                    borderRadius: '14px',
                    padding: '16px',
                    display: 'inline-block',
                    marginBottom: '14px',
                    position: 'relative'
                  }}
                >
                  {paymentData?.qrCodeUrl ? (
                    <img
                      src={paymentData.qrCodeUrl}
                      alt="VNPay QR Code"
                      style={{ width: '210px', height: '210px', objectFit: 'contain', display: 'block' }}
                    />
                  ) : (
                    <div style={{ width: '210px', height: '210px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                      <RefreshCw size={24} className="animate-spin" />
                    </div>
                  )}
                  <div
                    style={{
                      position: 'absolute',
                      top: '6px',
                      right: '6px',
                      background: '#eff6ff',
                      color: '#1d4ed8',
                      fontSize: '10px',
                      fontWeight: 800,
                      padding: '2px 6px',
                      borderRadius: '4px',
                      border: '1px solid #bfdbfe'
                    }}
                  >
                    VietQR / VNPay
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '12px', color: '#64748b', marginBottom: '14px' }}>
                  <Clock size={14} color="#ea580c" />
                  <span>Giao dịch hết hạn trong: <strong style={{ color: '#ea580c' }}>{formatTime(countdown)}</strong></span>
                </div>

                <div
                  style={{
                    background: '#f8fafc',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#475569',
                    textAlign: 'left',
                    marginBottom: '16px',
                    lineHeight: 1.5
                  }}
                >
                  <div>Ngân hàng: <strong>{paymentData?.bankName || 'MBBank'}</strong></div>
                  <div>Số tài khoản: <code style={{ color: '#005baa', fontWeight: 700 }}>{paymentData?.accountNumber || '0987654321'}</code></div>
                  <div>Nội dung CK: <code style={{ color: '#dc2626', fontWeight: 700 }}>{paymentData?.orderInfo || 'SMARTLIB NOP PHAT'}</code></div>
                </div>
              </div>
            )}

            {/* TAB 2: Thẻ ATM & VNPay Sandbox */}
            {activeTab === 'card' && (
              <div style={{ padding: '8px 4px 16px 4px' }}>
                <div
                  style={{
                    background: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    borderRadius: '10px',
                    padding: '14px',
                    marginBottom: '16px',
                    fontSize: '12.5px',
                    color: '#1e40af'
                  }}
                >
                  <div style={{ fontWeight: 700, marginBottom: '4px' }}>💳 Chế độ Thanh toán Demo / Thẻ ATM:</div>
                  Hệ thống hỗ trợ mô phỏng thanh toán trực tiếp qua Cổng kiểm thử VNPay Sandbox. Sau khi xác nhận, tài khoản độc giả sẽ được tự động mở khóa ngay tức thì.
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                    <span style={{ color: '#64748b' }}>Cổng thanh toán:</span>
                    <strong style={{ color: '#005baa' }}>VNPay Sandbox Gateway</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                    <span style={{ color: '#64748b' }}>Mã giao dịch:</span>
                    <strong>{paymentData?.txnRef || 'VNP_SAMPLE'}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                    <span style={{ color: '#64748b' }}>Tổng tiền thanh toán:</span>
                    <strong style={{ color: '#dc2626', fontSize: '15px' }}>{payAmount.toLocaleString('vi-VN')} đ</strong>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <button
              onClick={handleConfirmPayment}
              disabled={loading}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #005baa 0%, #004380 100%)',
                color: '#ffffff',
                border: 'none',
                padding: '12px 18px',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: 800,
                cursor: loading ? 'wait' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(0, 91, 170, 0.3)',
                transition: 'all 0.2s ease'
              }}
            >
              {loading ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  <span>Đang kết nối xác thực VNPay...</span>
                </>
              ) : (
                <>
                  <CheckCircle size={17} />
                  <span>Xác Nhận Đã Thanh Toán Qua VNPay</span>
                </>
              )}
            </button>

            <p style={{ fontSize: '11px', color: '#94a3b8', textAlign: 'center', margin: '10px 0 0 0' }}>
              Sau khi xác nhận thanh toán thành công, hệ thống sẽ gạch nợ và tự động mở khóa tài khoản tức thì.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
