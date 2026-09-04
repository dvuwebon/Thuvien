# 🗄️ SMARTLIB — THIẾT KẾ CƠ SỞ DỮ LIỆU TOÀN DIỆN (ERD 7 BẢNG)
**Mô hình Quan hệ Logic Chuẩn hóa & Kiến trúc Ánh xạ Lưu trữ Thực thi Dual-Mode**
> Phiên bản tài liệu: 2.1 (Đồng bộ Báo cáo Kỹ thuật) | Ngày cập nhật: 04/09/2026
> 📖 **Bộ tài liệu kỹ thuật SmartLib:** [📋 Yêu cầu (SRS)](requirements.md) | [📊 Ca sử dụng & Test Cases](use_cases.md) | [🗄️ Thiết kế CSDL (ERD 7 Bảng)](database_design.md) | [🤖 Nhật ký Prompt & AI Log](ai_log.md) | [🏠 Trang chủ README](../README.md)

---

## MỤC LỤC
1. [Tổng quan Kiến trúc Dữ liệu & Sự Đồng bộ](#1-tổng-quan-kiến-trúc-dữ-liệu--sự-đồng-bộ)
2. [Sơ đồ Quan hệ Thực thể (ERD 7 Bảng Chuẩn 3NF)](#2-sơ-đồ-quan-hệ-thực-thể-erd-7-bảng-chuẩn-3nf)
3. [Đặc tả Chi tiết Cấu trúc các Bảng Dữ liệu](#3-đặc-tả-chi-tiết-cấu-trúc-các-bảng-dữ-liệu)
   - [3.1. Bảng `users` (Tài khoản hệ thống)](#31-bảng-users-tài-khoản-hệ-thống)
   - [3.2. Bảng `readers` (Hồ sơ thẻ độc giả)](#32-bảng-readers-hồ-sơ-thẻ-độc-giả)
   - [3.3. Bảng `books` (Danh mục kho sách)](#33-bảng-books-danh-mục-kho-sách)
   - [3.4. Bảng `borrow_records` (Phiếu mượn lưu thông)](#34-bảng-borrow_records-phiếu-mượn-lưu-thông)
   - [3.5. Bảng `borrow_details` (Chi tiết sách trong phiếu)](#35-bảng-borrow_details-chi-tiết-sách-trong-phiếu)
   - [3.6. Bảng `reservations` (Hàng đợi đặt trước sách)](#36-bảng-reservations-hàng-đợi-đặt-trước-sách)
   - [3.7. Bảng `fines` (Xử lý phạt quá hạn & bồi hoàn)](#37-bảng-fines-xử-lý-phạt-quá-hạn--bồi-hoàn)
   - [3.8. Bảng `notifications` (Thông báo thời gian thực)](#38-bảng-notifications-thông-báo-thời-gian-thực)
4. [Kiến trúc Ánh xạ Lưu trữ Dual-Mode (Relational vs. JSON Storage)](#4-kiến-trúc-ánh-xạ-lưu-trữ-dual-mode)
5. [Quy chuẩn Ràng buộc Toàn vẹn & Khóa ngoại](#5-quy-chuẩn-ràng-buộc-toàn-vẹn--khóa-ngoại)
6. [Tập lệnh SQL DDL Chuẩn hóa (MySQL / PostgreSQL Compatible)](#6-tập-lệnh-sql-ddl-chuẩn-hóa)

---

## 1. TỔNG QUAN KIẾN TRÚC DỮ LIỆU & SỰ ĐỒNG BỘ

Hệ thống **SmartLib v2.1** giải quyết triệt để sự khác biệt giữa mô hình phân tích lý thuyết (Chương 2 Báo cáo) và mô hình triển khai thực tế (Chương 3 Báo cáo) thông qua cơ chế **Ánh xạ Mô hình Dữ liệu Hai Tầng (Two-tier Data Architecture)**:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ TẦNG LOGIC (Logical Relational Model): 7 BẢNG CHUẨN 3NF                     │
│ Phục vụ đặc tả phân tích quan hệ, thiết kế DDL MySQL và bài toán mở rộng    │
│ [users] ── [readers] ── [books] ── [borrow_records] ── [borrow_details]     │
│                     └── [reservations] ── [fines]                           │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ Ánh xạ (Object-Document Mapping)
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ TẦNG THỰC THI VẬT LÝ (Physical Dual-Mode Engine):                           │
│ 1. Môi trường Máy chủ (Localhost / Docker):                                │
│    • Đọc/ghi cấu trúc JSON chuẩn hóa tại data/database.json qua database.py│
│    • Sẵn sàng nạp vào MySQL / PostgreSQL qua file script init.sql           │
│ 2. Môi trường Tĩnh (GitHub Pages Demo):                                     │
│    • Đồng bộ qua LocalStorage Sync Engine với phiên bản DB_VERSION         │
│    • Tự động nhúng thông tin quan hệ (denormalization) để phản hồi 0ms      │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. SƠ ĐỒ QUAN HỆ THỰC THỂ (ERD 7 BẢNG CHUẨN 3NF)

```
 ┌────────────────────────┐                   ┌────────────────────────┐
 │        USERS           │ 1               1 │        READERS         │
 │────────────────────────│───────────────────│────────────────────────│
 │ PK  id                 │                   │ PK  id                 │
 │     username (UQ)      │                   │ FK  user_id (UQ)       │
 │     password_hash      │                   │     card_number (UQ)   │
 │     role (Admin/Reader)│                   │     full_name          │
 │     created_at         │                   │     email              │
 └────────────────────────┘                   │     phone              │
                                              │     address            │
                                              │     status (Active/Lock│
                                              └───────────┬────────────┘
                                                          │ 1
 ┌────────────────────────┐                               │
 │        BOOKS           │ 1                             │
 │────────────────────────│──────────┐                    │
 │ PK  id                 │          │                    │ N
 │     title              │          │ N                  ▼
 │     author             │          │        ┌────────────────────────┐
 │     category           │          │        │     BORROW_RECORDS     │
 │     quantity           │          │        │────────────────────────│
 │     available          │          │        │ PK  id                 │
 │     location           │          │        │ FK  reader_id          │
 │     desc               │          │        │     borrow_date        │
 └───────────┬────────────┘          │        │     due_date           │
             │ 1                     │        │     return_date        │
             │                       │        │     status (Approved.. │
             │ N                     │        └───────────┬────────────┘
             ▼                       ▼                    │ 1
 ┌────────────────────────┐ ┌────────────────────────┐    │
 │      RESERVATIONS      │ │     BORROW_DETAILS     │    │
 │────────────────────────│ │────────────────────────│    │
 │ PK  id                 │ │ PK  id                 │    │ N
 │ FK  book_id            │ │ FK  borrow_id          │◄───┘
 │ FK  reader_id          │ │ FK  book_id            │
 │     reserved_at        │ │     borrow_type        │
 │     status (Waiting..) │ │     note               │
 │     priority_queue     │ └────────────────────────┘
 └────────────────────────┘                               │ 1
                                                          │
                                                          │ N
                                                          ▼
                                              ┌────────────────────────┐
                                              │         FINES          │
                                              │────────────────────────│
                                              │ PK  id                 │
                                              │ FK  borrow_id          │
                                              │     amount             │
                                              │     reason             │
                                              │     status (Paid..)    │
                                              └────────────────────────┘
```

---

## 3. ĐẶC TẢ CHI TIẾT CẤU TRÚC CÁC BẢNG DỮ LIỆU

---

### 3.1. Bảng `users` (Tài khoản hệ thống)
Lưu trữ định danh đăng nhập và thông tin xác thực an toàn.

| Tên Cột | Kiểu Dữ Liệu | Ràng Buộc | Ý Nghĩa / Ghi Chú |
| :--- | :--- | :--- | :--- |
| `id` | `INT` | PRIMARY KEY, AUTO_INCREMENT | Mã định danh người dùng duy nhất |
| `username` | `VARCHAR(50)` | NOT NULL, UNIQUE | Tên đăng nhập hệ thống (không dấu, viết thường) |
| `password` | `VARCHAR(255)` | NOT NULL | Mật khẩu xác thực (lưu trữ plaintext/hash) |
| `password_hash`| `VARCHAR(255)` | NULLABLE | Chuỗi băm mật khẩu bảo mật SHA-256 |
| `role` | `VARCHAR(20)` | NOT NULL, DEFAULT 'Reader' | Phân quyền vai trò: `'Admin'` hoặc `'Reader'` |
| `is_active` | `BOOLEAN` | DEFAULT TRUE | Trạng thái hoạt động (`true`: mở, `false`: khóa) |
| `created_at` | `TIMESTAMP` | DEFAULT CURRENT_TIMESTAMP | Thời điểm tạo tài khoản |

---

### 3.2. Bảng `readers` (Hồ sơ thẻ độc giả)
Lưu trữ thông tin cá nhân và chi tiết thẻ thư viện của bạn đọc.

| Tên Cột | Kiểu Dữ Liệu | Ràng Buộc | Ý Nghĩa / Ghi Chú |
| :--- | :--- | :--- | :--- |
| `id` | `INT` | PRIMARY KEY, AUTO_INCREMENT | Mã định danh độc giả duy nhất |
| `user_id` | `INT` | UNIQUE, FK -> `users(id)` | Khóa ngoại liên kết 1-1 với tài khoản user |
| `card_number` | `VARCHAR(20)` | NOT NULL, UNIQUE | Mã số thẻ thư viện (định dạng `DG-xxx`) |
| `full_name` | `VARCHAR(100)`| NOT NULL | Họ và tên đầy đủ của độc giả |
| `email` | `VARCHAR(100)`| NULLABLE | Địa chỉ thư điện tử nhận thông báo |
| `phone` | `VARCHAR(20)` | NULLABLE | Số điện thoại liên lạc |
| `address` | `VARCHAR(255)`| NULLABLE | Địa chỉ cư trú / Lớp học |
| `birth_date` | `DATE` | NULLABLE | Ngày tháng năm sinh |
| `expiry_date` | `DATE` | NULLABLE | Ngày hết hạn hiệu lực của thẻ thư viện |

---

### 3.3. Bảng `books` (Danh mục kho sách)
Quản lý toàn bộ danh mục tài liệu, số lượng tồn kho và thông tin mục lục.

| Tên Cột | Kiểu Dữ Liệu | Ràng Buộc | Ý Nghĩa / Ghi Chú |
| :--- | :--- | :--- | :--- |
| `id` | `INT` | PRIMARY KEY, AUTO_INCREMENT | Mã sách duy nhất |
| `title` | `VARCHAR(255)`| NOT NULL | Tựa đề cuốn sách |
| `author` | `VARCHAR(150)`| NOT NULL | Tên tác giả hoặc nhóm tác giả |
| `category` | `VARCHAR(100)`| NOT NULL | Thể loại sách (Lịch sử, Tâm lý, Công nghệ...) |
| `quantity` | `INT` | NOT NULL, CHECK (quantity >= 1) | Tổng số lượng sách thuộc đầu sách này |
| `available` | `INT` | NOT NULL, CHECK (available >= 0) | Số cuốn sẵn sàng cho mượn ($available \le quantity$) |
| `desc` | `TEXT` | NULLABLE | Tóm tắt nội dung cuốn sách |
| `image_url` | `TEXT` | NULLABLE | Đường dẫn ảnh bìa hoặc Base64 Image |
| `publisher` | `VARCHAR(150)`| NULLABLE | Nhà xuất bản |
| `year` | `INT` | NULLABLE | Năm xuất bản |
| `location` | `VARCHAR(50)` | NULLABLE | Vị trí kệ lưu trữ trong thư viện (VD: "Kệ A1-02") |

---

### 3.4. Bảng `borrow_records` (Phiếu mượn lưu thông)
Quản lý các giao dịch mượn - trả sách của độc giả.

| Tên Cột | Kiểu Dữ Liệu | Ràng Buộc | Ý Nghĩa / Ghi Chú |
| :--- | :--- | :--- | :--- |
| `id` | `INT` | PRIMARY KEY, AUTO_INCREMENT | Mã phiếu mượn duy nhất |
| `reader_id` | `INT` | NOT NULL, FK -> `readers(id)` | Khóa ngoại xác định người mượn |
| `borrow_date` | `DATETIME` | NOT NULL | Thời điểm lập phiếu mượn |
| `due_date` | `DATE` | NOT NULL | Hạn chót phải hoàn trả sách |
| `return_date` | `DATETIME` | NULLABLE | Thời điểm thực tế mang trả sách về kho |
| `status` | `VARCHAR(20)` | NOT NULL | Trạng thái: `Pending` / `Approved` / `Rejected` / `Returned` |
| `renew_count` | `INT` | DEFAULT 0 | Số lần đã xin gia hạn thời gian mượn |
| `approved_by` | `INT` | NULLABLE, FK -> `users(id)` | Thủ thư thực hiện phê duyệt phiếu |

---

### 3.5. Bảng `borrow_details` (Chi tiết sách trong phiếu)
Lưu chi tiết từng cuốn sách trong một phiếu mượn (cho phép mượn nhiều sách/phiếu).

| Tên Cột | Kiểu Dữ Liệu | Ràng Buộc | Ý Nghĩa / Ghi Chú |
| :--- | :--- | :--- | :--- |
| `id` | `INT` | PRIMARY KEY, AUTO_INCREMENT | Mã chi tiết phiếu duy nhất |
| `borrow_id` | `INT` | NOT NULL, FK -> `borrow_records(id)` | Khóa ngoại gắn với phiếu mượn cha |
| `book_id` | `INT` | NOT NULL, FK -> `books(id)` | Khóa ngoại cuốn sách được mượn |
| `borrow_type` | `VARCHAR(50)` | NOT NULL, DEFAULT 'Mượn về' | Hình thức: `'Mượn về nhà'` hoặc `'Đọc tại chỗ'` |
| `note` | `VARCHAR(255)`| NULLABLE | Ghi chú tình trạng sách lúc bàn giao |

---

### 3.6. Bảng `reservations` (Hàng đợi đặt trước sách)
Quản lý việc xếp hàng chờ ưu tiên khi cuốn sách tạm thời hết kho.

| Tên Cột | Kiểu Dữ Liệu | Ràng Buộc | Ý Nghĩa / Ghi Chú |
| :--- | :--- | :--- | :--- |
| `id` | `INT` | PRIMARY KEY, AUTO_INCREMENT | Mã bản ghi đặt trước duy nhất |
| `book_id` | `INT` | NOT NULL, FK -> `books(id)` | Khóa ngoại cuốn sách cần đặt trước |
| `reader_id` | `INT` | NOT NULL, FK -> `readers(id)` | Khóa ngoại độc giả đăng ký đặt |
| `reserved_at` | `DATETIME` | NOT NULL | Thời điểm đăng ký (dùng sắp xếp FIFO) |
| `status` | `VARCHAR(20)` | NOT NULL, DEFAULT 'Waiting' | Trạng thái: `Waiting` / `Notified` / `Fulfilled` / `Cancelled` |
| `priority` | `INT` | DEFAULT 1 | Thứ tự ưu tiên trong hàng đợi |
| `expire_at` | `DATETIME` | NULLABLE | Hạn chót 48h giữ sách sau khi được thông báo |

---

### 3.7. Bảng `fines` (Xử lý phạt quá hạn & bồi hoàn)
Lưu trữ thông tin xử phạt vi phạm quy chế mượn trả của thư viện.

| Tên Cột | Kiểu Dữ Liệu | Ràng Buộc | Ý Nghĩa / Ghi Chú |
| :--- | :--- | :--- | :--- |
| `id` | `INT` | PRIMARY KEY, AUTO_INCREMENT | Mã phiếu phạt duy nhất |
| `borrow_id` | `INT` | NOT NULL, FK -> `borrow_records(id)` | Khóa ngoại gắn với phiếu mượn vi phạm |
| `amount` | `DECIMAL(10,2)`| NOT NULL, CHECK (amount >= 0) | Số tiền phạt (VNĐ) tính theo số ngày trễ |
| `reason` | `VARCHAR(255)`| NOT NULL | Lý do phạt: *"Trả sách quá hạn X ngày"*, *"Làm rách bìa"* |
| `status` | `VARCHAR(20)` | NOT NULL, DEFAULT 'Unpaid' | Trạng thái nộp phạt: `'Unpaid'` (Chưa nộp) / `'Paid'` (Đã nộp) |
| `paid_at` | `DATETIME` | NULLABLE | Thời điểm độc giả hoàn tất nộp tiền phạt |

---

### 3.8. Bảng `notifications` (Thông báo thời gian thực)
Lưu trữ lịch sử thông điệp gửi đến người dùng khi có sự kiện nghiệp vụ.

| Tên Cột | Kiểu Dữ Liệu | Ràng Buộc | Ý Nghĩa / Ghi Chú |
| :--- | :--- | :--- | :--- |
| `id` | `INT` | PRIMARY KEY, AUTO_INCREMENT | Mã thông báo duy nhất |
| `user_id` | `INT` | NOT NULL, FK -> `users(id)` | Khóa ngoại người nhận thông báo |
| `message` | `TEXT` | NOT NULL | Nội dung hiển thị thông báo |
| `type` | `VARCHAR(50)` | NOT NULL | Phân loại: `borrow_approved`, `book_reserved_ready`, `fine_issued` |
| `is_read` | `BOOLEAN` | DEFAULT FALSE | Trạng thái đã đọc hay chưa |
| `created_at` | `DATETIME` | NOT NULL | Thời điểm gửi thông báo |

---

## 4. KIẾN TRÚC ÁNH XẠ LƯU TRỮ DUAL-MODE

Để đảm bảo hiệu năng và tính linh hoạt triển khai, hệ thống thiết kế cơ chế ánh xạ giữa 7 bảng quan hệ sang cấu trúc JSON Document tại `data/database.json`:

```json
{
  "users": [
    {
      "id": 1,
      "username": "admin",
      "password": "123",
      "passwordHash": "a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3",
      "fullName": "Quản trị viên",
      "role": "Admin",
      "email": "admin@smartlib.com",
      "phone": "0987 654 321",
      "address": "Hà Nội",
      "isActive": true
    }
  ],
  "books": [
    {
      "id": 1,
      "title": "Giáo Trình Triết Học Mác - Lênin",
      "author": "Bộ Giáo Dục và Đào Tạo",
      "category": "Lịch sử & Xã hội",
      "quantity": 8,
      "available": 7,
      "location": "Kệ A1-01",
      "desc": "Giáo trình chuẩn mực cung cấp hệ thống tri thức..."
    }
  ],
  "borrowRecords": [
    {
      "id": 1,
      "userId": 2,
      "bookId": 1,
      "borrowType": "Mượn về",
      "status": "Approved",
      "borrowedAt": "2026-09-01T10:30:00",
      "dueDate": "2026-09-15",
      "returnedAt": null,
      "userName": "Độc giả",
      "bookTitle": "Giáo Trình Triết Học Mác - Lênin"
    }
  ],
  "reservations": [
    {
      "id": 1,
      "bookId": 3,
      "userId": 2,
      "reservedAt": "2026-09-04T12:00:00",
      "status": "Waiting",
      "priority": 1,
      "userName": "Độc giả",
      "bookTitle": "Tru Tiên"
    }
  ],
  "notifications": [
    {
      "id": 1,
      "userId": 2,
      "message": "Yêu cầu mượn sách của bạn đã được duyệt!",
      "type": "borrow_approved",
      "read": false,
      "createdAt": "2026-09-01T11:00:00"
    }
  ]
}
```

---

## 5. QUY CHUẨN RÀNG BUỘC TOÀN VẸN & KHÓA NGOẠI

1. **Ràng buộc Khóa ngoại Nghiêm ngặt (ON DELETE RESTRICT):**
   - Không được phép xóa độc giả trong bảng `readers` nếu độc giả đó đang có bản ghi liên kết trong `borrow_records` với trạng thái `Approved` hoặc `Pending`.
   - Không được phép xóa đầu sách trong `books` nếu cuốn sách đó đang có phiếu mượn chưa hoàn tất hoặc có độc giả đang xếp hàng trong `reservations`.
2. **Ràng buộc Tồn kho Nhất quán (Inventory Consistency):**
   - Thuộc tính `available` tự động tính theo công thức:
     $$\text{available} = \text{quantity} - \sum (\text{đang mượn trong } borrow\_records)$$
   - Luôn thỏa mãn điều kiện $0 \le \text{available} \le \text{quantity}$.
3. **Ràng buộc Hàng đợi Đặt trước (FIFO Queue Integrity):**
   - Chỉ cho phép tạo bản ghi trong `reservations` khi cuốn sách có $\text{available} = 0$.
   - Khi có độc giả trả sách, hệ thống bắt buộc ưu tiên giữ chỗ cho người có `reserved_at` sớm nhất trong danh sách `Waiting`.

---

## 6. TẬP LỆNH SQL DDL CHUẨN HÓA (MySQL / PostgreSQL Compatible)

Quản trị viên có thể sử dụng trực tiếp tập lệnh DDL dưới đây để khởi tạo cơ sở dữ liệu quan hệ hoàn chỉnh khi chuyển đổi sang máy chủ RDBMS:

```sql
-- =====================================================
-- SMARTLIB DATABASE DDL SCHEMA (7 BẢNG CHUẨN 3NF)
-- =====================================================

CREATE DATABASE IF NOT EXISTS smartlib_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE smartlib_db;

-- 1. Bảng users
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NULL,
    role ENUM('Admin', 'Reader') NOT NULL DEFAULT 'Reader',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 2. Bảng readers
CREATE TABLE readers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    card_number VARCHAR(20) NOT NULL UNIQUE,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NULL,
    phone VARCHAR(20) NULL,
    address VARCHAR(255) NULL,
    birth_date DATE NULL,
    expiry_date DATE NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 3. Bảng books
CREATE TABLE books (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(150) NOT NULL,
    category VARCHAR(100) NOT NULL,
    quantity INT NOT NULL DEFAULT 1 CHECK (quantity >= 1),
    available INT NOT NULL DEFAULT 1 CHECK (available >= 0),
    `desc` TEXT NULL,
    image_url TEXT NULL,
    publisher VARCHAR(150) NULL,
    year INT NULL,
    location VARCHAR(50) NULL
) ENGINE=InnoDB;

-- 4. Bảng borrow_records
CREATE TABLE borrow_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    reader_id INT NOT NULL,
    borrow_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    due_date DATE NOT NULL,
    return_date DATETIME NULL,
    status ENUM('Pending', 'Approved', 'Rejected', 'Returned') NOT NULL DEFAULT 'Pending',
    renew_count INT NOT NULL DEFAULT 0,
    approved_by INT NULL,
    FOREIGN KEY (reader_id) REFERENCES readers(id) ON DELETE RESTRICT,
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 5. Bảng borrow_details
CREATE TABLE borrow_details (
    id INT AUTO_INCREMENT PRIMARY KEY,
    borrow_id INT NOT NULL,
    book_id INT NOT NULL,
    borrow_type VARCHAR(50) NOT NULL DEFAULT 'Mượn về',
    note VARCHAR(255) NULL,
    FOREIGN KEY (borrow_id) REFERENCES borrow_records(id) ON DELETE CASCADE,
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- 6. Bảng reservations (Đặt trước sách)
CREATE TABLE reservations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    book_id INT NOT NULL,
    reader_id INT NOT NULL,
    reserved_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status ENUM('Waiting', 'Notified', 'Fulfilled', 'Cancelled') NOT NULL DEFAULT 'Waiting',
    priority INT NOT NULL DEFAULT 1,
    expire_at DATETIME NULL,
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE RESTRICT,
    FOREIGN KEY (reader_id) REFERENCES readers(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 7. Bảng fines (Xử lý phạt)
CREATE TABLE fines (
    id INT AUTO_INCREMENT PRIMARY KEY,
    borrow_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL DEFAULT 0.00 CHECK (amount >= 0),
    reason VARCHAR(255) NOT NULL,
    status ENUM('Unpaid', 'Paid') NOT NULL DEFAULT 'Unpaid',
    paid_at DATETIME NULL,
    FOREIGN KEY (borrow_id) REFERENCES borrow_records(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Bảng hỗ trợ notifications
CREATE TABLE notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;
```

---

*Tài liệu Thiết kế Cơ sở Dữ liệu này thống nhất trọn vẹn giữa mô hình quan hệ chuẩn hóa 7 bảng và cấu trúc lưu trữ thực thi Dual-Mode của Dự án SmartLib v2.1.*
