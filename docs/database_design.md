# 🗄️ SMARTLIB — THIẾT KẾ CƠ SỞ DỮ LIỆU
**Hệ thống Quản lý Thư viện Thông minh — SmartLib v2.0**
> Ngày soạn: 04/09/2026 | Định dạng CSDL: JSON File (NoSQL-style)

---

## 1. TỔNG QUAN KIẾN TRÚC DỮ LIỆU

### 1.1. Loại CSDL
SmartLib sử dụng **CSDL dạng file JSON** (`data/database.json`) làm lớp lưu trữ chính cho môi trường Localhost và Docker. Trên GitHub Pages, dữ liệu được đồng bộ qua **LocalStorage** của trình duyệt.

### 1.2. Vị trí file CSDL
```
d:\py-thuvien\
└── data\
    └── database.json   # File CSDL chính (JSON)
```

### 1.3. Lý do chọn JSON File thay vì SQL Database
| Tiêu chí | JSON File | SQLite/PostgreSQL |
| :--- | :--- | :--- |
| Cài đặt | Không cần cài đặt | Cần cài đặt driver |
| Tương thích GitHub Pages | Hoàn toàn (qua LocalStorage) | Không thể |
| Phù hợp dự án học tập | Cao | Trung bình |
| Hiệu năng (dữ liệu nhỏ) | Tốt | Tốt hơn |

---

## 2. SƠ ĐỒ QUAN HỆ THỰC THỂ (ERD)

```
┌────────────────────────────────────────────────────────────┐
│                    DATABASE.JSON                           │
│                                                            │
│  ┌──────────────┐           ┌──────────────────────────┐   │
│  │   USERS      │           │     BORROW_RECORDS       │   │
│  │─────────────-│1        N │─────────────────────────-│   │
│  │ id (PK)      │──────────►│ id (PK)                  │   │
│  │ username     │           │ userId (FK → users)      │   │
│  │ password     │           │ bookId (FK → books)      │   │
│  │ passwordHash │           │ status                   │   │
│  │ fullName     │           │ borrowType               │   │
│  │ role         │           │ borrowedAt               │   │
│  │ email        │           │ dueDate                  │   │
│  │ phone        │           │ returnedAt               │   │
│  │ address      │           │ userName                 │   │
│  │ birthDate    │           │ bookTitle                │   │
│  │ isActive     │           └──────────┬───────────────┘   │
│  └──────────────┘                      │N                  │
│                                        │                   │
│  ┌──────────────┐                      │                   │
│  │    BOOKS     │1                     │                   │
│  │─────────────-│◄─────────────────────┘                   │
│  │ id (PK)      │                                          │
│  │ title        │           ┌──────────────────────────┐   │
│  │ author       │           │     NOTIFICATIONS        │   │
│  │ category     │           │─────────────────────────-│   │
│  │ quantity     │           │ id (PK)                  │   │
│  │ desc         │           │ userId (FK → users)      │   │
│  │ imageUrl     │           │ message                  │   │
│  │ borrowed     │           │ type                     │   │
│  │ available    │           │ read                     │   │
│  │ publisher    │           │ createdAt                │   │
│  │ year         │           │ bookId (FK → books)      │   │
│  │ location     │           └──────────────────────────┘   │
│  └──────────────┘                                          │
└────────────────────────────────────────────────────────────┘
```

---

## 3. ĐẶC TẢ CHI TIẾT CÁC BẢNG

---

### 3.1. Bảng `users` — Người dùng hệ thống

**Mô tả:** Lưu thông tin tài khoản của tất cả người dùng: Quản trị viên và Độc giả.

| Tên trường | Kiểu dữ liệu | Ràng buộc | Mô tả |
| :--- | :--- | :--- | :--- |
| `id` | `integer` | PRIMARY KEY, AUTO INCREMENT | Mã định danh duy nhất |
| `username` | `string` | NOT NULL, UNIQUE | Tên đăng nhập, không trùng lặp |
| `password` | `string` | NOT NULL | Mật khẩu dạng plaintext (dùng để login) |
| `passwordHash` | `string` | NULLABLE | Mật khẩu băm SHA256 |
| `fullName` | `string` | NOT NULL | Họ và tên đầy đủ |
| `role` | `string (enum)` | NOT NULL, DEFAULT "Reader" | Vai trò: `"Admin"` hoặc `"Reader"` |
| `email` | `string` | NULLABLE | Địa chỉ email |
| `phone` | `string` | NULLABLE | Số điện thoại liên hệ |
| `address` | `string` | NULLABLE | Địa chỉ nơi ở |
| `birthDate` | `string (ISO date)` | NULLABLE | Ngày sinh, format `YYYY-MM-DD` |
| `isActive` | `boolean` | DEFAULT `true` | Tài khoản đang hoạt động hay bị khóa |

**Dữ liệu mẫu:**
```json
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
  "birthDate": "1990-01-01",
  "isActive": true
}
```

**Chú thích:**
- `role = "Admin"`: Toàn quyền hệ thống.
- `role = "Reader"`: Chỉ truy cập các chức năng bạn đọc.
- Mã độc giả hiển thị dạng `DG-{id}` (VD: `DG-001`, `DG-002`).

---

### 3.2. Bảng `books` — Kho sách thư viện

**Mô tả:** Lưu toàn bộ thông tin danh mục sách trong hệ thống.

| Tên trường | Kiểu dữ liệu | Ràng buộc | Mô tả |
| :--- | :--- | :--- | :--- |
| `id` | `integer` | PRIMARY KEY, AUTO INCREMENT | Mã sách duy nhất |
| `title` | `string` | NOT NULL | Tựa sách |
| `author` | `string` | NOT NULL | Tác giả |
| `category` | `string` | NOT NULL | Thể loại sách |
| `quantity` | `integer` | NOT NULL, >= 1 | Tổng số lượng sách trong kho |
| `desc` | `string` | NULLABLE | Tóm tắt/mô tả nội dung sách |
| `imageUrl` | `string (Base64 / URL)` | NULLABLE | Hình ảnh bìa sách (Base64 data URL hoặc HTTP URL) |
| `borrowed` | `integer` | DEFAULT 0 | Số cuốn đang được mượn (sẽ bỏ dần) |
| `available` | `integer` | COMPUTED | Số cuốn còn có thể mượn = `quantity - borrowed` |
| `publisher` | `string` | NULLABLE | Nhà xuất bản |
| `year` | `integer` | NULLABLE | Năm xuất bản |
| `location` | `string` | NULLABLE | Vị trí kệ trong thư viện (VD: "Kệ A1") |
| `rating` | `number` | NULLABLE, 1-5 | Điểm đánh giá trung bình |
| `reviews` | `integer` | DEFAULT 0 | Số lượt đánh giá |

**Dữ liệu mẫu:**
```json
{
  "id": 1,
  "title": "Giáo Trình Triết Học Mác - Lênin",
  "author": "Bộ Giáo Dục và Đào Tạo",
  "category": "Lịch sử & Xã hội",
  "quantity": 8,
  "borrowed": 0,
  "available": 8,
  "desc": "Giáo trình chuẩn mực cung cấp hệ thống tri thức...",
  "imageUrl": "data:image/jpeg;base64,...",
  "publisher": "NXB Giáo dục Việt Nam",
  "year": 2023,
  "location": "Kệ A1"
}
```

**Các thể loại sách hiện có trong hệ thống:**
- Lịch sử & Xã hội
- Tâm lý & Kỹ năng sống
- Văn học & Tiểu thuyết
- Khoa học & Công nghệ
- Kinh tế & Kinh doanh
- Giáo trình & Học thuật

---

### 3.3. Bảng `borrowRecords` — Phiếu mượn sách

**Mô tả:** Ghi nhận lịch sử toàn bộ các phiếu mượn sách từ tạo đến trả.

| Tên trường | Kiểu dữ liệu | Ràng buộc | Mô tả |
| :--- | :--- | :--- | :--- |
| `id` | `integer` | PRIMARY KEY, AUTO INCREMENT | Mã phiếu mượn duy nhất |
| `userId` | `integer` | FOREIGN KEY → `users.id` | Mã người mượn |
| `bookId` | `integer` | FOREIGN KEY → `books.id` | Mã sách được mượn |
| `status` | `string (enum)` | NOT NULL | Trạng thái: `Pending` / `Approved` / `Rejected` / `Returned` |
| `borrowType` | `string (enum)` | NOT NULL | Hình thức: `Mượn về` / `Đọc tại chỗ` |
| `borrowedAt` | `string (ISO datetime)` | NOT NULL | Ngày giờ tạo phiếu mượn |
| `dueDate` | `string (ISO date)` | NULLABLE | Ngày hạn trả do độc giả đề xuất |
| `returnedAt` | `string (ISO datetime)` | NULLABLE | Ngày giờ thực tế trả sách |
| `userName` | `string` | DENORMALIZED | Tên người mượn (cache để hiển thị nhanh) |
| `bookTitle` | `string` | DENORMALIZED | Tên sách (cache để hiển thị nhanh) |
| `note` | `string` | NULLABLE | Ghi chú thêm |

**Dữ liệu mẫu:**
```json
{
  "id": 1,
  "userId": 2,
  "bookId": 1,
  "status": "Approved",
  "borrowType": "Mượn về",
  "borrowedAt": "2026-09-01T10:30:00",
  "dueDate": "2026-09-15",
  "returnedAt": null,
  "userName": "Độc giả",
  "bookTitle": "Giáo Trình Triết Học Mác - Lênin"
}
```

**Vòng đời trạng thái phiếu mượn:**
```
Tạo phiếu       Admin duyệt    Bạn đọc trả
   │                │               │
   ▼                ▼               ▼
[Pending] ──► [Approved] ──────► [Returned]
   │
   └──────► [Rejected]   (Admin từ chối)
```

---

### 3.4. Bảng `notifications` — Thông báo hệ thống

**Mô tả:** Lưu các thông báo hệ thống được gửi cho người dùng khi có sự kiện quan trọng.

| Tên trường | Kiểu dữ liệu | Ràng buộc | Mô tả |
| :--- | :--- | :--- | :--- |
| `id` | `integer` | PRIMARY KEY, AUTO INCREMENT | Mã thông báo duy nhất |
| `userId` | `integer` | FOREIGN KEY → `users.id` | Người nhận thông báo |
| `message` | `string` | NOT NULL | Nội dung thông báo |
| `type` | `string (enum)` | NOT NULL | Loại: `borrow_approved` / `borrow_rejected` / `borrow_request` / `system` |
| `read` | `boolean` | DEFAULT `false` | Đã đọc hay chưa |
| `createdAt` | `string (ISO datetime)` | NOT NULL | Thời điểm tạo thông báo |
| `bookId` | `integer` | NULLABLE | Mã sách liên quan |
| `borrowId` | `integer` | NULLABLE | Mã phiếu mượn liên quan |

**Dữ liệu mẫu:**
```json
{
  "id": 1,
  "userId": 2,
  "message": "Yêu cầu mượn sách 'Giáo Trình Triết Học Mác - Lênin' của bạn đã được DUYỆT!",
  "type": "borrow_approved",
  "read": false,
  "createdAt": "2026-09-01T11:00:00",
  "bookId": 1,
  "borrowId": 1
}
```

---

## 4. CÁC CHỈ SỐ (Index) VÀ TỐI ƯU TRUY VẤN

Vì CSDL là JSON File, việc "index" được thực hiện thông qua bộ nhớ cache và cách tổ chức dữ liệu:

| Trường cần tối ưu | Cách thực hiện |
| :--- | :--- |
| `users.username` | Tìm kiếm bằng `Array.find()` - O(n), đủ nhanh cho dữ liệu nhỏ |
| `borrowRecords.userId` | Filter bằng `Array.filter()` khi xem lịch sử cá nhân |
| `borrowRecords.status` | Filter bằng `Array.filter()` để lấy phiếu đang hoạt động |
| `books.category` | Filter bằng `Set` để lấy danh sách thể loại unique |

---

## 5. CƠ CHẾ ĐỒNG BỘ DỮ LIỆU (Dual-Mode Persistence)

Đây là kiến trúc đặc biệt nhất của SmartLib, cho phép hoạt động trên cả Localhost lẫn GitHub Pages:

```javascript
// frontend/src/services/api.js (dòng 1-55)
const IS_GITHUB_PAGES = window.location.hostname.includes('github.io');

if (IS_GITHUB_PAGES) {
  // LocalStorage mode
  const DB_VERSION = 'v5_clean_sync_2026';
  // Đọc/ghi localStorage thay vì gọi API
} else {
  // FastAPI REST API mode  
  // Gọi http://localhost:3000/api/...
}

// Sự kiện đồng bộ giữa các tab
window.dispatchEvent(new Event('smartlib:data-updated'));
```

**Điểm mạnh:**
- 0ms phản hồi UI trên GitHub Pages (Optimistic Update).
- Không cần internet để tra cứu sách đã cache.
- Đồng bộ ngay lập tức giữa các tab trình duyệt cùng origin.

---

## 6. CẤU TRÚC FILE CSDL ĐẦY ĐỦ

```json
{
  "users": [ ...mảng tài khoản người dùng... ],
  "books": [ ...mảng danh mục sách... ],
  "borrowRecords": [ ...mảng phiếu mượn... ],
  "notifications": [ ...mảng thông báo hệ thống... ]
}
```

---

*Tài liệu thiết kế CSDL này phản ánh chính xác schema hiện tại của SmartLib v2.0 tại file `data/database.json`.*
