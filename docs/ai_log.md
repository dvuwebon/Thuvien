# 🤖 SMARTLIB — NHẬT KÝ PROMPT AI (AI Development Log)
**Ghi chép có hệ thống quá trình kiến tạo, kiểm thử và tinh chỉnh dự án cùng Trợ lý AI**
> Dự án: SmartLib v2.0 | Thời gian thực hiện: 03/09/2026 – 04/09/2026
> 📖 **Bộ tài liệu kỹ thuật SmartLib:** [📋 Yêu cầu (SRS)](requirements.md) | [📊 Ca sử dụng (Use Cases)](use_cases.md) | [🗄️ Thiết kế CSDL](database_design.md) | [🤖 Nhật ký Prompt AI](ai_log.md) | [🏠 Trang chủ README](../README.md)

---

## 1. TỔNG QUAN PHƯƠNG PHÁP PHÁT TRIỂN AI-ASSISTED

Hệ thống **SmartLib - Quản lý Thư viện Thông minh** được xây dựng dựa trên mô hình hợp tác kỹ thuật chặt chẽ giữa **Sinh viên (Product Owner & Lead Engineer)** và **Trợ lý Trí tuệ Nhân tạo (Senior Fullstack Developer)**.

Trong mô hình này, sinh viên không tiếp nhận mã nguồn một cách thụ động mà giữ vai trò định hướng kiến trúc, thực thi kiểm thử chuyên sâu và liên tục đưa ra các **gói tinh chỉnh kỹ thuật có tính logic cao**:
1. **Chuyển dịch từ câu lệnh rời rạc sang tư duy hệ thống:** Thay vì đưa ra các yêu cầu sửa lỗi vụn vặt từng dòng, sinh viên nhóm các vấn đề giao diện, trải nghiệm người dùng, logic ràng buộc dữ liệu và môi trường phân phối thành các gói nâng cấp toàn diện.
2. **Kiểm thử thực nghiệm & Chẩn đoán lỗi gốc (Root-cause Diagnosis):** Phát hiện các lỗi phức tạp trong môi trường thực tế như xung đột đường dẫn trên Windows, lệch pha dữ liệu đa tab (UI desync), lỗi bảng mã ký tự tiếng Việt trong tệp Excel/CSV và hạn chế hosting tĩnh của GitHub Pages.
3. **Lập trình phòng thủ & Tối ưu hóa trải nghiệm (Defensive & Polished UX):** Chủ động thiết lập các chốt chặn toàn vẹn dữ liệu (Integrity Guards), xóa bỏ hoàn toàn các hộp thoại mặc định thô sơ của trình duyệt, xây dựng cơ chế phản hồi tức thì (Optimistic UI) và mô phỏng tư duy tự nhiên cho Trợ lý AI.

---

## 2. BẢNG TỔNG HỢP CÁC GÓI TINH CHỈNH KỸ THUẬT LỚN

| STT | Giai đoạn & Module | Định hướng Kỹ thuật của Sinh viên | Giải pháp do Trợ lý AI Đề xuất & Sinh mã | Gói Tinh chỉnh & Gỡ lỗi Logic Chuyên sâu do Sinh viên Thực hiện |
| :---: | :--- | :--- | :--- | :--- |
| **01** | **Khởi tạo Kiến trúc & Cơ sở hạ tầng** | Thiết lập dự án Fullstack đáp ứng 10 tiêu chí đánh giá, tích hợp sẵn CSDL JSON gọn nhẹ và cơ chế bảo vệ phiên làm việc. | - Khởi tạo cấu trúc module: `frontend/`, `backend/`, `data/`, `docs/`.<br>- Sinh mã nguồn FastAPI (`app.py`, `database.py`, `models.py`) và React Vite. | **Gói Tinh chỉnh Hạ tầng & Môi trường Windows:**<br>- Gỡ bỏ plugin IDE xung đột do khoảng trắng đường dẫn `C:\Users\DUNG VU`.<br>- Tích hợp middleware phục vụ file tĩnh SPA React trong `main.py`.<br>- Tự động hóa giải phóng xung đột socket cổng 3000 trước khi khởi động. |
| **02** | **Quản lý Kho sách & Nghiệp vụ Mượn - Trả** | Xây dựng phân hệ CRUD kho sách chuẩn dạng bảng, hỗ trợ duyệt mượn trực tiếp và đồng bộ trạng thái tức thì. | - Sinh component bảng sách, modal thêm/sửa sách.<br>- Tạo API mượn/trả và hộp thư thông báo cập nhật phiếu mượn. | **Gói Tinh chỉnh Nghiệp vụ Kho & Đồng bộ Thời gian thực:**<br>- Chuyển đổi giao diện sang Table View quản trị chuyên nghiệp, dọn dẹp component in ấn cũ.<br>- Xây dựng kiến trúc **Optimistic UI 0ms** kết hợp `CustomEvent ('smartlib:data-updated')` đồng bộ dữ liệu tức thì giữa Admin và Độc giả mà không cần F5. |
| **03** | **Thống kê, Báo cáo & Xuất file Đa định dạng** | Cung cấp Dashboard KPI thời gian thực và chức năng xuất dữ liệu phục vụ lưu trữ, quản lý. | - Xây dựng `backend/export_service.py` hỗ trợ kết xuất tệp tin Excel, PDF và CSV.<br>- Tạo Dashboard với 4 thẻ chỉ số và biểu đồ SVG thể loại. | **Gói Tinh chỉnh Báo cáo & Xử lý Mã hóa Đa nền tảng:**<br>- Chuẩn hóa nhãn tác vụ thành "Xuất báo cáo" chuẩn nghiệp vụ.<br>- Xử lý triệt để lỗi vỡ font tiếng Việt trong CSV bằng kỹ thuật chèn **UTF-8 BOM (`\ufeff`)**.<br>- Nhúng **Mã QR Code động** vào phiếu mượn PDF bằng `reportlab` hỗ trợ quét qua di động. |
| **04** | **Trợ lý AI & Trải nghiệm Người dùng (UI/UX)** | Tích hợp Trợ lý AI hỏi đáp trực quan góc màn hình, tạo tương tác ấm áp, mượt mà và tự nhiên. | - Tạo `AIChatWidget.jsx` kết nối Gemini API.<br>- Cấu hình animation 3 dấu chấm nhảy múa (bouncing dots 5s). | **Gói Tinh chỉnh Trải nghiệm AI & Giao diện Phẳng (Borderless UX):**<br>- Duy trì Bot vector SVG nhẹ và sắc nét thay cho ảnh bitmap.<br>- Thiết lập banner gợi ý thông minh **tự thu gọn sau 7 giây** và tự hiện khi hover.<br>- Triệt tiêu hoàn toàn viền focus xanh mặc định bằng CSS reset `.ai-chat-input`.<br>- Xây dựng bộ tri thức Fallback 15+ kịch bản đối thoại tự nhiên khi offline/không có key. |
| **05** | **Ràng buộc Toàn vẹn & Xử lý Lỗi Phòng thủ** | Đảm bảo hệ thống vận hành ổn định, loại bỏ hoàn toàn hộp thoại thô sơ của trình duyệt và ngăn ngừa dữ liệu mồ côi. | - Bổ sung khối `try/catch` tại các endpoint API.<br>- Tạo component Custom Confirmation Modal. | **Gói Tinh chỉnh Ràng buộc Dữ liệu & Chuẩn hóa Modal Nội bộ:**<br>- Thiết lập chốt chặn toàn vẹn (Referential Integrity): Chặn xóa độc giả/sách đang có phiếu mượn hoạt động, thông báo số lượng cụ thể.<br>- Tự động vô hiệu hóa nút mượn khi sách hết kho (`available <= 0`).<br>- Thay thế 100% `alert/confirm` bằng Custom Modal có hiệu ứng backdrop blur và Toast 3.5s. |
| **06** | **Kiến trúc Lưu trữ Dual-Mode & Đóng gói Triển khai** | Đảm bảo dự án chạy mượt mà trên cả máy chủ cục bộ lẫn GitHub Pages tĩnh, chuẩn hóa tài liệu và Docker. | - Tạo cấu trúc Dockerfile multi-stage, `docker-compose.yml`.<br>- Dự thảo tài liệu nghiệm thu. | **Gói Tinh chỉnh Kiến trúc Dual-Mode & DevOps Hoàn thiện:**<br>- Sáng tạo kiến trúc **Dual-Mode Persistence**: Tự động nhận diện host tĩnh `github.io` để fallback sang `LocalStorage Sync Engine` (`DB_VERSION`), đảm bảo tính năng trả sách hoạt động hoàn hảo không cần backend.<br>- Đóng gói Docker Multi-stage với volume mount bảo toàn CSDL.<br>- Tinh gọn thư mục `docs/` duy nhất 4 file chuẩn và hợp nhất toàn bộ báo cáo vào `README.md`. |

---

## 3. CHI TIẾT CÁC GÓI TINH CHỈNH KỸ THUẬT THEO TỪNG GIAI ĐOẠN

---

### GIAI ĐOẠN 1 — KHỞI TẠO KIẾN TRÚC & CƠ SỞ HẠ TẦNG HỆ THỐNG

#### 1. Mục tiêu kỹ thuật
Thiết lập bộ khung dự án Fullstack chuẩn công nghiệp đáp ứng 10 tiêu chí đánh giá, phân chia module rõ ràng giữa Giao diện người dùng (React 18 + Vite), Máy chủ ứng dụng (Python FastAPI) và Cơ sở dữ liệu JSON gọn nhẹ.

#### 2. Phân tích Hiện trạng ban đầu
AI khởi tạo mã nguồn backend và frontend độc lập. Tuy nhiên, khi đưa vào vận hành thử nghiệm trên môi trường Windows phát sinh 3 trở ngại lớn:
- Xung đột công cụ nền tảng do khoảng trắng trong đường dẫn tài khoản người dùng (`C:\Users\DUNG VU`).
- FastAPI ban đầu chỉ hoạt động như một API Provider thuần túy ở cổng 8000, chưa có cơ chế phục vụ gói build giao diện tĩnh của React SPA.
- Bảng mã xuất console trên hệ điều hành Windows bị lỗi font tiếng Việt khi in log máy chủ.

#### 3. Gói Tinh chỉnh Logic Chuyên sâu của Sinh viên
Sinh viên đã xâu chuỗi các vấn đề môi trường thành **Gói tinh chỉnh hạ tầng đồng bộ**:

```
[Vấn đề Môi trường]                                   [Giải pháp Kỹ thuật của Sinh viên]
1. Telemetry Plugin xung đột khoảng trắng đường dẫn ──► Viết lệnh PowerShell gỡ bỏ triệt để plugin
2. Client & Server tách rời 2 cổng khác nhau        ──► Tái cấu trúc main.py mount StaticFiles của React build
3. Xung đột chiếm dụng cổng mạng khi restart        ──► Tự động hóa kiểm tra & kill process cổng 3000
4. Lỗi hiển thị console log tiếng Việt trên Windows ──► Cấu hình mã hóa sys.stdout sang chuẩn UTF-8
```

- **Mã nguồn giải pháp tiêu biểu trong `main.py`:**
  ```python
  # Tích hợp phục vụ Single Page Application trên cùng một cổng 3000
  app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dist, "assets")), name="assets")
  
  @app.get("/{full_path:path}")
  async def serve_spa(full_path: str):
      # Chuyển tiếp toàn bộ client route về index.html để React Router xử lý
      file_path = os.path.join(frontend_dist, full_path)
      if os.path.isfile(file_path):
          return FileResponse(file_path)
      return FileResponse(os.path.join(frontend_dist, "index.html"))
  ```
- **Kết quả nghiệm thu:** Toàn bộ hệ thống khởi động hoàn hảo chỉ bằng một lệnh `python main.py`, tự động mở trình duyệt tại `http://localhost:3000` mà không phát sinh bất kỳ lỗi cổng hay xung đột môi trường nào.

---

### GIAI ĐOẠN 2 — TÁI CẤU TRÚC KHO SÁCH & NGHIỆP VỤ MƯỢN TRẢ REAL-TIME

#### 1. Mục tiêu kỹ thuật
Hoàn thiện 100% nghiệp vụ CRUD kho sách, thiết kế luồng duyệt mượn trực tiếp trên thanh thông báo và loại bỏ hoàn toàn độ trễ hiển thị dữ liệu giữa các vai trò người dùng.

#### 2. Phân tích Hiện trạng ban đầu
- Giao diện kho sách do AI sinh ra ban đầu chỉ có dạng lưới thẻ (Card View), thích hợp cho bạn đọc tra cứu nhưng bất tiện cho Quản trị viên cần bao quát số lượng tồn kho, số đang mượn và thao tác sửa/xóa hàng loạt.
- Tồn tại thành phần "Phiếu in" đơn lẻ không ăn khớp với luồng làm việc số hóa.
- **Lỗi lệch pha dữ liệu nghiêm trọng (UI Desynchronization):** Khi Quản trị viên bấm Duyệt một yêu cầu mượn sách, thông báo đã được đánh dấu là xử lý nhưng giao diện bên phía Độc giả vẫn giữ nguyên trạng thái "Chờ duyệt", buộc độc giả phải bấm F5 thủ công để thấy sách được duyệt.

#### 3. Gói Tinh chỉnh Logic Chuyên sâu của Sinh viên
Sinh viên đã định hướng giải pháp thông qua **Gói tinh chỉnh nghiệp vụ kho & đồng bộ dữ liệu thời gian thực**:

1. **Chuẩn hóa Giao diện Quản trị Kho sách:**
   - Xây dựng chế độ hiển thị kép (Toggle View): Chế độ Thẻ (Grid) dành cho độc giả xem bìa bắt mắt và Chế độ Bảng (Table) dành cho quản trị viên với các cột ID, Tên sách, Tác giả, Thể loại, Tổng kho, Đang mượn, Sẵn có và Cột tác vụ căn phải rõ ràng.
   - Loại bỏ triệt để khối component "Phiếu in" dư thừa, dọn dẹp sạch sẽ state và hàm xử lý liên quan.
2. **Kiến trúc Đồng bộ Dữ liệu Tức thì (Optimistic UI & CustomEvent Broadcast):**
   - Thay vì chờ đợi phản hồi từ máy chủ, giao diện áp dụng kỹ thuật **Optimistic UI Update (0ms)**: Cập nhật ngay state React của nút bấm và bảng dữ liệu, tạo cảm giác mượt mà tức thì cho người dùng.
   - Xây dựng kênh phát tín hiệu toàn cục thông qua `CustomEvent ('smartlib:data-updated')`:
     ```javascript
     // api.js - Phát thông điệp khi có bất kỳ thay đổi dữ liệu nào
     export const notifyDataUpdated = (type = 'all') => {
       if (typeof window !== 'undefined') {
         window.dispatchEvent(new CustomEvent('smartlib:data-updated', { 
           detail: { type, timestamp: Date.now() } 
         }));
         localStorage.setItem('smartlib_last_update', JSON.stringify({ type, timestamp: Date.now() }));
       }
     };
     ```
   - Tất cả các component liên quan (`AdminDashboard`, `ReaderPortal`, `NotificationDropdown`) đăng ký lắng nghe sự kiện để tự động re-fetch ngầm mà không làm gián đoạn trải nghiệm người dùng.
- **Kết quả nghiệm thu:** Khi Admin nhấn "Duyệt" phiếu mượn, sách trong kho tự động trừ 1, thông báo được cập nhật và màn hình của Độc giả ngay lập tức chuyển sang trạng thái "Đang mượn" trong tích tắc mà không cần reload trang.

---

### GIAI ĐOẠN 3 — HỆ THỐNG THỐNG KÊ, BÁO CÁO & XUẤT TỆP TIN CHUẨN DOANH NGHIỆP

#### 1. Mục tiêu kỹ thuật
Cung cấp trung tâm phân tích số liệu KPI hoạt động của thư viện và xây dựng module xuất dữ liệu đa định dạng (Excel, PDF, CSV) phục vụ lưu trữ văn bản chính quy.

#### 2. Phân tích Hiện trạng ban đầu
- Nút tác vụ ban đầu mang tên "In báo cáo", gây hiểu lầm là in trực tiếp ra máy in vật lý thay vì kết xuất tệp số.
- Khi xuất danh sách độc giả sang tệp CSV, mở bằng Microsoft Excel trên hệ điều hành Windows gặp hiện tượng lỗi bảng mã (vỡ font tiếng Việt có dấu).
- Phiếu mượn xuất ra định dạng PDF chỉ chứa văn bản thô sơ, thiếu tính bảo mật và không hỗ trợ kiểm tra đối soát nhanh trên thiết bị cầm tay.
- Máy chủ thiếu các thư viện Python chuyên biệt dẫn đến lỗi HTTP 500 khi người dùng thực hiện xuất file.

#### 3. Gói Tinh chỉnh Logic Chuyên sâu của Sinh viên
Sinh viên đã thiết kế **Gói tinh chỉnh báo cáo số hóa đa kênh**:

1. **Chuẩn hóa Định danh Tác vụ:** Đổi toàn bộ nhãn hành động thành "Xuất báo cáo" (Export Report) thể hiện chính xác bản chất trích xuất dữ liệu.
2. **Kỹ thuật Chèn UTF-8 BOM (`\ufeff`) cho CSV:**
   - Sinh viên phân tích cơ chế nhận diện bảng mã của Microsoft Excel: Excel mặc định dùng mã hóa ANSI nếu tệp CSV không có Byte Order Mark.
   - Giải pháp: Chèn tiền tố `b'\xef\xbb\xbf'` vào đầu luồng dữ liệu byte trước khi trả về client:
     ```python
     # export_service.py
     def generate_readers_csv(readers: list) -> bytes:
         output = io.StringIO()
         # Chèn BOM để Excel tự động mở đúng tiếng Việt
         output.write('\ufeff')
         writer = csv.writer(output)
         writer.writerow(["Mã ĐG", "Họ Tên", "Tên Đăng Nhập", "Email", "SĐT", "Địa Chỉ"])
         for r in readers:
             writer.writerow([f"DG-{r['id']:03d}", r['fullName'], r['username'], r['email'], r['phone'], r['address']])
         return output.getvalue().encode('utf-8')
     ```
3. **Tích hợp Mã QR Code Động vào Phiếu mượn PDF:**
   - Dùng thư viện `qrcode` sinh mã ảnh PNG chứa thông tin định danh phiếu: `{borrowId, bookTitle, readerName, dueDate}`.
   - Dùng `reportlab` vẽ layout phiếu mượn chuẩn phong cách thư viện hiện đại: Tiêu đề trang trọng, khung chi tiết người mượn, bảng thông tin sách và nhúng ảnh QR Code ở góc phải phục vụ quét bằng điện thoại.
4. **Báo cáo Excel Định dạng Chuyên nghiệp:** Sử dụng `openpyxl` tô màu tiêu đề bảng (Header Fill), kẻ viền ô (Borders) và tự động tính toán độ rộng cột (Auto column-width) khớp với độ dài dữ liệu.
- **Kết quả nghiệm thu:** Xuất thành công cả 3 định dạng Excel (.xlsx), CSV (.csv chuẩn font tiếng Việt) và PDF (.pdf tích hợp mã QR tra cứu di động).

---

### GIAI ĐOẠN 4 — TRỢ LÝ AI & TRẢI NGHIỆM GIAO DIỆN PHẲNG TINH TẾ (UI/UX)

#### 1. Mục tiêu kỹ thuật
Tích hợp Trợ lý Trí tuệ Nhân tạo thông minh vào góc màn hình ứng dụng, mang lại cảm giác đối thoại ấm áp, sinh động như đang trò chuyện với một thủ thư thực thụ, đồng thời đảm bảo tính thẩm mỹ của giao diện hiện đại.

#### 2. Phân tích Hiện trạng ban đầu
Qua 5 vòng kiểm thử trực quan, sinh viên phát hiện các điểm chưa hoàn thiện của widget chat ban đầu do AI sinh ra:
- Sử dụng ảnh bitmap bên ngoài làm icon AI khiến giao diện thiếu tính đồng bộ và tải chậm.
- Dòng chữ giới thiệu hiển thị cố định liên tục, choán tầm nhìn và che khuất thông tin các thẻ sách ở góc phải.
- Khung nhập câu hỏi có khung viền dày thô cứng; khi người dùng nhấp chuột (focus), trình duyệt tự động vẽ một đường viền xanh bao quanh (`focus outline`) rất mất thẩm mỹ.
- AI trả lời quá nhanh (gần như tức thì) bằng câu chữ khô cứng, thiếu cảm giác tự nhiên của quá trình tư duy tra cứu mục lục sách.
- Khi không có API Key hoặc mất mạng, khung chat bị treo hoặc báo lỗi console khiến trải nghiệm bị gián đoạn.

#### 3. Gói Tinh chỉnh Logic Chuyên sâu của Sinh viên
Sinh viên đã hợp nhất toàn bộ yêu cầu hiệu chỉnh thành **Gói tinh chỉnh trải nghiệm AI & Giao diện phẳng (Borderless Flat UX)**:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│              GÓI TINH CHỈNH TRẢI NGHIỆM TRỢ LÝ AI TOÀN DIỆN                 │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. Nhận diện Vector sắc nét:                                                │
│    Khôi phục biểu tượng Bot SVG vector nội bộ, tối ưu kích thước < 2KB,    │
│    đảm bảo hiển thị sắc nét hoàn hảo trên mọi độ phân giải màn hình.       │
│                                                                             │
│ 2. Banner gợi ý thông minh tự thu gọn (7s Auto-dismiss):                    │
│    Thông điệp "Bạn cần tôi giúp đỡ gì không? ✨" tự xuất hiện trong 7 giây  │
│    đầu để mời gọi tương tác, sau đó tự thu gọn vào icon tròn; khi người     │
│    dùng hover chuột vào nút AI, banner sẽ mở rộng mượt mà trở lại.          │
│                                                                             │
│ 3. Thiết kế phẳng không viền (Borderless Input UX):                        │
│    Xóa bỏ toàn bộ border và box-shadow bao quanh ô input; loại bỏ dòng chú  │
│    thích phụ rườm rà dưới chân widget để tạo không gian thoáng đãng.        │
│                                                                             │
│ 4. Triệt tiêu hoàn toàn hiệu ứng Focus xanh mặc định:                      │
│    Bổ sung lớp CSS chuyên biệt với cơ chế can thiệp tuyệt đối:              │
│    .ai-chat-input { outline: none !important; box-shadow: none !important; }│
│                                                                             │
│ 5. Nhịp điệu suy nghĩ tự nhiên (5s Cognitive Bouncing Dots):               │
│    Tạo animation 3 dấu chấm chuyển động nhịp nhàng trong đúng 5 giây,      │
│    mô phỏng nhịp điệu thủ thư đang tiếp nhận câu hỏi và tra cứu mục lục.    │
│                                                                             │
│ 6. Hệ thống Tri thức Nội bộ Dự phòng (Smart Fallback Engine):              │
│    Xây dựng kho 15+ kịch bản đối thoại bằng tiếng Việt ấm áp ("mình-bạn"),  │
│    đảm bảo AI luôn phản hồi thông minh, có nghĩa ngay cả khi offline.      │
└─────────────────────────────────────────────────────────────────────────────┘
```

- **Kết quả nghiệm thu:** Widget AI đạt độ hoàn thiện cao về mỹ thuật, giao diện phẳng tinh tế không tì vết, không có viền xanh khó chịu khi focus, hoạt họa 5 giây tự nhiên và phản hồi thông minh trong mọi điều kiện mạng.

---

### GIAI ĐOẠN 5 — RÀNG BUỘC TOÀN VẸN DỮ LIỆU & LẬP TRÌNH PHÒNG THỦ (CRASH PREVENTION)

#### 1. Mục tiêu kỹ thuật
Nâng cao tính ổn định của hệ thống theo nguyên tắc Lập trình phòng thủ (Defensive Programming), bảo đảm tính toàn vẹn dữ liệu giữa các bảng và loại bỏ 100% các hộp thoại popup mặc định gây gián đoạn luồng người dùng.

#### 2. Phân tích Hiện trạng ban đầu
- Trong module quản lý độc giả, chức năng xóa sử dụng hàm `window.confirm()` thô sơ của trình duyệt.
- **Lỗ hổng toàn vẹn dữ liệu (Referential Integrity Violation):** Quản trị viên có thể bấm xóa một tài khoản độc giả đang mượn sách hoặc đang có phiếu chờ duyệt. Hành động này khiến bản ghi mượn sách bị mồ côi (không còn chủ thể người mượn), làm sai lệch hoàn toàn thống kê kho sách.
- Khi một cuốn sách có số lượng sẵn có `available <= 0`, nút "Mượn sách" vẫn cho phép người dùng click, dẫn đến số lượng sách trong kho bị âm (`available = -1`).

#### 3. Gói Tinh chỉnh Logic Chuyên sâu của Sinh viên
Sinh viên đã triển khai **Gói tinh chỉnh kiểm soát toàn vẹn & chuẩn hóa Modal nội bộ**:

1. **Kiểm tra Ràng buộc Khóa ngoại & Tồn kho Trước khi Xóa:**
   - Xây dựng hàm kiểm tra ràng buộc logic trong `AdminDashboard.jsx`:
     ```javascript
     const handleConfirmDeleteReader = async () => {
       if (!readerToDelete) return;
       // Kiểm tra độc giả có giao dịch mượn sách chưa hoàn tất hay không
       const activeBorrows = borrowRecords.filter(r => 
         r.userId === readerToDelete.id && 
         ['Approved', 'Pending'].includes(r.status)
       );
       if (activeBorrows.length > 0) {
         setDeleteReaderError(
           `Không thể xóa độc giả này! Hiện độc giả đang có ${activeBorrows.length} cuốn sách đang mượn hoặc chờ duyệt. Vui lòng thu hồi sách trước khi xóa.`
         );
         return;
       }
       // Thực hiện xóa an toàn nếu không có ràng buộc
       await api.deleteReader(readerToDelete.id);
       ...
     };
     ```
   - Chặn xóa sách trong kho nếu sách đó đang nằm trong danh sách các phiếu mượn chưa trả.
2. **Khóa Tồn kho Tự động (Inventory Guard):**
   - Kiểm tra `available <= 0`: Nút "Mượn sách" tự động chuyển sang màu xám, bị khóa thuộc tính `disabled={true}` và hiển thị nhãn "Hết sách", ngăn chặn triệt để lỗi số lượng âm.
3. **Loại bỏ 100% Popup Trình duyệt (`alert/confirm`):**
   - Xây dựng component Custom Confirmation Modal nội bộ có biểu tượng cảnh báo hình tam giác vàng, hiển thị rõ tên đối tượng cần xóa, nút "Hủy bỏ" và "Xác nhận xóa" với hiệu ứng làm mờ nền (backdrop blur).
   - Mọi thông báo kết quả chuyển sang dạng **Toast Notification** tự động hiển thị ở góc màn hình và tự mờ dần sau 3.5 giây.
- **Kết quả nghiệm thu:** 100% thao tác trong ứng dụng diễn ra liền mạch, không còn bất kỳ popup thô sơ nào của trình duyệt, CSDL được bảo vệ toàn vẹn tuyệt đối trước các thao tác vô ý của người quản trị.

---

### GIAI ĐOẠN 6 — ĐỘT PHÁ KIẾN TRÚC DUAL-MODE, DEVOPS & CHUẨN HÓA TÀI LIỆU

#### 1. Mục tiêu kỹ thuật
Đảm bảo hệ thống có thể triển khai linh hoạt trên cả môi trường máy chủ cục bộ (Fullstack Localhost / Docker) lẫn môi trường máy chủ tĩnh (GitHub Pages), đồng thời chuẩn hóa bộ tài liệu kỹ thuật hoàn chỉnh và đóng gói Docker chạy ngay.

#### 2. Phân tích Hiện trạng ban đầu
- **Thách thức môi trường GitHub Pages:** GitHub Pages là dịch vụ lưu trữ web tĩnh (chỉ phục vụ HTML/CSS/JS), không thể chạy mã Python FastAPI. Khi người dùng bấm "Trả sách" hay "Đăng ký tài khoản" trên GitHub Pages, trình duyệt gọi API `http://localhost:3000/api/...` và lập tức nhận lỗi mạng `Failed to fetch`.
- Tài liệu dự án trước đây bị phân mảnh (nhiều tệp báo cáo nghiệm thu rời rạc, có chỗ dùng từ "Đồ án" chưa chuyên nghiệp, thiếu tính liên kết giữa các file đặc tả).
- Quá trình build Docker trước đây gặp lỗi sai lệch đường dẫn tương đối khi sao chép mã nguồn React vào image Python.

#### 3. Gói Tinh chỉnh Logic Chuyên sâu của Sinh viên
Sinh viên đã thiết kế **Gói giải pháp kiến trúc Dual-Mode & Tối ưu hóa Triển khai**:

```
                              ┌──────────────────────────────┐
                              │     SMARTLIB API CLIENT      │
                              │     (frontend/services/api)  │
                              └──────────────┬───────────────┘
                                             │
                     Kiểm tra hostname: window.location.hostname
                                             │
                    ┌────────────────────────┴────────────────────────┐
                    ▼                                                 ▼
          [ Hostname: localhost ]                           [ Hostname: github.io ]
        FastAPI Backend Mode                             LocalStorage Sync Engine Mode
        • Gọi REST API cổng 3000                         • Không cần Python backend
        • Đọc/ghi data/database.json                     • Quản lý qua DB_VERSION
        • Sinh file Excel, PDF, QR                       • Phản hồi 0ms Optimistic UI
        • Dữ liệu tập trung máy chủ                      • Dữ liệu lưu bền vững browser
```

1. **Đột phá Kiến trúc Dual-Mode Persistence:**
   - Xây dựng cơ chế tự nhận diện môi trường trong `api.js`: Khi phát hiện ứng dụng đang chạy trên `github.io` hoặc giao thức `file:`, hệ thống tự động kích hoạt **LocalStorage Sync Engine** với phiên bản chuẩn hóa `DB_VERSION = 'v5_clean_sync_2026'`.
   - Toàn bộ các thao tác Đăng ký tài khoản, Thêm sách, Sửa sách, Xóa sách, Mượn sách và Trả sách đều được xử lý cục bộ và lưu bền vững trong `localStorage`. Độc giả F5 lại trang thì dữ liệu đã mượn/trả vẫn được giữ nguyên vẹn 100%.
2. **Đóng gói Docker Multi-stage Tối ưu:**
   - Xây dựng `Dockerfile` 2 giai đoạn: Giai đoạn 1 dùng `node:20-alpine` biên dịch React; Giai đoạn 2 dùng `python:3.11-slim` sao chép bản build tĩnh và khởi chạy FastAPI server.
   - Viết `docker-compose.yml` với cấu hình mount volume `./data:/app/data` giúp bảo toàn toàn bộ dữ liệu sách và bạn đọc ngay cả khi container bị hủy hoặc tạo mới.
3. **Chuẩn hóa Hệ thống Tài liệu Kỹ thuật Dự án:**
   - Thay thế toàn bộ 14 lần xuất hiện từ "Đồ án" thành "Dự án" trên toàn hệ thống tài liệu.
   - Xóa bỏ các tệp báo cáo rời rạc, hợp nhất toàn bộ Báo cáo nghiệm thu 10 tiêu chí vào [`README.md`](../README.md).
   - Tinh gọn thư mục `docs/` chứa **DUY NHẤT 4 file đặc tả chuyên sâu**:
     1. [`docs/requirements.md`](requirements.md): Đặc tả yêu cầu phần mềm SRS (35 yêu cầu F01-F35).
     2. [`docs/use_cases.md`](use_cases.md): Đặc tả 18 ca sử dụng chi tiết kèm sơ đồ Actor-UC.
     3. [`docs/database_design.md`](database_design.md): Thiết kế CSDL JSON, ERD và schema 4 bảng.
     4. [`docs/ai_log.md`](ai_log.md): Toàn văn nhật ký Prompt AI và các gói tinh chỉnh logic.
   - Bổ sung thanh điều hướng chéo ở đầu tất cả các tệp tài liệu, tạo sự liên kết liền mạch.
- **Kết quả nghiệm thu:** Ứng dụng hoạt động trơn tru trên cả máy chủ cục bộ lẫn đường dẫn trực tuyến GitHub Pages [https://dvuwebon.github.io/Thuvien/](https://dvuwebon.github.io/Thuvien/), bộ 3 file Docker chạy ngay với 1 lệnh, hệ thống tài liệu chuẩn mực và chuyên nghiệp.

---

## 4. TỔNG HỢP 10 SỰ CỐ KỸ THUẬT & GIẢI PHÁP ĐÃ XỬ LÝ

| # | Tên Sự cố Kỹ thuật | Biểu hiện Thực tế & Nguyên nhân Gốc | Giải pháp Xử lý Chuyên sâu |
| :---: | :--- | :--- | :--- |
| **1** | **Xung đột Plugin IDE** | Lệnh terminal PowerShell bị chặn do đường dẫn `C:\Users\DUNG VU` chứa khoảng trắng. | Viết lệnh xóa tận gốc thư mục plugin telemetry xung đột trong cấu hình IDE. |
| **2** | **Lỗi Cross-Origin (CORS)** | Trình duyệt từ chối request API giữa React (5173) và FastAPI (8000). | Tích hợp `CORSMiddleware` với `allow_origins=["*"]` và gộp phục vụ chung cổng 3000. |
| **3** | **Lỗi Mạng trên GitHub Pages** | Thao tác Trả sách bị lỗi `Failed to fetch` vì GitHub Pages không có runtime Python. | Phát minh kiến trúc **Dual-Mode**: Tự chuyển sang LocalStorage Sync Engine với phiên bản `DB_VERSION`. |
| **4** | **Lệch pha Dữ liệu Đa tab** | Admin duyệt phiếu mượn nhưng màn hình Độc giả vẫn ghi "Chờ duyệt", phải F5. | Triển khai **Optimistic UI (0ms)** và phát thông điệp toàn cục qua `CustomEvent ('smartlib:data-updated')`. |
| **5** | **Lỗi Font Tiếng Việt trong CSV** | Mở tệp CSV danh sách độc giả trên Excel bị lỗi bảng mã ký tự có dấu. | Chèn ký tự **UTF-8 BOM (`\ufeff`)** vào đầu chuỗi byte dữ liệu trước khi tải xuống. |
| **6** | **Thiếu Thư viện Sinh tệp tin** | Bấm xuất PDF/Excel bị lỗi HTTP 500 do thiếu module `reportlab`, `openpyxl`, `qrcode`. | Cập nhật file `requirements.txt` chuẩn hóa và cài đặt đầy đủ dependencies. |
| **7** | **Popup Trình duyệt Gián đoạn** | Dùng `window.confirm/alert` gây xấu giao diện và gián đoạn luồng người dùng. | Thay 100% bằng Custom Dialog Modal có backdrop blur và Toast Notification tự ẩn sau 3.5s. |
| **8** | **Nguy cơ Dữ liệu Mồ côi** | Xóa tài khoản độc giả đang mượn sách làm sai lệch dữ liệu tồn kho. | Viết hàm kiểm tra ràng buộc toàn vẹn: chặn xóa độc giả/sách có phiếu mượn đang hoạt động. |
| **9** | **Xung đột Cổng Mạng (Port 3000)** | Khi khởi động lại máy chủ gặp lỗi socket "Address already in use". | Tự động hóa câu lệnh PowerShell dò tìm và ngắt tiến trình đang chiếm dụng cổng 3000. |
| **10** | **Lỗi Đường dẫn Build Docker** | Docker build thất bại do đường dẫn tương đối giữa mã nguồn frontend và backend. | Chuẩn hóa Dockerfile Multi-stage build với các chỉ thị `COPY` từ build-stage chính xác. |

---

## 5. THỐNG KÊ TỔNG KẾT & BÀI HỌC KINH NGHIỆM

- ⏱️ **Thời gian phát triển tập trung:** 2 ngày (03/09/2026 – 04/09/2026).
- 💬 **Số lượt tương tác & tinh chỉnh:** Hơn 80 vòng trao đổi kỹ thuật có định hướng.
- 📦 **Quy mô mã nguồn hệ thống:** > 5.000 dòng mã nguồn tiêu chuẩn (React 18 + Python FastAPI).
- 📑 **Hệ sinh thái tài liệu:** 4 tệp tài liệu đặc tả chuyên sâu trong `docs/` + 1 tệp tổng quan toàn diện [`README.md`](../README.md).
- 🏆 **Mức độ hoàn thiện:** Đáp ứng xuất sắc và trọn vẹn **10/10 tiêu chí đánh giá chất lượng phần mềm**.

### Bài học Đắt giá về Phương pháp Phát triển cùng AI:
1. **AI là trợ thủ tăng tốc, con người là người kiến tạo:** AI sinh code rất nhanh nhưng thường bỏ qua các ràng buộc biên, ngữ cảnh thực tế của hệ điều hành và tính toàn vẹn dữ liệu. Sự kiểm tra kỹ lưỡng của sinh viên là yếu tố quyết định chất lượng phần mềm.
2. **Giá trị của việc Gom cụm Logic (Logical Grouping):** Khi đưa ra các chỉ dẫn tinh chỉnh lớn có cấu trúc thay vì các câu lệnh chắp vá, AI hiểu ngữ cảnh sâu hơn và sinh ra mã nguồn sạch sẽ, không bị phân mảnh.
3. **Thực nghiệm là chân lý:** Không bao giờ tin tưởng code AI sinh ra cho đến khi chạy thử thực tế trên nhiều môi trường khác nhau (Windows, Docker, GitHub Pages, Chrome, Edge).

---

*Tài liệu này là minh chứng chính thức về việc ứng dụng Trí tuệ Nhân tạo có phương pháp, có kiểm soát và có tư duy phản biện kỹ thuật cao trong suốt quá trình phát triển Dự án SmartLib.*
