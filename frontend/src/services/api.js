// SmartLib Unified API Client with Backend / LocalStorage Fallback for GitHub Pages & Local
import initialDb from '../../../data/database.json';

const API_BASE = '/api';

// Local storage fallback database helper with in-memory singleton
const DB_VERSION = 'v12_github_pages_flawless_2026';

// Singleton BroadcastChannel for 0ms instantaneous cross-tab synchronization
const syncChannel = typeof window !== 'undefined' && typeof BroadcastChannel !== 'undefined'
  ? new BroadcastChannel('smartlib_realtime_sync')
  : null;

let memoryDb = null;
let memoryDbTimestamp = 0;

if (syncChannel && typeof window !== 'undefined') {
  syncChannel.onmessage = (event) => {
    // Invalidate in-memory database cache so next read loads latest data from localStorage
    memoryDb = null;
    memoryDbTimestamp = 0;
    window.dispatchEvent(new CustomEvent('smartlib:data-updated', { detail: event.data }));
  };
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === 'smartlib_db' || e.key === 'smartlib_db_timestamp' || e.key === 'smartlib_last_update') {
      memoryDb = null;
      memoryDbTimestamp = 0;
      window.dispatchEvent(new CustomEvent('smartlib:data-updated', { detail: { type: 'storage' } }));
    }
  });
}

const isStaticHost = typeof window !== 'undefined' && (
  window.location.hostname.includes('github.io') ||
  window.location.protocol === 'file:'
);

const getLocalDb = (forceFresh = false) => {
  try {
    const storedTime = Number(localStorage.getItem('smartlib_db_timestamp') || 0);
    // If cache is valid and no external update occurred, return memoryDb
    if (!forceFresh && memoryDb && storedTime > 0 && storedTime === memoryDbTimestamp) {
      return memoryDb;
    }

    const savedVersion = localStorage.getItem('smartlib_db_version');
    const raw = localStorage.getItem('smartlib_db');
    if (raw && savedVersion === DB_VERSION) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.books) && parsed.books.length > 0) {
        // Khôi phục lại imageUrl gốc từ initialDb nếu trong LocalStorage đã được rút gọn nhẹ
        parsed.books = parsed.books.map((b, i) => {
          const orig = initialDb.books?.[i] || initialDb.books?.find(x => x.id === b.id);
          return {
            ...b,
            imageUrl: (orig && orig.imageUrl) || b.imageUrl
          };
        });
        memoryDb = parsed;
        memoryDbTimestamp = storedTime;
        return memoryDb;
      }
    }
  } catch (e) {
    // ignore
  }

  const clone = JSON.parse(JSON.stringify(initialDb));
  memoryDb = clone;
  saveLocalDb(clone);

  // Tự động đồng bộ lại currentUser nếu đang có phiên đăng nhập cũ
  try {
    const rawUser = localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser');
    const rawRole = localStorage.getItem('currentUserRole') || sessionStorage.getItem('currentUserRole');
    if (rawUser) {
      const u = JSON.parse(rawUser);
      if (u) {
        if (u.username === 'admin' || u.role === 'Admin' || rawRole === 'Admin') {
          const freshAdmin = (clone.users || []).find(usr => usr.username === 'admin') || {
            id: 1,
            username: 'admin',
            role: 'Admin',
            Role: 'Admin',
            fullName: 'Quản trị viên',
            FullName: 'Quản trị viên',
            email: 'admin@smartlib.edu.vn',
            phone: '0987 654 321',
            address: 'Phòng Quản lý Thư viện, ĐHQG Hà Nội',
            birthDate: '1990-01-01'
          };
          const merged = { ...freshAdmin, ...u, id: 1, UserID: 1, username: 'admin', role: 'Admin', Role: 'Admin' };
          if (merged.fullName === 'Trần Thị Mai' || merged.fullName === 'Độc giả') {
            merged.fullName = 'Quản trị viên';
            merged.FullName = 'Quản trị viên';
          }
          if (merged.email && merged.email.includes('mai.tran')) merged.email = 'admin@smartlib.edu.vn';
          if (merged.phone === '0901 234 567') merged.phone = '0987 654 321';
          if (merged.address && merged.address.includes('Mễ Trì')) merged.address = 'Phòng Quản lý Thư viện, ĐHQG Hà Nội';
          if (merged.birthDate === '2002-10-20') merged.birthDate = '1990-01-01';
          localStorage.setItem('currentUser', JSON.stringify(merged));
          sessionStorage.setItem('currentUser', JSON.stringify(merged));
          localStorage.setItem('currentUserRole', 'Admin');
          sessionStorage.setItem('currentUserRole', 'Admin');
        } else if (u.username === 'reader' || Number(u.id) === 2 || u.role === 'Reader') {
          const freshReader = (clone.users || []).find(usr => usr.username === 'reader') || {
            id: 2,
            username: 'reader',
            role: 'Reader',
            Role: 'Reader',
            fullName: 'Trần Thị Mai',
            FullName: 'Trần Thị Mai',
            email: 'mai.tran@smartlib.edu.vn',
            phone: '0901 234 567',
            address: 'Khu KTX Sinh viên Mễ Trì, Thanh Xuân, Hà Nội',
            birthDate: '2002-10-20'
          };
          const merged = { ...freshReader, ...u, id: 2, UserID: 2, username: 'reader', role: 'Reader', Role: 'Reader' };
          if (!merged.fullName || merged.fullName === 'Độc giả' || merged.fullName === 'Quản trị viên') {
            merged.fullName = 'Trần Thị Mai';
            merged.FullName = 'Trần Thị Mai';
          }
          if (merged.email && merged.email.includes('admin')) merged.email = 'mai.tran@smartlib.edu.vn';
          if (merged.phone === '0987 654 321') merged.phone = '0901 234 567';
          if (merged.address && merged.address.includes('ĐHQG')) merged.address = 'Khu KTX Sinh viên Mễ Trì, Thanh Xuân, Hà Nội';
          if (merged.birthDate === '1990-01-01') merged.birthDate = '2002-10-20';
          localStorage.setItem('currentUser', JSON.stringify(merged));
          sessionStorage.setItem('currentUser', JSON.stringify(merged));
          localStorage.setItem('currentUserRole', 'Reader');
          sessionStorage.setItem('currentUserRole', 'Reader');
        }
      }
    }
  } catch (e) {}

  return memoryDb;
};

const saveLocalDb = (db) => {
  memoryDb = db;
  const now = Date.now();
  memoryDbTimestamp = now;
  try {
    localStorage.setItem('smartlib_db_version', DB_VERSION);
    localStorage.setItem('smartlib_db_timestamp', String(now));
    // Để không bao giờ bị tràn quota LocalStorage (5MB limit, trong khi ảnh base64 chiếm 1.25MB),
    // chúng ta lưu phiên bản nhẹ của books (ảnh được lấy từ bundle initialDb)
    const lightDb = {
      ...db,
      books: (db.books || []).map(b => {
        const { imageUrl, ...rest } = b;
        return rest;
      })
    };
    localStorage.setItem('smartlib_db', JSON.stringify(lightDb));
  } catch (e) {
    console.error('LocalStorage write error:', e);
  }
};

// Global Real-time Data Synchronization Broadcaster
export const notifyDataUpdated = (type = 'all', meta = {}) => {
  if (typeof window !== 'undefined') {
    const payload = { type, timestamp: Date.now(), meta };
    
    // Invalidate local memory cache immediately
    memoryDb = null;
    memoryDbTimestamp = 0;

    // 1. Dispatch custom event for current window
    window.dispatchEvent(new CustomEvent('smartlib:data-updated', { detail: payload }));
    
    // 2. BroadcastChannel to all other tabs (0ms instant event)
    try {
      syncChannel?.postMessage(payload);
    } catch (e) {}
    
    // 3. Storage event fallback for other windows
    try {
      localStorage.setItem('smartlib_last_update', JSON.stringify(payload));
    } catch (e) {}
  }
};

export const api = {
  // Auth
  login: async (username, password) => {
    const trimmedUsername = (username || '').trim();
    if (!isStaticHost) {
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
    }

    // Ưu tiên tra cứu từ Local Database (đã đồng bộ chuẩn theo database.json)
    const db = getLocalDb();
    const found = (db.users || []).find(
      u => u.username && u.username.toLowerCase() === trimmedUsername.toLowerCase() && u.password === password
    );
    if (found) {
      return { user: found };
    }

    // Local / GitHub Pages fallback an toàn cho 2 tài khoản chính thức: admin và reader
    if (trimmedUsername.toLowerCase() === 'admin' && password === '123') {
      const adminUser = {
        id: 1,
        UserID: 1,
        username: 'admin',
        role: 'Admin',
        Role: 'Admin',
        fullName: 'Quản trị viên',
        FullName: 'Quản trị viên',
        email: 'admin@smartlib.edu.vn',
        phone: '0987 654 321',
        address: 'Phòng Quản lý Thư viện, ĐHQG Hà Nội'
      };
      return { user: adminUser };
    } else if ((trimmedUsername.toLowerCase() === 'reader' || trimmedUsername.toLowerCase() === 'docgia') && password === '123') {
      const readerUser = {
        id: 2,
        UserID: 2,
        username: 'reader',
        role: 'Reader',
        Role: 'Reader',
        fullName: 'Trần Thị Mai',
        FullName: 'Trần Thị Mai',
        email: 'mai.tran@smartlib.edu.vn',
        phone: '0901 234 567',
        address: 'Khu KTX Sinh viên Mễ Trì, Thanh Xuân, Hà Nội'
      };
      return { user: readerUser };
    }

    throw new Error('Tên đăng nhập hoặc mật khẩu không chính xác!');
  },

  register: async (userData) => {
    const trimmedUsername = (userData.username || '').trim();
    if (!isStaticHost) {
      try {
        const res = await fetch(`${API_BASE}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...userData, username: trimmedUsername })
        });
        if (res.ok) {
          const data = await res.json();
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
    if (!isStaticHost) {
      try {
        const res = await fetch(`${API_BASE}/auth/profile/${userId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        if (res.ok) return await res.json();
      } catch (e) {}
    }

    const db = getLocalDb();
    db.users = (db.users || []).map(u => Number(u.id) === Number(userId) ? { ...u, ...data } : u);
    saveLocalDb(db);
    return { success: true };
  },

  changePassword: async (userId, currentPassword, newPassword) => {
    if (!isStaticHost) {
      try {
        const res = await fetch(`${API_BASE}/auth/change-password/${userId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ currentPassword, newPassword })
        });
        if (res.ok) return await res.json();
      } catch (e) {}
    }

    const db = getLocalDb();
    db.users = (db.users || []).map(u => Number(u.id) === Number(userId) ? { ...u, password: newPassword } : u);
    saveLocalDb(db);
    return { success: true };
  },

  // Books
  getBooks: async () => {
    if (!isStaticHost) {
      try {
        const res = await fetch(`${API_BASE}/books`);
        if (res.ok) return await res.json();
      } catch (e) {}
    }
    return getLocalDb().books || [];
  },

  createBook: async (bookData) => {
    if (!isStaticHost) {
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
    }

    const db = getLocalDb();
    const newId = Math.max(0, ...(db.books || []).map(b => Number(b.id) || 0)) + 1;
    const newBook = { id: newId, ...bookData, available: bookData.quantity || 1, borrowed: 0 };
    db.books = [newBook, ...(db.books || [])];
    saveLocalDb(db);
    notifyDataUpdated('book');
    return newBook;
  },

  updateBook: async (bookId, bookData) => {
    if (!isStaticHost) {
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
    }

    const db = getLocalDb();
    db.books = (db.books || []).map(b => Number(b.id) === Number(bookId) ? { ...b, ...bookData } : b);
    saveLocalDb(db);
    notifyDataUpdated('book');
    return { success: true };
  },

  deleteBook: async (bookId) => {
    if (!isStaticHost) {
      try {
        const res = await fetch(`${API_BASE}/books/${bookId}`, { method: 'DELETE' });
        if (res.ok) {
          const result = await res.json();
          notifyDataUpdated('book');
          return result;
        }
      } catch (e) {}
    }

    const db = getLocalDb();
    db.books = (db.books || []).filter(b => Number(b.id) !== Number(bookId));
    saveLocalDb(db);
    notifyDataUpdated('book');
    return { success: true };
  },

  // Readers
  getReaders: async () => {
    if (!isStaticHost) {
      try {
        const res = await fetch(`${API_BASE}/readers`);
        if (res.ok) return await res.json();
      } catch (e) {}
    }
    const db = getLocalDb();
    return (db.users || []).filter(u => u.role === 'Reader');
  },

  createReader: async (readerData) => {
    if (!isStaticHost) {
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
    }

    const db = getLocalDb();
    const newId = Math.max(0, ...(db.users || []).map(u => Number(u.id) || 0)) + 1;
    const newReader = { id: newId, UserID: newId, role: 'Reader', Role: 'Reader', ...readerData };
    db.users = [...(db.users || []), newReader];
    saveLocalDb(db);
    notifyDataUpdated('reader');
    return newReader;
  },

  updateReader: async (readerId, readerData) => {
    if (!isStaticHost) {
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
    }

    const db = getLocalDb();
    db.users = (db.users || []).map(u => Number(u.id) === Number(readerId) ? { ...u, ...readerData } : u);
    saveLocalDb(db);
    notifyDataUpdated('reader');
    return { success: true };
  },

  deleteReader: async (readerId) => {
    if (!isStaticHost) {
      try {
        const res = await fetch(`${API_BASE}/readers/${readerId}`, { method: 'DELETE' });
        if (res.ok) {
          const result = await res.json();
          notifyDataUpdated('reader');
          return result;
        }
      } catch (e) {}
    }

    const db = getLocalDb();
    db.users = (db.users || []).filter(u => Number(u.id) !== Number(readerId));
    saveLocalDb(db);
    notifyDataUpdated('reader');
    return { success: true };
  },

  // Borrow Records
  getBorrowRecords: async () => {
    if (!isStaticHost) {
      try {
        const res = await fetch(`${API_BASE}/borrow-records`);
        if (res.ok) return await res.json();
      } catch (e) {}
    }
    return getLocalDb().borrowRecords || [];
  },

  createBorrowRecord: async (data) => {
    const db = getLocalDb();
    const targetBook = (db.books || []).find(b => Number(b.id) === Number(data.bookId));
    const finalBookTitle = data.bookTitle || targetBook?.title || 'Sách thư viện';
    const finalReaderName = data.readerName || 'Trần Thị Mai';
    const finalReaderId = Number(data.readerId || data.userId || 2);
    const enrichedData = {
      ...data,
      bookId: Number(data.bookId),
      bookTitle: finalBookTitle,
      readerId: finalReaderId,
      userId: finalReaderId,
      readerName: finalReaderName
    };

    if (!isStaticHost) {
      try {
        const res = await fetch(`${API_BASE}/borrow-records`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(enrichedData)
        });
        if (res.ok) {
          const result = await res.json();
          const localRecord = result.record || {
            id: result.id || Date.now(),
            bookId: enrichedData.bookId,
            bookTitle: finalBookTitle,
            readerId: finalReaderId,
            readerName: finalReaderName,
            borrowDate: new Date().toISOString(),
            returnDate: new Date(Date.now() + 14 * 86400000).toISOString().substring(0, 10),
            borrowType: data.borrowType || 'Mượn về nhà',
            status: 'Chờ duyệt'
          };
          db.borrowRecords = [localRecord, ...(db.borrowRecords || []).filter(r => Number(r.id) !== Number(localRecord.id))];
          saveLocalDb(db);
          notifyDataUpdated('borrow');
          return result;
        }
      } catch (e) {}
    }

    const newId = Math.max(0, ...(db.borrowRecords || []).map(r => Number(r.id) || 0)) + 1;
    const now = new Date();
    const returnD = new Date();
    returnD.setDate(now.getDate() + 14);
    const newRecord = {
      id: newId,
      bookId: enrichedData.bookId,
      bookTitle: finalBookTitle,
      readerId: finalReaderId,
      readerName: finalReaderName,
      borrowDate: now.toISOString(),
      returnDate: returnD.toISOString().substring(0, 10),
      borrowType: data.borrowType || 'Mượn về nhà',
      status: 'Chờ duyệt'
    };
    db.borrowRecords = [newRecord, ...(db.borrowRecords || [])];

    // Notification for both Reader and Admin
    const notifId1 = Math.max(0, ...(db.notifications || []).map(n => Number(n.id) || 0)) + 1;
    const notifId2 = notifId1 + 1;
    db.notifications = [
      {
        id: notifId1,
        recipientRole: 'Reader',
        recipientUserId: finalReaderId,
        title: 'Yêu cầu mượn sách đang chờ duyệt',
        message: `Yêu cầu mượn cuốn sách "${finalBookTitle}" của bạn đã được gửi thành công và đang chờ thủ thư phê duyệt.`,
        type: 'borrow_request',
        recordId: newId,
        bookId: enrichedData.bookId,
        bookTitle: finalBookTitle,
        isRead: false,
        createdAt: now.toISOString()
      },
      {
        id: notifId2,
        recipientRole: 'Admin',
        title: 'Yêu cầu mượn sách mới',
        message: `Độc giả ${finalReaderName} vừa gửi yêu cầu mượn cuốn sách "${finalBookTitle}" (${newRecord.borrowType}).`,
        type: 'borrow_request',
        recordId: newId,
        bookId: enrichedData.bookId,
        bookTitle: finalBookTitle,
        readerName: finalReaderName,
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
    if (!isStaticHost) {
      try {
        const res = await fetch(`${API_BASE}/borrow-records/${recordId}/approve`, { method: 'PUT' });
        if (res.ok) {
          const result = await res.json();
          notifyDataUpdated('borrow');
          return result;
        }
      } catch (e) {}
    }

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
    if (!isStaticHost) {
      try {
        const res = await fetch(`${API_BASE}/borrow-records/${recordId}/reject`, { method: 'PUT' });
        if (res.ok) {
          const result = await res.json();
          notifyDataUpdated('borrow');
          return result;
        }
      } catch (e) {}
    }

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

    // Khi trả sách thành công, khôi phục số lượng sách và gửi thông báo
    if (status === 'Đã trả' && updated) {
      if (updated.bookId) {
        db.books = (db.books || []).map(b => {
          if (Number(b.id) === Number(updated.bookId)) {
            const newBorrowed = Math.max(0, (Number(b.borrowed) || 1) - 1);
            const newAvailable = Math.min(Number(b.quantity) || 1, (Number(b.available) || 0) + 1);
            return { ...b, borrowed: newBorrowed, available: newAvailable };
          }
          return b;
        });
      }

      // Đánh dấu đã đọc tất cả thông báo mượn/chờ duyệt/duyệt cũ của lượt mượn này
      db.notifications = (db.notifications || []).map(n => {
        if (Number(n.recordId) === Number(recordId) || (n.meta && Number(n.meta.recordId) === Number(recordId))) {
          return { ...n, isRead: true };
        }
        return n;
      });

      const maxId = Math.max(0, ...(db.notifications || []).map(n => Number(n.id) || 0));
      const nowStr = new Date().toISOString();
      const notifAdmin = {
        id: maxId + 2,
        recipientRole: 'Admin',
        title: 'Độc giả đã trả sách',
        message: `Độc giả ${updated.readerName || 'Trần Thị Mai'} đã trả cuốn sách "${updated.bookTitle}".`,
        type: 'book_returned',
        recordId: updated.id,
        bookId: updated.bookId,
        bookTitle: updated.bookTitle,
        readerName: updated.readerName || 'Trần Thị Mai',
        isRead: false,
        createdAt: nowStr
      };
      const notifReader = {
        id: maxId + 1,
        recipientRole: 'Reader',
        recipientUserId: updated.readerId || 2,
        title: 'Xác nhận trả sách thành công',
        message: `Bạn đã hoàn tất trả cuốn sách "${updated.bookTitle}". Cảm ơn bạn đã giữ gìn sách cẩn thận!`,
        type: 'book_returned',
        recordId: updated.id,
        bookId: updated.bookId,
        bookTitle: updated.bookTitle,
        isRead: false,
        createdAt: nowStr
      };
      db.notifications = [notifAdmin, notifReader, ...(db.notifications || [])];
    } else if (status === 'Đã hủy' && updated) {
      // Đánh dấu đã đọc tất cả thông báo cũ của lượt mượn này
      db.notifications = (db.notifications || []).map(n => {
        if (Number(n.recordId) === Number(recordId) || (n.meta && Number(n.meta.recordId) === Number(recordId))) {
          return { ...n, isRead: true };
        }
        return n;
      });

      const maxId = Math.max(0, ...(db.notifications || []).map(n => Number(n.id) || 0));
      const nowStr = new Date().toISOString();
      db.notifications = [
        {
          id: maxId + 2,
          recipientRole: 'Admin',
          title: 'Độc giả đã hủy yêu cầu mượn',
          message: `Độc giả ${updated.readerName || 'Trần Thị Mai'} đã hủy yêu cầu mượn cuốn sách "${updated.bookTitle}".`,
          type: 'borrow_rejected',
          recordId: updated.id,
          bookId: updated.bookId,
          bookTitle: updated.bookTitle,
          readerName: updated.readerName || 'Trần Thị Mai',
          isRead: false,
          createdAt: nowStr
        },
        {
          id: maxId + 1,
          recipientRole: 'Reader',
          recipientUserId: updated.readerId || 2,
          title: 'Đã hủy yêu cầu mượn sách',
          message: `Bạn đã hủy thành công yêu cầu mượn cuốn sách "${updated.bookTitle}".`,
          type: 'borrow_rejected',
          recordId: updated.id,
          bookId: updated.bookId,
          bookTitle: updated.bookTitle,
          isRead: false,
          createdAt: nowStr
        },
        ...(db.notifications || [])
      ];
    }

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
          const result = await res.json();
          notifyDataUpdated('borrow');
          return result;
        }
      } catch (e) {}
    }

    return { success: true, record: updated };
  },

  // Notifications
  getNotifications: async (role, userId) => {
    if (!isStaticHost) {
      try {
        const params = new URLSearchParams();
        if (role) params.append('role', role);
        if (userId) params.append('userId', userId);
        const res = await fetch(`${API_BASE}/notifications?${params.toString()}`);
        if (res.ok) return await res.json();
      } catch (e) {}
    }

    const db = getLocalDb();
    let notifs = db.notifications || [];
    if (role === 'Admin') {
      notifs = notifs.filter(n => n.recipientRole === 'Admin');
    } else if (role === 'Reader') {
      notifs = notifs.filter(n => n.recipientRole === 'Reader' && (!userId || !n.recipientUserId || Number(n.recipientUserId) === Number(userId)));
    }
    const unreadCount = notifs.filter(n => !n.isRead).length;
    return { notifications: notifs, unreadCount };
  },

  readNotification: async (notifId) => {
    if (!isStaticHost) {
      try {
        await fetch(`${API_BASE}/notifications/${notifId}/read`, { method: 'PUT' });
      } catch (e) {}
    }

    const db = getLocalDb();
    db.notifications = (db.notifications || []).map(n => Number(n.id) === Number(notifId) ? { ...n, isRead: true } : n);
    saveLocalDb(db);
    notifyDataUpdated('notification');
    return { success: true };
  },

  readAllNotifications: async (role, userId) => {
    if (!isStaticHost) {
      try {
        await fetch(`${API_BASE}/notifications/read-all`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role, userId: userId ? Number(userId) : null })
        });
      } catch (e) {}
    }

    const db = getLocalDb();
    db.notifications = (db.notifications || []).map(n => {
      if (!role || n.recipientRole === role) {
        if (role === 'Reader' && userId && n.recipientUserId != null) {
          if (Number(n.recipientUserId) !== Number(userId)) return n;
        }
        return { ...n, isRead: true };
      }
      return n;
    });
    saveLocalDb(db);
    notifyDataUpdated('notification');
    return { success: true };
  },

  // Stats
  getStats: async () => {
    if (!isStaticHost) {
      try {
        const res = await fetch(`${API_BASE}/stats`);
        if (res.ok) return await res.json();
      } catch (e) {}
    }

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