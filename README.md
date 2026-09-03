# 📚 SmartLib - Hệ Thống Quản Lý Thư Viện Thông Minh (React.js + Python FastAPI)

Hệ thống quản trị và tra cứu thư viện trực tuyến hiện đại, sử dụng **React.js** (Frontend SPA) kết hợp **Python FastAPI** (Backend RESTful API & Sinh file Excel, PDF, CSV, QR Code).

---

## 🚀 Hướng Dẫn Khởi Chạy

Mở terminal tại thư mục dự án và chạy:

```powershell
python main.py
# hoặc
python app.py
# hoặc click đúp file start.bat
```

👉 Trình duyệt web sẽ tự động mở trang chủ tại: **[http://localhost:3000](http://localhost:3000)**  
👉 Trang tài liệu API (Swagger UI): **[http://localhost:3000/docs](http://localhost:3000/docs)**

---

## 🔑 Tài Khoản Đăng Nhập Mẫu

| Vai trò | Tên đăng nhập | Mật khẩu | Chức năng chính |
| :--- | :--- | :--- | :--- |
| **Quản trị viên (Admin)** | `admin` | `123` | Quản lý kho sách, duyệt mượn/trả, quản lý độc giả, xuất file báo cáo |
| **Độc giả (Reader)** | `reader` | `123` | Tra cứu sách, gửi yêu cầu mượn, xem lịch sử & tải phiếu mượn PDF |

---

## 🌟 Chức Năng Sinh File (Python)
- 📊 **Excel (.xlsx)**: Xuất Danh sách kho sách & Lịch sử mượn trả (sử dụng `openpyxl`).
- 📄 **PDF (.pdf)**: Tạo phiếu mượn chuyên nghiệp kèm mã QR (sử dụng `reportlab`).
- 📝 **CSV (.csv)**: Xuất hồ sơ độc giả chuẩn UTF-8 BOM.
- 📱 **QR Code (.png)**: Sinh mã QR cho từng cuốn sách (sử dụng `qrcode` & `pillow`).
- 💾 **JSON Backup (.json)**: Sao lưu toàn bộ cơ sở dữ liệu.