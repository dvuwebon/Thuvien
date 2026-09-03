// SmartLib File Generation & Export Helpers

export const exportApi = {
  downloadBooksExcel: () => {
    window.open('/api/export/books/excel', '_blank');
  },

  downloadBorrowsExcel: () => {
    window.open('/api/export/borrows/excel', '_blank');
  },

  downloadReadersCsv: () => {
    window.open('/api/export/readers/csv', '_blank');
  },

  downloadBorrowReceiptPdf: (recordId) => {
    window.open(`/api/export/receipt/${recordId}/pdf`, '_blank');
  },

  downloadBackupJson: () => {
    window.open('/api/export/backup/json', '_blank');
  },

  getBookQrUrl: (bookId) => {
    return `/api/export/qr/book/${bookId}`;
  }
};