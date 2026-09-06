import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../services/api';
import { useAuth } from './AuthContext';
import { Bell, CheckCircle, XCircle, X, BookOpen } from 'lucide-react';

const NotificationContext = createContext();

const playNotificationSound = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const now = ctx.currentTime;
    
    // Note 1 (E5 - 659.25Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, now);
    gain1.gain.setValueAtTime(0.12, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.22);

    // Note 2 (B5 - 987.77Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(987.77, now + 0.1);
    gain2.gain.setValueAtTime(0.15, now + 0.1);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.1);
    osc2.stop(now + 0.4);
  } catch (e) {
    // Audio might be blocked if user hasn't clicked page yet, safe to ignore
  }
};

export const NotificationProvider = ({ children }) => {
  const { user, role } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [liveToast, setLiveToast] = useState(null);
  const lastNotifIdRef = useRef(null);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const res = await api.getNotifications(role, user.id);
      if (res && res.notifications) {
        const firstId = res.notifications[0]?.id;
        
        // Kiểm tra xem có thông báo MỚI vừa đến hay không
        if (lastNotifIdRef.current !== null && firstId && firstId !== lastNotifIdRef.current) {
          const newNotif = res.notifications[0];
          if (newNotif && !newNotif.isRead) {
            playNotificationSound();
            setLiveToast(newNotif);
          }
        }
        
        lastNotifIdRef.current = firstId || 0;
        setNotifications(res.notifications);
        setUnreadCount(res.unreadCount || 0);
      }
    } catch (e) {
      console.error('Lỗi khi tải thông báo:', e);
    }
  }, [user, role]);

  // Lắng nghe sự kiện đồng bộ tức thì qua custom event, storage event và BroadcastChannel
  useEffect(() => {
    fetchNotifications();

    const handleUpdate = () => {
      fetchNotifications();
    };

    window.addEventListener('smartlib:data-updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    
    // Polling ngầm mỗi 1.8s để đảm bảo không bao giờ bị trễ
    const interval = setInterval(fetchNotifications, 1800);

    return () => {
      window.removeEventListener('smartlib:data-updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
      clearInterval(interval);
    };
  }, [fetchNotifications]);

  // Tự động ẩn Toast thông báo thời gian thực sau 6 giây
  useEffect(() => {
    if (liveToast) {
      const timer = setTimeout(() => {
        setLiveToast(null);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [liveToast]);

  const markAsRead = async (notifId) => {
    try {
      await api.readNotification(notifId);
      setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (e) {
      console.error('Lỗi markAsRead:', e);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.readAllNotifications(role, user ? user.id : null);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (e) {
      console.error('Lỗi markAllAsRead:', e);
    }
  };

  const getToastBorderColor = (type) => {
    if (type === 'borrow_approved') return '#10b981';
    if (type === 'borrow_rejected') return '#ef4444';
    return '#3b82f6';
  };

  const getToastIconBg = (type) => {
    if (type === 'borrow_approved') return '#064e3b';
    if (type === 'borrow_rejected') return '#7f1d1d';
    return '#1e3a8a';
  };

  const getToastIconColor = (type) => {
    if (type === 'borrow_approved') return '#34d399';
    if (type === 'borrow_rejected') return '#f87171';
    return '#60a5fa';
  };

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, fetchNotifications, markAsRead, markAllAsRead }}>
      {children}

      {/* Floating Real-time Notification Banner */}
      {liveToast && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 999999,
            background: '#0f172a',
            color: '#ffffff',
            borderRadius: '14px',
            padding: '16px 20px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3), 0 4px 12px rgba(0,0,0,0.15)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '14px',
            maxWidth: '420px',
            border: '1px solid rgba(255,255,255,0.12)',
            borderLeft: `5px solid ${getToastBorderColor(liveToast.type)}`,
            animation: 'fadeIn 0.25s ease-out'
          }}
        >
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: getToastIconBg(liveToast.type),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              color: getToastIconColor(liveToast.type)
            }}
          >
            {liveToast.type === 'borrow_approved' ? <CheckCircle size={20} /> :
             liveToast.type === 'borrow_rejected' ? <XCircle size={20} /> :
             liveToast.type === 'borrow_request' ? <BookOpen size={20} /> :
             <Bell size={20} />}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#f8fafc', marginBottom: '4px' }}>
              {liveToast.title || 'Thông báo mới'}
            </div>
            <div style={{ fontSize: '12.5px', color: '#cbd5e1', lineHeight: '1.45' }}>
              {liveToast.message}
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '6px' }}>
              Vừa nhận được • Tức thì
            </div>
          </div>
          <button
            onClick={() => setLiveToast(null)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '2px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Đóng thông báo"
          >
            <X size={16} />
          </button>
        </div>
      )}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);