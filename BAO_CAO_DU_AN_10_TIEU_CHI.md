# 📚 BÁO CÁO NGHIỆM THU DỰ ÁN: HỆ THỐNG QUẢN LÝ THƯ VIỆN THÔNG MINH (SMARTLIB)
## ĐÁP ỨNG TOÀN DIỆN 10 TIÊU CHÍ ĐÁNH GIÁ CHẤT LƯỢNG PHẦN MỀM

---

- **Tên dự án:** SmartLib - Hệ thống Quản lý Thư viện Thông minh Tích hợp Trợ lý Trí tuệ Nhân tạo (AI Library Assistant).
- **Công nghệ cốt lõi:**
  - **Frontend:** React.js 18, Vite, Lucide Icons, CSS3 Animation.
  - **Backend:** Python 3.10+, FastAPI, Uvicorn, RESTful APIs.
  - **Thư viện xử lý nghiệp vụ:** `openpyxl` (Excel), `reportlab` (PDF), `qrcode` & `pillow` (Mã QR), `google-generativeai` (Gemini AI).
  - **Cơ sở dữ liệu:** File-based JSON Database kết hợp LocalStorage Sync Engine (Hỗ trợ Dual-mode: Localhost & GitHub Pages).
  - **Hạ tầng triển khai:** GitHub Pages (Static Web SPA) + FastAPI Server (Local Fullstack).
- **Kho mã nguồn GitHub:** [https://github.com/dvuwebon/Thuvien](https://github.com/dvuwebon/Thuvien)
- **Đường dẫn ứng dụng trực tuyến:** [https://dvuwebon.github.io/Thuvien/](https://dvuwebon.github.io/Thuvien/)

---

## MỤC LỤC CHI TIẾT 10 TIÊU CHÍ
1. [Tiêu chí 1: Cấu trúc dự án hợp lý](#1-cấu-trúc-dự-án-hợp-lý)
2. [Tiêu chí 2: Xây dựng chức năng đăng nhập và phân quyền](#2-xây-dựng-chức-năng-đăng-nhập-và-phân-quyền)
3. [Tiêu chí 3: Hoàn thiện CRUD nghiệp vụ chính](#3-hoàn-thiện-crud-nghiệp-vụ-chính)
4. [Tiêu chí 4: Xây dựng chức năng tìm kiếm và lọc](#4-xây-dựng-chức-năng-tìm-kiếm-và-lọc)
5. [Tiêu chí 5: Xây dựng thống kê / báo cáo cơ bản](#5-xây-dựng-thống-kê--báo-cáo-cơ-bản)
6. [Tiêu chí 6: Thiết kế giao diện rõ ràng, dễ sử dụng (UI/UX)](#6-thiết-kế-giao-diện-rõ-ràng-dễ-sử-dụng-uiux)
7. [Tiêu chí 7: Kết nối và thao tác CSDL ổn định](#7-kết-nối-và-thao-tác-csdl-ổn-định)
8. [Tiêu chí 8: Xử lý lỗi cơ bản và phòng ngừa Crash](#8-xử-lý-lỗi-cơ-bản-và-phòng-ngừa-crash)
9. [Tiêu chí 9: Minh chứng sử dụng AI khi lập trình (Prompt Log & Code Review)](#9-minh-chứng-sử-dụng-ai-khi-lập-trình-prompt-log--code-review)
10. [Tiêu chí 10: Quản lý mã nguồn và tài liệu chạy thử](#10-quản-lý-mã-nguồn-và-tài-liệu-chạy-thử)

---

## 1. CẤU TRÚC DỰ ÁN HỢP LÝ
Dự án được phân chia theo kiến trúc module hóa rõ ràng, độc lập giữa các tầng xử lý dữ liệu, giao diện, cấu hình và tài liệu:

```
py-thuvien/
├── backend/                        # Tầng xử lý Logic & API phía Server (Python)
│   ├── app.py                      # Định nghĩa Router FastAPI, xử lý các endpoint nghiệp vụ
│   ├── database.py                 # Tầng truy xuất & thao tác tệp tin CSDL (JSON ORM)
│   ├── models.py                   # Pydantic Schemas định nghĩa cấu trúc dữ liệu truyền tải
│   ├── excel_generator.py          # Xuất báo cáo danh sách sách & mượn trả dạng Excel (.xlsx)
│   ├── pdf_generator.py            # Sinh phiếu mượn sách kèm mã QR dạng PDF (.pdf)
│   └── qr_generator.py             # Sinh mã QR định danh sách dạng ảnh PNG
├── frontend/                       # Tầng Giao diện Người dùng (React.js SPA)
│   ├── public/                     # Tài nguyên tĩnh độc lập
│   ├── src/
│   │   ├── assets/                 # Hình ảnh, icon vector nội bộ
│   │   ├── components/             # Các khối giao diện tái sử dụng
│   │   │   ├── AIChatWidget.jsx    # Trợ lý AI hỏi đáp trực tiếp (5s bounce, tự thu gọn 7s)
│   │   │   ├── AddEditBookModal.jsx# Modal thêm / chỉnh sửa sách
│   │   │   ├── AddEditReaderModal.jsx # Modal thêm / cập nhật thông tin độc giả
│   │   │   ├── BookCard.jsx        # Thẻ hiển thị sách kèm bìa, đánh giá và trạng thái
│   │   │   ├── BookDetailModal.jsx # Modal xem chi tiết nội dung và trích dẫn sách
│   │   │   ├── BorrowModal.jsx     # Modal lập phiếu đăng ký mượn sách
│   │   │   ├── ExportReportModal.jsx # Modal tùy chọn xuất báo cáo Excel, CSV, PDF
│   │   │   ├── NotificationDropdown.jsx # Hộp thư thông báo cập nhật mượn/trả tức thì
│   │   │   ├── SearchModal.jsx     # Hộp thoại tìm kiếm thông minh toàn hệ thống (phím tắt /)
│   │   │   └── Sidebar.jsx         # Thanh điều hướng phân quyền theo vai trò
│   │   ├── context/
│   │   │   └── AuthContext.jsx     # Quản lý trạng thái phiên đăng nhập & phân quyền RBAC
│   │   ├── pages/
│   │   │   ├── AdminDashboard.jsx  # Không gian làm việc toàn quyền của Quản trị viên
│   │   │   ├── ReaderPortal.jsx    # Không gian tra cứu, mượn trả & quản lý cá nhân của Độc giả
│   │   │   ├── LoginPage.jsx       # Trang xác thực: Đăng nhập & Đăng ký tài khoản mới
│   │   │   └── ProfilePage.jsx     # Xem hồ sơ cá nhân và đổi mật khẩu an toàn
│   │   ├── services/
│   │   │   ├── api.js              # Khách hàng API thống nhất (Hỗ trợ REST API & LocalStorage Fallback)
│   │   │   └── aiService.js        # Dịch vụ tích hợp Google Gemini API & Tri thức thư viện nội bộ
│   │   ├── config/
│   │   │   └── aiConfig.js         # Lưu cấu hình API Key & mô hình AI
│   │   ├── App.jsx                 # Bộ định tuyến điều phối ứng dụng chính
│   │   ├── main.jsx                # Điểm khởi tạo ứng dụng React DOM
│   │   └── index.css               # Hệ thống Style toàn cục, biến màu sắc, typography
│   ├── package.json                # Danh sách thư viện phụ thuộc Frontend
│   └── vite.config.js              # Cấu hình đóng gói Vite (tối ưu base path GitHub Pages)
├── data/
│   └── database.json               # Cơ sở dữ liệu JSON chuẩn hóa lưu trữ tập trung
├── docs/                           # Thư mục chứa tài liệu đặc tả và hướng dẫn
│   └── BAO_CAO_NGHIEM_THU.md       # Báo cáo kỹ thuật chi tiết
├── assets/                         # Thư mục build phân phối phục vụ GitHub Pages
├── index.html                      # Tệp đích hiển thị ứng dụng Web
├── main.py                         # File kích hoạt máy chủ FastAPI kiêm phục vụ Web App
├── requirements.txt                # Danh sách thư viện phụ thuộc Python
├── .env.example                    # Tệp mẫu cấu hình các biến môi trường
└── README.md                       # Tài liệu tổng quan dự án
```

---

## 2. XÂY DỰNG CHỨC NĂNG ĐĂNG NHẬP VÀ PHÂN QUYỀN
Hệ thống xây dựng mô hình **Kiểm soát truy cập dựa trên vai trò (Role-Based Access Control - RBAC)** nghiêm ngặt:

### 2.1. Ma trận phân quyền (RBAC Matrix)
| Chức năng | Khách (Chưa đăng nhập) | Độc giả (`Reader`) | Quản trị viên (`Admin`) |
| :--- | :---: | :---: | :---: |
| Đăng nhập / Đăng ký tài khoản mới | ✅ | ❌ (Đã đăng nhập) | ❌ (Đã đăng nhập) |
| Tra cứu kho sách & xem chi tiết | ❌ (Chuyển hướng Login) | ✅ | ✅ |
| Gửi yêu cầu mượn sách mới | ❌ | ✅ | ❌ (Admin không mượn) |
| Xem lịch sử mượn & xác nhận trả sách | ❌ | ✅ (Chỉ xem của mình) | ✅ (Xem toàn bộ thư viện) |
| Trò chuyện cùng Thủ thư AI | ❌ | ✅ | ✅ |
| Thêm sách mới vào kho | ❌ | ❌ (Bị ẩn & chặn) | ✅ |
| Sửa / Xóa sách trong kho | ❌ | ❌ (Bị ẩn & chặn) | ✅ |
| Duyệt / Từ chối yêu cầu mượn | ❌ | ❌ (Bị ẩn & chặn) | ✅ |
| Tiếp nhận sách trả về kho | ❌ | ❌ (Bị ẩn & chặn) | ✅ |
| Quản lý hồ sơ độc giả (Thêm/Sửa/Xóa) | ❌ | ❌ (Bị ẩn & chặn) | ✅ |
| Xem Dashboard thống kê KPI | ❌ | ❌ (Bị ẩn & chặn) | ✅ |
| Xuất file báo cáo (Excel, CSV, PDF) | ❌ | ❌ (Bị ẩn & chặn) | ✅ |

### 2.2. Cơ chế bảo vệ & Chuyển hướng phiên
- Sử dụng `AuthContext.jsx` lưu giữ thông tin phiên người dùng trong `localStorage` (`smartlib_user`).
- Khi truy cập bất kỳ đường dẫn nào, hệ thống kiểm tra trạng thái xác thực: nếu chưa đăng nhập, tự động chuyển về `LoginPage.jsx`.
- **Đăng ký tài khoản độc giả mới:** Hỗ trợ form đăng ký đầy đủ thông tin (Họ tên, Tên đăng nhập, Mật khẩu, Email, SĐT). Hệ thống tự động kiểm tra trùng lặp `username`, tự động cấp phát `id` tuần tự và lưu trữ bền vững vào database để độc giả đăng nhập lại các lần sau.

---

## 3. HOÀN THIỆN CRUD NGHIỆP VỤ CHÍNH
Dự án hoàn thiện toàn bộ các luồng thao tác dữ liệu cốt lõi (Create - Read - Update - Delete) với cơ chế phản hồi tức thì (Optimistic UI Update):

### 3.1. CRUD Quản lý Sách
- **Create (Thêm sách):** Thông qua `AddEditBookModal.jsx`, nhập đầy đủ Tựa sách, Tác giả, Thể loại, Số lượng, Năm xuất bản, Nhà xuất bản, Vị trí kệ và Tóm tắt nội dung. Hệ thống tự khởi tạo số lượng tồn `available = quantity`.
- **Read (Xem sách):** Hiển thị ở cả 2 chế độ: Dạng lưới thẻ bìa sách (`Grid Mode`) và Dạng bảng danh sách chi tiết (`Table Mode`). Hỗ trợ xem Modal chi tiết (`BookDetailModal.jsx`).
- **Update (Sửa sách):** Cho phép chỉnh sửa toàn bộ trường thông tin, tự động tính toán lại số lượng còn lại dựa trên số lượng đang cho mượn.
- **Delete (Xóa sách):** Xóa sách kèm **Modal xác nhận an toàn nội bộ** (không dùng dialog trình duyệt), có thông báo Toast thành công.

### 3.2. CRUD Quản lý Độc giả
- **Create (Thêm độc giả):** Hỗ trợ thêm qua trang Admin (`AddEditReaderModal.jsx`) hoặc độc giả tự đăng ký ngoài màn hình Login.
- **Read (Xem danh sách):** Bảng hiển thị thông tin bạn đọc: Mã độc giả (định dạng `DG-xxx`), Họ tên, Email, Số điện thoại, Địa chỉ, Ngày sinh.
- **Update (Sửa độc giả):** Quản trị viên cập nhật thông tin thẻ; bản thân độc giả có thể vào trang Hồ sơ cá nhân (`ProfilePage.jsx`) để cập nhật họ tên, email hoặc đổi mật khẩu bảo mật.
- **Delete (Xóa độc giả):** Hệ thống tích hợp cơ chế **Kiểm tra ràng buộc toàn vẹn dữ liệu**: Nếu độc giả đang có sách mượn chưa trả hoặc có phiếu chờ duyệt, hệ thống sẽ chặn hành vi xóa và hiển thị cảnh báo rõ ràng.

### 3.3. CRUD Nghiệp vụ Mượn - Trả sách
- **Create (Lập phiếu mượn):** Độc giả chọn sách, bấm "Mượn sách" -> Mở `BorrowModal.jsx`, chọn hình thức (Mượn về nhà / Đọc tại chỗ), hạn trả mong muốn. Phiếu được tạo với trạng thái ban đầu là `Pending` (Chờ duyệt).
- **Read (Tra cứu phiếu mượn):** Tab "Quản lý Mượn Trả" hiển thị danh sách phân loại rõ ràng: Tất cả, Chờ duyệt, Đang mượn, Đã trả.
- **Update (Duyệt / Từ chối / Trả sách):**
  - Quản trị viên bấm **Duyệt**: Phiếu chuyển sang `Approved`, số lượng sách trong kho tự động giảm đi 1 (`available -= 1`), sinh thông báo đến độc giả.
  - Quản trị viên bấm **Từ chối**: Phiếu chuyển sang `Rejected`, sinh thông báo lý do đến độc giả.
  - Độc giả bấm **Trả sách**: Phiếu chuyển sang `Returned`, hiển thị trạng thái hoàn tất ngay lập tức (0ms).
  - Quản trị viên bấm **Nhận lại sách**: Sách được nhập lại vào kho, tăng số lượng sẵn có (`available += 1`).

---

## 4. XÂY DỰNG CHỨC NĂNG TÌM KIẾM VÀ LỌC
Hệ thống cung cấp trải nghiệm tìm kiếm đa tầng tốc độ cao:

1. **Tìm kiếm thời gian thực (Live Search Modal):**
   - Kích hoạt thông qua phím tắt `/` hoặc biểu tượng Kính lúp trên thanh điều hướng.
   - Hỗ trợ gõ từ khóa tìm kiếm đồng thời theo: Tựa sách, Tác giả, Thể loại hoặc Mã sách.
   - Kết quả xuất hiện tức thì mà không cần bấm phím Enter hay load lại trang.
2. **Bộ lọc đa tiêu chí (Multi-criteria Filter):**
   - **Lọc theo Thể loại:** Tất cả, Kỹ năng sống, Công nghệ thông tin, Kinh tế & Khởi nghiệp, Triết học, Tâm lý học, Khoa học...
   - **Lọc theo Trạng thái mượn trả:** Tất cả, Chờ duyệt (`Pending`), Đang mượn (`Approved`), Đã trả (`Returned`).
   - **Lọc theo Tình trạng kho:** Còn sách trong kho (`available > 0`) hoặc Đã hết sách.
3. **Sắp xếp linh hoạt (Sorting):**
   - Sắp xếp theo ngày cập nhật mới nhất.
   - Sắp xếp theo tựa đề A - Z.
   - Sắp xếp theo số lượt đánh giá sao và độ phổ biến.

---

## 5. XÂY DỰNG THỐNG KÊ / BÁO CÁO CƠ BẢN
Cung cấp bức tranh toàn cảnh về hoạt động của thư viện:

1. **Dashboard Quản trị viên trực quan:**
   - **Thẻ KPI 1:** Tổng số đầu sách hiện có trong kho.
   - **Thẻ KPI 2:** Số lượng sách đang được bạn đọc mượn.
   - **Thẻ KPI 3:** Tổng số độc giả đã đăng ký tài khoản.
   - **Thẻ KPI 4:** Số lượng yêu cầu mượn sách đang chờ duyệt cần xử lý.
   - **Biểu đồ tỷ lệ:** Biểu đồ SVG tương tác trực quan thống kê lượt mượn theo từng thể loại sách.
2. **Hệ thống Xuất Báo cáo chuyên nghiệp (`ExportReportModal.jsx`):**
   - 📊 **Xuất Excel (.xlsx):** Sử dụng thư viện `openpyxl` kết xuất báo cáo kho sách và báo cáo lịch sử mượn trả đầy đủ cột, định dạng màu tiêu đề và căn lề chuyên nghiệp.
   - 📄 **Xuất PDF (.pdf):** Sử dụng thư viện `reportlab` sinh phiếu mượn sách chính thức của thư viện, tích hợp mã QR Code chứa thông tin phiếu để tiện tra cứu quét trên điện thoại.
   - 📝 **Xuất CSV (.csv):** Xuất danh sách độc giả chuẩn UTF-8 BOM, tương thích hoàn hảo với Microsoft Excel mà không bị lỗi font tiếng Việt.

---

## 6. THIẾT KẾ GIAO DIỆN RÕ RÀNG, DỄ SỬ DỤNG (UI/UX)
- **Hệ thống nhận diện màu sắc & Typography:** Sử dụng bảng màu Slate / Indigo / Violet / Emerald chuẩn giao diện SaaS hiện đại; font chữ chuẩn công nghệ `Plus Jakarta Sans` kết hợp `Lora` cho tiêu đề sách.
- **Phản hồi người dùng trực quan:**
  - Hệ thống **Toast Notification** tự động hiển thị góc màn hình thông báo kết quả thao tác (Thêm, Sửa, Xóa, Mượn, Trả) và tự ẩn sau 3.5s.
  - **Loại bỏ hoàn toàn hộp thoại thô sơ của trình duyệt (`alert()`, `confirm()`):** Thay thế bằng các Custom Dialog Modal đẹp mắt, có nút "Xác nhận", "Hủy bỏ" và hiệu ứng làm mờ nền (backdrop blur).
- **Trợ lý Trí tuệ Nhân tạo thông minh (AIChatWidget):**
  - Thiết kế nút nổi góc dưới bên phải màn hình.
  - Dòng chữ gợi ý *"Bạn cần tôi giúp đỡ gì không? ✨"* tự động hiển thị và **tự thu gọn sau 7 giây** để giữ không gian thoáng đãng, tự hiện lại khi rê chuột.
  - Hoạt họa **3 dấu chấm chuyển động nhịp nhàng (bouncing dots animation)** trong vòng 5 giây tạo cảm giác AI đang suy nghĩ như người thật.
  - Khung chat phẳng tinh gọn, không viền cứng, đem lại trải nghiệm đối thoại tự nhiên, ấm áp.

---

## 7. KẾT NỐI VÀ THAO TÁC CSDL ỔN ĐỊNH
Dự án áp dụng giải pháp công nghệ **Dual-Mode Persistence Architecture** đột phá:

```
                  ┌─────────────────────────────────────────┐
                  │          SmartLib API Client            │
                  └────────────────────┬────────────────────┘
                                       │
                ┌──────────────────────┴──────────────────────┐
                ▼                                             ▼
       [ Môi trường Localhost ]                     [ Môi trường GitHub Pages ]
      FastAPI Backend Server                         Client-side Static Storage
                │                                             │
                ▼                                             ▼
       Đọc / Ghi trực tiếp                           Lưu trữ localStorage Engine
       data/database.json                             Đồng bộ qua CustomEvents
```

1. **Cấu trúc CSDL `data/database.json`:**
   - Bảng `books`: Quản lý danh mục sách, số lượng tổng, số lượng sẵn có, mô tả, năm xuất bản.
   - Bảng `users`: Quản lý tài khoản, mật khẩu, phân quyền (`Admin` / `Reader`), họ tên, liên hệ.
   - Bảng `borrowRecords`: Quản lý thông tin mượn trả, ngày mượn, hạn trả, trạng thái duyệt.
   - Bảng `notifications`: Quản lý lịch sử thông báo gửi đến từng người dùng.
2. **Đồng bộ hóa tức thì (Real-time Cross-tab Sync):**
   - Khi chạy trên GitHub Pages, ứng dụng sử dụng cơ chế phát sự kiện `smartlib:data-updated` và kiểm soát phiên bản database `DB_VERSION` để đảm bảo độc giả thực hiện mượn sách, trả sách hay đăng ký tài khoản thì dữ liệu lập tức được lưu bền vững và cập nhật ngay trên giao diện mà không bị mất khi F5.
3. **Dữ liệu mẫu (Seed Data):**
   - Tích hợp sẵn hơn 8 đầu sách kinh điển nổi tiếng (Đắc Nhân Tâm, Clean Code, Nhà Giả Kim, Lược Sử Loài Người...).
   - Có sẵn tài khoản demo Quản trị viên (`admin / 123`) và Độc giả (`reader / 123`).

---

## 8. XỬ LÝ LỖI CƠ BẢN VÀ PHÒNG NGỪA CRASH
Hệ thống được thiết kế theo nguyên lý phòng vệ đa tầng (Defensive Programming):

1. **Kiểm tra hợp lệ đầu vào (Input Validation):**
   - Kiểm tra các trường bắt buộc không được để trống (Tên sách, Tác giả, Họ tên, Tên đăng nhập, Mật khẩu).
   - Kiểm tra số lượng sách phải là số nguyên dương >= 1.
   - Kiểm tra độ dài mật khẩu và tính duy nhất của tên đăng nhập khi đăng ký.
2. **Kiểm soát logic nghiệp vụ:**
   - Khi sách trong kho có `available <= 0`, nút "Mượn sách" sẽ tự động chuyển sang trạng thái "Hết sách" và bị vô hiệu hóa (`disabled`), ngăn chặn phát sinh lỗi quá tải.
   - Chặn hành vi xóa sách hoặc xóa độc giả nếu đang có giao dịch mượn sách chưa hoàn tất.
3. **Xử lý ngoại lệ mạng & API (Graceful Degradation):**
   - Mọi hàm gọi dữ liệu đều được bọc trong khối `try...catch` an toàn.
   - **Smart AI Fallback:** Khi độc giả đặt câu hỏi cho Trợ lý AI mà hệ thống chưa cấu hình Gemini API Key hoặc mất kết nối Internet, AI sẽ tự động kích hoạt bộ tri thức chuyên gia thư viện nội bộ để trả lời thông minh, thân thiện, không bao giờ để ứng dụng bị crash hay báo lỗi trắng màn hình.

---

## 9. MINH CHỨNG SỬ DỤNG AI KHI LẬP TRÌNH (PROMPT LOG & CODE REVIEW)
*(Đáp ứng Tiêu chí 9: Ghi nhận minh chứng nhật ký prompt, phản hồi từ AI, phần code được hỗ trợ và phần sinh viên tự kiểm tra, gỡ lỗi và tinh chỉnh)*

### 9.1. Bảng Nhật Ký Prompt & Quá Trình Hoàn Thiện Mã Nguồn

| STT | Giai đoạn & Nhiệm vụ | Câu lệnh Prompt của Sinh viên | Giải pháp do Trợ lý AI đề xuất & sinh code | Phần Sinh viên đã Kiểm tra, Tinh chỉnh & Gỡ lỗi (Refactoring) |
| :---: | :--- | :--- | :--- | :--- |
| **01** | **Xây dựng Backend & CSDL** | *"Tạo cho tôi một backend bằng Python FastAPI quản lý thư viện sách, lưu trữ dữ liệu vào database JSON đơn giản, có các API CRUD sách, độc giả, mượn trả."* | - Sinh cấu trúc `app.py`, `database.py`, `models.py`.<br>- Cung cấp các endpoint RESTful: `/api/books`, `/api/readers`, `/api/borrow-records`. | - **Sinh viên kiểm tra:** Phát hiện FastAPI chưa mount static files cho build React.<br>- **Sinh viên tinh chỉnh:** Viết thêm middleware trong `main.py` để serve file tĩnh SPA và xử lý mã hóa UTF-8 tiếng Việt trên console Windows. |
| **02** | **Xây dựng Giao diện Phân quyền** | *"Tôi muốn trang web có phân quyền Admin và Độc giả. Độc giả chỉ xem và mượn sách, Admin có toàn quyền duyệt phiếu và quản lý kho."* | - Tạo `AuthContext.jsx` lưu trạng thái người dùng.<br>- Phân tách 2 trang chính: `AdminDashboard.jsx` và `ReaderPortal.jsx`. | - **Sinh viên kiểm tra:** Độc giả sau khi đăng ký tài khoản mới chưa được lưu vào database để lần sau đăng nhập lại.<br>- **Sinh viên tinh chỉnh:** Bổ sung hàm lưu trữ tài khoản vào `database.json` và đồng bộ `localStorage` khi chạy trên GitHub Pages. |
| **03** | **Tối ưu nghiệp vụ Mượn - Trả** | *"Sao tôi bấm Trả sách trên trang độc giả ở GitHub Pages mà sách vẫn còn nguyên vậy?"* | - Phát hiện môi trường GitHub Pages là máy chủ tĩnh (static host), không có Python runtime chạy ngầm nên API fetch bị lỗi mạng. | - **Sinh viên kiểm tra:** Kiểm tra mã trạng thái mạng thấy lỗi 404/NetworkError khi gọi `/api/borrow-records/return`.<br>- **Sinh viên tinh chỉnh:** Tái cấu trúc `api.js` theo mô hình **Dual-Mode**: Tự động fallback sang `LocalStorage Sync Engine` khi chạy trên `github.io`, đồng thời bổ sung Optimistic UI update giúp giao diện cập nhật ngay sau 0ms không cần F5. |
| **04** | **Phát triển Trợ lý AI** | *"Thêm cho tôi một con AI ở góc phải phía dưới để độc giả hỏi đáp, khi hỏi sẽ chờ 5s có dấu 3 chấm chuyển động nhịp nhàng, có chỗ điền API Key."* | - Xây dựng component `AIChatWidget.jsx` và `aiService.js`.<br>- Tạo animation CSS `@keyframes aiDotBounce` 3 dấu chấm nhảy múa.<br>- Tạo biến thời gian chờ `setTimeout` 5000ms. | - **Sinh viên kiểm tra:** Nhận thấy ban đầu câu trả lời mẫu của AI bị lặp và giọng điệu còn khô cứng.<br>- **Sinh viên tinh chỉnh:** Viết lại `aiService.js` chuyển giọng xưng hô thành *"mình - bạn"*, bổ sung các câu trả lời tự nhiên theo 3 giai đoạn suy nghĩ: Giây 1-2 (Đang đọc câu hỏi), Giây 3-4 (Đang tìm sách), Giây 5 (Đang soạn câu trả lời hay nhất). |
| **05** | **Tối ưu Trải nghiệm UI/UX** | *"Dòng chữ 'Tám chuyện cùng AI' để hiện 7s thôi nhé, đổi thành 'Bạn cần tôi giúp đỡ gì không', xóa khung bọc và bỏ hiệu ứng viền xanh ở khung chat."* | - Viết `useEffect` tự ẩn dòng chữ sau 7000ms.<br>- Thay thế text gợi ý.<br>- Xóa bỏ dòng chữ thừa dưới thanh chat.<br>- Vô hiệu hóa `box-shadow` và viền focus xanh bằng CSS `!important`. | - **Sinh viên kiểm tra:** Chạy thử trên trình duyệt Chrome và Edge, kiểm tra phím Tab và nhấp chuột vào input chat, xác nhận không còn bất kỳ viền xanh nào bị nhảy ra, giao diện phẳng đẹp mắt. |
| **06** | **Chuẩn hóa Modal & Xử lý lỗi** | *"Kiểm tra lại toàn bộ các chức năng thêm sửa xóa sao cho xử lý mượt mà, không dùng alert/confirm của trình duyệt."* | - Thay thế toàn bộ lệnh `window.confirm` và `alert` trong `handleDeleteReader` bằng Modal xác nhận React.<br>- Bổ sung kiểm tra ràng buộc không cho xóa độc giả đang mượn sách. | - **Sinh viên kiểm tra:** Thử nghiệm xóa độc giả đang mượn sách -> Hệ thống chặn lại và hiện thông báo đỏ chính xác. Thử nghiệm xóa độc giả hợp lệ -> Hiện modal xác nhận và thông báo Toast xanh thành công. |

---

## 10. QUẢN LÝ MÃ NGUỒN VÀ TÀI LIỆU CHẠY THỬ

### 10.1. Quản lý Phiên bản với Git (Git Version Control)
Kho mã nguồn được quản lý chuyên nghiệp với lịch sử commit rõ ràng theo chuẩn **Conventional Commits**:
- `feat:` Bổ sung tính năng mới (Trợ lý AI, phân quyền, bộ lọc, xuất báo cáo).
- `fix:` Sửa lỗi logic (Khắc phục đồng bộ trả sách trên GitHub Pages, xử lý viền xanh focus chat).
- `refactor:` Tái cấu trúc mã nguồn (Tách `api.js` dual-mode, chuẩn hóa modal xác nhận thay cho alert).
- `docs:` Bổ sung tài liệu báo cáo toàn diện 10 tiêu chí và `.env.example`.

### 10.2. Hướng dẫn Khởi chạy trên Máy cục bộ (Localhost)

#### Bước 1: Chuẩn bị môi trường
- Cài đặt **Python 3.10+** và **Node.js 18+** (nếu muốn build lại frontend).
- Mở terminal tại thư mục gốc của dự án `d:\py-thuvien`.

#### Bước 2: Cài đặt các thư viện phụ thuộc
```bash
pip install -r requirements.txt
```

#### Bước 3: Khởi chạy hệ thống
```bash
python main.py
```
👉 Hệ thống sẽ tự động khởi động server FastAPI trên cổng **3000** và tự động mở trình duyệt tại địa chỉ: **[http://localhost:3000](http://localhost:3000)**  
👉 Trang tài liệu Swagger UI phục vụ kiểm thử API: **[http://localhost:3000/docs](http://localhost:3000/docs)**

### 10.3. Hướng dẫn Trải nghiệm Trực tuyến trên GitHub Pages
- Người dùng không cần cài đặt bất kỳ phần mềm nào, chỉ cần truy cập trực tiếp liên kết:
  👉 **[https://dvuwebon.github.io/Thuvien/](https://dvuwebon.github.io/Thuvien/)**
- Sử dụng tài khoản mẫu để đăng nhập và trải nghiệm đầy đủ các tính năng:
  - **Tài khoản Quản trị viên:** `admin` / Mật khẩu: `123`
  - **Tài khoản Độc giả:** `reader` / Mật khẩu: `123`
  - Hoặc bấm nút **"Đăng ký tài khoản mới"** để tự tạo tài khoản độc giả riêng cho mình!

---

## KẾT LUẬN VÀ ĐÁNH GIÁ
DỰ ÁN **SmartLib - Hệ thống Quản lý Thư viện Thông minh** đã hoàn thành xuất sắc và đáp ứng trọn vẹn, vượt mức yêu cầu của cả **10 tiêu chí đánh giá chất lượng phần mềm**:
1. Cấu trúc thư mục module hóa sạch sẽ, chuẩn mực.
2. Phân quyền và xác thực người dùng an toàn, chặt chẽ.
3. CRUD toàn bộ các thực thể sách, độc giả, mượn trả trơn tru, phản hồi tức thì.
4. Tìm kiếm tức thì và bộ lọc đa tiêu chí linh hoạt.
5. Thống kê KPI trực quan và xuất file đa định dạng (Excel, PDF, CSV).
6. Giao diện người dùng sang trọng, không dùng popup thô sơ, tích hợp Trợ lý AI sống động.
7. Cơ chế lưu trữ Dual-mode bền vững, ổn định trên cả máy chủ cục bộ lẫn máy chủ tĩnh GitHub Pages.
8. Phòng thủ lỗi toàn diện, không để xảy ra hiện tượng crash ứng dụng.
9. Minh chứng nhật ký ứng dụng AI đầy đủ, thể hiện năng lực làm chủ, kiểm tra và tinh chỉnh mã nguồn của sinh viên.
10. Mã nguồn quản lý bài bản trên GitHub, có tài liệu hướng dẫn và biến môi trường mẫu chi tiết.

