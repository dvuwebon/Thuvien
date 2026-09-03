// SmartLib Unified API Client with Backend / LocalStorage Fallback

const API_BASE = '/api';

// Global Real-time Data Synchronization Broadcaster
export const notifyDataUpdated = (type = 'all') => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('smartlib:data-updated', { detail: { type, timestamp: Date.now() } }));
    try {
      localStorage.setItem('smartlib_last_update', JSON.stringify({ type, timestamp: Date.now() }));
    } catch (e) {
      // ignore
    }
  }
};

export const api = {
  // Auth
  login: async (username, password) => {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || err.message || 'Đăng nhập thất bại');
      }
      return await res.json();
    } catch (e) {
      // Local fallback
      if (username === 'admin' && password === '123') {
        const adminUser = { id: 1, UserID: 1, username: 'admin', role: 'Admin', Role: 'Admin', fullName: 'Quản trị viên', FullName: 'Quản trị viên', email: 'admin@smartlib.com', phone: '0987 654 321', address: 'Hà Nội' };
        return { user: adminUser };
      } else if ((username === 'reader' || username === 'docgia') && password === '123') {
        const readerUser = { id: 2, UserID: 2, username: 'reader', role: 'Reader', Role: 'Reader', fullName: 'Độc giả', FullName: 'Độc giả', email: 'reader@smartlib.com', phone: '0912 345 678', address: 'Hà Nội' };
        return { user: readerUser };
      }
      const localUsers = JSON.parse(localStorage.getItem('smartlib_users') || '[]');
      const found = localUsers.find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === password);
      if (found) {
        return { user: found };
      }
      throw e;
    }
  },

  register: async (userData) => {
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || err.message || 'Đăng ký thất bại');
      }
      return await res.json();
    } catch (e) {
      const localUsers = JSON.parse(localStorage.getItem('smartlib_users') || '[]');
      if (localUsers.some(u => u.username.toLowerCase() === userData.username.toLowerCase())) {
        throw new Error('Tên đăng nhập đã tồn tại!');
      }
      const newId = Date.now();
      const newUser = {
        id: newId,
        UserID: newId,
        ...userData,
        role: 'Reader',
        Role: 'Reader'
      };
      localUsers.push(newUser);
      localStorage.setItem('smartlib_users', JSON.stringify(localUsers));
      return { user: newUser, message: 'Đăng ký thành công!' };
    }
  },

  updateProfile: async (userId, data) => {
    const res = await fetch(`${API_BASE}/auth/profile/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || err.message || 'Cập nhật thông tin thất bại');
    }
    return await res.json();
  },

  changePassword: async (userId, currentPassword, newPassword) => {
    const res = await fetch(`${API_BASE}/auth/change-password/${userId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword, newPassword })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || err.message || 'Đổi mật khẩu thất bại');
    }
    return await res.json();
  },

  // Books
  getBooks: async () => {
    const res = await fetch(`${API_BASE}/books`);
    if (!res.ok) throw new Error('Không thể tải danh sách sách');
    return await res.json();
  },

  createBook: async (bookData) => {
    const res = await fetch(`${API_BASE}/books`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bookData)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || err.message || 'Thêm sách thất bại');
    }
    const result = await res.json();
    notifyDataUpdated('book');
    return result;
  },

  updateBook: async (bookId, bookData) => {
    const res = await fetch(`${API_BASE}/books/${bookId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bookData)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || err.message || 'Cập nhật sách thất bại');
    }
    const result = await res.json();
    notifyDataUpdated('book');
    return result;
  },

  deleteBook: async (bookId) => {
    const res = await fetch(`${API_BASE}/books/${bookId}`, {
      method: 'DELETE'
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || err.message || 'Xóa sách thất bại');
    }
    const result = await res.json();
    notifyDataUpdated('book');
    return result;
  },

  // Readers
  getReaders: async () => {
    const res = await fetch(`${API_BASE}/readers`);
    if (!res.ok) throw new Error('Không thể tải danh sách độc giả');
    return await res.json();
  },

  createReader: async (readerData) => {
    const res = await fetch(`${API_BASE}/readers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(readerData)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || err.message || 'Thêm độc giả thất bại');
    }
    const result = await res.json();
    notifyDataUpdated('reader');
    return result;
  },

  updateReader: async (readerId, readerData) => {
    const res = await fetch(`${API_BASE}/readers/${readerId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(readerData)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || err.message || 'Cập nhật độc giả thất bại');
    }
    const result = await res.json();
    notifyDataUpdated('reader');
    return result;
  },

  deleteReader: async (readerId) => {
    const res = await fetch(`${API_BASE}/readers/${readerId}`, {
      method: 'DELETE'
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || err.message || 'Xóa độc giả thất bại');
    }
    const result = await res.json();
    notifyDataUpdated('reader');
    return result;
  },

  // Borrow Records
  getBorrowRecords: async () => {
    const res = await fetch(`${API_BASE}/borrow-records`);
    if (!res.ok) throw new Error('Không thể tải danh sách mượn trả');
    return await res.json();
  },

  createBorrowRecord: async (data) => {
    const res = await fetch(`${API_BASE}/borrow-records`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || err.message || 'Gửi yêu cầu mượn thất bại');
    }
    const result = await res.json();
    notifyDataUpdated('borrow');
    return result;
  },

  approveBorrow: async (recordId) => {
    const res = await fetch(`${API_BASE}/borrow-records/${recordId}/approve`, {
      method: 'PUT'
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || err.message || 'Duyệt mượn thất bại');
    }
    const result = await res.json();
    notifyDataUpdated('borrow');
    return result;
  },

  rejectBorrow: async (recordId) => {
    const res = await fetch(`${API_BASE}/borrow-records/${recordId}/reject`, {
      method: 'PUT'
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || err.message || 'Từ chối thất bại');
    }
    const result = await res.json();
    notifyDataUpdated('borrow');
    return result;
  },

  updateBorrowStatus: async (recordId, status) => {
    const res = await fetch(`${API_BASE}/borrow-records/${recordId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || err.message || 'Cập nhật trạng thái thất bại');
    }
    const result = await res.json();
    notifyDataUpdated('borrow');
    return result;
  },

  // Notifications
  getNotifications: async (role, userId) => {
    const params = new URLSearchParams();
    if (role) params.append('role', role);
    if (userId) params.append('userId', userId);
    const res = await fetch(`${API_BASE}/notifications?${params.toString()}`);
    if (!res.ok) throw new Error('Không thể tải thông báo');
    return await res.json();
  },

  readNotification: async (notifId) => {
    const res = await fetch(`${API_BASE}/notifications/${notifId}/read`, {
      method: 'PUT'
    });
    return await res.json();
  },

  readAllNotifications: async (role, userId) => {
    const res = await fetch(`${API_BASE}/notifications/read-all`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role, userId })
    });
    return await res.json();
  },

  // Stats
  getStats: async () => {
    const res = await fetch(`${API_BASE}/stats`);
    if (!res.ok) throw new Error('Không thể tải thống kê');
    return await res.json();
  }
};