-- =====================================================================
-- SMARTLIB - HỆ THỐNG QUẢN LÝ THƯ VIỆN THÔNG MINH
-- KỊCH BẢN KHỞI TẠO CƠ SỞ DỮ LIỆU CHUẨN 3NF DÀNH CHO MYSQL 8.0 / MARIADB
-- =====================================================================

CREATE DATABASE IF NOT EXISTS smartlib_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE smartlib_db;

-- ---------------------------------------------------------------------
-- 1. BẢNG NGƯỜI DÙNG (users)
-- Quản lý tài khoản 3 tác nhân: Admin, Librarian (Thủ thư), Reader (Độc giả)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(256) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role ENUM('Admin', 'Librarian', 'Reader') NOT NULL DEFAULT 'Reader',
    email VARCHAR(100) NULL,
    phone VARCHAR(30) NULL,
    address VARCHAR(255) NULL,
    birth_date DATE NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_users_username (username),
    INDEX idx_users_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 2. BẢNG KHO SÁCH (books)
-- Lưu trữ thông tin chi tiết đầu sách, phân loại, số lượng tổng và khả dụng
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS books (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(100) NOT NULL DEFAULT 'Chưa rõ',
    category VARCHAR(100) NOT NULL DEFAULT 'Chung',
    quantity INT NOT NULL DEFAULT 1,
    available_copies INT NOT NULL DEFAULT 1,
    description TEXT NULL,
    image_url VARCHAR(500) NULL,
    status ENUM('Sẵn sàng', 'Hết sách', 'Bảo trì') NOT NULL DEFAULT 'Sẵn sàng',
    published_year INT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_books_title (title),
    INDEX idx_books_category (category),
    INDEX idx_books_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 3. BẢNG LỊCH SỬ MƯỢN TRẢ (borrow_records)
-- Ghi nhận giao dịch mượn trả, thời hạn, ngày trả thực tế và tiền phạt
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS borrow_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    book_id INT NOT NULL,
    borrow_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    due_date DATETIME NOT NULL,
    return_date DATETIME NULL,
    actual_return_date DATETIME NULL,
    borrow_type VARCHAR(50) NOT NULL DEFAULT 'Mượn về nhà',
    fine_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    overdue_days INT NOT NULL DEFAULT 0,
    status ENUM('Chờ duyệt', 'Đang mượn', 'Đã trả', 'Quá hạn', 'Từ chối') NOT NULL DEFAULT 'Chờ duyệt',
    notes VARCHAR(255) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_borrow_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_borrow_book FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
    INDEX idx_borrow_user (user_id),
    INDEX idx_borrow_book (book_id),
    INDEX idx_borrow_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 4. BẢNG HÀNG CHỜ ĐẶT TRƯỚC SÁCH (reservations)
-- Hàng chờ ưu tiên FIFO khi sách hết kho (hạn giữ chỗ 48h)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reservations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    book_id INT NOT NULL,
    reserved_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    priority INT NOT NULL DEFAULT 1,
    expires_at DATETIME NOT NULL,
    status ENUM('Waiting', 'Ready', 'Cancelled', 'Completed') NOT NULL DEFAULT 'Waiting',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_res_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_res_book FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
    INDEX idx_res_user (user_id),
    INDEX idx_res_book (book_id),
    INDEX idx_res_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 5. BẢNG QUẢN LÝ TIỀN PHẠT QUÁ HẠN (fines)
-- Lưu trữ các khoản phạt quá hạn (2.000 đ/ngày)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS fines (
    id INT AUTO_INCREMENT PRIMARY KEY,
    record_id INT NOT NULL,
    user_id INT NOT NULL,
    book_id INT NOT NULL,
    due_date DATETIME NOT NULL,
    actual_return_date DATETIME NOT NULL,
    fine_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    status ENUM('Chưa nộp', 'Đã nộp') NOT NULL DEFAULT 'Chưa nộp',
    paid_at DATETIME NULL,
    note VARCHAR(255) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_fine_record FOREIGN KEY (record_id) REFERENCES borrow_records(id) ON DELETE CASCADE,
    CONSTRAINT fk_fine_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_fine_book FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
    INDEX idx_fines_user (user_id),
    INDEX idx_fines_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 6. BẢNG THÔNG BÁO HỆ THỐNG (notifications)
-- Lưu trữ thông báo gửi cho độc giả, thủ thư và quản trị viên
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    recipient_role VARCHAR(20) NOT NULL,
    recipient_user_id INT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'general',
    is_read TINYINT(1) NOT NULL DEFAULT 0,
    meta_json JSON NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_notif_user FOREIGN KEY (recipient_user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_notif_recipient (recipient_role, recipient_user_id),
    INDEX idx_notif_is_read (is_read)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- DỮ LIỆU KHỞI TẠO MẪU (SEED DATA CHUẨN)
-- Mật khẩu mặc định: '123' (mã hóa SHA-256)
-- =====================================================================

INSERT INTO users (id, username, password_hash, full_name, role, email, phone, address, birth_date, is_active)
VALUES
(1, 'admin', 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3', 'Quản trị viên', 'Admin', 'admin@smartlib.edu.vn', '0987 654 321', 'Phòng Quản lý Thư viện, ĐHQG Hà Nội', '1990-01-01', 1),
(2, 'reader', 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3', 'Trần Thị Mai', 'Reader', 'mai.tran@smartlib.edu.vn', '0901 234 567', 'Khu KTX Sinh viên Mễ Trì, Thanh Xuân, Hà Nội', '2002-10-20', 1),
(3, 'librarian', 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3', 'Thủ thư Nguyễn Văn Hưng', 'Librarian', 'librarian@smartlib.edu.vn', '0912 888 999', 'Bộ phận Nghiệp vụ Thư viện, ĐHQG Hà Nội', '1995-05-12', 1)
ON DUPLICATE KEY UPDATE full_name=VALUES(full_name), role=VALUES(role);

