import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      // Khi truy cập qua GitHub Pages, luôn bắt đầu bằng form Đăng nhập cho phiên mới
      if (typeof window !== 'undefined' && window.location.hostname.includes('github.io')) {
        const sessionUser = sessionStorage.getItem('currentUser');
        return sessionUser ? JSON.parse(sessionUser) : null;
      }
      const saved = localStorage.getItem('currentUser');
      return saved ? JSON.parse(saved) : null;
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