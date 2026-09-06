// SmartLib File Generation & Export Helpers
import QRCode from 'qrcode';

export const exportApi = {
  downloadBooksExcel: () => {
    if (window.location.hostname.includes('github.io')) {
      try {
        const db = JSON.parse(localStorage.getItem('smartlib_db_v6') || '{}');
        const books = db.books || [];
        let csv = '\ufeffMã Sách,Tiêu Đề,Tác Giả,Thể Loại,Tổng Số Lượng,Đang Mượn,Khả Dụng\n';
        books.forEach(b => {
          const qty = Number(b.quantity) || 1;
          const borrowed = Number(b.borrowed) || 0;
          const avail = Math.max(0, qty - borrowed);
          csv += `"${b.id}","${b.title}","${b.author || ''}","${b.category || ''}","${qty}","${borrowed}","${avail}"\n`;
        });
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'Kho_Sach_SmartLib.csv';
        a.click();
        URL.revokeObjectURL(url);
        return;
      } catch (e) {
        console.error(e);
      }
    }
    window.open('/api/export/books/excel', '_blank');
  },

  downloadBorrowsExcel: () => {
    if (window.location.hostname.includes('github.io')) {
      try {
        const db = JSON.parse(localStorage.getItem('smartlib_db_v6') || '{}');
        const borrows = db.borrow_records || [];
        let csv = '\ufeffMã Phiếu,Tên Sách,Độc Giả,Ngày Mượn,Hạn Trả,Hình Thức,Trạng Thái\n';
        borrows.forEach(r => {
          csv += `"${r.id}","${r.bookTitle}","${r.readerName}","${r.borrowDate || ''}","${r.returnDate || ''}","${r.borrowType || ''}","${r.status || ''}"\n`;
        });
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'Lich_Su_Muon_Tra_SmartLib.csv';
        a.click();
        URL.revokeObjectURL(url);
        return;
      } catch (e) {
        console.error(e);
      }
    }
    window.open('/api/export/borrows/excel', '_blank');
  },

  downloadReadersCsv: () => {
    if (window.location.hostname.includes('github.io')) {
      try {
        const db = JSON.parse(localStorage.getItem('smartlib_db_v6') || '{}');
        const readers = db.readers || [];
        let csv = '\ufeffID,Họ và tên,Tên đăng nhập,Email,Số điện thoại,Địa chỉ\n';
        readers.forEach(r => {
          csv += `"${r.id}","${r.fullName || ''}","${r.username || ''}","${r.email || ''}","${r.phone || ''}","${r.address || ''}"\n`;
        });
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'Danh_Sach_Doc_Gia_SmartLib.csv';
        a.click();
        URL.revokeObjectURL(url);
        return;
      } catch (e) {
        console.error(e);
      }
    }
    window.open('/api/export/readers/csv', '_blank');
  },

  downloadBorrowReceiptPdf: (recordId) => {
    window.open(`/api/export/receipt/${recordId}/pdf`, '_blank');
  },

  downloadBackupJson: () => {
    if (window.location.hostname.includes('github.io')) {
      const db = localStorage.getItem('smartlib_db_v6');
      if (db) {
        const blob = new Blob([db], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'SmartLib_Database_Backup.json';
        a.click();
        URL.revokeObjectURL(url);
        return;
      }
    }
    window.open('/api/export/backup/json', '_blank');
  },

  getBookQrUrl: (bookId) => {
    return `/api/export/qr/book/${bookId}`;
  },

  getBookQrDataUrl: async (book) => {
    const text = `SMARTLIB-BOOK-ID:${book.id}|${book.title}|Tác giả:${book.author || 'Chưa rõ'}|Thể loại:${book.category || 'Khác'}`;
    return await QRCode.toDataURL(text, {
      width: 220,
      margin: 1,
      color: { dark: '#1e40af', light: '#ffffff' }
    });
  }
};