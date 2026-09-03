import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { exportApi } from '../services/exportApi';
import { useAuth } from '../context/AuthContext';
import BookCard from '../components/BookCard';
import BookDetailModal from '../components/BookDetailModal';
import BorrowModal from '../components/BorrowModal';
import {
  Search, BookOpen, Clock, CheckCircle, AlertTriangle, Printer,
  BookMarked, Calendar, ArrowRight, Sparkles, Filter, ChevronLeft, ChevronRight
} from 'lucide-react';

import FeaturedCarousel from '../components/FeaturedCarousel';

export default function ReaderPortal({ activeTab, onTabChange }) {
  const { user } = useAuth();
  const [books, setBooks] = useState([]);
  const [myBorrows, setMyBorrows] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [bookSearch, setBookSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Pagination & Scroll Ref
  const searchSectionRef = useRef(null);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 20;

  // Modals
  const [selectedBook, setSelectedBook] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [borrowModalOpen, setBorrowModalOpen] = useState(false);
  const [borrowTargetBook, setBorrowTargetBook] = useState(null);
  const [returnConfirmRecord, setReturnConfirmRecord] = useState(null);
  const [isReturning, setIsReturning] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const loadData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const [bRes, brRes] = await Promise.all([
        api.getBooks().catch(() => []),
        api.getBorrowRecords().catch(() => [])
      ]);
      setBooks(bRes || []);
      
      // Filter borrows for current logged-in reader
      if (user) {
        const myFiltered = (brRes || []).filter(r => 
          (r.readerId && Number(r.readerId) === Number(user.id)) ||
          (r.readerName && user.fullName && r.readerName.toLowerCase() === user.fullName.toLowerCase()) ||
          (user?.username && r.readerName && r.readerName.toLowerCase() === user.username.toLowerCase())
        );
        setMyBorrows(myFiltered);
      }
    } catch (e) {
      console.error('Error loading reader data:', e);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // 1. Lắng nghe sự kiện cập nhật dữ liệu tức thì
    const handleDataUpdate = () => {
      loadData(true);
    };
    window.addEventListener('smartlib:data-updated', handleDataUpdate);

    // 2. Lắng nghe sự kiện giữa các tab trình duyệt khác nhau
    const handleStorageUpdate = (e) => {
      if (e.key === 'smartlib_last_update') {
        loadData(true);
      }
    };
    window.addEventListener('storage', handleStorageUpdate);

    // 3. Polling ngầm mỗi 2.5s để cập nhật ngay khi Admin duyệt mà không cần F5
    const interval = setInterval(() => loadData(true), 2500);

    return () => {
      window.removeEventListener('smartlib:data-updated', handleDataUpdate);
      window.removeEventListener('storage', handleStorageUpdate);
      clearInterval(interval);
    };
  }, [user]);

  // Tự động load dữ liệu mới khi chuyển tab
  useEffect(() => {
    loadData();
  }, [activeTab]);

  // Reset to page 1 when search or category changes
  useEffect(() => {
    setCurrentPage(1);
  }, [bookSearch, selectedCategory]);

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
        desc: 'Thông tin chi tiết về cuốn sách trong hệ thống thư viện SmartLib.'
      });
      setDetailModalOpen(true);
    }
  };

  const handleBorrowRequest = async (formData) => {
    await api.createBorrowRecord(formData);
    loadData();
  };

  const handleConfirmReturn = async () => {
    if (!returnConfirmRecord) return;
    const targetId = returnConfirmRecord.id;
    const targetTitle = returnConfirmRecord.bookTitle;
    setIsReturning(true);

    // Cập nhật giao diện ngay lập tức 0ms để sách biến mất khỏi danh sách đang mượn ngay
    setMyBorrows(prev => prev.map(r => 
      Number(r.id) === Number(targetId) 
        ? { ...r, status: 'Đã trả', actualReturnDate: new Date().toISOString().substring(0, 10) }
        : r
    ));
    setReturnConfirmRecord(null);

    try {
      await api.updateBorrowStatus(targetId, 'Đã trả');
      showToast(`✓ Đã hoàn tất trả cuốn sách "${targetTitle}" về thư viện thành công!`);
      await loadData(true);
    } catch (err) {
      console.error(err);
      showToast('Có lỗi xảy ra khi thực hiện trả sách.');
      await loadData(true);
    } finally {
      setIsReturning(false);
    }
  };

  const categories = ['All', ...new Set(books.map(b => b.category).filter(Boolean))];

  const filteredBooks = books.filter(b => {
    const matchSearch = b.title.toLowerCase().includes(bookSearch.toLowerCase()) || 
                        (b.author && b.author.toLowerCase().includes(bookSearch.toLowerCase()));
    const matchCat = selectedCategory === 'All' || b.category === selectedCategory;
    return matchSearch && matchCat;
  });

  // Calculate pagination
  const totalPages = Math.ceil(filteredBooks.length / PAGE_SIZE) || 1;
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const endIndex = startIndex + PAGE_SIZE;
  const paginatedBooks = filteredBooks.slice(startIndex, endIndex);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    setCurrentPage(newPage);
    if (searchSectionRef.current) {
      searchSectionRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  const activeBorrowsList = myBorrows.filter(r => r.status === 'Đang mượn' || r.status === 'Chờ duyệt' || r.status === 'Quá hạn');
  const historyBorrowsList = myBorrows.filter(r => r.status === 'Đã trả' || r.status === 'Từ chối');

  return (
    <div style={{ padding: '32px 36px', flex: 1, background: '#ffffff', minHeight: '100vh', boxSizing: 'border-box' }}>
      {/* TAB 1: TRA CỨU SÁCH */}
      {activeTab === 'catalog' && (
        <div>
          {/* Top Div: Hệ thống đề xuất 6 cuốn sách luân phiên (Matching Image 2) */}
          <FeaturedCarousel
            books={books}
            onSelectBook={(book) => { setSelectedBook(book); setDetailModalOpen(true); }}
            onBorrowBook={(book) => { setBorrowTargetBook(book); setBorrowModalOpen(true); }}
          />

          {/* Header Kho sách (My Library) & Search/Filter */}
          <div
            ref={searchSectionRef}
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '16px', flexWrap: 'wrap', scrollMarginTop: '20px' }}
          >
            <div>
              <h2 style={{ fontFamily: "'Lora', serif", fontSize: '24px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                Kho sách thư viện
              </h2>
            </div>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ position: 'relative', width: '260px' }}>
                <input
                  type="text"
                  placeholder="Lọc nhanh sách..."
                  value={bookSearch}
                  onChange={(e) => setBookSearch(e.target.value)}
                  style={{ paddingLeft: '34px', height: '38px', fontSize: '13px' }}
                />
                <Search size={15} style={{ position: 'absolute', left: '11px', top: '12px', color: '#94a3b8' }} />
              </div>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                style={{ width: '200px', height: '38px', fontSize: '13px' }}
              >
                {categories.map(c => (
                  <option key={c} value={c}>{c === 'All' ? 'Tất cả thể loại' : c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Book Cards Grid (20 books per page) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '18px' }}>
            {paginatedBooks.length === 0 ? (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '64px', color: '#64748b' }}>
                <BookOpen size={48} style={{ margin: '0 auto 12px', color: '#cbd5e1' }} />
                <p style={{ fontSize: '15px', fontWeight: 600 }}>Không tìm thấy cuốn sách nào phù hợp với từ khóa.</p>
              </div>
            ) : (
              paginatedBooks.map(b => (
                <BookCard
                  key={b.id}
                  book={b}
                  onSelect={(book) => { setSelectedBook(book); setDetailModalOpen(true); }}
                  onBorrow={(book) => { setBorrowTargetBook(book); setBorrowModalOpen(true); }}
                  isAdmin={false}
                />
              ))
            )}
          </div>

          {/* Phân trang (Pagination) - Mỗi trang 20 cuốn sách */}
          {totalPages > 1 && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                marginTop: '36px',
                paddingTop: '20px',
                borderTop: '1px solid #f1f5f9'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', justifyContent: 'center' }}>
                {/* Previous Button */}
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    background: currentPage === 1 ? '#f8fafc' : '#ffffff',
                    color: currentPage === 1 ? '#94a3b8' : '#334155',
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                    fontWeight: 600,
                    fontSize: '13px',
                    transition: 'all 0.2s'
                  }}
                >
                  <ChevronLeft size={16} />
                  <span>Trước</span>
                </button>

                {/* Page Number Buttons */}
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      border: currentPage === pageNum ? '1px solid #2563eb' : '1px solid #e2e8f0',
                      background: currentPage === pageNum ? '#2563eb' : '#ffffff',
                      color: currentPage === pageNum ? '#ffffff' : '#334155',
                      fontWeight: 700,
                      fontSize: '13px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      boxShadow: currentPage === pageNum ? '0 4px 10px rgba(37, 99, 235, 0.25)' : 'none'
                    }}
                  >
                    {pageNum}
                  </button>
                ))}

                {/* Next Button */}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    background: currentPage === totalPages ? '#f8fafc' : '#ffffff',
                    color: currentPage === totalPages ? '#94a3b8' : '#334155',
                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                    fontWeight: 600,
                    fontSize: '13px',
                    transition: 'all 0.2s'
                  }}
                >
                  <span>Sau</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SÁCH ĐANG MƯỢN */}
      {activeTab === 'active-borrows' && (
        <div>
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>Danh sách Sách Đang Mượn & Chờ Duyệt</h2>
            <p style={{ color: '#64748b', fontSize: '13.5px', marginTop: '2px' }}>
              Theo dõi thời hạn trả sách để tránh bị quá hạn
            </p>
          </div>

          {activeBorrowsList.length === 0 ? (
            <div className="card" style={{ padding: '64px', textAlign: 'center' }}>
              <BookMarked size={48} style={{ margin: '0 auto 12px', color: '#cbd5e1' }} />
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#334155' }}>Bạn hiện không có sách nào đang mượn.</h3>
              <p style={{ color: '#64748b', fontSize: '13px', marginTop: '4px', marginBottom: '18px' }}>
                Hãy tra cứu kho sách và đăng ký mượn cuốn sách yêu thích của bạn ngay hôm nay!
              </p>
              <button onClick={() => onTabChange('catalog')} className="btn btn-primary">
                <span>Khám phá kho sách</span>
                <ArrowRight size={16} />
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
              {activeBorrowsList.map(r => {
                const isLibraryBorrow = r.borrowType && (
                  r.borrowType.toLowerCase().includes('thư viện') ||
                  r.borrowType.toLowerCase().includes('tại chỗ')
                );
                const canReturn = r.status === 'Đang mượn' || r.status === 'Quá hạn';

                return (
                  <div key={r.id} className="card" style={{ padding: '20px', margin: 0, borderLeft: `4px solid ${r.status === 'Đang mượn' ? '#16a34a' : r.status === 'Quá hạn' ? '#ef4444' : '#f59e0b'}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <span className={`badge ${r.status === 'Đang mượn' ? 'badge-success' : r.status === 'Quá hạn' ? 'badge-danger' : 'badge-warning'}`}>
                        {r.status}
                      </span>
                      <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Phiếu #{r.id}</span>
                    </div>

                    <h3
                      style={{
                        fontSize: '15px',
                        fontWeight: 700,
                        color: '#0f172a',
                        marginBottom: '6px',
                        lineHeight: 1.3,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = '#2563eb';
                        e.currentTarget.style.textDecoration = 'underline';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = '#0f172a';
                        e.currentTarget.style.textDecoration = 'none';
                      }}
                      onClick={() => handleOpenBookByTitleOrId(r.bookTitle, r.bookId)}
                      title={`Xem chi tiết sách: ${r.bookTitle}`}
                    >
                      {r.bookTitle}
                    </h3>
                    <div style={{ fontSize: '12.5px', color: '#64748b', marginBottom: '14px' }}>
                      Hình thức: <strong>{r.borrowType || 'Mượn về nhà'}</strong>
                    </div>

                    <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', fontSize: '12.5px', color: '#475569', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div>Ngày mượn: <strong>{r.borrowDate ? r.borrowDate.substring(0, 10) : '-'}</strong></div>
                      <div>Hạn trả sách: <strong style={{ color: r.status === 'Quá hạn' ? '#ef4444' : '#0f172a' }}>{r.returnDate ? r.returnDate.substring(0, 10) : '-'}</strong></div>
                    </div>

                    <div style={{ marginTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      {/* Nút Trả sách cho tất cả các sách đang mượn */}
                      {canReturn ? (
                        <button
                          onClick={() => setReturnConfirmRecord(r)}
                          className="btn btn-primary"
                          style={{
                            padding: '6px 14px',
                            fontSize: '12.5px',
                            background: '#16a34a',
                            borderColor: '#16a34a',
                            cursor: 'pointer',
                            fontWeight: 600
                          }}
                          title="Trả sách về thư viện"
                        >
                          Trả sách
                        </button>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: LỊCH SỬ MƯỢN TRẢ */}
      {activeTab === 'history' && (
        <div>
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>Lịch Sử Mượn Trả Của Bạn</h2>
            <p style={{ color: '#64748b', fontSize: '13.5px', marginTop: '2px' }}>
              Danh sách tất cả các cuốn sách bạn đã từng mượn và hoàn tất trả
            </p>
          </div>

          <div className="card">
            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>Mã Phiếu</th>
                    <th>Tên Sách</th>
                    <th>Hình Thức</th>
                    <th>Ngày Mượn</th>
                    <th>Hạn Trả</th>
                    <th>Ngày Trả Thực Tế</th>
                    <th>Trạng Thái</th>
                    <th style={{ textAlign: 'right' }}>Chứng Từ</th>
                  </tr>
                </thead>
                <tbody>
                  {myBorrows.length === 0 ? (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                        Bạn chưa có lịch sử mượn trả nào.
                      </td>
                    </tr>
                  ) : (
                    myBorrows.map(r => (
                      <tr key={r.id}>
                        <td style={{ fontWeight: 700 }}>#{r.id}</td>
                        <td
                          style={{ fontWeight: 600, color: '#2563eb', cursor: 'pointer', transition: 'all 0.15s ease' }}
                          onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                          onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
                          onClick={() => handleOpenBookByTitleOrId(r.bookTitle, r.bookId)}
                          title={`Xem chi tiết sách: ${r.bookTitle}`}
                        >
                          {r.bookTitle}
                        </td>
                        <td>{r.borrowType || 'Mượn về nhà'}</td>
                        <td>{r.borrowDate ? r.borrowDate.substring(0, 10) : '-'}</td>
                        <td>{r.returnDate ? r.returnDate.substring(0, 10) : '-'}</td>
                        <td>{r.actualReturnDate ? r.actualReturnDate.substring(0, 10) : '-'}</td>
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
                        <td style={{ textAlign: 'right', color: '#94a3b8', fontSize: '13px' }}>
                          -
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
        isAdmin={false}
      />

      <BorrowModal
        book={borrowTargetBook}
        isOpen={borrowModalOpen}
        onClose={() => { setBorrowModalOpen(false); setBorrowTargetBook(null); }}
        onConfirm={handleBorrowRequest}
        isAdmin={false}
      />

      {/* DIV Xác nhận Trả sách (Thay thế hoàn toàn thông báo của trình duyệt) */}
      {returnConfirmRecord && (
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
          onClick={() => !isReturning && setReturnConfirmRecord(null)}
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
            <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#0f172a', margin: '0 0 10px 0' }}>
              Xác nhận trả sách
            </h3>
            <p style={{ fontSize: '13.5px', color: '#64748b', lineHeight: 1.6, margin: '0 0 22px 0' }}>
              Bạn có chắc chắn muốn hoàn tất trả cuốn sách <strong style={{ color: '#0f172a' }}>"{returnConfirmRecord.bookTitle}"</strong> (Phiếu #{returnConfirmRecord.id}) tại quầy thư viện không?
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => setReturnConfirmRecord(null)}
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

      {/* Toast Notification khi Trả sách thành công */}
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