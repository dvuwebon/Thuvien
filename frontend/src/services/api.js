// SmartLib Unified API Client with Backend / LocalStorage Fallback for GitHub Pages & Local
import initialDb from '../../../data/database.json';

const API_BASE = '/api';

// Local storage fallback database helper
const DB_VERSION = 'v5_clean_sync_2026';

const isStaticHost = typeof window !== 'undefined' && (
  window.location.hostname.includes('github.io') ||
  window.location.protocol === 'file:'
);

const getLocalDb = () => {
  try {
    const savedVersion = localStorage.getItem('smartlib_db_version');
    const raw = localStorage.getItem('smartlib_db');
    if (raw && savedVersion === DB_VERSION) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.books) && parsed.books.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    // ignore
  }
  const clone = JSON.parse(JSON.stringify(initialDb));
  try {
    localStorage.setItem('smartlib_db', JSON.stringify(clone));
    localStorage.setItem('smartlib_db_version', DB_VERSION);
  } catch (e) {
    // ignore
  }
  return clone;
};

const saveLocalDb = (db) => {
  try {
    localStorage.setItem('smartlib_db', JSON.stringify(db));
  } catch (e) {
    // ignore
  }
};

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
    const trimmedUsername = (username || '').trim();
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: trimmedUsername, password })
      });
      if (res.ok) {
        const data = await res.json();
        // Đồng bộ người dùng vào localDb để offline / GitHub Pages cũng đăng nhập được
        try {
          const db = getLocalDb();
          const existingUsers = (db.users || []).filter(
            u => u.username && u.username.toLowerCase() !== trimmedUsername.toLowerCase()
          );
          existingUsers.push({ ...data.user, password });
          db.users = existingUsers;
          saveLocalDb(db);
        } catch (e) {}
        return data;
      } else if (res.status === 401 || res.status === 400) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Tên đăng nhập hoặc mật khẩu không chính xác!');
      }
    } catch (e) {
      if (e.message && e.message !== 'Failed to fetch' && !e.message.includes('NetworkError')) {
        throw e;
      }
    }

    // Local / GitHub Pages fallback
    if (trimmedUsername.toLowerCase() === 'admin' && password === '123') {
      const adminUser = {
        id: 1,
        UserID: 1,
        username: 'admin',
        role: 'Admin',
        Role: 'Admin',
        fullName: 'Quản trị viên',
        FullName: 'Quản trị viên',
        email: 'admin@smartlib.com',
        phone: '0987 654 321',
        address: 'Hà Nội'
      };
      return { user: adminUser };
    } else if ((trimmedUsername.toLowerCase() === 'reader' || trimmedUsername.toLowerCase() === 'docgia') && password === '123') {
      const readerUser = {
        id: 2,
        UserID: 2,
        username: 'reader',
        role: 'Reader',
        Role: 'Reader',
        fullName: 'Độc giả',
        FullName: 'Độc giả',
        email: 'reader@smartlib.com',
        phone: '0912 345 678',
        address: 'Hà Nội'
      };
      return { user: readerUser };
    }

    const db = getLocalDb();
    const found = (db.users || []).find(
      u => u.username && u.username.toLowerCase() === trimmedUsername.toLowerCase() && u.password === password
    );
    if (found) {
      return { user: found };
    }

    throw new Error('Tên đăng nhập hoặc mật khẩu không chính xác!');
  },

  register: async (userData) => {
    const trimmedUsername = (userData.username || '').trim();
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...userData, username: trimmedUsername })
      });
      if (res.ok) {
        const data = await res.json();
        // LƯU NGAY VÀO LOCAL DATABASE ĐỂ OFFLINE / GITHUB PAGES CŨNG ĐỒNG BỘ
        try {
          const db = getLocalDb();
          const newUser = {
            id: data.user?.id || Date.now(),
            UserID: data.user?.id || Date.now(),
            ...userData,
            username: trimmedUsername,
            role: 'Reader',
            Role: 'Reader'
          };
          db.users = [
            ...(db.users || []).filter(u => u.username && u.username.toLowerCase() !== trimmedUsername.toLowerCase()),
            newUser
          ];
          saveLocalDb(db);
        } catch (e) {}

        notifyDataUpdated('reader');
        return data;
      } else if (res.status === 400) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Tên đăng nhập đã tồn tại!');
      }
    } catch (e) {
      if (e.message && e.message !== 'Failed to fetch' && !e.message.includes('NetworkError')) {
        throw e;
      }
    }

    // Local / GitHub Pages fallback (khi chạy không có server backend)
    const db = getLocalDb();
    if ((db.users || []).some(u => u.username && u.username.toLowerCase() === trimmedUsername.toLowerCase())) {
      throw new Error('Tên đăng nhập này đã được sử dụng. Vui lòng chọn tên khác!');
    }
    const newId = Math.max(0, ...(db.users || []).map(u => Number(u.id) || 0)) + 1;
    const newUser = {
      id: newId,
      UserID: newId,
      ...userData,
      username: trimmedUsername,
      role: 'Reader',
      Role: 'Reader'
    };
    db.users = [...(db.users || []), newUser];
    saveLocalDb(db);
    notifyDataUpdated('reader');
    return { user: newUser, message: 'Đăng ký thành công!' };
  },

  updateProfile: async (userId, data) => {
    try {
      const res = await fetch(`${API_BASE}/auth/profile/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) return await res.json();
    } catch (e) {}

    const db = getLocalDb();
    db.users = (db.users || []).map(u => Number(u.id) === Number(userId) ? { ...u, ...data } : u);
    saveLocalDb(db);
    return { success: true };
  },

  changePassword: async (userId, currentPassword, newPassword) => {
    try {
      const res = await fetch(`${API_BASE}/auth/change-password/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      if (res.ok) return await res.json();
    } catch (e) {}

    const db = getLocalDb();
    db.users = (db.users || []).map(u => Number(u.id) === Number(userId) ? { ...u, password: newPassword } : u);
    saveLocalDb(db);
    return { success: true };
  },

  // Books
  getBooks: async () => {
    try {
      const res = await fetch(`${API_BASE}/books`);
      if (res.ok) return await res.json();
    } catch (e) {}
    return getLocalDb().books || [];
  },

  createBook: async (bookData) => {
    try {
      const res = await fetch(`${API_BASE}/books`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookData)
      });
      if (res.ok) {
        const result = await res.json();
        notifyDataUpdated('book');
        return result;
      }
    } catch (e) {}

    const db = getLocalDb();
    const newId = Math.max(0, ...(db.books || []).map(b => Number(b.id) || 0)) + 1;
    const newBook = { id: newId, ...bookData, available: bookData.quantity || 1, borrowed: 0 };
    db.books = [newBook, ...(db.books || [])];
    saveLocalDb(db);
    notifyDataUpdated('book');
    return newBook;
  },

  updateBook: async (bookId, bookData) => {
    try {
      const res = await fetch(`${API_BASE}/books/${bookId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookData)
      });
      if (res.ok) {
        const result = await res.json();
        notifyDataUpdated('book');
        return result;
      }
    } catch (e) {}

    const db = getLocalDb();
    db.books = (db.books || []).map(b => Number(b.id) === Number(bookId) ? { ...b, ...bookData } : b);
    saveLocalDb(db);
    notifyDataUpdated('book');
    return { success: true };
  },

  deleteBook: async (bookId) => {
    try {
      const res = await fetch(`${API_BASE}/books/${bookId}`, { method: 'DELETE' });
      if (res.ok) {
        const result = await res.json();
        notifyDataUpdated('book');
        return result;
      }
    } catch (e) {}

    const db = getLocalDb();
    db.books = (db.books || []).filter(b => Number(b.id) !== Number(bookId));
    saveLocalDb(db);
    notifyDataUpdated('book');
    return { success: true };
  },

  // Readers
  getReaders: async () => {
    try {
      const res = await fetch(`${API_BASE}/readers`);
      if (res.ok) return await res.json();
    } catch (e) {}
    const db = getLocalDb();
    return (db.users || []).filter(u => u.role === 'Reader');
  },

  createReader: async (readerData) => {
    try {
      const res = await fetch(`${API_BASE}/readers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(readerData)
      });
      if (res.ok) {
        const result = await res.json();
        notifyDataUpdated('reader');
        return result;
      }
    } catch (e) {}

    const db = getLocalDb();
    const newId = Math.max(0, ...(db.users || []).map(u => Number(u.id) || 0)) + 1;
    const newReader = { id: newId, UserID: newId, role: 'Reader', Role: 'Reader', ...readerData };
    db.users = [...(db.users || []), newReader];
    saveLocalDb(db);
    notifyDataUpdated('reader');
    return newReader;
  },

  updateReader: async (readerId, readerData) => {
    try {
      const res = await fetch(`${API_BASE}/readers/${readerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(readerData)
      });
      if (res.ok) {
        const result = await res.json();
        notifyDataUpdated('reader');
        return result;
      }
    } catch (e) {}

    const db = getLocalDb();
    db.users = (db.users || []).map(u => Number(u.id) === Number(readerId) ? { ...u, ...readerData } : u);
    saveLocalDb(db);
    notifyDataUpdated('reader');
    return { success: true };
  },

  deleteReader: async (readerId) => {
    try {
      const res = await fetch(`${API_BASE}/readers/${readerId}`, { method: 'DELETE' });
      if (res.ok) {
        const result = await res.json();
        notifyDataUpdated('reader');
        return result;
      }
    } catch (e) {}

    const db = getLocalDb();
    db.users = (db.users || []).filter(u => Number(u.id) !== Number(readerId));
    saveLocalDb(db);
    notifyDataUpdated('reader');
    return { success: true };
  },

  // Borrow Records
  getBorrowRecords: async () => {
    try {
      const res = await fetch(`${API_BASE}/borrow-records`);
      if (res.ok) return await res.json();
    } catch (e) {}
    return getLocalDb().borrowRecords || [];
  },

  createBorrowRecord: async (data) => {
    try {
      const res = await fetch(`${API_BASE}/borrow-records`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        const result = await res.json();
        notifyDataUpdated('borrow');
        return result;
      }
    } catch (e) {}

    const db = getLocalDb();
    const newId = Math.max(0, ...(db.borrowRecords || []).map(r => Number(r.id) || 0)) + 1;
    const now = new Date();
    const returnD = new Date();
    returnD.setDate(now.getDate() + 14);
    const newRecord = {
      id: newId,
      bookId: data.bookId,
      bookTitle: data.bookTitle,
      readerId: data.readerId || 2,
      readerName: data.readerName || 'Độc giả',
      borrowDate: now.toISOString(),
      returnDate: returnD.toISOString().substring(0, 10),
      borrowType: data.borrowType || 'Mượn về nhà',
      status: 'Chờ duyệt'
    };
    db.borrowRecords = [newRecord, ...(db.borrowRecords || [])];

    // Notification for Admin
    const notifId = Math.max(0, ...(db.notifications || []).map(n => Number(n.id) || 0)) + 1;
    db.notifications = [
      {
        id: notifId,
        recipientRole: 'Admin',
        title: 'Yêu cầu mượn sách mới',
        message: `Độc giả ${newRecord.readerName} vừa gửi yêu cầu mượn cuốn sách "${newRecord.bookTitle}" (${newRecord.borrowType}).`,
        type: 'borrow_request',
        recordId: newId,
        bookId: data.bookId,
        bookTitle: data.bookTitle,
        readerName: newRecord.readerName,
        isRead: false,
        createdAt: now.toISOString()
      },
      ...(db.notifications || [])
    ];

    saveLocalDb(db);
    notifyDataUpdated('borrow');
    return newRecord;
  },

  approveBorrow: async (recordId) => {
    try {
      const res = await fetch(`${API_BASE}/borrow-records/${recordId}/approve`, { method: 'PUT' });
      if (res.ok) {
        const result = await res.json();
        notifyDataUpdated('borrow');
        return result;
      }
    } catch (e) {}

    const db = getLocalDb();
    let approvedRec = null;
    db.borrowRecords = (db.borrowRecords || []).map(r => {
      if (Number(r.id) === Number(recordId)) {
        approvedRec = { ...r, status: 'Đang mượn' };
        return approvedRec;
      }
      return r;
    });

    if (approvedRec) {
      const notifId = Math.max(0, ...(db.notifications || []).map(n => Number(n.id) || 0)) + 1;
      db.notifications = [
        {
          id: notifId,
          recipientRole: 'Reader',
          recipientUserId: approvedRec.readerId || 2,
          title: 'Yêu cầu mượn sách đã được duyệt',
          message: `Yêu cầu mượn cuốn sách "${approvedRec.bookTitle}" của bạn đã được duyệt thành công!`,
          type: 'borrow_approved',
          recordId: approvedRec.id,
          bookId: approvedRec.bookId,
          bookTitle: approvedRec.bookTitle,
          isRead: false,
          createdAt: new Date().toISOString()
        },
        ...(db.notifications || [])
      ];
    }

    saveLocalDb(db);
    notifyDataUpdated('borrow');
    return { success: true };
  },

  rejectBorrow: async (recordId) => {
    try {
      const res = await fetch(`${API_BASE}/borrow-records/${recordId}/reject`, { method: 'PUT' });
      if (res.ok) {
        const result = await res.json();
        notifyDataUpdated('borrow');
        return result;
      }
    } catch (e) {}

    const db = getLocalDb();
    let rejectedRec = null;
    db.borrowRecords = (db.borrowRecords || []).map(r => {
      if (Number(r.id) === Number(recordId)) {
        rejectedRec = { ...r, status: 'Từ chối' };
        return rejectedRec;
      }
      return r;
    });

    if (rejectedRec) {
      const notifId = Math.max(0, ...(db.notifications || []).map(n => Number(n.id) || 0)) + 1;
      db.notifications = [
        {
          id: notifId,
          recipientRole: 'Reader',
          recipientUserId: rejectedRec.readerId || 2,
          title: 'Yêu cầu mượn sách bị từ chối',
          message: `Yêu cầu mượn cuốn sách "${rejectedRec.bookTitle}" đã bị từ chối.`,
          type: 'borrow_rejected',
          recordId: rejectedRec.id,
          bookId: rejectedRec.bookId,
          bookTitle: rejectedRec.bookTitle,
          isRead: false,
          createdAt: new Date().toISOString()
        },
        ...(db.notifications || [])
      ];
    }

    saveLocalDb(db);
    notifyDataUpdated('borrow');
    return { success: true };
  },

  updateBorrowStatus: async (recordId, status) => {
    // 1. Luôn cập nhật localDb trước để đảm bảo trạng thái đổi ngay lập tức
    const db = getLocalDb();
    let updated = null;
    db.borrowRecords = (db.borrowRecords || []).map(r => {
      if (Number(r.id) === Number(recordId)) {
        updated = { ...r, status };
        if (status === 'Đã trả') {
          updated.actualReturnDate = new Date().toISOString().substring(0, 10);
        }
        return updated;
      }
      return r;
    });
    saveLocalDb(db);
    notifyDataUpdated('borrow');

    // 2. Nếu có máy chủ backend, đồng bộ sang backend
    if (!isStaticHost) {
      try {
        const res = await fetch(`${API_BASE}/borrow-records/${recordId}/status`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status })
        });
        if (res.ok) {
          return await res.json();
        }
      } catch (e) {}
    }

    return { success: true, record: updated };
  },

  // Notifications
  getNotifications: async (role, userId) => {
    try {
      const params = new URLSearchParams();
      if (role) params.append('role', role);
      if (userId) params.append('userId', userId);
      const res = await fetch(`${API_BASE}/notifications?${params.toString()}`);
      if (res.ok) return await res.json();
    } catch (e) {}

    const db = getLocalDb();
    let notifs = db.notifications || [];
    if (role === 'Admin') {
      notifs = notifs.filter(n => n.recipientRole === 'Admin');
    } else if (role === 'Reader') {
      notifs = notifs.filter(n => n.recipientRole === 'Reader' && (!userId || !n.recipientUserId || Number(n.recipientUserId) === Number(userId)));
    }
    return notifs;
  },

  readNotification: async (notifId) => {
    try {
      const res = await fetch(`${API_BASE}/notifications/${notifId}/read`, { method: 'PUT' });
      if (res.ok) return await res.json();
    } catch (e) {}

    const db = getLocalDb();
    db.notifications = (db.notifications || []).map(n => Number(n.id) === Number(notifId) ? { ...n, isRead: true } : n);
    saveLocalDb(db);
    return { success: true };
  },

  readAllNotifications: async (role, userId) => {
    try {
      const res = await fetch(`${API_BASE}/notifications/read-all`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, userId })
      });
      if (res.ok) return await res.json();
    } catch (e) {}

    const db = getLocalDb();
    db.notifications = (db.notifications || []).map(n => ({ ...n, isRead: true }));
    saveLocalDb(db);
    return { success: true };
  },

  // Stats
  getStats: async () => {
    try {
      const res = await fetch(`${API_BASE}/stats`);
      if (res.ok) return await res.json();
    } catch (e) {}

    const db = getLocalDb();
    const books = db.books || [];
    const totalBooks = books.length;
    const totalReaders = (db.users || []).filter(u => u.role === 'Reader').length;
    const records = db.borrowRecords || [];
    const activeBorrows = records.filter(r => r.status === 'Đang mượn').length;
    const pendingBorrows = records.filter(r => r.status === 'Chờ duyệt').length;
    const overdueBorrows = records.filter(r => r.status === 'Quá hạn').length;
    const returnedBooks = records.filter(r => r.status === 'Đã trả').length;

    return {
      totalBooks,
      totalReaders,
      activeBorrows,
      pendingBorrows,
      overdueBorrows,
      returnedBooks
    };
  }
};