import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { api, notifyDataUpdated } from '../services/api';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const { user, role } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const lastNotifIdRef = useRef(null);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const res = await api.getNotifications(role, user.id);
      if (res && res.notifications) {
        const firstId = res.notifications[0]?.id;
        if (lastNotifIdRef.current !== null && firstId !== lastNotifIdRef.current) {
          // Có thông báo mới vừa đến -> Thông báo toàn bộ app đồng bộ dữ liệu ngay lập tức!
          notifyDataUpdated('notification_received');
        }
        lastNotifIdRef.current = firstId || 0;
        setNotifications(res.notifications);
        setUnreadCount(res.unreadCount || 0);
      }
    } catch (e) {
      console.error('Lỗi khi tải thông báo:', e);
    }
  }, [user, role]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 3500); // Polling mỗi 3.5s để cập nhật siêu tốc
    return () => clearInterval(interval);
  }, [fetchNotifications]);

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

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, fetchNotifications, markAsRead, markAllAsRead }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);