import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import BookCard from '../components/BookCard';
import BookDetailModal from '../components/BookDetailModal';
import BorrowModal from '../components/BorrowModal';
import {
  Search, BookOpen, Clock, CheckCircle,
  BookMarked, ArrowRight, ChevronLeft, ChevronRight,
  Lock, CreditCard
} from 'lucide-react';

import FeaturedCarousel from '../components/FeaturedCarousel';
import UpcomingBooksSection from '../components/UpcomingBooksSection';
import VNPayPaymentModal from '../components/VNPayPaymentModal';

export default function ReaderPortal({ activeTab, onTabChange }) {
  const { user, updateUser, logout } = useAuth();
  const [books, setBooks] = useState(() => (api.getCachedBooks ? api.getCachedBooks() : []));
  const [myBorrows, setMyBorrows] = useState([]);
  const [myReservations, setMyReservations] = useState([]);
  const [recommendations, setRecommendations] = useState(null);
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
  const [myFines, setMyFines] = useState([]);
  const [vnpayModalOpen, setVnpayModalOpen] = useState(false);
  const [selectedFineForPayment, setSelectedFineForPayment] = useState(null);
  const [systemSettings, setSystemSettings] = useState(null);

  useEffect(() => {
    if (api.getSettings) {
      api.getSettings().then(s => setSystemSettings(s)).catch(() => {});
    }
  }, []);

  // Tự động kiểm tra và kick độc giả ra khỏi hệ thống nếu tài khoản chuyển sang trạng thái Chờ duyệt nộp phạt
  useEffect(() => {
    if (!user) return;
    const checkPendingAndKick = async () => {
      if (user.pendingPaymentApproval) {
        sessionStorage.setItem('pendingApprovalKickMsg', 'Tài khoản của bạn đang chờ Quản trị viên duyệt giao dịch nộp phạt VNPay. Hệ thống đã tự động đăng xuất.');
        if (logout) logout();
        return;
      }
      try {
        const finesList = await (api.getFines ? api.getFines() : []);
        const uId = Number(user.id || 0);
        const hasPending = finesList.some(
          f => Number(f.readerId || f.userId || 0) === uId && (f.status === 'Chờ duyệt' || f.status === 'Chờ duyệt nộp phạt')
        );
        if (hasPending) {
          sessionStorage.setItem('pendingApprovalKickMsg', 'Tài khoản của bạn đang chờ Quản trị viên duyệt giao dịch nộp phạt VNPay. Hệ thống đã tự động đăng xuất.');
          if (logout) logout();
        }
      } catch (e) {}
    };

    checkPendingAndKick();
    const handleDataUpdate = () => checkPendingAndKick();
    window.addEventListener('smartlib:data-updated', handleDataUpdate);
    return () => window.removeEventListener('smartlib:data-updated', handleDataUpdate);
  }, [user, logout]);

  const showToast = (msg) => {

    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  // 1. Tải danh sách sách (chỉ tải 1 lần khi vào trang hoặc khi có sự kiện cập nhật kho sách)
  const loadBooks = async () => {
    try {
      const bRes = await api.getBooks().catch(() => []);
      if (bRes && bRes.length > 0) {
        setBooks(bRes);
      }
    } catch (e) {
      console.error('Error loading books:', e);
    }
  };

  // 2. Tải phiếu mượn & hàng chờ của riêng độc giả (payload siêu nhẹ < 2KB, không kèm base64 ảnh)
  const loadBorrowsOnly = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const brRes = await api.getBorrowRecords().catch(() => []);
      if (user) {
        const uId = user.id ? Number(user.id) : 2;
        const uName = (user.fullName || '').toLowerCase().trim();
        const uUsername = (user.username || '').toLowerCase().trim();
        const myFiltered = (brRes || []).filter(r => {
          const rId = r.readerId ? Number(r.readerId) : null;
          const rName = (r.readerName || '').toLowerCase().trim();
          return (rId && rId === uId) ||
                 (uName && rName && rName === uName) ||
                 (uUsername && rName && rName === uUsername);
        });
        setMyBorrows(myFiltered);

        // Tải danh sách sách trong hàng chờ đặt trước của độc giả
        api.getReservations(uId).then(resvs => {
          const cleanResvs = (resvs || []).filter(r => 
            Number(r.bookId) !== 3 && 
            !((r.bookTitle || '').toLowerCase().includes('tru tiên')) &&
            r.status !== 'Cancelled' && 
            r.status !== 'Hủy' && 
            r.status !== 'Fulfilled'
          );
          setMyReservations(cleanResvs);
        }).catch(() => {});

        // Tải danh sách các khoản phạt của độc giả
        if (api.getFines) {
          api.getFines(uId).then(fList => {
            setMyFines(fList || []);
          }).catch(() => {});
        }

        // Đồng bộ trạng thái khóa tài khoản thực tế từ server
        if (api.getReaders && updateUser) {
          api.getReaders().then(readers => {
            const currentReader = (readers || []).find(rd => Number(rd.id) === uId);
            if (currentReader) {
              const serverLocked = Boolean(currentReader.isLocked);
              const serverReason = currentReader.lockReason || '';
              if (Boolean(user?.isLocked) !== serverLocked || (user?.lockReason || '') !== serverReason) {
                updateUser({
                  isLocked: serverLocked,
                  lockReason: serverReason
                });
              }
            }
          }).catch(() => {});
        }

        // Fetch AI recommendations (Loại trừ hoàn toàn sách sắp có)
        api.getRecommendations(uId).then(rec => {
          if (rec && Array.isArray(rec.books)) {
            rec.books = rec.books.filter(
              b => b.status !== 'Upcoming' && 
                   b.status !== 'Sắp phát hành' && 
                   b.status !== 'Sắp có' && 
                   Number(b.id) < 51 && 
                   !b.isUpcoming
            );
          }
          setRecommendations(rec);
        }).catch(() => {});
      }
    } catch (e) {
      console.error('Error loading reader borrows:', e);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const fineRate = Number(systemSettings?.finePerDay || 2000);
  const lockDays = Number(systemSettings?.autoLockAfterDays || 3);
  const graceDays = Number(systemSettings?.gracePeriodDays || 0);

  // Kiểm tra tài khoản có bị khóa hoặc có sách trễ hạn >= lockDays ngày không
  const overdueBorrows = myBorrows.filter(r => {
    if (r.status === 'Đã trả' || r.status === 'Từ chối' || r.status === 'Chờ duyệt') return false;
    if (r.status === 'Quá hạn') return true;
    const dueStr = r.returnDate || r.dueDate;
    if (!dueStr) return false;
    const due = new Date(dueStr);
    const now = new Date();
    const diffDays = Math.floor((now - due) / (1000 * 60 * 60 * 24));
    return diffDays >= lockDays || (r.daysOverdue && r.daysOverdue >= lockDays) || (r.overdueDays && r.overdueDays >= lockDays);
  });

  const calculateBorrowFine = (r) => {
    if (Number(r.fineAmount) > 0) return Number(r.fineAmount);
    if (Number(r.fine_amount) > 0) return Number(r.fine_amount);
    const dueStr = r.returnDate || r.dueDate;
    if (!dueStr) return lockDays * fineRate;
    const due = new Date(dueStr);
    const now = new Date();
    const diffDays = Math.floor((now - due) / (1000 * 60 * 60 * 24));
    const days = Math.max(lockDays, diffDays, Number(r.daysOverdue || 0), Number(r.overdueDays || 0));
    const chargeable = Math.max(0, days - graceDays);
    return chargeable * fineRate;
  };

  const unpaidFinesList = (myFines || []).filter(f => f.status === 'Chưa nộp');
  const fineFromFinesList = unpaidFinesList.reduce((sum, f) => sum + Number(f.fineAmount || 0), 0);
  const totalUnpaidFineAmount = fineFromFinesList > 0 
    ? fineFromFinesList 
    : overdueBorrows.reduce((sum, r) => sum + calculateBorrowFine(r), 0);

  const isReaderLocked = Boolean(user?.isLocked || user?.is_locked || overdueBorrows.length > 0 || (unpaidFinesList.length > 0 && totalUnpaidFineAmount > 0));

  let readerLockReason = user?.lockReason || '';
  if (!readerLockReason) {
    if (overdueBorrows.length > 0) {
      readerLockReason = `Bạn đang mượn ${overdueBorrows.length} cuốn sách quá hạn từ ${lockDays} ngày trở lên (${overdueBorrows.map(b => b.bookTitle).join(', ')}). Hệ thống tự động khóa tài khoản theo quy chế thư viện.`;
    } else if (unpaidFinesList.length > 0) {
      readerLockReason = `Tài khoản còn khoản phạt trễ hạn (${totalUnpaidFineAmount.toLocaleString('vi-VN')} đ) chưa thanh toán. Vui lòng nộp phạt qua VNPay để tự động mở khóa tài khoản.`;
    } else {
      readerLockReason = 'Tài khoản đang bị tạm khóa theo quy định thư viện.';
    }
  }

  const handleVNPaySuccess = (res) => {
    setVnpayModalOpen(false);
    setSelectedFineForPayment(null);
    const kickMsg = res?.message || 'Tài khoản của bạn đang chờ Quản trị viên duyệt giao dịch nộp phạt VNPay. Vui lòng đợi trong giây lát hoặc liên hệ ban quản trị!';
    sessionStorage.setItem('pendingApprovalKickMsg', kickMsg);
    if (logout) {
      logout();
    }
  };

  const handleOpenBorrowModal = (book) => {
    if (isReaderLocked) {
      showToast(`Tài khoản của bạn đang bị khóa do mượn sách quá hạn từ ${lockDays} ngày trở lên. Vui lòng nộp phạt qua VNPay để mở lại tài khoản.`);
      setSelectedFineForPayment(unpaidFinesList[0] || null);
      setVnpayModalOpen(true);
      return;
    }
    setBorrowTargetBook(book);
    setBorrowModalOpen(true);
  };

  const handleCreateReservation = async (book) => {
    if (!user) {
      showToast('Vui lòng đăng nhập để đặt trước sách.');
      return;
    }

    if (isReaderLocked) {
      showToast(`Tài khoản của bạn đang bị khóa do mượn sách quá hạn từ ${lockDays} ngày trở lên. Vui lòng nộp phạt qua VNPay để mở lại tài khoản.`);
      setSelectedFineForPayment(unpaidFinesList[0] || null);
      setVnpayModalOpen(true);
      return;
    }

    // Kiểm tra giới hạn số sách đặt trước tối đa theo cài đặt
    const maxRes = Number(systemSettings?.maxReservations || 3);
    const activeResvs = myReservations.filter(
      r => r.status !== 'Cancelled' && r.status !== 'Hủy' && r.status !== 'Fulfilled' &&
           Number(r.bookId) !== 3 && !((r.bookTitle || '').toLowerCase().includes('tru tiên'))
    );
    if (activeResvs.length >= maxRes) {
      showToast(`Bạn đã hết lượt đặt trước sách! Mỗi độc giả chỉ được đặt trước tối đa ${maxRes} cuốn sách. Nếu muốn đặt thì cần phải hủy một cuốn sách khác để đặt tiếp.`);
      return;
    }


    try {
      const uId = user.id ? Number(user.id) : 2;
      const res = await api.createReservation({
        bookId: book.id,
        readerId: uId
      });
      showToast(res.message || '✓ Đặt trước sách thành công! Bạn đã được thêm vào hàng chờ.');
      setSelectedBook(prev => (prev && Number(prev.id) === Number(book.id)) ? { ...prev, isReserved: true } : prev);
      loadBorrowsOnly(true);
      window.dispatchEvent(new CustomEvent('smartlib:data-updated'));
    } catch (e) {
      showToast(e.message || 'Không thể đặt trước sách lúc này.');
    }
  };

  const handleCancelReservation = async (resId) => {
    try {
      // Cập nhật giao diện ngay lập tức
      setMyReservations(prev => prev.filter(r => Number(r.id) !== Number(resId)));
      await api.cancelReservation(resId);
      showToast('Đã hủy yêu cầu đặt trước sách.');
      setSelectedBook(prev => prev ? { ...prev, isReserved: false } : null);
      loadBorrowsOnly(true);
      window.dispatchEvent(new CustomEvent('smartlib:data-updated'));
    } catch (e) {
      showToast('Lỗi khi hủy đặt trước: ' + (e.message || ''));
      loadBorrowsOnly(true);
    }
  };

  const handleCancelReservationForBook = async (bookId) => {
    try {
      const targetRes = myReservations.find(r => Number(r.bookId) === Number(bookId) && r.status !== 'Cancelled' && r.status !== 'Hủy');
      if (targetRes) {
        await api.cancelReservation(targetRes.id);
      }
      setMyReservations(prev => prev.filter(r => Number(r.bookId) !== Number(bookId)));
      setSelectedBook(prev => (prev && Number(prev.id) === Number(bookId)) ? { ...prev, isReserved: false } : prev);
      showToast('✓ Đã hủy đặt trước sách thành công.');
      loadBorrowsOnly(true);
      window.dispatchEvent(new CustomEvent('smartlib:data-updated'));
    } catch (e) {
      showToast('Lỗi khi hủy đặt trước: ' + (e.message || ''));
    }
  };

  const loadData = async (silent = false) => {
    await Promise.all([loadBooks(), loadBorrowsOnly(silent)]);
  };

  // Xử lý VNPay return URL params (khi VNPay redirect về sau thanh toán)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const vnpResult = params.get('vnp_result');
    const vnpTxnRef = params.get('vnp_txnRef');
    const vnpAmount = params.get('vnp_amount');

    if (vnpResult === 'success' && vnpTxnRef) {
      // Thanh toán VNPay thành công — tự động trigger handleVNPaySuccess
      const successData = {
        success: true,
        transactionRef: vnpTxnRef,
        amount: Number(vnpAmount || 0),
        message: `Thanh toán VNPay thành công! Mã GD: ${vnpTxnRef}. Tài khoản đã được tự động mở khóa.`,
        unlocked: true
      };
      // Xóa params khỏi URL mà không reload trang
      window.history.replaceState({}, document.title, window.location.pathname);
      // Trigger success sau 500ms để đảm bảo component đã mount đủ
      setTimeout(() => {
        handleVNPaySuccess(successData);
      }, 500);
    } else if (vnpResult === 'failed') {
      const vnpCode = params.get('vnp_code');
      window.history.replaceState({}, document.title, window.location.pathname);
      setTimeout(() => {
        showToast(`⚠️ Thanh toán VNPay thất bại (Mã lỗi: ${vnpCode || 'N/A'}). Vui lòng thử lại.`);
      }, 500);
    }
  }, []); // Chỉ chạy 1 lần khi mount

  useEffect(() => {
    loadData();

    // 1. Lắng nghe sự kiện cập nhật dữ liệu tức thì từ các thao tác mượn/trả
    const handleDataUpdate = () => {
      loadBorrowsOnly(true);
      loadBooks();
    };
    window.addEventListener('smartlib:data-updated', handleDataUpdate);

    // 2. Lắng nghe sự kiện giữa các tab trình duyệt khác nhau
    const handleStorageUpdate = (e) => {
      if (e.key === 'smartlib_last_update') {
        loadBorrowsOnly(true);
      }
    };
    window.addEventListener('storage', handleStorageUpdate);

    // 3. Polling ngầm CHỈ tải phiếu mượn nhẹ (< 2KB), chu kỳ 6s giúp đạt 60fps mượt mà
    const interval = setInterval(() => loadBorrowsOnly(true), 6000);

    return () => {
      window.removeEventListener('smartlib:data-updated', handleDataUpdate);
      window.removeEventListener('storage', handleStorageUpdate);
      clearInterval(interval);
    };
  }, [user]);


  // Khi chuyển tab: chỉ cập nhật phiếu mượn/hàng chờ, không reload sách
  useEffect(() => {
    if (activeTab === 'borrows' || activeTab === 'history' || activeTab === 'reservations' || activeTab === 'active-borrows') {
      loadBorrowsOnly(true);
    }
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
    if (isReaderLocked) {
      showToast('Tài khoản của bạn đang bị khóa do mượn sách quá hạn từ 3 ngày trở lên. Vui lòng nộp phạt qua VNPay để mở lại tài khoản.');
      setSelectedFineForPayment(unpaidFinesList[0] || null);
      setVnpayModalOpen(true);
      return;
    }
    try {
      await api.createBorrowRecord(formData);
      showToast(`✓ Đã gửi yêu cầu mượn cuốn sách "${formData.bookTitle || 'sách'}" thành công!`);
      await loadData(true);
    } catch (err) {
      console.error('Lỗi gửi yêu cầu mượn:', err);
      showToast(err.message || 'Lỗi khi gửi yêu cầu mượn sách');
      await loadData(true);
      throw err;
    }
  };

  const handleConfirmReturn = async () => {
    if (!returnConfirmRecord) return;
    const targetId = returnConfirmRecord.id;
    const targetTitle = returnConfirmRecord.bookTitle;
    setIsReturning(true);

    try {
      await api.updateBorrowStatus(targetId, 'Đã trả');
      setMyBorrows(prev => prev.map(r => 
        Number(r.id) === Number(targetId) 
          ? { ...r, status: 'Đã trả', actualReturnDate: new Date().toISOString().substring(0, 10) }
          : r
      ));
      setReturnConfirmRecord(null);
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

  const handleCancelBorrow = async (recordId, bookTitle) => {
    try {
      await api.updateBorrowStatus(recordId, 'Đã hủy');
      setMyBorrows(prev => prev.filter(r => Number(r.id) !== Number(recordId)));
      showToast(`✓ Đã hủy yêu cầu mượn cuốn sách "${bookTitle}" thành công!`);
      await loadData(true);
    } catch (err) {
      console.error(err);
      showToast('Có lỗi xảy ra khi hủy yêu cầu.');
    }
  };

  const actualBooks = books.filter(b => 
    b.status !== 'Upcoming' && 
    b.status !== 'Sắp phát hành' && 
    b.status !== 'Sắp có' && 
    Number(b.id) < 51 && 
    !b.isUpcoming
  );

  const categories = ['All', ...new Set(actualBooks.map(b => b.category).filter(Boolean))];

  const filteredBooks = actualBooks.filter(b => {
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

  return (
    <div style={{ padding: '32px 36px', flex: 1, background: '#ffffff', minHeight: '100vh', boxSizing: 'border-box' }}>
      {/* BANNER CẢNH BÁO TÀI KHOẢN BỊ KHÓA & NỘP PHẠT VNPAY */}
      {isReaderLocked && (
        <div style={{
          background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
          border: '1.5px solid #f87171',
          borderRadius: '16px',
          padding: '18px 24px',
          marginBottom: '26px',
          boxShadow: '0 4px 20px rgba(239, 68, 68, 0.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: '280px' }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: '#ef4444',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 4px 10px rgba(239, 68, 68, 0.3)'
            }}>
              <Lock size={24} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#991b1b' }}>
                  TÀI KHOẢN ĐANG BỊ KHÓA DO QUÁ HẠN MƯỢN SÁCH
                </h4>
                <span style={{
                  background: '#b91c1c',
                  color: '#fff',
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '999px'
                }}>
                  Tự động khóa sau 3 ngày trễ hạn
                </span>
              </div>
              <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#b91c1c', lineHeight: 1.4 }}>
                {readerLockReason}
              </p>
              {totalUnpaidFineAmount > 0 && (
                <div style={{ marginTop: '6px', fontSize: '13px', color: '#7f1d1d', fontWeight: 700 }}>
                  Tổng tiền phạt cần nộp: <span style={{ color: '#dc2626', fontSize: '15px', textDecoration: 'underline' }}>{totalUnpaidFineAmount.toLocaleString('vi-VN')} đ</span> (2.000 đ/ngày/sách)
                </div>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              onClick={() => {
                setSelectedFineForPayment(unpaidFinesList[0] || null);
                setVnpayModalOpen(true);
              }}
              className="btn"
              style={{
                background: '#005baa',
                color: '#ffffff',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '10px',
                fontWeight: 700,
                fontSize: '13.5px',
                boxShadow: '0 4px 12px rgba(0, 91, 170, 0.35)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <CreditCard size={18} />
              <span>Nộp phạt qua VNPay ngay</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 1: TRA CỨU SÁCH */}
      {activeTab === 'catalog' && (
        <div>
          {/* Top Div: Hệ thống đề xuất 6 cuốn sách luân phiên (Matching Image 2) */}
          <FeaturedCarousel
            books={actualBooks}
            onSelectBook={(book) => { setSelectedBook(book); setDetailModalOpen(true); }}
            onBorrowBook={handleOpenBorrowModal}
          />

          {/* Mục SÁCH SẮP CÓ (Upcoming Books Section - Bố cục 5 cột chuẩn theo ảnh mẫu) */}
          <UpcomingBooksSection
            reservedBookIds={myReservations.filter(r => r.status !== 'Cancelled' && r.status !== 'Hủy').map(r => Number(r.bookId))}
            onReserve={handleCreateReservation}
            onCancelReserve={(book) => handleCancelReservationForBook(book.id)}
            onSelectBook={(book) => {
              const isResv = myReservations.some(r => Number(r.bookId) === Number(book.id) && r.status !== 'Cancelled' && r.status !== 'Hủy') || Boolean(book.isReserved);
              setSelectedBook({
                id: book.id,
                title: book.title,
                author: book.author || 'Chưa rõ',
                category: book.category || 'Manga & Light Novel',
                quantity: 0,
                available: 0,
                borrowed: 0,
                status: 'Sắp phát hành',
                isUpcoming: true,
                isReserved: isResv,
                releaseDate: book.releaseDate,
                views: book.views,
                desc: book.desc || `Tác phẩm của tác giả ${book.author || 'nổi tiếng'} đang chuẩn bị phát hành và sẽ sớm có mặt tại thư viện trong đợt nhập sách tới (${book.releaseDate}). Lượt quan tâm hiện tại: ${book.views}.`,
                imageUrl: book.cover
              });
              setDetailModalOpen(true);
            }}
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
                style={{ width: '200px', height: '38px', fontSize: '13px', paddingTop: 0, paddingBottom: 0 }}
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
                  onSelect={(book) => {
                    const isResv = myReservations.some(r => Number(r.bookId) === Number(book.id) && r.status !== 'Cancelled' && r.status !== 'Hủy');
                    setSelectedBook({ ...book, isReserved: isResv });
                    setDetailModalOpen(true);
                  }}
                  onBorrow={handleOpenBorrowModal}
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
      {(activeTab === 'active-borrows' || activeTab === 'borrows') && (
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
                const canReturn = r.status === 'Đang mượn' || r.status === 'Quá hạn';
                const canCancel = r.status === 'Chờ duyệt';
                const diffDays = r.returnDate ? Math.max(0, Math.floor((new Date() - new Date(r.returnDate)) / (1000 * 60 * 60 * 24))) : 0;
                const isOverdue = r.status === 'Quá hạn' || diffDays > 0;
                const itemFineAmount = calculateBorrowFine(r);

                return (
                  <div key={r.id} className="card" style={{ padding: '20px', margin: 0, borderLeft: `4px solid ${r.status === 'Đang mượn' && !isOverdue ? '#16a34a' : isOverdue ? '#ef4444' : '#f59e0b'}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <span className={`badge ${r.status === 'Đang mượn' && !isOverdue ? 'badge-success' : isOverdue ? 'badge-danger' : 'badge-warning'}`}>
                        {diffDays > 0 ? `Quá hạn ${diffDays} ngày` : isOverdue ? 'Quá hạn' : r.status}
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
                      <div>Hạn trả sách: <strong style={{ color: isOverdue ? '#ef4444' : '#0f172a' }}>{r.returnDate ? r.returnDate.substring(0, 10) : '-'}</strong></div>
                    </div>

                    {isOverdue && (
                      <div style={{
                        marginTop: '10px',
                        padding: '8px 12px',
                        background: '#fef2f2',
                        border: '1px solid #fecaca',
                        borderRadius: '8px',
                        fontSize: '12px',
                        color: '#b91c1c',
                        fontWeight: 600,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <span>Tiền phạt: <strong style={{ color: '#dc2626' }}>{itemFineAmount.toLocaleString('vi-VN')} đ</strong> (2.000 đ/ngày)</span>
                        {(diffDays >= 3 || r.status === 'Quá hạn') && (
                          <span style={{
                            background: '#dc2626',
                            color: '#fff',
                            fontSize: '10.5px',
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: '4px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px'
                          }}>
                            <Lock size={11} /> Đã khóa tài khoản
                          </span>
                        )}
                      </div>
                    )}

                    <div style={{ marginTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {/* Nút Trả sách cho tất cả các sách đang mượn */}
                        {canReturn ? (
                          <button
                            type="button"
                            onClick={() => setReturnConfirmRecord(r)}
                            className="btn btn-return btn-table-action"
                            title="Trả sách về thư viện"
                          >
                            <CheckCircle size={14} /> Trả sách
                          </button>
                        ) : null}

                        {/* Nút Hủy yêu cầu cho sách đang Chờ duyệt */}
                        {canCancel ? (
                          <button
                            type="button"
                            onClick={() => handleCancelBorrow(r.id, r.bookTitle)}
                            className="btn btn-reject btn-table-action"
                            title="Hủy yêu cầu mượn cuốn sách này"
                          >
                            <X size={14} /> Hủy yêu cầu
                          </button>
                        ) : null}
                      </div>

                      {/* Nút Nộp phạt VNPay khi trễ hạn */}
                      {isOverdue && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedFineForPayment({
                              id: r.id,
                              borrowRecordId: r.id,
                              bookTitle: r.bookTitle,
                              fineAmount: itemFineAmount,
                              readerId: user?.id || 2
                            });
                            setVnpayModalOpen(true);
                          }}
                          className="btn"
                          style={{
                            padding: '6px 12px',
                            fontSize: '12px',
                            background: '#005baa',
                            color: '#ffffff',
                            border: 'none',
                            fontWeight: 700,
                            borderRadius: '6px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            cursor: 'pointer',
                            boxShadow: '0 2px 6px rgba(0, 91, 170, 0.25)'
                          }}
                          title="Nộp tiền phạt trễ hạn ngay qua VNPay"
                        >
                          <CreditCard size={13} />
                          <span>Nộp phạt VNPay</span>
                        </button>
                      )}
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
                    <th style={{ whiteSpace: 'nowrap' }}>Mã Phiếu</th>
                    <th style={{ minWidth: '220px' }}>Tên Sách</th>
                    <th style={{ whiteSpace: 'nowrap' }}>Hình Thức</th>
                    <th style={{ whiteSpace: 'nowrap' }}>Ngày Mượn</th>
                    <th style={{ whiteSpace: 'nowrap' }}>Hạn Trả</th>
                    <th style={{ whiteSpace: 'nowrap' }}>Ngày Trả Thực Tế</th>
                    <th style={{ whiteSpace: 'nowrap' }}>Trạng Thái</th>
                    <th style={{ whiteSpace: 'nowrap', textAlign: 'center' }}>Tiền Phạt</th>
                    <th style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>Chứng Từ</th>
                  </tr>
                </thead>
                <tbody>
                  {myBorrows.length === 0 ? (
                    <tr>
                      <td colSpan="9" style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                        Bạn chưa có lịch sử mượn trả nào.
                      </td>
                    </tr>
                  ) : (
                    myBorrows.map(r => (
                      <tr key={r.id}>
                        <td style={{ fontWeight: 700, whiteSpace: 'nowrap' }}>#{r.id}</td>
                        <td
                          style={{ fontWeight: 600, color: '#2563eb', cursor: 'pointer', transition: 'all 0.15s ease', minWidth: '220px' }}
                          onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                          onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
                          onClick={() => handleOpenBookByTitleOrId(r.bookTitle, r.bookId)}
                          title={`Xem chi tiết sách: ${r.bookTitle}`}
                        >
                          {r.bookTitle}
                        </td>
                        <td style={{ whiteSpace: 'nowrap' }}>{r.borrowType || 'Mượn về nhà'}</td>
                        <td style={{ whiteSpace: 'nowrap' }}>{r.borrowDate ? r.borrowDate.substring(0, 10) : '-'}</td>
                        <td style={{ whiteSpace: 'nowrap' }}>{r.returnDate ? r.returnDate.substring(0, 10) : '-'}</td>
                        <td style={{ whiteSpace: 'nowrap' }}>{r.actualReturnDate ? r.actualReturnDate.substring(0, 10) : '-'}</td>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          <span className={`badge ${
                            r.status === 'Đang mượn' ? 'badge-success' :
                            r.status === 'Chờ duyệt' ? 'badge-warning' :
                            r.status === 'Quá hạn' ? 'badge-danger' :
                            r.status === 'Đã trả' ? 'badge-info' : 'badge-neutral'
                          }`} style={{ whiteSpace: 'nowrap' }}>
                            {r.status}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                          {Number(r.fine_amount || r.fineAmount || 0) > 0 ? (
                            <span style={{
                              display: 'inline-block',
                              background: '#fef2f2',
                              color: '#dc2626',
                              border: '1px solid #fca5a5',
                              borderRadius: '6px',
                              padding: '2px 8px',
                              fontSize: '12px',
                              fontWeight: 700,
                              whiteSpace: 'nowrap'
                            }}
                            title={`Trễ ${r.overdue_days || r.overdueDays || r.daysOverdue || 0} ngày`}
                            >
                              {Number(r.fine_amount || r.fineAmount).toLocaleString('vi-VN')} đ
                            </span>
                          ) : (
                            <span style={{ color: '#16a34a', fontSize: '12px', fontWeight: 600, whiteSpace: 'nowrap' }}>
                              {r.status === 'Đã trả' ? '✓ Đúng hạn' : '-'}
                            </span>
                          )}
                        </td>
                        <td style={{ textAlign: 'right', color: '#94a3b8', fontSize: '13px', whiteSpace: 'nowrap' }}>
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

      {/* TAB 4: HÀNG CHỜ ĐẶT TRƯỚC SÁCH (FIFO QUEUE) */}
      {activeTab === 'reservations' && (() => {
        const cleanActiveReservations = myReservations.filter(
          r => r.status !== 'Cancelled' && r.status !== 'Hủy' && r.status !== 'Fulfilled' &&
               Number(r.bookId) !== 3 && !((r.bookTitle || '').toLowerCase().includes('tru tiên'))
        );

        return (
          <div>
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#ea580c', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Clock size={18} />
                </div>
                <h2 style={{ fontFamily: "'Lora', serif", fontSize: '24px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                  Hàng chờ đặt trước sách
                </h2>
              </div>
              <p style={{ margin: 0, fontSize: '13.5px', color: '#64748b' }}>
                Hệ thống quản lý hàng chờ tự động theo thứ tự ưu tiên FIFO. Khi sách được trả về thư viện, độc giả đứng đầu hàng chờ sẽ nhận được thông báo để mượn sách trong vòng 48 giờ.
              </p>
            </div>

            {/* Thẻ tóm tắt trạng thái */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '24px' }}>
              <div className="card" style={{ padding: '16px 20px', margin: 0, borderLeft: '4px solid #3b82f6' }}>
                <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Sách đang đặt trước (Tối đa 3)</div>
                <div style={{ fontSize: '22px', fontWeight: 800, color: cleanActiveReservations.length >= 3 ? '#dc2626' : '#1e293b', marginTop: '4px' }}>
                  {cleanActiveReservations.length} / 3
                </div>
                <div style={{ fontSize: '11px', color: cleanActiveReservations.length >= 3 ? '#ef4444' : '#64748b', fontWeight: 600, marginTop: '2px' }}>
                  {cleanActiveReservations.length >= 3 ? '⚠️ Hết lượt (Cần hủy bớt để đặt tiếp)' : `Còn lại: ${3 - cleanActiveReservations.length} lượt đặt`}
                </div>
              </div>

              <div className="card" style={{ padding: '16px 20px', margin: 0, borderLeft: '4px solid #f59e0b' }}>
                <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Đang xếp hàng chờ sách về</div>
                <div style={{ fontSize: '22px', fontWeight: 800, color: '#d97706', marginTop: '4px' }}>
                  {cleanActiveReservations.filter(r => r.status === 'Waiting').length}
                </div>
              </div>

              <div className="card" style={{ padding: '16px 20px', margin: 0, borderLeft: '4px solid #16a34a' }}>
                <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Sách đã về (Sẵn sàng mượn)</div>
                <div style={{ fontSize: '22px', fontWeight: 800, color: '#16a34a', marginTop: '4px' }}>
                  {cleanActiveReservations.filter(r => r.status === 'Ready').length}
                </div>
              </div>
            </div>

            {/* Danh sách bản ghi hàng chờ */}
            {cleanActiveReservations.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '56px 20px' }}>
                <Clock size={48} style={{ margin: '0 auto 12px', color: '#cbd5e1' }} />
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#334155', margin: '0 0 6px 0' }}>
                  Hàng chờ hiện đang trống
                </h3>
                <p style={{ fontSize: '13px', color: '#64748b', maxWidth: '480px', margin: '0 auto 18px auto' }}>
                  Khi bạn tìm kiếm thấy một cuốn sách đang hết bản sao sẵn có hoặc tại mục "Sách sắp có", bạn có thể bấm <strong>"Đặt trước"</strong> để xếp hàng ưu tiên nhận sách sớm nhất.
                </p>
                <button
                  onClick={() => onTabChange && onTabChange('catalog')}
                  className="btn btn-primary"
                  style={{ padding: '8px 20px', fontSize: '13px' }}
                >
                  Khám phá kho sách
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
                {cleanActiveReservations.map(res => {
                const isReady = res.status === 'Ready';
                const isWaiting = res.status === 'Waiting';

                return (
                  <div
                    key={res.id}
                    className="card"
                    style={{
                      padding: '20px',
                      margin: 0,
                      borderLeft: `4px solid ${isReady ? '#16a34a' : isWaiting ? '#ea580c' : '#94a3b8'}`,
                      background: isReady ? '#f0fdf4' : '#ffffff'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <span className={`badge ${isReady ? 'badge-success' : isWaiting ? 'badge-warning' : 'badge-neutral'}`}>
                        {isReady ? '🎉 Sách đã về kho!' : isWaiting ? `⏳ Hàng chờ #${res.priority || 1}` : res.status}
                      </span>
                      <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Mã #{res.id}</span>
                    </div>

                    <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', marginBottom: '6px', lineHeight: 1.35 }}>
                      {res.bookTitle}
                    </h3>

                    <div style={{ background: isReady ? '#dcfce7' : '#f8fafc', padding: '10px 14px', borderRadius: '8px', fontSize: '12.5px', color: '#475569', display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '14px' }}>
                      <div>Thời gian đăng ký: <strong>{res.reservedAt ? res.reservedAt.substring(0, 16).replace('T', ' ') : '-'}</strong></div>
                      <div>
                        Vị trí ưu tiên: <strong style={{ color: '#2563eb' }}>Số #{res.priority || 1} trong hàng chờ</strong>
                      </div>
                      {isReady && res.expiresAt && (
                        <div style={{ color: '#b91c1c', fontWeight: 700 }}>
                          ⏰ Hạn giữ chỗ ưu tiên: Đến {res.expiresAt.substring(0, 16).replace('T', ' ')}
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                      {isReady && (
                        <button
                          onClick={() => {
                            const b = books.find(item => Number(item.id) === Number(res.bookId)) || { id: res.bookId, title: res.bookTitle };
                            setBorrowTargetBook(b);
                            setBorrowModalOpen(true);
                          }}
                          className="btn btn-primary"
                          style={{
                            background: '#16a34a',
                            borderColor: '#16a34a',
                            fontSize: '12.5px',
                            padding: '6px 16px',
                            fontWeight: 700
                          }}
                        >
                          Mượn sách ngay
                        </button>
                      )}

                      {isWaiting && (
                        <button
                          type="button"
                          onClick={() => handleCancelReservation(res.id)}
                          className="btn btn-reject btn-table-action"
                          title="Hủy đặt trước cuốn sách này"
                        >
                          <X size={14} /> Hủy đặt
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        );
      })()}

      {/* Modals */}
      <BookDetailModal
        book={selectedBook}
        isOpen={detailModalOpen}
        onClose={() => { setDetailModalOpen(false); setSelectedBook(null); }}
        onBorrow={handleOpenBorrowModal}
        onReserve={handleCreateReservation}
        onCancelReserve={(b) => handleCancelReservationForBook(b.id)}
        activeReservationCount={myReservations.filter(r => r.status !== 'Cancelled' && r.status !== 'Hủy' && r.status !== 'Fulfilled' && Number(r.bookId) !== 3 && !((r.bookTitle || '').toLowerCase().includes('tru tiên'))).length}
        isAdmin={false}
        isUserLocked={isReaderLocked}
      />

      <BorrowModal
        book={borrowTargetBook}
        isOpen={borrowModalOpen}
        onClose={() => { setBorrowModalOpen(false); setBorrowTargetBook(null); }}
        onConfirm={handleBorrowRequest}
        onReserve={handleCreateReservation}
        isAdmin={false}
      />

      <VNPayPaymentModal
        isOpen={vnpayModalOpen}
        onClose={() => setVnpayModalOpen(false)}
        fine={selectedFineForPayment || (unpaidFinesList.length > 0 ? unpaidFinesList[0] : {
          id: overdueBorrows[0]?.id || 1,
          borrowRecordId: overdueBorrows[0]?.id || 1,
          bookTitle: overdueBorrows[0]?.bookTitle || 'Phí phạt trễ hạn mượn sách',
          fineAmount: totalUnpaidFineAmount || 10000
        })}
        readerId={user?.id || 2}
        amount={totalUnpaidFineAmount || 10000}
        onSuccess={handleVNPaySuccess}
        onPaymentSuccess={handleVNPaySuccess}
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
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '50%',
                background: '#e0f2fe',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px auto'
              }}
            >
              <CheckCircle size={28} color="#0284c7" />
            </div>
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
                className="btn btn-outline btn-modal-action"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmReturn}
                disabled={isReturning}
                className="btn btn-return btn-modal-action"
              >
                {isReturning ? 'Đang xử lý...' : 'Xác nhận trả sách'}
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