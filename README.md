# 📚 SmartLib - Hệ Thống Quản Lý Thư Viện Thông Minh Tích Hợp Trợ Lý AI

<p align="center">
  <img src="https://img.shields.io/badge/React-18.3.1-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React 18" />
  <img src="https://img.shields.io/badge/Python-3.10%2B-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python 3.10+" />
  <img src="https://img.shields.io/badge/FastAPI-0.110%2B-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI" />
  <img src="https://img.shields.io/badge/Docker-Supported-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker" />
  <img src="https://img.shields.io/badge/GitHub%20Pages-Live%20Demo-22c55e?style=for-the-badge&logo=github" alt="Live Demo" />
  <img src="https://img.shields.io/badge/License-MIT-orange?style=for-the-badge" alt="License MIT" />
</p>

> **SmartLib** là dự án phần mềm quản lý và tra cứu thư viện trực tuyến hiện đại, được xây dựng theo chuẩn mực **10 tiêu chí đánh giá chất lượng phần mềm**. Hệ thống tích hợp công nghệ **Trợ lý Trí tuệ Nhân tạo (AI Library Assistant)** hỗ trợ bạn đọc 24/7 với giọng điệu tự nhiên, hoạt họa suy nghĩ 5 giây sống động và khả năng đồng bộ dữ liệu đa nền tảng (Dual-mode Persistence).

---

## 🔗 Liên Kết Trực Tuyến & Demo

- 🌐 **Trải nghiệm trực tuyến trên GitHub Pages:** [https://dvuwebon.github.io/Thuvien/](https://dvuwebon.github.io/Thuvien/)
- 💻 **Kho mã nguồn chính thức (GitHub):** [https://github.com/dvuwebon/Thuvien](https://github.com/dvuwebon/Thuvien)
- 📑 **Báo cáo chi tiết 10 tiêu chí đánh giá:** [BAO_CAO_DU_AN_10_TIEU_CHI.md](BAO_CAO_DU_AN_10_TIEU_CHI.md)
- ⚙️ **Tệp cấu hình môi trường mẫu:** [.env.example](.env.example)

---

## 📑 Mục Lục
1. [Tính Năng Nổi Bật](#-tính-năng-nổi-bật)
2. [Đáp Ứng 10 Tiêu Chí Đánh Giá](#-đáp-ứng-10-tiêu-chí-đánh-giá)
3. [Cấu Trúc Thư Mục Dự Án](#-cấu-trúc-thư-mục-dự-án)
4. [Công Nghệ Sử Dụng (Tech Stack)](#-công-nghệ-sử-dụng-tech-stack)
5. [Hướng Dẫn Cài Đặt & Khởi Chạy](#-hướng-dẫn-cài-đặt--khởi-chạy)
   - [Cách 1: Trải nghiệm trên GitHub Pages](#cách-1-trải-nghiệm-trực-tiếp-trên-github-pages-không-cần-cài-đặt)
   - [Cách 2: Khởi chạy bằng Docker Compose (Khuyên dùng)](#cách-2-khởi-chạy-bằng-docker--docker-compose-khuyên-dùng)
   - [Cách 3: Khởi chạy bằng Python trên máy cục bộ](#cách-3-khởi-chạy-cục-bộ-bằng-python-localhost)
6. [Tài Khoản Đăng Nhập & Phân Quyền](#-tài-khoản-đăng-nhập--phân-quyền)
7. [Danh Sách RESTful API Chính](#-danh-sách-restful-api-chính)
8. [Giấy Phép & Tác Quyền](#-giấy-phép)

---

## 🌟 Tính Năng Nổi Bật

- 🤖 **Thủ thư Trí tuệ Nhân tạo (AI Library Assistant):**
  - Widget chat nổi góc phải màn hình, thiết kế phẳng tinh gọn, hiện đại.
  - Dòng chữ gợi ý *"Bạn cần tôi giúp đỡ gì không? ✨"* tự động hiển thị và **tự ẩn sau 7 giây**, tự hiện lại khi rê chuột.
  - Hoạt họa **3 dấu chấm chuyển động nhịp nhàng (bouncing dots)** trong 5 giây, chuyển trạng thái tự nhiên như đang chat với người thật.
  - Hỗ trợ kết nối Google Gemini API và cơ chế **Smart Fallback** tự động giải đáp từ bộ tri thức nội bộ khi chưa có API Key.
- ⚡ **Nghiệp vụ Mượn - Trả tức thì (Optimistic UI 0ms):** Thao tác mượn sách, duyệt phiếu, trả sách cập nhật giao diện ngay lập tức mà không cần F5.
- 🔍 **Tìm kiếm toàn cục (Live Search):** Kích hoạt nhanh bằng phím tắt `/`, lọc theo thể loại, tình trạng kho và sắp xếp đa tiêu chí.
- 📊 **Thống kê & Xuất báo cáo chuyên nghiệp:**
  - Báo cáo **Excel (.xlsx)** định dạng bảng biểu, màu sắc tiêu đề bằng `openpyxl`.
  - Phiếu mượn **PDF (.pdf)** tích hợp mã QR tra cứu bằng `reportlab`.
  - Dữ liệu độc giả **CSV (.csv)** mã hóa UTF-8 BOM chuẩn tiếng Việt.
- 💾 **Kiến trúc lưu trữ Dual-mode Persistence:**
  - Localhost: FastAPI đọc/ghi trực tiếp `data/database.json`.
  - GitHub Pages: Tự kích hoạt `LocalStorage Sync Engine` kiểm soát phiên bản `DB_VERSION`, đồng bộ thời gian thực giữa các tab.
- 🎨 **Giao diện người dùng tinh tế (UI/UX):** Bỏ 100% popup `alert/confirm` thô sơ của trình duyệt, thay bằng Custom Confirmation Modal và Toast Notification.

---

## 🏆 Đáp Ứng 10 Tiêu Chí Đánh Giá

| STT | Tiêu chí đánh giá | Mức độ hoàn thiện trong Dự án SmartLib |
| :---: | :--- | :--- |
| **1** | **Cấu trúc dự án hợp lý** | Phân tách module rõ ràng: `frontend`, `backend`, `data`, `docs`, `config`, `docker`. |
| **2** | **Đăng nhập & phân quyền** | Phân quyền vai trò RBAC (`Admin` vs `Reader`), bảo vệ route, cho phép đăng ký tài khoản mới lưu bền vững vào CSDL. |
| **3** | **CRUD nghiệp vụ chính** | Hoàn thiện 100% Thêm - Xem - Sửa - Xóa cho Sách, Độc giả và Mượn - Trả sách. |
| **4** | **Tìm kiếm và lọc** | Live search modal theo phím `/`, lọc theo danh mục, trạng thái mượn trả, lọc còn/hết sách, sắp xếp A-Z. |
| **5** | **Thống kê / Báo cáo** | Dashboard 4 thẻ KPI, biểu đồ SVG lượt mượn theo thể loại, xuất file Excel, PDF kèm QR, CSV. |
| **6** | **Giao diện rõ ràng (UI/UX)** | Giao diện nhất quán, Toast thông báo, Modal xác nhận an toàn, Trợ lý AI hỏi đáp 5s mượt mà. |
| **7** | **Thao tác CSDL ổn định** | Kiến trúc Dual-mode (FastAPI JSON DB + LocalStorage Sync Engine), có sẵn dữ liệu mẫu phong phú. |
| **8** | **Xử lý lỗi cơ bản** | Bắt lỗi form rỗng, kiểm tra số nguyên dương, **chặn xóa sách/độc giả đang có giao dịch mượn**, bọc try/catch toàn diện. |
| **9** | **Minh chứng sử dụng AI** | Có bảng nhật ký Prompt 6 giai đoạn, đối chiếu code AI sinh ra và phần sinh viên tự kiểm tra, gỡ lỗi và tinh chỉnh. |
| **10** | **Quản lý mã nguồn & Docker** | Commit Git chuẩn Conventional Commits, tài liệu báo cáo đầy đủ, `.env.example`, đóng gói Docker chạy ngay. |

*(Chi tiết minh chứng kiểm thử từng tiêu chí xem tại: [BAO_CAO_DU_AN_10_TIEU_CHI.md](BAO_CAO_DU_AN_10_TIEU_CHI.md))*

---

## 📂 Cấu Trúc Thư Mục Dự Án

```
py-thuvien/
├── backend/                        # Backend RESTful API (Python FastAPI)
│   ├── app.py                      # Router API, phân quyền, xử lý dữ liệu
│   ├── database.py                 # Tầng truy xuất & thao tác CSDL JSON
│   ├── models.py                   # Pydantic Schemas định nghĩa dữ liệu
│   ├── excel_generator.py          # Xuất báo cáo Excel (.xlsx)
│   ├── pdf_generator.py            # Sinh phiếu mượn PDF kèm mã QR (.pdf)
│   └── qr_generator.py             # Sinh mã QR định danh sách PNG
├── frontend/                       # Frontend SPA (React.js 18 + Vite)
│   ├── src/
│   │   ├── components/             # Modal, Cards, Sidebar, AIChatWidget...
│   │   ├── context/AuthContext.jsx # Quản lý phiên đăng nhập & phân quyền
│   │   ├── pages/                  # AdminDashboard, ReaderPortal, LoginPage...
│   │   ├── services/api.js         # API Client Dual-mode (FastAPI + LocalStorage)
│   │   ├── services/aiService.js   # Dịch vụ kết nối AI & Tri thức thư viện
│   │   └── index.css               # Hệ thống CSS toàn cục, Design Tokens
├── data/
│   └── database.json               # CSDL JSON chuẩn hóa lưu trữ tập trung
├── docs/
│   └── BAO_CAO_NGHIEM_THU.md       # Tài liệu nghiệm thu dự án
├── assets/ & index.html            # Bản phân phối tĩnh phục vụ GitHub Pages
├── Dockerfile                      # Tệp cấu hình đóng gói Multi-stage Docker
├── docker-compose.yml              # Cấu hình khởi chạy nhanh Docker Compose
├── .dockerignore                   # Danh sách loại trừ khi build Docker
├── .env.example                    # Biến môi trường mẫu
├── requirements.txt                # Thư viện phụ thuộc Python
├── main.py                         # Điểm khởi chạy máy chủ FastAPI & phục vụ Web
└── README.md                       # Tài liệu hướng dẫn chính của dự án
```

---

## 💻 Công Nghệ Sử Dụng (Tech Stack)

- **Giao diện (Frontend):** React 18, Vite, Lucide Icons, Modern CSS3 Animation.
- **Phía Máy chủ (Backend):** Python 3.10+, FastAPI, Uvicorn ASGI Server.
- **Thư viện sinh tệp (Generators):** `openpyxl` (Excel), `reportlab` (PDF), `qrcode`, `pillow`.
- **Trí tuệ Nhân tạo (AI Engine):** Google Generative AI (Gemini 1.5 Flash) + Expert Knowledge Fallback.
- **Cơ sở dữ liệu:** File-based JSON Database kết hợp LocalStorage Sync Engine.
- **Đóng gói & Triển khai:** Docker, Docker Compose, GitHub Pages CI/CD.

---

## 🚀 Hướng Dẫn Cài Đặt & Khởi Chạy

### Cách 1: Trải nghiệm trực tiếp trên GitHub Pages (Không cần cài đặt)
Chỉ cần truy cập ngay: 👉 **[https://dvuwebon.github.io/Thuvien/](https://dvuwebon.github.io/Thuvien/)**

---

### Cách 2: Khởi chạy bằng Docker / Docker Compose (Khuyên dùng)
Yêu cầu: Máy tính đã cài đặt [Docker Desktop](https://www.docker.com/products/docker-desktop).

1. Khởi động ứng dụng trong chế độ nền:
   ```bash
   docker compose up -d --build
   ```
2. Mở trình duyệt truy cập:
   - 🌐 **Web App:** **[http://localhost:3000](http://localhost:3000)**
   - 📑 **Swagger API Docs:** **[http://localhost:3000/docs](http://localhost:3000/docs)**
3. Dừng hệ thống:
   ```bash
   docker compose down
   ```

---

### Cách 3: Khởi chạy cục bộ bằng Python (Localhost)
Yêu cầu: Đã cài đặt **Python 3.10+**.

1. Cài đặt các thư viện phụ thuộc:
   ```bash
   pip install -r requirements.txt
   ```
2. Khởi động máy chủ:
   ```bash
   python main.py
   ```
   *(Trình duyệt sẽ tự động mở trang web tại địa chỉ `http://localhost:3000`)*.

---

## 🔑 Tài Khoản Đăng Nhập & Phân Quyền

| Vai trò | Tên đăng nhập | Mật khẩu | Quyền hạn và Chức năng chính |
| :--- | :---: | :---: | :--- |
| **Quản trị viên (Admin)** | `admin` | `123` | Toàn quyền: Quản trị kho sách (Thêm/Sửa/Xóa), Duyệt/Từ chối phiếu mượn, Nhận sách trả, Quản lý tài khoản độc giả, Xem Dashboard KPI, Xuất file Excel/CSV/PDF |
| **Độc giả (Reader)** | `reader` | `123` | Tra cứu kho sách, Gửi yêu cầu mượn, Xem lịch sử cá nhân, Thao tác Trả sách, Hỏi đáp cùng Thủ thư AI, Cập nhật hồ sơ & đổi mật khẩu |

*(Bạn đọc có thể bấm **"Đăng ký tài khoản mới"** tại màn hình đăng nhập để tạo tài khoản độc giả riêng).*

---

## 🌐 Danh Sách RESTful API Chính

| Phương thức | Đường dẫn Endpoint | Mô tả chức năng |
| :---: | :--- | :--- |
| `POST` | `/api/auth/login` | Xác thực người dùng và cấp phiên đăng nhập |
| `POST` | `/api/auth/register` | Đăng ký tài khoản độc giả mới |
| `GET` | `/api/books` | Lấy danh sách toàn bộ sách trong kho |
| `POST` | `/api/books` | Thêm sách mới vào kho (Chỉ Admin) |
| `PUT` | `/api/books/{id}` | Cập nhật thông tin sách (Chỉ Admin) |
| `DELETE` | `/api/books/{id}` | Xóa sách khỏi kho (Chỉ Admin) |
| `GET` | `/api/readers` | Lấy danh sách hồ sơ độc giả (Chỉ Admin) |
| `DELETE` | `/api/readers/{id}` | Xóa tài khoản độc giả (Chặn nếu đang mượn sách) |
| `GET` | `/api/borrow-records` | Lấy danh sách lịch sử mượn trả |
| `POST` | `/api/borrow-records` | Gửi yêu cầu mượn sách mới |
| `PUT` | `/api/borrow-records/{id}/approve` | Phê duyệt cho mượn sách (Chỉ Admin) |
| `PUT` | `/api/borrow-records/{id}/return` | Xác nhận hoàn tất trả sách về kho |
| `GET` | `/api/stats` | Thống kê số liệu KPI và tỷ lệ thể loại |
| `GET` | `/api/reports/excel` | Tải xuống tệp báo cáo Excel (.xlsx) |
| `GET` | `/api/reports/csv` | Tải xuống tệp danh sách độc giả CSV (.csv) |
| `GET` | `/api/reports/borrow-receipt/{id}` | Tải phiếu mượn PDF kèm mã QR (.pdf) |

---

## 📄 Giấy Phép
Dự án được phân phối dưới giấy phép **MIT License**. Bạn có toàn quyền sử dụng, sửa đổi và triển khai cho mục đích học tập và nghiên cứu.
