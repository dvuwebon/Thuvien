import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      let loaded = null;
      if (typeof window !== 'undefined' && window.location.hostname.includes('github.io')) {
        const sessionUser = sessionStorage.getItem('currentUser');
        loaded = sessionUser ? JSON.parse(sessionUser) : null;
      } else {
        const saved = localStorage.getItem('currentUser');
        loaded = saved ? JSON.parse(saved) : null;
      }
      if (loaded && loaded.username === 'reader' && (!loaded.fullName || loaded.fullName === 'Độc giả')) {
        loaded.fullName = 'Trần Thị Mai';
        loaded.FullName = 'Trần Thị Mai';
      }
      return loaded;
    } catch {
      return null;
    }
  });

  const [role, setRole] = useState(() => {
    if (typeof window !== 'undefined' && window.location.hostname.includes('github.io')) {
      const sessionRole = sessionStorage.getItem('currentUserRole');
      return sessionRole || (user ? (user.Role || user.role || 'Reader') : null);
    }
    return localStorage.getItem('currentUserRole') || (user ? (user.Role || user.role || 'Reader') : null);
  });

  // Tự động kiểm tra và đồng bộ lại họ tên chính xác từ database
  useEffect(() => {
    if (user) {
      let shouldUpdate = false;
      let freshUser = { ...user };

      if (user.username === 'reader' && (!user.fullName || user.fullName === 'Độc giả')) {
        freshUser.fullName = 'Trần Thị Mai';
        freshUser.FullName = 'Trần Thị Mai';
        shouldUpdate = true;
      }

      try {
        const raw = localStorage.getItem('smartlib_db');
        if (raw) {
          const db = JSON.parse(raw);
          if (db && Array.isArray(db.users)) {
            const dbUser = db.users.find(u => 
              (user.id && Number(u.id) === Number(user.id)) || 
              (u.username && u.username.toLowerCase() === (user.username || '').toLowerCase())
            );
            if (dbUser && dbUser.fullName && dbUser.fullName !== user.fullName) {
              freshUser = { ...freshUser, ...dbUser };
              shouldUpdate = true;
            }
          }
        }
      } catch (e) {}

      if (shouldUpdate) {
        setUser(freshUser);
        sessionStorage.setItem('currentUser', JSON.stringify(freshUser));
        localStorage.setItem('currentUser', JSON.stringify(freshUser));
      }
    }
  }, [user]);

  const login = async (username, password) => {
    const res = await api.login(username, password);
    if (res && res.user) {
      const uRole = res.user.Role || res.user.role || 'Reader';
      setUser(res.user);
      setRole(uRole);
      sessionStorage.setItem('currentUser', JSON.stringify(res.user));
      sessionStorage.setItem('currentUserRole', uRole);
      localStorage.setItem('currentUser', JSON.stringify(res.user));
      localStorage.setItem('currentUserRole', uRole);
      return res.user;
    }
    throw new Error('Đăng nhập không thành công');
  };

  const register = async (userData) => {
    const res = await api.register(userData);
    if (res && res.user) {
      setUser(res.user);
      setRole('Reader');
      sessionStorage.setItem('currentUser', JSON.stringify(res.user));
      sessionStorage.setItem('currentUserRole', 'Reader');
      localStorage.setItem('currentUser', JSON.stringify(res.user));
      localStorage.setItem('currentUserRole', 'Reader');
      return res.user;
    }
    return res;
  };

  const logout = () => {
    setUser(null);
    setRole(null);
    sessionStorage.removeItem('currentUser');
    sessionStorage.removeItem('currentUserRole');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('currentUserRole');
  };

  const updateUser = (updatedData) => {
    const merged = { ...user, ...updatedData };
    setUser(merged);
    sessionStorage.setItem('currentUser', JSON.stringify(merged));
  };

  return (
    <AuthContext.Provider value={{ user, role, login, register, logout, updateUser, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);