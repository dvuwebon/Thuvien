# 📊 SMARTLIB — TÀI LIỆU ĐẶC TẢ CA SỬ DỤNG (Use Cases)
**Hệ thống Quản lý Thư viện Thông minh — SmartLib v2.0**
> Ngày soạn: 04/09/2026

---

## 1. TỔNG QUAN TÁC NHÂN (Actors)

| Tác nhân | Mô tả | Quyền hạn |
| :---: | :--- | :--- |
| **Admin** | Quản trị viên thư viện | Toàn quyền hệ thống |
| **Reader** | Bạn đọc đã đăng nhập | Tra cứu, mượn/trả, chat AI, cá nhân hóa |
| **Guest** | Khách chưa đăng nhập | Chỉ xem trang đăng nhập / đăng ký |
| **AI System** | Trợ lý AI (Gemini API hoặc Fallback) | Trả lời hỏi đáp về thư viện |

---

## 2. DANH SÁCH CA SỬ DỤNG

| Mã UC | Tên Use Case | Tác nhân | Phân hệ |
| :---: | :--- | :---: | :--- |
| UC01 | Đăng nhập hệ thống | Guest → Admin/Reader | Xác thực |
| UC02 | Đăng ký tài khoản | Guest | Xác thực |
| UC03 | Đăng xuất | Admin, Reader | Xác thực |
| UC04 | Xem danh sách sách | Admin, Reader | Kho sách |
| UC05 | Tìm kiếm và lọc sách | Admin, Reader | Kho sách |
| UC06 | Xem chi tiết sách | Admin, Reader | Kho sách |
| UC07 | Thêm sách mới | Admin | Kho sách |
| UC08 | Sửa thông tin sách | Admin | Kho sách |
| UC09 | Xóa sách | Admin | Kho sách |
| UC10 | Gửi yêu cầu mượn sách | Reader | Mượn trả |
| UC11 | Duyệt / Từ chối yêu cầu mượn | Admin | Mượn trả |
| UC12 | Trả sách | Reader | Mượn trả |
| UC13 | Xem lịch sử mượn trả | Admin, Reader | Mượn trả |
| UC14 | Quản lý danh sách độc giả | Admin | Độc giả |
| UC15 | Xem thống kê & xuất báo cáo | Admin | Báo cáo |
| UC16 | Cập nhật hồ sơ cá nhân | Reader | Tài khoản |
| UC17 | Hỏi đáp cùng Trợ lý AI | Admin, Reader | AI |
| UC18 | Xem thông báo hệ thống | Reader | Thông báo |

---

## 3. ĐẶC TẢ CHI TIẾT TỪNG CA SỬ DỤNG

---

### UC01 — Đăng nhập hệ thống

| Thuộc tính | Nội dung |
| :--- | :--- |
| **Tác nhân** | Guest |
| **Tiền điều kiện** | Người dùng chưa đăng nhập, đang ở trang Login |
| **Điều kiện thành công** | Người dùng được xác thực và chuyển đến Dashboard |
| **Điều kiện thất bại** | Thông tin sai, tài khoản không tồn tại |

**Luồng chính (Main Flow):**
1. Guest mở ứng dụng tại URL gốc.
2. Hệ thống tự động chuyển hướng đến `/login`.
3. Guest nhập Tên đăng nhập và Mật khẩu.
4. Hệ thống kiểm tra thông tin với CSDL (API hoặc LocalStorage).
5. Nếu đúng: Lưu thông tin phiên, chuyển đến trang tương ứng theo vai trò.
   - Admin → Trang Admin Dashboard
   - Reader → Trang Danh sách sách

**Luồng thay thế (Alternative Flow):**
- 4a. Nếu sai: Hiện thông báo lỗi màu đỏ *"Tên đăng nhập hoặc mật khẩu không chính xác!"*. Quay lại bước 3.

**Tài khoản demo:**
- Admin: `admin` / `123`
- Reader: `reader` / `123`

---

### UC02 — Đăng ký tài khoản

| Thuộc tính | Nội dung |
| :--- | :--- |
| **Tác nhân** | Guest |
| **Tiền điều kiện** | Người dùng chưa có tài khoản |
| **Điều kiện thành công** | Tài khoản mới được tạo, tự động đăng nhập |
| **Điều kiện thất bại** | Tên đăng nhập đã tồn tại, thiếu thông tin bắt buộc |

**Luồng chính:**
1. Guest bấm "Đăng ký ngay" trên trang Login.
2. Điền form: Họ tên (*), Username (*), Mật khẩu (*), Email, SĐT.
3. Hệ thống kiểm tra Username không trùng.
4. Tạo tài khoản mới với `role = Reader`.
5. Lưu vào CSDL và tự động đăng nhập.

**Luồng thay thế:**
- 3a. Username đã tồn tại → Hiện lỗi *"Tên đăng nhập đã được sử dụng"*.

---

### UC04 — Xem danh sách sách

| Thuộc tính | Nội dung |
| :--- | :--- |
| **Tác nhân** | Admin, Reader |
| **Tiền điều kiện** | Đã đăng nhập |
| **Điều kiện thành công** | Hiển thị danh sách sách phân trang |

**Luồng chính:**
1. Người dùng chọn menu "Kho sách" trên Sidebar.
2. Hệ thống load danh sách sách từ CSDL.
3. Hiển thị ở chế độ mặc định (Grid thẻ bìa sách).
4. Người dùng có thể chuyển sang chế độ Bảng (Table) bằng icon toggle.

**Các tính năng đi kèm:**
- Phân trang: mỗi trang 12 sách (Grid) hoặc 20 dòng (Table).
- Hiển thị trạng thái kho: Còn `available X cuốn` (xanh) / Hết sách (đỏ).

---

### UC05 — Tìm kiếm và lọc sách

| Thuộc tính | Nội dung |
| :--- | :--- |
| **Tác nhân** | Admin, Reader |
| **Tiền điều kiện** | Đã đăng nhập, đang ở trang Kho sách |

**Luồng chính:**
1. Người dùng gõ từ khóa vào ô tìm kiếm (hoặc nhấn phím `/` để focus nhanh).
2. Hệ thống lọc tức thì theo: Tựa sách, Tác giả, Thể loại, Mô tả.
3. Người dùng có thể kết hợp thêm bộ lọc: Thể loại, Tình trạng kho.
4. Sắp xếp theo: Tên A-Z/Z-A, Mới nhất, Đánh giá cao nhất.

---

### UC07 — Thêm sách mới

| Thuộc tính | Nội dung |
| :--- | :--- |
| **Tác nhân** | Admin |
| **Tiền điều kiện** | Đã đăng nhập với vai trò Admin |
| **Điều kiện thành công** | Sách mới xuất hiện đầu danh sách |
| **Điều kiện thất bại** | Thiếu Tựa sách hoặc Tác giả |

**Luồng chính:**
1. Admin bấm nút "Thêm sách" (chỉ hiện với Admin).
2. Điền form Modal: Tựa sách (*), Tác giả (*), Thể loại, NXB, Năm XB, Số lượng, Mô tả, URL hình bìa, Vị trí kệ.
3. Bấm Lưu.
4. Hệ thống tạo `id` tự tăng, tính `available = quantity`, lưu CSDL.
5. Toast thông báo thành công *"Đã thêm sách thành công!"*.

---

### UC09 — Xóa sách

| Thuộc tính | Nội dung |
| :--- | :--- |
| **Tác nhân** | Admin |
| **Tiền điều kiện** | Sách không đang được mượn |
| **Điều kiện thất bại** | Sách đang có phiếu mượn Approved/Pending |

**Luồng chính:**
1. Admin bấm icon Xóa trên thẻ/dòng sách.
2. Hệ thống hiện Modal xác nhận nội bộ (không dùng `confirm()`).
3. Admin bấm "Xác nhận xóa".
4. Hệ thống kiểm tra ràng buộc mượn sách.
5. Nếu OK: Xóa sách, cập nhật CSDL, toast thành công.

**Luồng thay thế:**
- 4a. Sách đang được mượn → Hiện thông báo lỗi *"Không thể xóa. Sách đang có X phiếu mượn đang hoạt động."*

---

### UC10 — Gửi yêu cầu mượn sách

| Thuộc tính | Nội dung |
| :--- | :--- |
| **Tác nhân** | Reader |
| **Tiền điều kiện** | Đã đăng nhập với vai trò Reader, sách còn trong kho (`available > 0`) |
| **Điều kiện thành công** | Phiếu mượn tạo với trạng thái `Pending`, Admin nhận thông báo |

**Luồng chính:**
1. Reader xem trang Kho sách, bấm "Mượn sách" trên sách còn hàng.
2. Modal mượn sách hiện: Tên sách (chỉ đọc), Hình thức (Mượn về/Đọc tại chỗ), Hạn trả.
3. Reader điền thông tin, bấm "Gửi yêu cầu".
4. Hệ thống tạo `BorrowRecord` với `status = Pending`, `borrowedAt = now()`.
5. Sinh thông báo cho Admin: *"[Reader Name] đã gửi yêu cầu mượn [Book Title]"*.

**Luồng thay thế:**
- 1a. Sách hết hàng (`available = 0`) → Nút "Mượn sách" bị vô hiệu hóa, hiện chữ *"Hết sách"*.

---

### UC11 — Duyệt / Từ chối yêu cầu mượn

| Thuộc tính | Nội dung |
| :--- | :--- |
| **Tác nhân** | Admin |
| **Tiền điều kiện** | Có phiếu mượn đang `Pending` |

**Luồng Duyệt:**
1. Admin vào tab "Quản lý mượn trả" hoặc xem trong NotificationDropdown.
2. Bấm nút "Duyệt" → Modal xác nhận nội bộ hiện ra.
3. Admin xác nhận → `status = Approved`, `available -= 1` trên sách, sinh thông báo cho Reader.
4. Giao diện cập nhật ngay (0ms Optimistic Update + đồng bộ qua `smartlib:data-updated`).

**Luồng Từ chối:**
1. Admin bấm "Không duyệt" → Modal xác nhận hiện ra.
2. Admin xác nhận → `status = Rejected`, sinh thông báo lý do cho Reader.

---

### UC12 — Trả sách

| Thuộc tính | Nội dung |
| :--- | :--- |
| **Tác nhân** | Reader |
| **Tiền điều kiện** | Reader có phiếu mượn trạng thái `Approved` |

**Luồng chính:**
1. Reader vào "Lịch sử mượn trả" của mình.
2. Bấm "Trả sách" trên phiếu đang mượn.
3. Hệ thống cập nhật ngay: `status = Returned`, `returnedAt = now()`.
4. Giao diện Reader cập nhật 0ms.
5. Kho sách: `available += 1` sau khi Admin "Nhận sách".

---

### UC15 — Xem thống kê & xuất báo cáo

| Thuộc tính | Nội dung |
| :--- | :--- |
| **Tác nhân** | Admin |

**Luồng chính:**
1. Admin vào tab "Thống kê / Báo cáo".
2. Xem Dashboard: 4 KPI cards, biểu đồ thể loại mượn sách.
3. Bấm "Xuất báo cáo":
   - Excel kho sách → `books_report.xlsx`
   - Excel lịch sử mượn → `borrow_history.xlsx`
   - CSV độc giả → `readers.csv`
   - PDF phiếu mượn → `receipt_[id].pdf` (có QR Code)

---

### UC17 — Hỏi đáp cùng Trợ lý AI

| Thuộc tính | Nội dung |
| :--- | :--- |
| **Tác nhân** | Admin, Reader |

**Luồng chính:**
1. Bấm nút AI tròn nổi góc phải màn hình.
2. Khung chat trượt lên, hiện lịch sử (nếu có).
3. Người dùng gõ câu hỏi, bấm Gửi hoặc Enter.
4. Hiệu ứng 3 dấu chấm nhảy trong 5 giây.
5. AI phản hồi dạng Markdown trong bong bóng chat.

**Luồng thay thế:**
- 4a. API Key chưa cấu hình → AI fallback dùng tri thức nội bộ (không cần internet).

---

## 4. SƠ ĐỒ QUAN HỆ ACTOR - USE CASE

```
                    ┌─────────────────────────────────────────┐
                    │         HỆ THỐNG SMARTLIB               │
                    │                                          │
         ┌──────┐   │  ○ UC01 Đăng nhập                        │
         │Guest │───┤  ○ UC02 Đăng ký                          │
         └──────┘   │                                          │
                    │  ○ UC04 Xem danh sách sách               │
         ┌────────┐  │  ○ UC05 Tìm kiếm & lọc sách             │
         │Reader  │──┤  ○ UC06 Xem chi tiết sách               │
         └────────┘  │  ○ UC10 Gửi yêu cầu mượn               │
                    │  ○ UC12 Trả sách                         │
                    │  ○ UC13 Xem lịch sử (của mình)           │
                    │  ○ UC16 Cập nhật hồ sơ                   │
                    │  ○ UC17 Hỏi đáp AI                       │
                    │  ○ UC18 Xem thông báo                    │
                    │                                          │
         ┌───────┐  │  ○ UC07 Thêm sách                        │
         │Admin  │──┤  ○ UC08 Sửa sách                         │
         └───────┘  │  ○ UC09 Xóa sách                         │
                    │  ○ UC11 Duyệt/Từ chối mượn               │
                    │  ○ UC13 Xem toàn bộ lịch sử              │
                    │  ○ UC14 Quản lý độc giả (CRUD)           │
                    │  ○ UC15 Thống kê & xuất báo cáo          │
                    └─────────────────────────────────────────┘
```

---

*Tài liệu Use Cases này phản ánh chính xác các chức năng đã được xây dựng và kiểm thử trong hệ thống SmartLib v2.0.*

