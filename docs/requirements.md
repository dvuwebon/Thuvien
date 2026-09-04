# 📋 SMARTLIB — ĐẶC TẢ YÊU CẦU PHẦN MỀM (SRS)
**Hệ thống Quản lý Thư viện Thông minh Tích hợp Trợ lý AI**
> Phiên bản tài liệu: 2.0 | Ngày cập nhật: 04/09/2026

---

## MỤC LỤC
1. [Giới thiệu tổng quan](#1-giới-thiệu-tổng-quan)
2. [Yêu cầu chức năng (Functional Requirements)](#2-yêu-cầu-chức-năng)
3. [Yêu cầu phi chức năng (Non-Functional Requirements)](#3-yêu-cầu-phi-chức-năng)
4. [Ràng buộc hệ thống](#4-ràng-buộc-hệ-thống)
5. [Môi trường hoạt động và Triển khai](#5-môi-trường-hoạt-động-và-triển-khai)

---

## 1. GIỚI THIỆU TỔNG QUAN

### 1.1. Mục tiêu hệ thống
SmartLib là hệ thống quản lý thư viện trực tuyến toàn diện phục vụ hai đối tượng người dùng chính:
- **Quản trị viên (Admin):** Quản lý toàn bộ hoạt động kho sách, duyệt phiếu mượn, theo dõi thống kê.
- **Độc giả (Reader):** Tra cứu, đặt mượn sách, xem lịch sử cá nhân, hỏi đáp cùng Trợ lý AI.

### 1.2. Phạm vi dự án
- Xây dựng hệ thống web SPA (Single Page Application) dùng **React.js 18** và **Python FastAPI**.
- Hỗ trợ triển khai trên cả **máy chủ cục bộ (Localhost)** và **máy chủ tĩnh (GitHub Pages)**.
- Tích hợp Trợ lý Trí tuệ Nhân tạo (AI) sử dụng **Google Gemini API**.

### 1.3. Các bên liên quan (Stakeholders)
| Đối tượng | Vai trò |
| :--- | :--- |
| Sinh viên phát triển | Thiết kế, lập trình, kiểm thử, triển khai toàn bộ hệ thống |
| Quản trị viên thư viện | Sử dụng hệ thống để quản lý sách và bạn đọc |
| Độc giả (Bạn đọc) | Sử dụng hệ thống để tra cứu và mượn sách |

---

## 2. YÊU CẦU CHỨC NĂNG

### 2.1. Phân hệ Xác thực & Quản lý Tài khoản

| Mã YC | Tên chức năng | Mô tả chi tiết | Vai trò |
| :---: | :--- | :--- | :--- |
| **F01** | Đăng nhập hệ thống | Người dùng nhập Tên đăng nhập và Mật khẩu để xác thực. Hệ thống trả về thông tin phiên đăng nhập và phân quyền theo vai trò. | Admin, Reader |
| **F02** | Đăng ký tài khoản mới | Bạn đọc tự điền thông tin (Họ tên, Username, Mật khẩu, Email, SĐT) để tạo tài khoản Reader mới. Hệ thống kiểm tra trùng lặp username và lưu bền vững vào CSDL. | Reader (mới) |
| **F03** | Đăng xuất | Xóa phiên đăng nhập khỏi bộ nhớ cục bộ, chuyển hướng về màn hình đăng nhập. | Admin, Reader |
| **F04** | Cập nhật hồ sơ cá nhân | Bạn đọc cập nhật Họ tên, Email, SĐT, Địa chỉ, Ngày sinh của bản thân. | Reader |
| **F05** | Đổi mật khẩu an toàn | Xác thực mật khẩu hiện tại trước khi chấp nhận mật khẩu mới. | Admin, Reader |
| **F06** | Bảo vệ tuyến đường | Mọi đường dẫn hệ thống đều yêu cầu trạng thái đăng nhập. Người dùng chưa đăng nhập bị tự động chuyển hướng về trang Login. | Hệ thống |

### 2.2. Phân hệ Quản lý Sách (CRUD)

| Mã YC | Tên chức năng | Mô tả chi tiết | Vai trò |
| :---: | :--- | :--- | :--- |
| **F07** | Xem danh sách sách | Hiển thị danh sách sách ở hai chế độ: Lưới thẻ bìa sách (Grid) và Bảng chi tiết (Table). Phân trang tự động. | Admin, Reader |
| **F08** | Xem chi tiết sách | Mở Modal hiển thị đầy đủ: Tựa sách, Tác giả, Thể loại, Năm XB, NXB, Số lượng kho, Tóm tắt nội dung, Hình bìa, Vị trí kệ. | Admin, Reader |
| **F09** | Thêm sách mới | Admin nhập đầy đủ thông tin và lưu sách mới. Số lượng `available` mặc định bằng `quantity`. | Admin |
| **F10** | Sửa thông tin sách | Admin cập nhật bất kỳ trường nào. Hệ thống tự tính lại `available = quantity - số đang mượn`. | Admin |
| **F11** | Xóa sách | Hiển thị Modal xác nhận nội bộ. Không dùng hộp thoại trình duyệt. Chặn xóa nếu đang có sách được mượn. | Admin |
| **F12** | Tìm kiếm sách | Tìm kiếm theo Tựa sách, Tác giả, Thể loại, Mã sách. Kết quả cập nhật tức thì khi gõ (Live Search). Kích hoạt nhanh bằng phím `/`. | Admin, Reader |
| **F13** | Lọc và sắp xếp sách | Lọc theo thể loại, tình trạng kho (Còn/Hết); sắp xếp theo Tên A-Z, Ngày tạo mới nhất, Lượt đánh giá. | Admin, Reader |

### 2.3. Phân hệ Nghiệp vụ Mượn - Trả Sách

| Mã YC | Tên chức năng | Mô tả chi tiết | Vai trò |
| :---: | :--- | :--- | :--- |
| **F14** | Gửi yêu cầu mượn sách | Bạn đọc chọn sách → mở Modal mượn sách, chọn hình thức (Mượn về/Đọc tại chỗ) và hạn trả mong muốn. Phiếu được tạo với trạng thái `Pending`. | Reader |
| **F15** | Chặn mượn sách hết | Nút "Mượn sách" tự động chuyển trạng thái `disabled` khi sách có `available ≤ 0`. | Hệ thống |
| **F16** | Duyệt yêu cầu mượn | Admin bấm Duyệt → phiếu thành `Approved`, kho tự giảm `available -= 1`, sinh thông báo cho bạn đọc. | Admin |
| **F17** | Từ chối yêu cầu mượn | Admin bấm Từ chối → phiếu thành `Rejected`, sinh thông báo lý do cho bạn đọc. | Admin |
| **F18** | Trả sách | Bạn đọc bấm Trả sách → phiếu thành `Returned`, giao diện cập nhật ngay lập tức (0ms). | Reader |
| **F19** | Nhận lại sách về kho | Admin xác nhận nhận sách → kho tăng `available += 1`. | Admin |
| **F20** | Xem lịch sử mượn trả | Admin xem toàn bộ; Bạn đọc chỉ xem phiếu của mình. Lọc theo trạng thái: Tất cả / Chờ duyệt / Đang mượn / Đã trả. | Admin, Reader |

### 2.4. Phân hệ Quản lý Độc giả

| Mã YC | Tên chức năng | Mô tả chi tiết | Vai trò |
| :---: | :--- | :--- | :--- |
| **F21** | Xem danh sách độc giả | Bảng hiển thị: Mã độc giả (dạng `DG-xxx`), Họ tên, Email, SĐT, Địa chỉ, Ngày sinh. | Admin |
| **F22** | Thêm độc giả mới | Admin thêm tài khoản bạn đọc mới, hệ thống tự cấp phát `id` tuần tự. | Admin |
| **F23** | Sửa thông tin độc giả | Admin cập nhật toàn bộ hồ sơ bạn đọc bất kỳ. | Admin |
| **F24** | Xóa độc giả | Kiểm tra ràng buộc: chặn xóa nếu bạn đọc đang có sách mượn hoặc phiếu chờ duyệt. Hiển thị lỗi cụ thể số sách đang mượn. | Admin |

### 2.5. Phân hệ Thống kê & Báo cáo

| Mã YC | Tên chức năng | Mô tả chi tiết | Vai trò |
| :---: | :--- | :--- | :--- |
| **F25** | Dashboard KPI thời gian thực | 4 thẻ chỉ số: Tổng sách, Đang mượn, Tổng độc giả, Chờ duyệt. Cập nhật khi có thay đổi dữ liệu. | Admin |
| **F26** | Biểu đồ thống kê | Biểu đồ SVG tương tác: lượt mượn sách theo từng thể loại trong tháng. | Admin |
| **F27** | Xuất báo cáo Excel | File `.xlsx` chuẩn OpenXML: Danh sách kho sách hoặc Lịch sử mượn trả toàn bộ, có màu tiêu đề, căn lề. | Admin |
| **F28** | Xuất phiếu mượn PDF | Phiếu mượn sách chính thức tích hợp mã QR chứa thông tin định danh phiếu để tra cứu. | Admin |
| **F29** | Xuất danh sách độc giả CSV | File `.csv` mã hóa UTF-8 BOM, tương thích hoàn hảo với Microsoft Excel không lỗi font tiếng Việt. | Admin |

### 2.6. Phân hệ Trợ lý AI

| Mã YC | Tên chức năng | Mô tả chi tiết | Vai trò |
| :---: | :--- | :--- | :--- |
| **F30** | Widget AI hỏi đáp | Nút tròn nổi góc phải màn hình, bấm mở/đóng khung chat với Thủ thư AI. | Admin, Reader |
| **F31** | Dòng gợi ý tự động | Dòng chữ *"Bạn cần tôi giúp đỡ gì không? ✨"* tự động hiện 7 giây đầu, tự ẩn, tự hiện lại khi hover. | Admin, Reader |
| **F32** | Giao tiếp AI | Độc giả gửi câu hỏi, AI phản hồi sau 5 giây với hoạt họa 3 dấu chấm chuyển giai đoạn tự nhiên. | Admin, Reader |
| **F33** | Cấu hình API Key | Nút bánh răng trong tiêu đề chat mở Modal cấu hình Gemini API Key. | Admin, Reader |
| **F34** | Smart Fallback AI | Khi không có API Key hoặc mất mạng, AI tự động dùng bộ tri thức nội bộ thư viện để trả lời. | Hệ thống |
| **F35** | Thông báo hệ thống | Hộp thư thông báo realtime cho bạn đọc khi phiếu mượn được duyệt/từ chối. | Admin, Reader |

---

## 3. YÊU CẦU PHI CHỨC NĂNG

### 3.1. Hiệu năng
- Thao tác CRUD phản hồi giao diện trong vòng **< 500ms** (Optimistic UI Update 0ms).
- Tìm kiếm live search cập nhật trong **< 100ms** sau mỗi ký tự gõ.

### 3.2. Độ tin cậy & Tính sẵn sàng
- Ứng dụng **không bao giờ crash hoàn toàn**; mọi lỗi được bắt bởi `try/catch` và hiển thị thông báo lỗi thân thiện.
- Tích hợp cơ chế **Smart Fallback** đảm bảo AI vẫn trả lời được khi mất kết nối.

### 3.3. Tính bảo mật
- Mật khẩu lưu trữ dạng băm (`SHA256 hash`), không lưu plaintext trong CSDL chính thức.
- Kiểm tra phân quyền ở cả hai tầng: Frontend (ẩn/hiện nút) và Backend (bảo vệ endpoint API).

### 3.4. Tính tương thích
- Hỗ trợ đầy đủ trên trình duyệt: **Chrome 120+, Firefox 120+, Edge 120+, Safari 17+**.
- Hoạt động hoàn hảo trên cả máy chủ cục bộ FastAPI lẫn máy chủ tĩnh GitHub Pages.

### 3.5. Thiết kế giao diện (UX)
- Không sử dụng bất kỳ hộp thoại thô sơ nào của trình duyệt (`alert()`, `confirm()`, `prompt()`).
- Thay thế 100% bằng Custom Dialog Modal với nút xác nhận và hiệu ứng làm mờ nền.
- Toast Notification tự động ẩn sau 3.5 giây.

---

## 4. RÀNG BUỘC HỆ THỐNG

### 4.1. Ràng buộc toàn vẹn dữ liệu
- Không cho phép xóa sách khi sách đang có phiếu mượn trạng thái `Approved` hoặc `Pending`.
- Không cho phép xóa tài khoản độc giả khi đang có sách mượn chưa trả.
- Số lượng sách `quantity` phải là số nguyên dương >= 1.

### 4.2. Ràng buộc đầu vào
- Tên đăng nhập không được trùng lặp trong hệ thống.
- Tên sách và Tác giả là các trường bắt buộc khi thêm/sửa sách.
- Họ tên và Tên đăng nhập là các trường bắt buộc khi đăng ký tài khoản.

---

## 5. MÔI TRƯỜNG HOẠT ĐỘNG VÀ TRIỂN KHAI

| Chế độ | Công nghệ | Đặc điểm |
| :--- | :--- | :--- |
| **Localhost (Fullstack)** | Python FastAPI + React.js | Đọc/ghi trực tiếp `data/database.json`. Hỗ trợ toàn bộ tính năng xuất file. |
| **GitHub Pages (Static)** | React.js + LocalStorage | Tự động kích hoạt LocalStorage Sync Engine. Không cần backend. |
| **Docker Container** | Docker Compose (Multi-stage) | Build Node.js → Runtime Python. Volume mount data để lưu bền vững. |

---

*Tài liệu này được soạn thảo đầy đủ phản ánh hiện trạng hệ thống SmartLib phiên bản 2.0.*

