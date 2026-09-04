# 📚 SmartLib - Hệ Thống Quản Lý Thư Viện Thông Minh Tích Hợp Trợ Lý AI

> Dự án đồ án phần mềm được thiết kế và xây dựng theo chuẩn mực 10 tiêu chí đánh giá chất lượng phần mềm, kết hợp giữa **React.js 18** hiện đại và **Python FastAPI**, tích hợp Trợ lý Trí tuệ Nhân tạo hỗ trợ độc giả 24/7.

[![GitHub Pages](https://img.shields.io/badge/Demo-GitHub%20Pages-blue?style=for-the-badge&logo=github)](https://dvuwebon.github.io/Thuvien/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=for-the-badge&logo=fastapi)](http://localhost:3000/docs)
[![React](https://img.shields.io/badge/Frontend-React_18-61DAFB?style=for-the-badge&logo=react)](http://localhost:3000)

---

## 🌟 Điểm Nổi Bật Của Hệ Thống

1. 📂 **Cấu trúc module hóa chuẩn mực**: Tách biệt rõ ràng `frontend`, `backend`, `data`, `docs`, `config`.
2. 🔐 **Đăng nhập & Phân quyền chặt chẽ (RBAC)**: Phân quyền Quản trị viên (`Admin`) và Độc giả (`Reader`), bảo vệ mọi thao tác quan trọng.
3. ⚡ **Hoàn thiện CRUD nghiệp vụ cốt lõi**: Thêm, xem, sửa, xóa Sách, Độc giả, Phiếu mượn - trả với phản hồi tức thì (Optimistic UI Update 0ms).
4. 🔍 **Tìm kiếm & Bộ lọc thời gian thực**: Tìm kiếm live search qua phím tắt `/`, lọc theo thể loại, trạng thái mượn trả, sắp xếp đa dạng.
5. 📊 **Dashboard Thống kê & Xuất Báo cáo đa định dạng**: Thẻ KPI, biểu đồ trực quan, xuất file **Excel (.xlsx)**, **PDF (.pdf)** kèm mã QR tra cứu, **CSV (.csv)** chuẩn UTF-8.
6. 🎨 **Giao diện người dùng sang trọng (UI/UX)**: Toast thông báo tức thì, Modal xác nhận thân thiện (loại bỏ hoàn toàn dialog trình duyệt thô sơ), Trợ lý AI hỏi đáp với hoạt họa 3 dấu chấm suy nghĩ 5s mượt mà.
7. 💾 **Cơ chế lưu trữ Dual-mode bền vững**: Hoạt động hoàn hảo trên cả máy chủ cục bộ (FastAPI + JSON DB) và máy chủ tĩnh (GitHub Pages + LocalStorage Sync Engine).
8. 🛡️ **Phòng thủ lỗi toàn diện**: Validation input, ràng buộc toàn vẹn dữ liệu, Smart AI Fallback khi mất mạng/chưa có key.
9. 🤖 **Minh chứng ứng dụng AI khi lập trình**: Có nhật ký Prompt đầy đủ, đối chiếu code AI sinh ra và phần sinh viên tự kiểm tra, gỡ lỗi và tinh chỉnh.
10. 📖 **Tài liệu nghiệm thu toàn diện**: Đầy đủ file [.env.example](.env.example), [BAO_CAO_DU_AN_10_TIEU_CHI.md](BAO_CAO_DU_AN_10_TIEU_CHI.md) và commit Git rõ ràng.

---

## 🚀 Hướng Dẫn Khởi Chạy Nhanh

### 1. Trải nghiệm trực tuyến trên GitHub Pages (Không cần cài đặt)
👉 **Truy cập ngay:** **[https://dvuwebon.github.io/Thuvien/](https://dvuwebon.github.io/Thuvien/)**

### 2. Khởi chạy trên máy tính cục bộ (Localhost)
Yêu cầu: Python 3.10+ đã được cài đặt.

```bash
# 1. Cài đặt các thư viện phụ thuộc
pip install -r requirements.txt

# 2. Khởi động hệ thống
python main.py
```

👉 Web App sẽ tự động mở tại: **[http://localhost:3000](http://localhost:3000)**  
👉 Trang tài liệu Swagger UI: **[http://localhost:3000/docs](http://localhost:3000/docs)**

---

## 🔑 Tài Khoản Đăng Nhập Mẫu

| Vai trò | Tên đăng nhập | Mật khẩu | Chức năng chính |
| :--- | :---: | :---: | :--- |
| **Quản trị viên (Admin)** | `admin` | `123` | Quản trị kho sách, duyệt/từ chối mượn, tiếp nhận sách trả, quản lý độc giả, xem KPI, xuất báo cáo |
| **Độc giả (Reader)** | `reader` | `123` | Tra cứu sách, gửi yêu cầu mượn, xem lịch sử & xác nhận trả sách, trò chuyện cùng Thủ thư AI |

*(Bạn cũng có thể bấm **"Đăng ký tài khoản mới"** tại màn hình đăng nhập để tự tạo tài khoản độc giả riêng).*

---

## 📑 Báo Cáo Nghiệm Thu 10 Tiêu Chí Chi Tiết
Vui lòng xem chi tiết toàn bộ báo cáo phân tích kiến trúc, bảng phân quyền, ma trận CRUD và nhật ký Prompt AI tại:  
👉 **[BAO_CAO_DU_AN_10_TIEU_CHI.md](BAO_CAO_DU_AN_10_TIEU_CHI.md)**
