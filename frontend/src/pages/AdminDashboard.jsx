import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { exportApi } from '../services/exportApi';
import BookCard from '../components/BookCard';
import BookDetailModal from '../components/BookDetailModal';
import AddEditBookModal from '../components/AddEditBookModal';
import AddEditReaderModal from '../components/AddEditReaderModal';
import BorrowModal from '../components/BorrowModal';
import ExportReportModal from '../components/ExportReportModal';
import {
  BookOpen, Users, Clock, AlertTriangle, CheckCircle, Search, Plus,
  FileSpreadsheet, Filter, Grid, List, Check, X, Printer, Edit2, Trash2, BookMarked, Eye,
  TrendingUp, BookmarkCheck, XCircle
} from 'lucide-react';

const getReaderCode = (id) => {
  if (!id) return 'DG-001';
  const num = id === 2 ? 1 : (typeof id === 'number' ? id - 1 : parseInt(id) || 1);
  return `DG-${String(Math.max(1, num)).padStart(3, '0')}`;
};

function MonthlyTrendChart() {
  const baseData = [38, 65, 76, 62, 92, 85, 110, 98, 120, 105, 88, 130];
  const months = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'];
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const width = 360;
  const height = 180;
  const paddingLeft = 30;
  const paddingRight = 14;
  const paddingTop = 20;
  const paddingBottom = 26;

  const chartW = width - paddingLeft - paddingRight;
  const chartH = height - paddingTop - paddingBottom;
  const maxY = 140;

  const points = baseData.map((val, idx) => {
    const x = paddingLeft + idx * (chartW / (baseData.length - 1));
    const y = paddingTop + chartH - (val / maxY) * chartH;
    return { x, y, val, month: months[idx] };
  });

  const polylinePoints = points.map(p => `${p.x},${p.y}`).join(' ');

  return (
    <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #eef2f6', padding: '20px 22px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', margin: 0 }}>Xu hướng Mượn theo Tháng</h3>
        <span style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8' }}>Năm 2026</span>
      </div>

      <div style={{ width: '100%', position: 'relative' }}>
        <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', overflow: 'visible' }}>
          {[140, 105, 70, 35, 0].map(level => {
            const y = paddingTop + chartH - (level / maxY) * chartH;
            return (
              <g key={level}>
                <text x={paddingLeft - 8} y={y + 3.5} textAnchor="end" fontSize="9.5" fill="#94a3b8" fontWeight="500">
                  {level}
                </text>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={width - paddingRight}
                  y2={y}
                  stroke="#f1f5f9"
                  strokeDasharray={level === 0 ? 'none' : '3 3'}
                  strokeWidth="1"
                />
              </g>
            );
          })}

          <polyline
            fill="none"
            stroke="#2563eb"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={polylinePoints}
          />

          {points.map((p, i) => (
            <g
              key={i}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
              style={{ cursor: 'pointer' }}
            >
              <circle
                cx={p.x}
                cy={p.y}
                r={hoveredIndex === i ? 5.5 : 3.5}
                fill="#ffffff"
                stroke="#2563eb"
                strokeWidth="2.5"
                style={{ transition: 'all 0.15s ease' }}
              />
              <text
                x={p.x}
                y={height - 6}
                textAnchor="middle"
                fontSize="9.5"
                fill={hoveredIndex === i ? '#2563eb' : '#64748b'}
                fontWeight={hoveredIndex === i ? '700' : '500'}
              >
                {p.month}
              </text>
            </g>
          ))}
        </svg>

        {hoveredIndex !== null && (
          <div
            style={{
              position: 'absolute',
              top: '0',
              left: `${(points[hoveredIndex].x / width) * 100}%`,
              transform: 'translate(-50%, -10px)',
              background: '#0f172a',
              color: '#ffffff',
              padding: '4px 8px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 600,
              pointerEvents: 'none',
              boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
              whiteSpace: 'nowrap',
              zIndex: 10
            }}
          >
            {points[hoveredIndex].month}: {points[hoveredIndex].val} lượt
          </div>
        )}
      </div>
    </div>
  );
}

function CategoryDonutChart() {
  const categories = [
    { name: 'Khoa học', color: '#06b6d4', percent: 22 },
    { name: 'Kỳ ảo', color: '#8b5cf6', percent: 14 },
    { name: 'Lịch sử', color: '#10b981', percent: 18 },
    { name: 'Phát triển', color: '#f59e0b', percent: 18 },
    { name: 'Tiểu thuyết', color: '#3b82f6', percent: 28 }
  ];

  const size = 170;
  const strokeWidth = 22;
  const radius = 48;
  const circumference = 2 * Math.PI * radius;

  let accumulatedPercent = 0;

  return (
    <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #eef2f6', padding: '20px 22px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', margin: 0 }}>Tỉ lệ Thể loại Sách</h3>
        <span style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8' }}>5 thể loại</span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '136px' }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
          {categories.map((cat, i) => {
            const strokeLength = (cat.percent / 100) * circumference - 4;
            const strokeOffset = -((accumulatedPercent / 100) * circumference) - 2;
            accumulatedPercent += cat.percent;

            return (
              <circle
                key={i}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="transparent"
                stroke={cat.color}
                strokeWidth={strokeWidth}
                strokeDasharray={`${strokeLength} ${circumference - strokeLength}`}
                strokeDashoffset={strokeOffset}
                style={{ transition: 'all 0.3s ease', cursor: 'pointer' }}
              >
                <title>{cat.name}: {cat.percent}%</title>
              </circle>
            );
          })}
        </svg>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px 12px', marginTop: '8px' }}>
        {categories.map((cat, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', fontWeight: 500, color: '#475569' }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: cat.color, display: 'inline-block' }} />
            <span>{cat.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CategoryBorrowBarChart() {
  const data = [
    { name: 'Tiểu thuyết', value: 35, color: '#3b82f6' },
    { name: 'Khoa học', value: 21, color: '#06b6d4' },
    { name: 'Lịch sử', value: 15, color: '#10b981' },
    { name: 'Phát triển', value: 19, color: '#f59e0b' },
    { name: 'Kỳ ảo', value: 12, color: '#8b5cf6' }
  ];

  const width = 310;
  const height = 180;
  const paddingLeft = 30;
  const paddingRight = 14;
  const paddingTop = 15;
  const paddingBottom = 26;

  const chartW = width - paddingLeft - paddingRight;
  const chartH = height - paddingTop - paddingBottom;
  const maxY = 36;
  const [hoveredBar, setHoveredBar] = useState(null);

  const barWidth = 18;

  return (
    <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #eef2f6', padding: '20px 22px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', margin: 0 }}>Lượt Mượn theo Thể loại</h3>
      </div>

      <div style={{ width: '100%', position: 'relative' }}>
        <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', overflow: 'visible' }}>
          {[36, 27, 18, 9, 0].map(level => {
            const y = paddingTop + chartH - (level / maxY) * chartH;
            return (
              <g key={level}>
                <text x={paddingLeft - 8} y={y + 3.5} textAnchor="end" fontSize="9.5" fill="#94a3b8" fontWeight="500">
                  {level}
                </text>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={width - paddingRight}
                  y2={y}
                  stroke="#f1f5f9"
                  strokeDasharray={level === 0 ? 'none' : '3 3'}
                  strokeWidth="1"
                />
              </g>
            );
          })}

          {data.map((item, i) => {
            const slotW = chartW / data.length;
            const x = paddingLeft + i * slotW + (slotW - barWidth) / 2;
            const bHeight = (item.value / maxY) * chartH;
            const y = paddingTop + chartH - bHeight;

            return (
              <g
                key={i}
                onMouseEnter={() => setHoveredBar(i)}
                onMouseLeave={() => setHoveredBar(null)}
                style={{ cursor: 'pointer' }}
              >
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={bHeight}
                  rx="5"
                  ry="5"
                  fill={item.color}
                  opacity={hoveredBar === null || hoveredBar === i ? '1' : '0.65'}
                  style={{ transition: 'all 0.2s ease' }}
                />
                <text
                  x={x + barWidth / 2}
                  y={height - 6}
                  textAnchor="middle"
                  fontSize="9.5"
                  fill={hoveredBar === i ? '#0f172a' : '#64748b'}
                  fontWeight={hoveredBar === i ? '700' : '500'}
                >
                  {item.name}
                </text>
              </g>
            );
          })}
        </svg>

        {hoveredBar !== null && (
          <div
            style={{
              position: 'absolute',
              top: '0',
              left: `${((paddingLeft + hoveredBar * (chartW / data.length) + chartW / data.length / 2) / width) * 100}%`,
              transform: 'translate(-50%, -10px)',
              background: '#0f172a',
              color: '#ffffff',
              padding: '4px 8px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 600,
              pointerEvents: 'none',
              boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
              whiteSpace: 'nowrap',
              zIndex: 10
            }}
          >
            {data[hoveredBar].name}: {data[hoveredBar].value} lượt
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminDashboard({ activeTab, onTabChange }) {
  const [stats, setStats] = useState(null);
  const [books, setBooks] = useState([]);
  const [readers, setReaders] = useState([]);
  const [borrowRecords, setBorrowRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [bookSearch, setBookSearch] = useState('');
  const [bookCategory, setBookCategory] = useState('All');
  const [bookViewMode, setBookViewMode] = useState('table'); // 'table' | 'grid'
  const [borrowStatusFilter, setBorrowStatusFilter] = useState('All');
  const [borrowSearch, setBorrowSearch] = useState('');
  const [readerSearch, setReaderSearch] = useState('');

  // Modals state
  const [selectedBook, setSelectedBook] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [bookModalOpen, setBookModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [readerModalOpen, setReaderModalOpen] = useState(false);
  const [editingReader, setEditingReader] = useState(null);
  const [borrowModalOpen, setBorrowModalOpen] = useState(false);
  const [borrowTargetBook, setBorrowTargetBook] = useState(null);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [adminReturnRecord, setAdminReturnRecord] = useState(null);
  const [isReturning, setIsReturning] = useState(false);
  const [bookToDelete, setBookToDelete] = useState(null);
  const [deleteBookError, setDeleteBookError] = useState('');
  const [isDeletingBook, setIsDeletingBook] = useState(false);
  const [borrowActionModal, setBorrowActionModal] = useState(null); // { type: 'approve' | 'reject', record }
  const [isProcessingBorrowAction, setIsProcessingBorrowAction] = useState(false);
  const [borrowActionError, setBorrowActionError] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const loadData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [sRes, bRes, rRes, brRes] = await Promise.all([
        api.getStats().catch(() => null),
        api.getBooks().catch(() => []),
        api.getReaders().catch(() => []),
        api.getBorrowRecords().catch(() => [])
      ]);
      setStats(sRes);
      setBooks(bRes);
      setReaders(rRes);
      setBorrowRecords(brRes);
    } catch (e) {
      console.error('Error loading admin data:', e);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // 1. Đồng bộ tức thì khi có sự kiện cập nhật từ NotificationDropdown hoặc component khác
    const handleDataUpdate = () => {
      loadData(true);
    };
    window.addEventListener('smartlib:data-updated', handleDataUpdate);

    // 2. Đồng bộ giữa các tab trình duyệt khác nhau qua storage event
    const handleStorageUpdate = (e) => {
      if (e.key === 'smartlib_last_update') {
        loadData(true);
      }
    };
    window.addEventListener('storage', handleStorageUpdate);

    // 3. Polling ngầm mỗi 2.5s đảm bảo dữ liệu luôn mới nhất
    const interval = setInterval(() => loadData(true), 2500);

    return () => {
      window.removeEventListener('smartlib:data-updated', handleDataUpdate);
      window.removeEventListener('storage', handleStorageUpdate);
      clearInterval(interval);
    };
  }, []);

  // Tự động load dữ liệu mới khi chuyển tab
  useEffect(() => {
    loadData();
  }, [activeTab]);

  // Book Handlers (Thêm / Sửa / Xóa lưu trực tiếp vào database)
  const handleSaveBook = async (bookData) => {
    try {
      if (editingBook) {
        await api.updateBook(editingBook.id, bookData);
        showToast('✓ Đã cập nhật sách vào cơ sở dữ liệu thành công!');
      } else {
        await api.createBook(bookData);
        showToast('✓ Đã thêm sách mới vào cơ sở dữ liệu thành công!');
      }
      setBookModalOpen(false);
      setEditingBook(null);
      await loadData();
    } catch (err) {
      console.error('Lỗi lưu sách:', err);
      throw err;
    }
  };

  const handleConfirmDeleteBook = async () => {
    if (!bookToDelete) return;
    setIsDeletingBook(true);
    setDeleteBookError('');
    try {
      await api.deleteBook(bookToDelete.id);
      setBookToDelete(null);
      showToast('✓ Đã xóa sách khỏi cơ sở dữ liệu thành công!');
      await loadData();
    } catch (err) {
      setDeleteBookError(err.message || 'Không thể xóa cuốn sách này.');
    } finally {
      setIsDeletingBook(false);
    }
  };

  // Reader Handlers
  const handleSaveReader = async (readerData) => {
    if (editingReader) {
      await api.updateReader(editingReader.id, readerData);
    } else {
      await api.createReader(readerData);
    }
    loadData();
  };

  const handleDeleteReader = async (readerId) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa độc giả này?')) {
      try {
        await api.deleteReader(readerId);
        loadData();
      } catch (err) {
        alert(err.message);
      }
    }
  };

  // Borrow Handlers (Duyệt / Không duyệt dùng DIV Modal xác nhận)
  const handleConfirmBorrowAction = async () => {
    if (!borrowActionModal) return;
    setIsProcessingBorrowAction(true);
    setBorrowActionError('');
    try {
      if (borrowActionModal.type === 'approve') {
        await api.approveBorrow(borrowActionModal.record.id);
        showToast('✓ Đã phê duyệt cho mượn sách thành công!');
      } else {
        await api.rejectBorrow(borrowActionModal.record.id);
        showToast('✓ Đã từ chối yêu cầu mượn sách!');
      }
      setBorrowActionModal(null);
      await loadData();
    } catch (err) {
      setBorrowActionError(err.message || 'Lỗi khi xử lý yêu cầu mượn sách.');
    } finally {
      setIsProcessingBorrowAction(false);
    }
  };

  const handleConfirmReturn = async () => {
    if (!adminReturnRecord) return;
    const targetId = adminReturnRecord.id;
    const targetTitle = adminReturnRecord.bookTitle;
    const targetReader = adminReturnRecord.readerName;
    setIsReturning(true);

    // Cập nhật giao diện ngay lập tức
    setBorrowRecords(prev => prev.map(r => 
      Number(r.id) === Number(targetId) 
        ? { ...r, status: 'Đã trả', actualReturnDate: new Date().toISOString().substring(0, 10) }
        : r
    ));
    setAdminReturnRecord(null);

    try {
      await api.updateBorrowStatus(targetId, 'Đã trả');
      showToast(`✓ Đã xác nhận độc giả "${targetReader}" trả cuốn sách "${targetTitle}" về kho thành công!`);
      await loadData(true);
    } catch (err) {
      console.error('Lỗi khi trả sách:', err);
      showToast('Có lỗi xảy ra khi thực hiện trả sách.');
      await loadData(true);
    } finally {
      setIsReturning(false);
    }
  };

  const handleOpenBookByTitleOrId = (bookTitle, bookId) => {
    const found = books.find(b =>
      (bookId && Number(b.id) === Number(bookId)) ||
      (bookTitle && b.title && b.title.trim().toLowerCase() === bookTitle.trim().toLowerCase())
    );
    if (found) {
      setSelectedBook(found);
      setDetailModalOpen(true);
    } else {
      setSelectedBook({
        id: bookId || 0,
        title: bookTitle || 'Thông tin sách',
        author: 'Chưa rõ tác giả',
        category: 'Tài liệu thư viện',
        quantity: 1,
        borrowed: 0,
        desc: 'Thông tin chi tiết về cuốn sách trong hệ thống SmartLib.'
      });
      setDetailModalOpen(true);
    }
  };

  const handleCreateBorrowConfirm = async (formData) => {
    await api.createBorrowRecord(formData);
    loadData();
  };

  // Filtered Lists
  const filteredBooks = books.filter(b => {
    const matchSearch = b.title.toLowerCase().includes(bookSearch.toLowerCase()) || (b.author && b.author.toLowerCase().includes(bookSearch.toLowerCase()));
    const matchCat = bookCategory === 'All' || b.category === bookCategory;
    return matchSearch && matchCat;
  });

  const filteredBorrows = borrowRecords.filter(r => {
    const readerCode = r.readerId ? getReaderCode(r.readerId) : '';
    const matchSearch = (r.bookTitle && r.bookTitle.toLowerCase().includes(borrowSearch.toLowerCase())) ||
                        (r.readerName && r.readerName.toLowerCase().includes(borrowSearch.toLowerCase())) ||
                        (readerCode && readerCode.toLowerCase().includes(borrowSearch.toLowerCase()));
    const matchStatus = borrowStatusFilter === 'All' || r.status === borrowStatusFilter;
    return matchSearch && matchStatus;
  });

  const filteredReaders = readers.filter(r => {
    const code = getReaderCode(r.id);
    return code.toLowerCase().includes(readerSearch.toLowerCase()) ||
           r.fullName.toLowerCase().includes(readerSearch.toLowerCase()) ||
           (r.phone && r.phone.includes(readerSearch)) ||
           (r.email && r.email.toLowerCase().includes(readerSearch.toLowerCase()));
  });

  const categories = ['All', ...new Set(books.map(b => b.category).filter(Boolean))];

  return (
    <div style={{ padding: '28px 32px', flex: 1, background: '#ffffff' }}>
      {/* TAB 1: DASHBOARD & STATS */}
      {activeTab === 'dashboard' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>Tổng quan Thư viện & Duyệt Mượn Trả</h2>
              <p style={{ color: '#64748b', fontSize: '13.5px', marginTop: '2px' }}>Theo dõi chỉ số kho sách và quản lý các phiếu mượn</p>
            </div>
            <button onClick={() => setExportModalOpen(true)} className="btn btn-primary">
              <FileSpreadsheet size={16} />
              <span>Xuất báo cáo</span>
            </button>
          </div>

          {/* Top 4 Stat Cards (Chính xác theo Ảnh 1) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '22px' }}>
            {/* Card 1: Tổng số sách */}
            <div
              onClick={() => setBorrowStatusFilter('All')}
              style={{
                background: '#ffffff',
                borderRadius: '16px',
                border: '1px solid #eef2f6',
                padding: '20px 22px',
                display: 'flex',
                justifyContent: 'space-between',
                boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.05)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.02)'; }}
            >
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  Tổng số sách
                </div>
                <div style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', margin: '6px 0 8px 0', lineHeight: 1 }}>
                  {books.length}
                </div>
                <div style={{ fontSize: '11.5px', fontWeight: 600, color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <TrendingUp size={13} /> +12 so với tháng trước
                </div>
              </div>
              <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb', flexShrink: 0 }}>
                <BookOpen size={20} />
              </div>
            </div>

            {/* Card 2: Độc giả hoạt động */}
            <div
              onClick={() => onTabChange('readers')}
              style={{
                background: '#ffffff',
                borderRadius: '16px',
                border: '1px solid #eef2f6',
                padding: '20px 22px',
                display: 'flex',
                justifyContent: 'space-between',
                boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.05)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.02)'; }}
            >
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  Độc giả hoạt động
                </div>
                <div style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', margin: '6px 0 8px 0', lineHeight: 1 }}>
                  {readers.length}
                </div>
                <div style={{ fontSize: '11.5px', fontWeight: 600, color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <TrendingUp size={13} /> +5 so với tháng trước
                </div>
              </div>
              <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#f3e8ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7c3aed', flexShrink: 0 }}>
                <Users size={20} />
              </div>
            </div>

            {/* Card 3: Sách đang mượn */}
            <div
              onClick={() => setBorrowStatusFilter('Đang mượn')}
              style={{
                background: '#ffffff',
                borderRadius: '16px',
                border: '1px solid #eef2f6',
                padding: '20px 22px',
                display: 'flex',
                justifyContent: 'space-between',
                boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.05)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.02)'; }}
            >
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  Sách đang mượn
                </div>
                <div style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', margin: '6px 0 8px 0', lineHeight: 1 }}>
                  {borrowRecords.filter(r => r.status === 'Đang mượn').length}
                </div>
                <div style={{ fontSize: '11.5px', fontWeight: 600, color: '#0284c7', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <TrendingUp size={13} /> Hiện tại
                </div>
              </div>
              <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284c7', flexShrink: 0 }}>
                <BookmarkCheck size={20} />
              </div>
            </div>

            {/* Card 4: Sách quá hạn */}
            <div
              onClick={() => setBorrowStatusFilter('Quá hạn')}
              style={{
                background: '#ffffff',
                borderRadius: '16px',
                border: '1px solid #eef2f6',
                padding: '20px 22px',
                display: 'flex',
                justifyContent: 'space-between',
                boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.05)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.02)'; }}
            >
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  Sách quá hạn
                </div>
                <div style={{ fontSize: '28px', fontWeight: 800, color: borrowRecords.filter(r => r.status === 'Quá hạn').length > 0 ? '#ef4444' : '#0f172a', margin: '6px 0 8px 0', lineHeight: 1 }}>
                  {borrowRecords.filter(r => r.status === 'Quá hạn').length}
                </div>
                <div style={{ fontSize: '11.5px', fontWeight: 600, color: borrowRecords.filter(r => r.status === 'Quá hạn').length > 0 ? '#ef4444' : '#f59e0b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <TrendingUp size={13} /> Cần xử lý
                </div>
              </div>
              <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706', flexShrink: 0 }}>
                <AlertTriangle size={20} />
              </div>
            </div>
          </div>

          {/* 3 Statistical Charts Section (Chính xác theo Ảnh 1) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))', gap: '18px', marginBottom: '24px' }}>
            <MonthlyTrendChart />
            <CategoryDonutChart />
            <CategoryBorrowBarChart />
          </div>

          {/* Banner thông báo khi có yêu cầu mượn chờ duyệt */}
          {borrowRecords.filter(r => r.status === 'Chờ duyệt').length > 0 && (
            <div
              onClick={() => setBorrowStatusFilter('Chờ duyệt')}
              style={{
                background: '#fffbeb',
                border: '1px solid #fde68a',
                borderRadius: '12px',
                padding: '12px 18px',
                marginBottom: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#fef3c7'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#fffbeb'; }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#b45309', fontSize: '13.5px', fontWeight: 600 }}>
                <Clock size={18} color="#d97706" />
                <span>
                  Đang có <strong style={{ color: '#92400e', fontSize: '14px' }}>{borrowRecords.filter(r => r.status === 'Chờ duyệt').length} yêu cầu mượn sách</strong> chờ thủ thư phê duyệt!
                </span>
              </div>
              <span style={{ background: '#f59e0b', color: '#ffffff', fontSize: '12px', fontWeight: 700, padding: '5px 12px', borderRadius: '6px' }}>
                Xem danh sách chờ duyệt »
              </span>
            </div>
          )}

          {/* Borrow Records Table Section */}
          <div className="card">
            <div className="card-header">
              <span>Danh sách Phiếu Mượn & Quản lý Trả Sách ({filteredBorrows.length})</span>
              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ position: 'relative', width: '220px' }}>
                  <input
                    type="text"
                    placeholder="Tìm tên sách / độc giả..."
                    value={borrowSearch}
                    onChange={(e) => setBorrowSearch(e.target.value)}
                    style={{ paddingLeft: '32px', height: '34px', fontSize: '13px' }}
                  />
                  <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: '#94a3b8' }} />
                </div>

                <select
                  value={borrowStatusFilter}
                  onChange={(e) => setBorrowStatusFilter(e.target.value)}
                  style={{ width: '160px', height: '34px', fontSize: '13px' }}
                >
                  <option value="All">Tất cả trạng thái</option>
                  <option value="Chờ duyệt">Chờ duyệt</option>
                  <option value="Đang mượn">Đang mượn</option>
                  <option value="Quá hạn">Quá hạn</option>
                  <option value="Đã trả">Đã trả</option>
                  <option value="Từ chối">Từ chối</option>
                </select>
              </div>
            </div>

            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>Mã</th>
                    <th>Tên Sách</th>
                    <th>Độc Giả</th>
                    <th>Hình Thức</th>
                    <th>Ngày Mượn</th>
                    <th>Hạn Trả</th>
                    <th>Trạng Thái</th>
                    <th style={{ textAlign: 'right' }}>Thao Tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBorrows.length === 0 ? (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                        Không có dữ liệu mượn trả nào phù hợp.
                      </td>
                    </tr>
                  ) : (
                    filteredBorrows.map(r => (
                      <tr key={r.id}>
                        <td style={{ fontWeight: 700, color: '#64748b' }}>#{r.id}</td>
                        <td
                          style={{ fontWeight: 600, color: '#2563eb', cursor: 'pointer', transition: 'all 0.15s ease' }}
                          onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                          onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
                          onClick={() => handleOpenBookByTitleOrId(r.bookTitle, r.bookId)}
                          title={`Xem chi tiết sách: ${r.bookTitle}`}
                        >
                          {r.bookTitle}
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, color: '#0f172a' }}>{r.readerName}</div>
                          {r.readerId && (
                            <div style={{ fontSize: '11px', color: '#2563eb', fontWeight: 700 }}>
                              {getReaderCode(r.readerId)}
                            </div>
                          )}
                        </td>
                        <td>
                          <span style={{ fontSize: '12px', color: '#64748b' }}>{r.borrowType || 'Mượn về nhà'}</span>
                        </td>
                        <td>{r.borrowDate ? r.borrowDate.substring(0, 10) : '-'}</td>
                        <td>{r.returnDate ? r.returnDate.substring(0, 10) : '-'}</td>
                        <td>
                          <span className={`badge ${
                            r.status === 'Đang mượn' ? 'badge-success' :
                            r.status === 'Chờ duyệt' ? 'badge-warning' :
                            r.status === 'Quá hạn' ? 'badge-danger' :
                            r.status === 'Đã trả' ? 'badge-info' : 'badge-neutral'
                          }`}>
                            {r.status}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                            {r.status === 'Chờ duyệt' && (
                              <>
                                <button
                                  onClick={() => setBorrowActionModal({ type: 'approve', record: r })}
                                  className="btn btn-success"
                                  style={{ padding: '4px 10px', fontSize: '12px' }}
                                  title="Duyệt cho mượn"
                                >
                                  <Check size={14} /> Duyệt
                                </button>
                                <button
                                  onClick={() => setBorrowActionModal({ type: 'reject', record: r })}
                                  className="btn btn-danger"
                                  style={{ padding: '4px 10px', fontSize: '12px' }}
                                  title="Từ chối"
                                >
                                  <X size={14} /> Từ chối
                                </button>
                              </>
                            )}

                            {(r.status === 'Đang mượn' || r.status === 'Quá hạn') && (
                              <button
                                onClick={() => setAdminReturnRecord(r)}
                                className="btn btn-primary"
                                style={{ padding: '4px 10px', fontSize: '12px', background: '#0284c7' }}
                                title="Xác nhận trả sách"
                              >
                                <CheckCircle size={14} /> Trả sách
                              </button>
                            )}

                            {r.status === 'Đã trả' && (
                              <span style={{ fontSize: '12px', color: '#94a3b8', padding: '4px 8px' }}>-</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: QUẢN LÝ KHO SÁCH */}
      {activeTab === 'books' && (
        <div>
          {/* Header Quản lý kho sách */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>Quản lý Kho Sách Thư Viện</h2>
              <p style={{ color: '#64748b', fontSize: '13.5px', marginTop: '2px' }}>
                Quản lý chi tiết toàn bộ {books.length} đầu sách, tồn kho và cập nhật trực tiếp vào cơ sở dữ liệu
              </p>
            </div>
            <button
              onClick={() => { setEditingBook(null); setBookModalOpen(true); }}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Plus size={16} />
              <span>Thêm sách mới</span>
            </button>
          </div>

          {/* Table Container Card (Thiết kế chuẩn theo Ảnh phiếu mượn) */}
          <div className="card">
            <div className="card-header">
              <span>Danh sách Kho Sách & Quản lý Tồn Kho ({filteredBooks.length})</span>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                {/* Search */}
                <div style={{ position: 'relative', width: '240px' }}>
                  <input
                    type="text"
                    placeholder="Tìm tên sách, tác giả..."
                    value={bookSearch}
                    onChange={(e) => setBookSearch(e.target.value)}
                    style={{ paddingLeft: '32px', height: '34px', fontSize: '13px' }}
                  />
                  <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: '#94a3b8' }} />
                </div>

                {/* Filter Thể loại */}
                <div style={{ position: 'relative', width: '190px' }}>
                  <select
                    value={bookCategory}
                    onChange={(e) => setBookCategory(e.target.value)}
                    style={{ height: '34px', fontSize: '13px', paddingLeft: '28px' }}
                  >
                    {categories.map(c => (
                      <option key={c} value={c}>{c === 'All' ? 'Tất cả thể loại' : c}</option>
                    ))}
                  </select>
                  <Filter size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: '#94a3b8' }} />
                </div>

                {/* View Switcher: Bảng / Lưới */}
                <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: '8px', padding: '2px' }}>
                  <button
                    onClick={() => setBookViewMode('table')}
                    style={{
                      border: 'none',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      background: bookViewMode === 'table' ? '#ffffff' : 'transparent',
                      color: bookViewMode === 'table' ? '#2563eb' : '#64748b',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '12px',
                      fontWeight: 600
                    }}
                    title="Chế độ xem Bảng chi tiết"
                  >
                    <List size={13} /> Bảng
                  </button>
                  <button
                    onClick={() => setBookViewMode('grid')}
                    style={{
                      border: 'none',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      background: bookViewMode === 'grid' ? '#ffffff' : 'transparent',
                      color: bookViewMode === 'grid' ? '#2563eb' : '#64748b',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '12px',
                      fontWeight: 600
                    }}
                    title="Chế độ xem Lưới bìa sách"
                  >
                    <Grid size={13} /> Lưới
                  </button>
                </div>
              </div>
            </div>

            {/* Content: Bảng hoặc Lưới */}
            {bookViewMode === 'table' ? (
              <div className="table-responsive">
                <table>
                  <thead>
                    <tr>
                      <th style={{ width: '60px' }}>ID</th>
                      <th>Tên Sách</th>
                      <th>Tác Giả</th>
                      <th>Thể Loại</th>
                      <th>Tồn Kho</th>
                      <th>Trạng Thái</th>
                      <th style={{ textAlign: 'right', minWidth: '220px' }}>Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBooks.length === 0 ? (
                      <tr>
                        <td colSpan="7" style={{ textAlign: 'center', padding: '48px', color: '#64748b' }}>
                          Không tìm thấy cuốn sách nào phù hợp với bộ lọc tìm kiếm.
                        </td>
                      </tr>
                    ) : (
                      filteredBooks.map(b => {
                        const qty = Number(b.quantity) || 1;
                        const borrowed = Number(b.borrowed) || 0;
                        const avail = Math.max(0, qty - borrowed);
                        return (
                          <tr key={b.id}>
                            {/* Cột 1: Mã sách #ID */}
                            <td style={{ fontWeight: 700, color: '#64748b', fontSize: '13.5px' }}>
                              #{b.id}
                            </td>

                            {/* Cột 2: Tên sách (Link xanh click xem chi tiết) */}
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                {b.imageUrl ? (
                                  <img
                                    src={b.imageUrl}
                                    alt={b.title}
                                    style={{ width: '32px', height: '42px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #e2e8f0', flexShrink: 0 }}
                                  />
                                ) : (
                                  <div style={{ width: '32px', height: '42px', background: '#f1f5f9', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', flexShrink: 0 }}>
                                    <BookOpen size={16} />
                                  </div>
                                )}
                                <div>
                                  <span
                                    onClick={() => { setSelectedBook(b); setDetailModalOpen(true); }}
                                    style={{
                                      fontWeight: 700,
                                      color: '#2563eb',
                                      cursor: 'pointer',
                                      fontSize: '13.5px',
                                      lineHeight: 1.3
                                    }}
                                    className="hover:underline"
                                    title="Nhấp để xem chi tiết sách"
                                  >
                                    {b.title}
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* Cột 3: Tác giả (Format 2 dòng giống Độc giả DG-001 trong ảnh) */}
                            <td>
                              <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '13px' }}>
                                {b.author || 'Chưa rõ'}
                              </div>
                              <div style={{ fontSize: '11.5px', color: '#2563eb' }}>
                                Tác giả
                              </div>
                            </td>

                            {/* Cột 4: Thể loại */}
                            <td>
                              <span style={{ fontSize: '12.5px', color: '#64748b' }}>
                                {b.category || 'Khác'}
                              </span>
                            </td>

                            {/* Cột 5: Tồn kho & Đang mượn */}
                            <td>
                              <div style={{ fontSize: '13px', color: '#0f172a' }}>
                                Tổng <strong>{qty}</strong> cuốn
                              </div>
                              <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                                Đang mượn: {borrowed}
                              </div>
                            </td>

                            {/* Cột 6: Trạng thái (Badge chuẩn ảnh) */}
                            <td>
                              {avail > 0 ? (
                                <span
                                  className="badge"
                                  style={{
                                    background: '#dcfce7',
                                    color: '#16a34a',
                                    fontWeight: 600,
                                    fontSize: '12px',
                                    padding: '4px 10px',
                                    borderRadius: '6px'
                                  }}
                                >
                                  Còn {avail} cuốn
                                </span>
                              ) : (
                                <span
                                  className="badge"
                                  style={{
                                    background: '#fee2e2',
                                    color: '#dc2626',
                                    fontWeight: 600,
                                    fontSize: '12px',
                                    padding: '4px 10px',
                                    borderRadius: '6px'
                                  }}
                                >
                                  Hết sách
                                </span>
                              )}
                            </td>

                            {/* Cột 7: Thao tác (Cho mượn, Sửa, Xóa, In QR) */}
                            <td style={{ textAlign: 'right' }}>
                              <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', alignItems: 'center' }}>
                                {/* Nút Cho mượn (Màu xanh ngọc chuẩn như nút [Trả sách] trong ảnh) */}
                                {avail > 0 && (
                                  <button
                                    onClick={() => { setBorrowTargetBook(b); setBorrowModalOpen(true); }}
                                    className="btn btn-primary"
                                    style={{
                                      padding: '4px 10px',
                                      fontSize: '12px',
                                      background: '#0284c7',
                                      borderColor: '#0284c7',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '4px'
                                    }}
                                    title="Cho độc giả mượn cuốn sách này"
                                  >
                                    <BookMarked size={13} /> Cho mượn
                                  </button>
                                )}

                                {/* Nút Chỉnh sửa */}
                                <button
                                  onClick={() => { setEditingBook(b); setBookModalOpen(true); }}
                                  className="btn btn-outline"
                                  style={{ padding: '4px 10px', fontSize: '12px', color: '#2563eb', borderColor: '#bfdbfe', display: 'flex', alignItems: 'center', gap: '4px' }}
                                  title="Chỉnh sửa thông tin sách"
                                >
                                  <Edit2 size={13} /> Sửa
                                </button>

                                {/* Nút Xóa */}
                                <button
                                  onClick={() => setBookToDelete(b)}
                                  className="btn btn-outline"
                                  style={{ padding: '4px 10px', fontSize: '12px', color: '#ef4444', borderColor: '#fecaca', display: 'flex', alignItems: 'center', gap: '4px' }}
                                  title="Xóa sách khỏi cơ sở dữ liệu"
                                >
                                  <Trash2 size={13} /> Xóa
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              /* Grid View Lưới khi chuyển chế độ */
              <div style={{ padding: '22px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(205px, 1fr))', gap: '18px' }}>
                  {filteredBooks.map(b => (
                    <div
                      key={b.id}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        background: '#ffffff',
                        borderRadius: '14px',
                        border: '1px solid #eef2f6',
                        overflow: 'hidden',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow = '0 8px 18px rgba(0,0,0,0.06)';
                        e.currentTarget.style.borderColor = '#cbd5e1';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.03)';
                        e.currentTarget.style.borderColor = '#eef2f6';
                      }}
                    >
                      <BookCard
                        book={b}
                        onSelect={(book) => { setSelectedBook(book); setDetailModalOpen(true); }}
                        isAdmin={true}
                      />

                      <div style={{ display: 'flex', gap: '6px', padding: '8px 10px 10px 10px', background: '#f8fafc', borderTop: '1px solid #f1f5f9' }}>
                        <button
                          onClick={() => { setBorrowTargetBook(b); setBorrowModalOpen(true); }}
                          className="btn btn-outline"
                          style={{ flex: 1, padding: '5px 6px', fontSize: '11.5px', fontWeight: 600, color: '#16a34a', borderColor: '#bbf7d0', background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}
                          title="Cho mượn"
                        >
                          <BookMarked size={13} /> Mượn
                        </button>
                        <button
                          onClick={() => { setEditingBook(b); setBookModalOpen(true); }}
                          className="btn btn-outline"
                          style={{ padding: '5px 8px', fontSize: '11.5px', fontWeight: 600, color: '#2563eb', borderColor: '#bfdbfe', background: '#ffffff', display: 'flex', alignItems: 'center', gap: '3px' }}
                          title="Chỉnh sửa"
                        >
                          <Edit2 size={13} /> Sửa
                        </button>
                        <button
                          onClick={() => setBookToDelete(b)}
                          className="btn btn-outline"
                          style={{ padding: '5px 8px', fontSize: '11.5px', fontWeight: 600, color: '#ef4444', borderColor: '#fecaca', background: '#ffffff', display: 'flex', alignItems: 'center', gap: '3px' }}
                          title="Xóa sách"
                        >
                          <Trash2 size={13} /> Xóa
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: QUẢN LÝ ĐỘC GIẢ */}
      {activeTab === 'readers' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>Quản lý Danh sách Độc Giả</h2>
              <p style={{ color: '#64748b', fontSize: '13.5px', marginTop: '2px' }}>
                Tổng số {readers.length} độc giả đã đăng ký hồ sơ mượn sách
              </p>
            </div>
            <button
              onClick={() => { setEditingReader(null); setReaderModalOpen(true); }}
              className="btn btn-primary"
            >
              <Plus size={16} />
              <span>Thêm độc giả mới</span>
            </button>
          </div>

          <div className="card">
            <div className="card-header">
              <span>Danh sách Độc giả ({filteredReaders.length})</span>
              <div style={{ position: 'relative', width: '260px' }}>
                <input
                  type="text"
                  placeholder="Tìm theo mã độc giả (DG-001), tên, SĐT..."
                  value={readerSearch}
                  onChange={(e) => setReaderSearch(e.target.value)}
                  style={{ paddingLeft: '32px', height: '34px', fontSize: '13px' }}
                />
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: '#94a3b8' }} />
              </div>
            </div>

            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>Mã Độc Giả</th>
                    <th>Họ và Tên</th>
                    <th>Tên Đăng Nhập</th>
                    <th>Số Điện Thoại</th>
                    <th>Email</th>
                    <th>Địa Chỉ</th>
                    <th>Ngày Sinh</th>
                    <th style={{ textAlign: 'right' }}>Thao Tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReaders.length === 0 ? (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                        Không tìm thấy độc giả nào.
                      </td>
                    </tr>
                  ) : (
                    filteredReaders.map(r => (
                      <tr key={r.id}>
                        <td style={{ fontWeight: 700, color: '#2563eb' }}>{getReaderCode(r.id)}</td>
                        <td style={{ fontWeight: 700, color: '#0f172a' }}>{r.fullName}</td>
                        <td><code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>{r.username}</code></td>
                        <td>{r.phone || '-'}</td>
                        <td>{r.email || '-'}</td>
                        <td>{r.address || '-'}</td>
                        <td>{r.birthDate || '-'}</td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                            <button
                              onClick={() => { setEditingReader(r); setReaderModalOpen(true); }}
                              className="btn btn-outline"
                              style={{ padding: '4px 8px', fontSize: '12px' }}
                              title="Chỉnh sửa thông tin"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteReader(r.id)}
                              className="btn btn-outline"
                              style={{ padding: '4px 8px', fontSize: '12px', color: '#ef4444' }}
                              title="Xóa độc giả"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <BookDetailModal
        book={selectedBook}
        isOpen={detailModalOpen}
        onClose={() => { setDetailModalOpen(false); setSelectedBook(null); }}
        onBorrow={(b) => { setBorrowTargetBook(b); setBorrowModalOpen(true); }}
        onEdit={(b) => { setEditingBook(b); setBookModalOpen(true); }}
        onDelete={(b) => setBookToDelete(b)}
        isAdmin={true}
      />

      <AddEditBookModal
        book={editingBook}
        isOpen={bookModalOpen}
        onClose={() => { setBookModalOpen(false); setEditingBook(null); }}
        onSave={handleSaveBook}
      />

      <AddEditReaderModal
        reader={editingReader}
        isOpen={readerModalOpen}
        onClose={() => { setReaderModalOpen(false); setEditingReader(null); }}
        onSave={handleSaveReader}
      />

      <BorrowModal
        book={borrowTargetBook}
        readers={readers}
        isOpen={borrowModalOpen}
        onClose={() => { setBorrowModalOpen(false); setBorrowTargetBook(null); }}
        onConfirm={handleCreateBorrowConfirm}
        isAdmin={true}
      />

      <ExportReportModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
      />

      {/* DIV Modal xác nhận Trả sách cho Admin (Không dùng thông báo trình duyệt) */}
      {adminReturnRecord && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.45)',
            backdropFilter: 'blur(3px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
          onClick={() => !isReturning && setAdminReturnRecord(null)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              padding: '26px 28px',
              maxWidth: '420px',
              width: '100%',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
              textAlign: 'center'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '50%',
                background: '#dcfce7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px auto'
              }}
            >
              <CheckCircle size={28} color="#16a34a" />
            </div>
            <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#0f172a', margin: '0 0 10px 0' }}>
              Xác nhận trả sách về kho
            </h3>
            <p style={{ fontSize: '13.5px', color: '#64748b', lineHeight: 1.6, margin: '0 0 22px 0' }}>
              Xác nhận độc giả <strong style={{ color: '#0f172a' }}>"{adminReturnRecord.readerName}"</strong> ({getReaderCode(adminReturnRecord.readerId)}) đã hoàn tất trả cuốn sách <strong style={{ color: '#0f172a' }}>"{adminReturnRecord.bookTitle}"</strong> (Phiếu #{adminReturnRecord.id}) về thư viện?
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => setAdminReturnRecord(null)}
                disabled={isReturning}
                className="btn btn-outline"
                style={{ padding: '8px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: 600 }}
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmReturn}
                disabled={isReturning}
                className="btn btn-primary"
                style={{
                  padding: '8px 20px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 600,
                  background: '#16a34a',
                  borderColor: '#16a34a'
                }}
              >
                {isReturning ? 'Đang xử lý...' : 'Xác nhận'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DIV Modal xác nhận Xóa Sách (Không dùng thông báo trình duyệt) */}
      {bookToDelete && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.45)',
            backdropFilter: 'blur(3px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
          onClick={() => !isDeletingBook && setBookToDelete(null)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              padding: '26px 28px',
              maxWidth: '430px',
              width: '100%',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15)',
              textAlign: 'center'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                width: '54px',
                height: '54px',
                borderRadius: '50%',
                background: '#fee2e2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px auto'
              }}
            >
              <Trash2 size={26} color="#dc2626" />
            </div>

            <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#0f172a', margin: '0 0 8px 0' }}>
              Xác nhận xóa cuốn sách?
            </h3>
            <p style={{ fontSize: '13.5px', color: '#64748b', lineHeight: 1.6, margin: '0 0 16px 0' }}>
              Bạn có chắc chắn muốn xóa cuốn sách <strong style={{ color: '#0f172a' }}>"{bookToDelete.title}"</strong> (Mã #{bookToDelete.id})? Cuốn sách này sẽ được xóa hoàn toàn khỏi cơ sở dữ liệu thư viện.
            </p>

            {deleteBookError && (
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
                {deleteBookError}
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => { setBookToDelete(null); setDeleteBookError(''); }}
                disabled={isDeletingBook}
                className="btn btn-outline"
                style={{ padding: '8px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: 600 }}
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteBook}
                disabled={isDeletingBook}
                className="btn btn-primary"
                style={{
                  padding: '8px 22px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 600,
                  background: '#dc2626',
                  borderColor: '#dc2626'
                }}
              >
                {isDeletingBook ? 'Đang xóa...' : 'Xác nhận xóa'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DIV Modal xác nhận Duyệt / Từ chối mượn sách (Không dùng thông báo trình duyệt) */}
      {borrowActionModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.45)',
            backdropFilter: 'blur(3px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
          onClick={() => !isProcessingBorrowAction && setBorrowActionModal(null)}
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
                background: borrowActionModal.type === 'approve' ? '#dcfce7' : '#fee2e2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px auto'
              }}
            >
              {borrowActionModal.type === 'approve' ? (
                <CheckCircle size={28} color="#16a34a" />
              ) : (
                <XCircle size={28} color="#dc2626" />
              )}
            </div>

            <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#0f172a', margin: '0 0 8px 0' }}>
              {borrowActionModal.type === 'approve' ? 'Xác nhận duyệt cho mượn sách?' : 'Xác nhận từ chối yêu cầu mượn?'}
            </h3>

            <p style={{ fontSize: '13.5px', color: '#64748b', lineHeight: 1.6, margin: '0 0 20px 0' }}>
              {borrowActionModal.type === 'approve' ? (
                <>
                  Bạn có chắc chắn muốn phê duyệt cho độc giả <strong style={{ color: '#0f172a' }}>"{borrowActionModal.record.readerName}"</strong> ({getReaderCode(borrowActionModal.record.readerId)}) mượn cuốn sách <strong style={{ color: '#0f172a' }}>"{borrowActionModal.record.bookTitle}"</strong>?
                </>
              ) : (
                <>
                  Bạn có chắc chắn muốn từ chối yêu cầu mượn cuốn sách <strong style={{ color: '#0f172a' }}>"{borrowActionModal.record.bookTitle}"</strong> của độc giả <strong style={{ color: '#0f172a' }}>"{borrowActionModal.record.readerName}"</strong>?
                </>
              )}
            </p>

            {borrowActionError && (
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
                {borrowActionError}
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => { setBorrowActionModal(null); setBorrowActionError(''); }}
                disabled={isProcessingBorrowAction}
                className="btn btn-outline"
                style={{ padding: '8px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: 600 }}
              >
                Hủy bỏ
              </button>

              <button
                type="button"
                onClick={handleConfirmBorrowAction}
                disabled={isProcessingBorrowAction}
                className="btn btn-primary"
                style={{
                  padding: '8px 22px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 600,
                  background: borrowActionModal.type === 'approve' ? '#16a34a' : '#dc2626',
                  borderColor: borrowActionModal.type === 'approve' ? '#16a34a' : '#dc2626'
                }}
              >
                {isProcessingBorrowAction ? 'Đang xử lý...' : (borrowActionModal.type === 'approve' ? 'Xác nhận duyệt' : 'Xác nhận từ chối')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification khi Thêm/Sửa/Xóa thành công */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '28px',
            background: '#0f172a',
            color: '#ffffff',
            padding: '12px 20px',
            borderRadius: '10px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.25)',
            fontSize: '13.5px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            zIndex: 10000
          }}
        >
          <CheckCircle size={18} color="#22c55e" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}