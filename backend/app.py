import os
import sys

# Ensure backend dir is in sys.path
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from fastapi import FastAPI, HTTPException, Depends, Query, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response, StreamingResponse
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
import io

from database import db_manager
from models import (
    LoginRequest, RegisterRequest, UpdateProfileRequest, ChangePasswordRequest,
    BookCreate, BookUpdate, ReaderCreate, ReaderUpdate,
    BorrowRequestCreate, BorrowStatusUpdate, NotificationReadRequest
)
from export_service import (
    generate_books_excel, generate_borrows_excel, generate_readers_csv,
    generate_borrow_receipt_pdf, generate_qr_code
)

app = FastAPI(
    title="SmartLib API",
    description="Backend API cho Hệ thống Quản lý Thư viện Thông minh SmartLib",
    version="2.0.0"
)

# CORS setup for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
def health_check():
    return {"status": "ok", "timestamp": datetime.now().isoformat(), "service": "SmartLib Python Backend"}

# ================= AUTHENTICATION =================
@app.post("/api/auth/login")
def login(req: LoginRequest):
    db = db_manager.load_db()
    users = db.get("users", [])
    username = req.username.strip().lower()
    user = next((u for u in users if u.get("username", "").lower() == username and u.get("password") == req.password), None)
    
    if not user:
        if req.username == "admin" and req.password == "123":
            user = next((u for u in users if u.get("username") == "admin"), None)
        elif req.username in ["reader", "docgia"] and req.password == "123":
            user = next((u for u in users if u.get("username") == "reader"), None)

    if not user:
        raise HTTPException(status_code=401, detail="Tên đăng nhập hoặc mật khẩu không chính xác!")

    user_data = {
        "id": user.get("id"),
        "UserID": user.get("id"),
        "username": user.get("username"),
        "fullName": user.get("fullName"),
        "FullName": user.get("fullName"),
        "role": user.get("role", "Reader"),
        "Role": user.get("role", "Reader"),
        "email": user.get("email", ""),
        "phone": user.get("phone", ""),
        "address": user.get("address", ""),
        "birthDate": user.get("birthDate")
    }
    return {"message": "Đăng nhập thành công!", "user": user_data}


@app.post("/api/auth/register", status_code=201)
def register(req: RegisterRequest):
    db = db_manager.load_db()
    users = db.get("users", [])
    
    if any(u.get("username", "").lower() == req.username.strip().lower() for u in users):
        raise HTTPException(status_code=400, detail="Tên đăng nhập này đã được sử dụng. Vui lòng chọn tên khác!")

    new_id = max([int(u.get("id", 0)) for u in users], default=0) + 1
    new_user = {
        "id": new_id,
        "username": req.username.strip(),
        "password": req.password,
        "fullName": req.fullName.strip(),
        "role": "Reader",
        "phone": req.phone.strip(),
        "email": req.email.strip() if req.email else "",
        "address": req.address.strip() if req.address else "",
        "birthDate": req.birthDate,
        "isActive": True
    }
    users.append(new_user)
    db["users"] = users
    db_manager.save_db(db)

    db_manager.add_notification(
        recipient_role="Admin",
        title="Độc giả mới đăng ký",
        message=f"Độc giả {new_user['fullName']} (@{new_user['username']}) vừa tạo tài khoản trên hệ thống.",
        notif_type="reader_registered",
        meta={"readerId": new_id, "readerName": new_user['fullName']}
    )

    user_data = {
        "id": new_id,
        "UserID": new_id,
        "username": new_user["username"],
        "fullName": new_user["fullName"],
        "FullName": new_user["fullName"],
        "role": "Reader",
        "Role": "Reader",
        "email": new_user["email"],
        "phone": new_user["phone"],
        "address": new_user["address"],
        "birthDate": new_user["birthDate"]
    }
    return {"message": "Đăng ký thành công!", "user": user_data}


@app.put("/api/auth/profile/{user_id}")
def update_profile(user_id: int, req: UpdateProfileRequest):
    db = db_manager.load_db()
    users = db.get("users", [])
    user = next((u for u in users if int(u.get("id", 0)) == user_id), None)
    if not user:
        raise HTTPException(status_code=404, detail="Không tìm thấy người dùng.")

    if req.fullName is not None:
        user["fullName"] = req.fullName.strip()
    if req.email is not None:
        user["email"] = req.email.strip()
    if req.phone is not None:
        user["phone"] = req.phone.strip()
    if req.address is not None:
        user["address"] = req.address.strip()
    if req.birthDate is not None:
        user["birthDate"] = req.birthDate

    db_manager.save_db(db)
    return {"message": "Cập nhật thông tin thành công!", "user": user}


@app.post("/api/auth/change-password/{user_id}")
def change_password(user_id: int, req: ChangePasswordRequest):
    db = db_manager.load_db()
    users = db.get("users", [])
    user = next((u for u in users if int(u.get("id", 0)) == user_id), None)
    if not user:
        raise HTTPException(status_code=404, detail="Không tìm thấy người dùng.")

    if user.get("password") != req.currentPassword:
        raise HTTPException(status_code=400, detail="Mật khẩu hiện tại không chính xác!")

    if len(req.newPassword) < 3:
        raise HTTPException(status_code=400, detail="Mật khẩu mới phải có ít nhất 3 ký tự.")

    user["password"] = req.newPassword
    db_manager.save_db(db)
    return {"message": "Đổi mật khẩu thành công!"}


# ================= BOOKS =================
@app.get("/api/books")
def get_books():
    db = db_manager.load_db()
    books = db.get("books", [])
    borrow_records = db.get("borrowRecords", [])
    
    result = []
    for b in books:
        b_id = int(b.get("id", 0))
        active_borrowed = sum(
            1 for r in borrow_records 
            if int(r.get("bookId", 0)) == b_id and r.get("status") in ["Đang mượn", "Quá hạn"]
        )
        item = dict(b)
        item["borrowed"] = active_borrowed
        result.append(item)
    return result


@app.post("/api/books", status_code=201)
def create_book(req: BookCreate):
    if not req.title.strip() or req.quantity < 1:
        raise HTTPException(status_code=400, detail="Vui lòng nhập tên sách và số lượng hợp lệ.")

    db = db_manager.load_db()
    books = db.get("books", [])
    new_id = max([int(b.get("id", 0)) for b in books], default=0) + 1
    
    new_book = {
        "id": new_id,
        "title": req.title.strip(),
        "author": req.author.strip() if req.author else "Chưa rõ",
        "category": req.category if req.category else "Khác",
        "quantity": int(req.quantity),
        "desc": req.desc or "",
        "imageUrl": req.imageUrl,
        "borrowed": 0
    }
    books.insert(0, new_book)
    db["books"] = books
    db_manager.save_db(db)
    return {"message": "Đã thêm sách mới thành công!", "book": new_book}


@app.put("/api/books/{book_id}")
def update_book(book_id: int, req: BookUpdate):
    db = db_manager.load_db()
    books = db.get("books", [])
    book = next((b for b in books if int(b.get("id", 0)) == book_id), None)
    if not book:
        raise HTTPException(status_code=404, detail="Không tìm thấy sách.")

    if req.title is not None:
        book["title"] = req.title.strip()
    if req.author is not None:
        book["author"] = req.author.strip()
    if req.category is not None:
        book["category"] = req.category
    if req.quantity is not None:
        book["quantity"] = int(req.quantity)
    if req.desc is not None:
        book["desc"] = req.desc
    if req.imageUrl is not None:
        book["imageUrl"] = req.imageUrl

    db_manager.save_db(db)
    return {"message": "Đã cập nhật thông tin sách thành công!", "book": book}


@app.delete("/api/books/{book_id}")
def delete_book(book_id: int):
    db = db_manager.load_db()
    books = db.get("books", [])
    borrow_records = db.get("borrowRecords", [])

    is_borrowed = any(
        int(r.get("bookId", 0)) == book_id and r.get("status") in ["Đang mượn", "Quá hạn"]
        for r in borrow_records
    )
    if is_borrowed:
        raise HTTPException(status_code=400, detail="Không thể xóa sách vì đang có độc giả mượn chưa trả!")

    idx = next((i for i, b in enumerate(books) if int(b.get("id", 0)) == book_id), -1)
    if idx == -1:
        raise HTTPException(status_code=404, detail="Không tìm thấy sách.")

    books.pop(idx)
    db["books"] = books
    db_manager.save_db(db)
    return {"message": "Đã xóa sách khỏi hệ thống."}


# ================= READERS =================
@app.get("/api/readers")
def get_readers():
    db = db_manager.load_db()
    users = db.get("users", [])
    readers = [
        {
            "id": u.get("id"),
            "fullName": u.get("fullName"),
            "username": u.get("username"),
            "birthDate": u.get("birthDate"),
            "email": u.get("email"),
            "phone": u.get("phone"),
            "address": u.get("address")
        }
        for u in users if u.get("role") == "Reader"
    ]
    return readers


@app.post("/api/readers", status_code=201)
def create_reader(req: ReaderCreate):
    db = db_manager.load_db()
    users = db.get("users", [])
    new_id = max([int(u.get("id", 0)) for u in users], default=0) + 1
    
    username = req.username.strip() if req.username else f"reader_{new_id}"
    new_reader = {
        "id": new_id,
        "username": username,
        "password": req.password or "123",
        "fullName": req.fullName.strip(),
        "role": "Reader",
        "email": req.email.strip() if req.email else "",
        "phone": req.phone.strip() if req.phone else "",
        "address": req.address.strip() if req.address else "",
        "birthDate": req.birthDate,
        "isActive": True
    }
    users.append(new_reader)
    db["users"] = users
    db_manager.save_db(db)
    return {"message": "Đã thêm độc giả thành công!", "reader": new_reader}


@app.put("/api/readers/{reader_id}")
def update_reader(reader_id: int, req: ReaderUpdate):
    db = db_manager.load_db()
    users = db.get("users", [])
    reader = next((u for u in users if int(u.get("id", 0)) == reader_id and u.get("role") == "Reader"), None)
    if not reader:
        raise HTTPException(status_code=404, detail="Không tìm thấy độc giả.")

    if req.fullName is not None:
        reader["fullName"] = req.fullName.strip()
    if req.email is not None:
        reader["email"] = req.email.strip()
    if req.phone is not None:
        reader["phone"] = req.phone.strip()
    if req.address is not None:
        reader["address"] = req.address.strip()
    if req.birthDate is not None:
        reader["birthDate"] = req.birthDate

    db_manager.save_db(db)
    return {"message": "Đã cập nhật thông tin độc giả."}


@app.delete("/api/readers/{reader_id}")
def delete_reader(reader_id: int):
    db = db_manager.load_db()
    users = db.get("users", [])
    borrow_records = db.get("borrowRecords", [])

    has_borrows = any(
        int(r.get("readerId", 0)) == reader_id and r.get("status") in ["Đang mượn", "Quá hạn"]
        for r in borrow_records
    )
    if has_borrows:
        raise HTTPException(status_code=400, detail="Không thể xóa độc giả vì đang có sách mượn chưa trả!")

    idx = next((i for i, u in enumerate(users) if int(u.get("id", 0)) == reader_id and u.get("role") == "Reader"), -1)
    if idx == -1:
        raise HTTPException(status_code=404, detail="Không tìm thấy độc giả.")

    users.pop(idx)
    db["users"] = users
    db_manager.save_db(db)
    return {"message": "Đã xóa độc giả khỏi hệ thống."}


# ================= BORROW RECORDS =================
@app.get("/api/borrow-records")
def get_borrow_records():
    db = db_manager.load_db()
    return db.get("borrowRecords", [])


@app.post("/api/borrow-records", status_code=201)
def create_borrow_record(req: BorrowRequestCreate):
    db = db_manager.load_db()
    books = db.get("books", [])
    users = db.get("users", [])
    records = db.get("borrowRecords", [])

    book = next((b for b in books if int(b.get("id", 0)) == req.bookId), None)
    if not book:
        raise HTTPException(status_code=404, detail="Không tìm thấy sách.")

    b_type = "Mượn tại thư viện" if req.borrowType == "Mượn tại thư viện" else "Mượn về nhà"
    init_status = req.status or "Chờ duyệt"

    now = datetime.now()
    if b_type == "Mượn tại thư viện":
        due_date = now.replace(hour=23, minute=59, second=59)
    else:
        due_date = now + timedelta(days=14)

    target_user = None
    if req.userId:
        target_user = next((u for u in users if int(u.get("id", 0)) == req.userId), None)
    if not target_user and req.readerName:
        target_user = next((u for u in users if u.get("fullName", "").lower() == req.readerName.strip().lower()), None)
    if not target_user:
        target_user = next((u for u in users if u.get("role") == "Reader"), {"id": 2, "fullName": req.readerName or "Độc giả"})

    new_id = max([int(r.get("id", 0)) for r in records], default=0) + 1
    new_record = {
        "id": new_id,
        "bookId": req.bookId,
        "bookTitle": book["title"],
        "readerId": target_user["id"],
        "readerName": target_user["fullName"],
        "borrowDate": now.isoformat(),
        "returnDate": due_date.isoformat(),
        "status": init_status,
        "borrowType": b_type
    }
    records.insert(0, new_record)
    db["borrowRecords"] = records
    db_manager.save_db(db)

    db_manager.add_notification(
        recipient_role="Admin",
        title="Yêu cầu mượn sách mới",
        message=f"Độc giả {target_user['fullName']} vừa gửi yêu cầu mượn cuốn sách \"{book['title']}\" ({b_type}).",
        notif_type="borrow_request",
        meta={"recordId": new_id, "bookId": req.bookId, "bookTitle": book["title"], "readerName": target_user["fullName"]}
    )

    return {"message": "Đã gửi yêu cầu mượn sách thành công!", "record": new_record}


@app.put("/api/borrow-records/{record_id}/approve")
def approve_borrow(record_id: int):
    db = db_manager.load_db()
    records = db.get("borrowRecords", [])
    books = db.get("books", [])

    record = next((r for r in records if int(r.get("id", 0)) == record_id), None)
    if not record:
        raise HTTPException(status_code=404, detail="Không tìm thấy lượt mượn.")

    book = next((b for b in books if int(b.get("id", 0)) == int(record.get("bookId", 0))), None)
    if book:
        active_borrowed = sum(
            1 for r in records
            if int(r.get("bookId", 0)) == int(book.get("id", 0)) and r.get("status") in ["Đang mượn", "Quá hạn"]
        )
        if active_borrowed >= int(book.get("quantity", 1)):
            raise HTTPException(status_code=400, detail="Sách này đã hết số lượng sẵn có trong kho, không thể duyệt!")

    record["status"] = "Đang mượn"
    record["borrowDate"] = datetime.now().isoformat()
    db_manager.save_db(db)

    db_manager.add_notification(
        recipient_role="Reader",
        recipient_user_id=record.get("readerId"),
        title="Yêu cầu mượn sách đã được duyệt",
        message=f"Yêu cầu mượn cuốn sách \"{record.get('bookTitle')}\" của bạn đã được duyệt thành công!",
        notif_type="borrow_approved",
        meta={"recordId": record_id, "bookId": record.get("bookId"), "bookTitle": record.get("bookTitle")}
    )

    return {"message": "Đã duyệt yêu cầu mượn sách thành công!"}


@app.put("/api/borrow-records/{record_id}/reject")
def reject_borrow(record_id: int):
    db = db_manager.load_db()
    records = db.get("borrowRecords", [])
    record = next((r for r in records if int(r.get("id", 0)) == record_id), None)
    if not record:
        raise HTTPException(status_code=404, detail="Không tìm thấy lượt mượn.")

    record["status"] = "Từ chối"
    db_manager.save_db(db)

    db_manager.add_notification(
        recipient_role="Reader",
        recipient_user_id=record.get("readerId"),
        title="Yêu cầu mượn sách bị từ chối",
        message=f"Yêu cầu mượn cuốn sách \"{record.get('bookTitle')}\" của bạn không được duyệt.",
        notif_type="borrow_rejected",
        meta={"recordId": record_id, "bookId": record.get("bookId"), "bookTitle": record.get("bookTitle")}
    )

    return {"message": "Đã từ chối yêu cầu mượn sách."}


@app.put("/api/borrow-records/{record_id}/status")
def update_borrow_status(record_id: int, req: BorrowStatusUpdate):
    db = db_manager.load_db()
    records = db.get("borrowRecords", [])
    record = next((r for r in records if int(r.get("id", 0)) == record_id), None)
    if not record:
        raise HTTPException(status_code=404, detail="Không tìm thấy lượt mượn.")

    record["status"] = req.status
    if req.status == "Đã trả":
        record["actualReturnDate"] = datetime.now().isoformat()
        db_manager.add_notification(
            recipient_role="Reader",
            recipient_user_id=record.get("readerId"),
            title="Xác nhận trả sách thành công",
            message=f"Bạn đã hoàn tất trả cuốn sách \"{record.get('bookTitle')}\". Cảm ơn bạn!",
            notif_type="book_returned"
        )
        db_manager.add_notification(
            recipient_role="Admin",
            title="Độc giả đã trả sách",
            message=f"Độc giả {record.get('readerName')} đã trả cuốn sách \"{record.get('bookTitle')}\".",
            notif_type="book_returned"
        )

    db_manager.save_db(db)
    return {"message": "Cập nhật trạng thái mượn sách thành công!"}


# ================= NOTIFICATIONS =================
@app.get("/api/notifications")
def get_notifications(role: Optional[str] = Query(None), userId: Optional[int] = Query(None)):
    db = db_manager.load_db()
    notifs = db.get("notifications", [])
    
    filtered = []
    for n in notifs:
        if role == "Admin":
            if n.get("recipientRole") == "Admin":
                filtered.append(n)
        elif role == "Reader":
            if n.get("recipientRole") == "Reader":
                if not n.get("recipientUserId") or int(n.get("recipientUserId")) == int(userId or 0):
                    filtered.append(n)
        else:
            filtered.append(n)

    unread_count = sum(1 for n in filtered if not n.get("isRead"))
    return {"notifications": filtered, "unreadCount": unread_count}


@app.put("/api/notifications/{notif_id}/read")
def read_notification(notif_id: int):
    db = db_manager.load_db()
    notifs = db.get("notifications", [])
    notif = next((n for n in notifs if int(n.get("id", 0)) == notif_id), None)
    if notif:
        notif["isRead"] = True
        db_manager.save_db(db)
    return {"message": "OK"}


@app.put("/api/notifications/read-all")
def read_all_notifications(req: NotificationReadRequest):
    db = db_manager.load_db()
    notifs = db.get("notifications", [])
    for n in notifs:
        if not req.role or n.get("recipientRole") == req.role:
            if req.role != "Reader" or not req.userId or int(n.get("recipientUserId", 0)) == req.userId:
                n["isRead"] = True
    db_manager.save_db(db)
    return {"message": "OK"}


# ================= STATISTICS =================
@app.get("/api/stats")
def get_stats():
    db = db_manager.load_db()
    books = db.get("books", [])
    users = db.get("users", [])
    records = db.get("borrowRecords", [])

    total_books = len(books)
    total_copies = sum(int(b.get("quantity", 1)) for b in books)
    total_readers = sum(1 for u in users if u.get("role") == "Reader")
    
    borrowing_count = sum(1 for r in records if r.get("status") == "Đang mượn")
    overdue_count = sum(1 for r in records if r.get("status") == "Quá hạn")
    pending_count = sum(1 for r in records if r.get("status") == "Chờ duyệt")
    returned_count = sum(1 for r in records if r.get("status") == "Đã trả")

    return {
        "totalBooks": total_books,
        "totalCopies": total_copies,
        "totalReaders": total_readers,
        "borrowingCount": borrowing_count,
        "overdueCount": overdue_count,
        "pendingCount": pending_count,
        "returnedCount": returned_count
    }


# ================= FILE GENERATION & EXPORT ENDPOINTS =================
@app.get("/api/export/books/excel")
def export_books_excel():
    db = db_manager.load_db()
    books = db.get("books", [])
    records = db.get("borrowRecords", [])
    
    books_with_borrowed = []
    for b in books:
        b_id = int(b.get("id", 0))
        active_borrowed = sum(
            1 for r in records 
            if int(r.get("bookId", 0)) == b_id and r.get("status") in ["Đang mượn", "Quá hạn"]
        )
        item = dict(b)
        item["borrowed"] = active_borrowed
        books_with_borrowed.append(item)

    excel_bytes = generate_books_excel(books_with_borrowed)
    return Response(
        content=excel_bytes,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=SmartLib_DanhSachSach.xlsx"}
    )


@app.get("/api/export/borrows/excel")
def export_borrows_excel():
    db = db_manager.load_db()
    records = db.get("borrowRecords", [])
    excel_bytes = generate_borrows_excel(records)
    return Response(
        content=excel_bytes,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=SmartLib_LichSuMuonTra.xlsx"}
    )


@app.get("/api/export/readers/csv")
def export_readers_csv():
    db = db_manager.load_db()
    users = db.get("users", [])
    readers = [u for u in users if u.get("role") == "Reader"]
    csv_str = generate_readers_csv(readers)
    return Response(
        content=csv_str.encode("utf-8"),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": "attachment; filename=SmartLib_DanhSachDocGia.csv"}
    )


@app.get("/api/export/receipt/{record_id}/pdf")
def export_borrow_receipt_pdf(record_id: int):
    db = db_manager.load_db()
    records = db.get("borrowRecords", [])
    books = db.get("books", [])
    users = db.get("users", [])

    record = next((r for r in records if int(r.get("id", 0)) == record_id), None)
    if not record:
        raise HTTPException(status_code=404, detail="Không tìm thấy lượt mượn.")

    book = next((b for b in books if int(b.get("id", 0)) == int(record.get("bookId", 0))), None)
    reader = next((u for u in users if int(u.get("id", 0)) == int(record.get("readerId", 0))), None)

    pdf_bytes = generate_borrow_receipt_pdf(record, book, reader)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=PhieuMuon_SmartLib_{record_id}.pdf"}
    )


@app.get("/api/export/qr/book/{book_id}")
def export_book_qr(book_id: int):
    db = db_manager.load_db()
    books = db.get("books", [])
    book = next((b for b in books if int(b.get("id", 0)) == book_id), None)
    if not book:
        raise HTTPException(status_code=404, detail="Không tìm thấy sách.")

    qr_bytes = generate_qr_code(f"SMARTLIB-BOOK-ID:{book_id}|TITLE:{book.get('title')}")
    return Response(content=qr_bytes, media_type="image/png")


@app.get("/api/export/backup/json")
def export_backup_json():
    db = db_manager.load_db()
    json_bytes = json.dumps(db, ensure_ascii=False, indent=2).encode("utf-8")
    return Response(
        content=json_bytes,
        media_type="application/json",
        headers={"Content-Disposition": "attachment; filename=SmartLib_Database_Backup.json"}
    )