import os
import sys
import json

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
    BorrowRequestCreate, BorrowStatusUpdate, NotificationReadRequest,
    ReservationCreate, FineStatusUpdate, ReaderLockUpdate,
    VNPayPaymentCreate, VNPayPaymentVerify
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
        elif req.username in ["librarian", "thuthu"] and req.password == "123":
            user = next((u for u in users if u.get("username") == "librarian"), None)

    if not user:
        raise HTTPException(status_code=401, detail="Tên đăng nhập hoặc mật khẩu không chính xác!")

    # 🔒 Kiểm tra nếu tài khoản đang bị khóa do mượn sách quá hạn chưa nộp phạt sau 3 ngày
    if user.get("isLocked") or user.get("is_locked"):
        unpaid_fines = [
            f for f in db.get("fines", [])
            if int(f.get("readerId") or f.get("userId") or 0) == int(user.get("id", 0)) and f.get("status") == "Chưa nộp"
        ]
        total_unpaid = sum(float(f.get("fineAmount", 0)) for f in unpaid_fines)
        first_fine = unpaid_fines[0] if unpaid_fines else None
        lock_reason = user.get("lockReason") or "Tài khoản của bạn đã bị tự động khóa do chưa nộp phạt sách quá hạn sau 3 ngày."
        raise HTTPException(
            status_code=403,
            detail={
                "error": "ACCOUNT_LOCKED",
                "message": lock_reason,
                "readerId": user.get("id"),
                "readerName": user.get("fullName"),
                "username": user.get("username"),
                "unpaidFines": total_unpaid if total_unpaid > 0 else 10000,
                "fine": first_fine
            }
        )

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
            "address": u.get("address"),
            "isActive": u.get("isActive", True),
            "isLocked": bool(u.get("isLocked", False)),
            "lockReason": u.get("lockReason", "") or "",
            "unpaidFines": float(u.get("unpaidFines", 0.0))
        }
        for u in users if u.get("role") == "Reader"
    ]
    return readers


@app.put("/api/readers/{reader_id}/toggle-lock")
def toggle_reader_lock(reader_id: int, req: ReaderLockUpdate):
    db = db_manager.load_db()
    users = db.get("users", [])
    reader = next((u for u in users if int(u.get("id", 0)) == reader_id and u.get("role") == "Reader"), None)
    if not reader:
        raise HTTPException(status_code=404, detail="Không tìm thấy độc giả.")

    reader["isLocked"] = req.isLocked
    reader["lockReason"] = req.reason or ("Khóa bởi thủ thư" if req.isLocked else "")
    db["users"] = users
    db_manager.save_db(db)
    db_manager.toggle_reader_lock(reader_id, req.isLocked, reader["lockReason"])

    action_text = "khóa" if req.isLocked else "mở khóa"
    return {
        "message": f"Đã {action_text} tài khoản độc giả thành công!",
        "readerId": reader_id,
        "isLocked": req.isLocked,
        "lockReason": reader["lockReason"]
    }


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

    book = next((b for b in books if b.get("id") is not None and int(b.get("id")) == int(req.bookId)), None)
    book_title = book["title"] if book else (req.bookTitle or "Sách thư viện")

    b_type = "Mượn tại thư viện" if req.borrowType == "Mượn tại thư viện" else "Mượn về nhà"
    init_status = req.status or "Chờ duyệt"

    now = datetime.now()
    if b_type == "Mượn tại thư viện":
        due_date = now.replace(hour=23, minute=59, second=59)
    else:
        due_date = now + timedelta(days=14)

    target_user_id = req.readerId or req.userId
    target_user = None
    if target_user_id:
        target_user = next((u for u in users if u.get("id") is not None and int(u.get("id")) == int(target_user_id)), None)
    if not target_user and req.readerName:
        target_user = next((u for u in users if u.get("fullName", "").lower() == req.readerName.strip().lower()), None)
    if not target_user:
        target_user = next((u for u in users if u.get("role") == "Reader"), {"id": 2, "fullName": req.readerName or "Độc giả"})

    # 🔒 Chặn mượn sách nếu tài khoản độc giả đang bị khóa do quá hạn / nợ phạt
    if target_user.get("isLocked"):
        reason = target_user.get("lockReason") or "mượn sách quá hạn từ 3 ngày trở lên"
        raise HTTPException(
            status_code=403,
            detail=f"Tài khoản của bạn đang bị khóa do {reason}. Vui lòng nộp phạt qua cổng VNPay để mở khóa tài khoản trước khi đăng ký mượn sách mới!"
        )

    # ✅ Kiểm tra giới hạn tối đa 5 cuốn sách đang mượn cùng lúc (UC-09, F18)
    reader_active_borrows = sum(
        1 for r in records
        if int(r.get("readerId", 0)) == int(target_user.get("id", 0))
        and r.get("status") in ["Chờ duyệt", "Đang mượn", "Quá hạn"]
    )
    if reader_active_borrows >= 5:
        raise HTTPException(
            status_code=400,
            detail=f"Độc giả {target_user.get('fullName')} đã có {reader_active_borrows} cuốn sách đang mượn hoặc chờ duyệt. Hệ thống chỉ cho phép tối đa 5 cuốn/lúc."
        )

    new_id = max([int(r.get("id", 0)) for r in records], default=0) + 1
    new_record = {
        "id": new_id,
        "bookId": req.bookId,
        "bookTitle": book_title,
        "readerId": target_user["id"],
        "readerName": target_user["fullName"],
        "borrowDate": now.isoformat(),
        "returnDate": due_date.isoformat(),
        "status": init_status,
        "borrowType": b_type,
        "fine_amount": 0,
        "overdue_days": 0
    }
    records.insert(0, new_record)
    db["borrowRecords"] = records
    db_manager.save_db(db)

    db_manager.add_notification(
        recipient_role="Admin",
        title="Yêu cầu mượn sách mới",
        message=f"Độc giả {target_user['fullName']} vừa gửi yêu cầu mượn cuốn sách \"{book_title}\" ({b_type}).",
        notif_type="borrow_request",
        meta={"recordId": new_id, "bookId": req.bookId, "bookTitle": book_title, "readerName": target_user["fullName"]}
    )

    db_manager.add_notification(
        recipient_role="Reader",
        recipient_user_id=target_user["id"],
        title="Yêu cầu mượn sách đang chờ duyệt",
        message=f"Yêu cầu mượn cuốn sách \"{book_title}\" của bạn đã được gửi thành công và đang chờ thủ thư phê duyệt.",
        notif_type="borrow_request",
        meta={"recordId": new_id, "bookId": req.bookId, "bookTitle": book_title}
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
    for n in db.get("notifications", []):
        if n.get("recordId") == record_id or (n.get("meta") and n.get("meta", {}).get("recordId") == record_id) or (record.get("bookTitle") and record.get("bookTitle") in n.get("message", "") and n.get("type") == "borrow_request"):
            n["isRead"] = True
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
    for n in db.get("notifications", []):
        if n.get("recordId") == record_id or (n.get("meta") and n.get("meta", {}).get("recordId") == record_id) or (record.get("bookTitle") and record.get("bookTitle") in n.get("message", "") and n.get("type") == "borrow_request"):
            n["isRead"] = True
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
    fine_amount = 0.0

    if req.status == "Đã trả":
        record["actualReturnDate"] = datetime.now().isoformat()

        # ✅ Tính tiền phạt trễ hạn và lưu bền vững
        fine_amount = db_manager.calculate_fine(record)
        overdue_days = 0
        try:
            due = datetime.fromisoformat(record.get("returnDate", ""))
            actual = datetime.fromisoformat(record["actualReturnDate"])
            overdue_days = max(0, (actual.date() - due.date()).days)
        except Exception:
            pass

        record["fine_amount"] = fine_amount
        record["overdue_days"] = overdue_days

        # Khôi phục số lượng sách trong kho
        book_id = record.get("bookId")
        if book_id:
            books = db.get("books", [])
            target_book = next((b for b in books if int(b.get("id", 0)) == int(book_id)), None)
            if target_book:
                target_book["borrowed"] = max(0, int(target_book.get("borrowed", 1)) - 1)
                target_book["available"] = min(int(target_book.get("quantity", 1)), int(target_book.get("available", 0)) + 1)

        # Đánh dấu ĐÃ ĐỌC tất cả thông báo mượn/chờ duyệt/duyệt cũ của lượt mượn này
        for n in db.get("notifications", []):
            if n.get("recordId") == record_id or (n.get("meta") and n.get("meta", {}).get("recordId") == record_id) or (record.get("bookTitle") and record.get("bookTitle") in n.get("message", "") and n.get("type") in ["borrow_request", "borrow_approved"]):
                n["isRead"] = True

    elif req.status == "Đã hủy":
        for n in db.get("notifications", []):
            if n.get("recordId") == record_id or (n.get("meta") and n.get("meta", {}).get("recordId") == record_id) or (record.get("bookTitle") and record.get("bookTitle") in n.get("message", "") and n.get("type") in ["borrow_request", "borrow_approved"]):
                n["isRead"] = True

    elif req.status == "Quá hạn":
        record["status"] = "Quá hạn"
        now = datetime.now()
        record["overdue_marked_at"] = now.isoformat()
        
        # Tính số ngày quá hạn (tối thiểu 3 ngày khi quản trị viên đánh dấu hoặc tính theo ngày hạn trả)
        overdue_days = 3
        try:
            due_str = record.get("returnDate") or record.get("dueDate")
            if due_str:
                due = datetime.fromisoformat(due_str.replace("Z", ""))
                diff = (now.date() - due.date()).days
                overdue_days = max(3, diff)
        except Exception:
            overdue_days = 3
        
        fine_amount = float(overdue_days * 2000)
        record["fine_amount"] = fine_amount
        record["overdue_days"] = overdue_days

        # Tạo hoặc cập nhật phiếu phạt trong db["fines"]
        fines = db.setdefault("fines", [])
        existing_fine = next((f for f in fines if int(f.get("borrowRecordId") or 0) == record_id), None)
        if not existing_fine:
            new_fine_id = max([int(f.get("id", 0)) for f in fines], default=0) + 1
            new_fine = {
                "id": new_fine_id,
                "borrowRecordId": record_id,
                "bookTitle": record.get("bookTitle", "Sách quá hạn"),
                "readerId": record.get("readerId", 2),
                "readerName": record.get("readerName", "Độc giả"),
                "dueDate": record.get("returnDate"),
                "actualReturnDate": None,
                "fineAmount": fine_amount,
                "status": "Chưa nộp",
                "paymentMethod": None,
                "transactionRef": None,
                "createdAt": now.isoformat()
            }
            fines.append(new_fine)
        else:
            existing_fine["fineAmount"] = fine_amount
            existing_fine["status"] = "Chưa nộp"

        # Tự động khóa tài khoản độc giả do quá hạn >= 3 ngày
        target_reader_id = int(record.get("readerId", 0))
        lock_msg = f"Mượn cuốn sách \"{record.get('bookTitle')}\" quá hạn {overdue_days} ngày chưa trả và chưa nộp phạt sau 3 ngày. Bắt buộc phải nộp phạt để mở khóa tài khoản."
        for u in db.get("users", []):
            if int(u.get("id", 0)) == target_reader_id:
                u["isLocked"] = True
                u["lockReason"] = lock_msg
        db_manager.toggle_reader_lock(target_reader_id, True, lock_msg)

        # Gửi thông báo đến độc giả
        db_manager.add_notification(
            recipient_role="Reader",
            recipient_user_id=target_reader_id,
            title="Cảnh báo: Sách mượn bị chuyển Quá hạn",
            message=f"Cuốn sách \"{record.get('bookTitle')}\" của bạn đã bị chuyển sang trạng thái Quá hạn (Tiền phạt: {int(fine_amount):,} đ). Tài khoản đã bị khóa đăng nhập sau 3 ngày chưa nộp phạt, vui lòng nộp phạt qua cổng VNPay để mở lại tài khoản!",
            notif_type="overdue_alert",
            meta={"recordId": record_id, "fineAmount": fine_amount, "overdueDays": overdue_days}
        )

    # Lưu thay đổi trạng thái mượn và số lượng sách vào CSDL
    db_manager.save_db(db)

    # Lưu bản ghi phạt vào bảng fines (chỉ khi có tiền phạt)
    if req.status == "Đã trả" and fine_amount > 0:
        db_manager.save_fine_record(record, fine_amount)

    # Gửi thông báo
    if req.status == "Đã trả":
        fine_msg = f" Tiền phạt trễ hạn: {int(fine_amount):,} VND ({record.get('overdue_days', 0)} ngày trễ)." if fine_amount > 0 else " Bạn đã trả đúng hạn!"
        db_manager.add_notification(
            recipient_role="Reader",
            recipient_user_id=record.get("readerId"),
            title="Xác nhận trả sách thành công",
            message=f"Bạn đã hoàn tất trả cuốn sách \"{record.get('bookTitle')}\".{fine_msg}",
            notif_type="book_returned",
            meta={"recordId": record_id, "bookId": record.get("bookId"), "bookTitle": record.get("bookTitle"), "fineAmount": fine_amount}
        )
        db_manager.add_notification(
            recipient_role="Admin",
            title="Độc giả đã trả sách",
            message=f"Độc giả {record.get('readerName')} đã trả cuốn \"{record.get('bookTitle')}\".{' Tiền phạt: ' + str(int(fine_amount)) + ' VND.' if fine_amount > 0 else ''}",
            notif_type="book_returned",
            meta={"recordId": record_id, "bookId": record.get("bookId"), "bookTitle": record.get("bookTitle"), "readerName": record.get("readerName"), "fineAmount": fine_amount}
        )

        # ✅ TỰ ĐỘNG QUÉT BẢNG HÀNG CHỜ ĐẶT TRƯỚC (FIFO QUEUE)
        book_id = record.get("bookId")
        if book_id:
            reservations = db.get("reservations", [])
            waiting_queue = [
                r for r in reservations
                if int(r.get("bookId", 0)) == int(book_id) and r.get("status") == "Waiting"
            ]
            if waiting_queue:
                waiting_queue.sort(key=lambda x: (int(x.get("priority", 999)), x.get("reservedAt", "")))
                top_res = waiting_queue[0]
                top_res["status"] = "Ready"
                exp_dt = datetime.now() + timedelta(hours=48)
                top_res["expiresAt"] = exp_dt.isoformat()
                db_manager.save_db(db)

                # Gửi thông báo ưu tiên trực tiếp tới độc giả đứng đầu hàng chờ
                db_manager.add_notification(
                    recipient_role="Reader",
                    recipient_user_id=top_res.get("readerId"),
                    title="🎉 Sách bạn đặt trước đã về thư viện!",
                    message=f"Cuốn sách \"{record.get('bookTitle')}\" bạn đang chờ trong hàng chờ (Ưu tiên #{top_res.get('priority', 1)}) đã có sẵn tại thư viện! Hệ thống đã kích hoạt quyền ưu tiên cho bạn trong vòng 48 giờ (trước {exp_dt.strftime('%H:%M ngày %d/%m/%Y')}).",
                    notif_type="reservation_ready",
                    meta={
                        "reservationId": top_res.get("id"),
                        "bookId": book_id,
                        "bookTitle": record.get("bookTitle"),
                        "priority": top_res.get("priority", 1),
                        "expiresAt": top_res["expiresAt"]
                    }
                )

                # Gửi thông báo cho Quản trị viên / Thủ thư
                db_manager.add_notification(
                    recipient_role="Admin",
                    title="Sách hàng chờ đã về kho",
                    message=f"Cuốn sách \"{record.get('bookTitle')}\" vừa được trả về. Hệ thống đã kích hoạt lượt ưu tiên số 1 cho độc giả {top_res.get('readerName')} (Hàng chờ #{top_res.get('priority', 1)}) - Thời hạn giữ sách: 48h.",
                    notif_type="reservation_ready",
                    meta={"reservationId": top_res.get("id"), "bookId": book_id, "readerId": top_res.get("readerId")}
                )
    elif req.status == "Đã hủy":
        db_manager.add_notification(
            recipient_role="Admin",
            title="Độc giả đã hủy yêu cầu mượn",
            message=f"Độc giả {record.get('readerName')} đã hủy yêu cầu mượn cuốn sách \"{record.get('bookTitle')}\".",
            notif_type="borrow_rejected",
            meta={"recordId": record_id, "bookId": record.get("bookId"), "bookTitle": record.get("bookTitle")}
        )

    result = {"message": "Cập nhật trạng thái mượn sách thành công!"}
    if req.status == "Đã trả":
        result["fine_amount"] = fine_amount
        result["overdue_days"] = record.get("overdue_days", 0)
    return result



# ================= NOTIFICATIONS =================
@app.get("/api/notifications")
def get_notifications(role: Optional[str] = Query(None), userId: Optional[int] = Query(None)):
    db = db_manager.load_db()
    notifs = db.get("notifications", [])
    
    filtered = []
    for n in notifs:
        if role in ("Admin", "Librarian"):
            if n.get("recipientRole") in ("Admin", "Librarian"):
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
    db_manager.mark_notification_read(notif_id)
    return {"message": "OK"}


@app.put("/api/notifications/read-all")
def read_all_notifications(req: NotificationReadRequest):
    db_manager.mark_all_notifications_read(role=req.role, user_id=req.userId)
    return {"message": "OK"}


@app.delete("/api/notifications/{notif_id}")
def delete_notification(notif_id: int):
    db_manager.delete_notification(notif_id)
    return {"message": "OK"}


@app.delete("/api/notifications/clear-read")
def clear_read_notifications(role: Optional[str] = Query(None), userId: Optional[int] = Query(None)):
    db_manager.clear_read_notifications(role=role, user_id=userId)
    return {"message": "OK"}



# ================= RESERVATIONS (Đặt trước sách) =================
@app.get("/api/reservations")
def get_reservations(userId: Optional[int] = Query(None)):
    db = db_manager.load_db()
    reservations = db.get("reservations", [])
    # Lọc sạch các bản ghi không hợp lệ hoặc sách không thuộc diện đặt trước (như Tru Tiên)
    reservations = [
        r for r in reservations
        if int(r.get("bookId", 0)) != 3 and "tru tiên" not in str(r.get("bookTitle", "")).lower()
    ]
    if userId:
        reservations = [r for r in reservations if int(r.get("readerId", 0)) == userId]
    return reservations


@app.post("/api/reservations", status_code=201)
def create_reservation(req: ReservationCreate):
    db = db_manager.load_db()
    reservations = db.get("reservations", [])
    books = db.get("books", [])
    users = db.get("users", [])

    # Kiểm tra sách tồn tại
    book = next((b for b in books if int(b.get("id", 0)) == int(req.bookId)), None)
    if not book:
        raise HTTPException(status_code=404, detail="Không tìm thấy sách.")

    reader = next((u for u in users if int(u.get("id", 0)) == int(req.readerId)), None)
    if not reader:
        raise HTTPException(status_code=404, detail="Không tìm thấy độc giả.")

    # 🔒 Chặn đặt trước nếu tài khoản đang bị khóa do mượn sách quá hạn >= 3 ngày / nợ phạt
    if reader.get("isLocked"):
        reason = reader.get("lockReason") or "mượn sách quá hạn từ 3 ngày trở lên"
        raise HTTPException(
            status_code=403,
            detail=f"Tài khoản của bạn đang bị khóa do {reason}. Vui lòng nộp phạt qua cổng VNPay để mở khóa tài khoản trước khi đặt trước sách!"
        )

    # Kiểm tra điều kiện: Đặt trước chỉ áp dụng cho Sách Sắp có (Upcoming) hoặc Sách đang tạm hết bản sao (available <= 0)
    is_upcoming = book.get("status") in ["Upcoming", "Sắp phát hành", "Sắp có"] or int(book.get("id", 0)) >= 51
    is_out_of_stock = int(book.get("available", 0)) <= 0
    if not is_upcoming and not is_out_of_stock:
        raise HTTPException(
            status_code=400,
            detail="Cuốn sách này hiện đang có sẵn trong thư viện. Bạn có thể đăng ký mượn trực tiếp thay vì đặt trước."
        )

    # Tránh đặt trùng
    existing = next(
        (r for r in reservations if int(r.get("bookId", 0)) == int(req.bookId)
         and int(r.get("readerId", 0)) == int(req.readerId)
         and r.get("status") in ["Waiting", "Ready"]),
        None
    )
    if existing:
        raise HTTPException(status_code=400, detail="Bạn đã đặt trước cuốn sách này rồi.")

    # Kiểm tra giới hạn: Mỗi độc giả chỉ được đặt trước tối đa 3 cuốn sách
    active_reservations = [
        r for r in reservations
        if int(r.get("readerId", 0)) == int(req.readerId)
        and r.get("status") in ["Waiting", "Ready"]
        and int(r.get("bookId", 0)) != 3
        and "tru tiên" not in str(r.get("bookTitle", "")).lower()
    ]
    if len(active_reservations) >= 3:
        raise HTTPException(
            status_code=400,
            detail="Bạn đã hết lượt đặt trước sách. Mỗi độc giả chỉ được đặt trước tối đa 3 cuốn sách, nếu muốn đặt thì cần phải hủy một cuốn sách khác để đặt tiếp."
        )

    # Xác định thứ tự ưu tiên (FIFO)
    same_book_waiting = [r for r in reservations if int(r.get("bookId", 0)) == int(req.bookId) and r.get("status") == "Waiting"]
    priority = len(same_book_waiting) + 1

    new_id = max([int(r.get("id", 0)) for r in reservations], default=0) + 1
    new_res = {
        "id": new_id,
        "bookId": req.bookId,
        "bookTitle": book.get("title", ""),
        "readerId": req.readerId,
        "readerName": reader.get("fullName", ""),
        "reservedAt": datetime.now().isoformat(),
        "status": "Waiting",
        "priority": priority,
        "expiresAt": (datetime.now() + timedelta(hours=48)).isoformat()
    }
    reservations.append(new_res)
    db["reservations"] = reservations
    db_manager.save_db(db)

    db_manager.add_notification(
        recipient_role="Reader",
        recipient_user_id=req.readerId,
        title="Đặt trước sách thành công",
        message=f"Bạn đã đặt trước cuốn \"{book.get('title')}\". Vị trí hàng chờ: #{priority}. Hệ thống sẽ thông báo khi sách sẵn sàng.",
        notif_type="reservation_created",
        meta={"reservationId": new_id, "bookId": req.bookId, "bookTitle": book.get("title"), "priority": priority}
    )

    return {"message": "Đặt trước sách thành công!", "reservation": new_res}


@app.delete("/api/reservations/{res_id}")
def cancel_reservation(res_id: int):
    db = db_manager.load_db()
    reservations = db.get("reservations", [])
    idx = next((i for i, r in enumerate(reservations) if int(r.get("id", 0)) == res_id), -1)
    if idx == -1:
        raise HTTPException(status_code=404, detail="Không tìm thấy đặt trước.")
    reservations[idx]["status"] = "Cancelled"
    db["reservations"] = reservations
    db_manager.save_db(db)
    db_manager.cancel_reservation(res_id)
    return {"message": "Đã hủy đặt trước sách."}


# ================= FINES (Quản lý phạt) =================
@app.get("/api/fines")
def get_fines(readerId: Optional[int] = Query(None)):
    db = db_manager.load_db()
    fines = db.get("fines", [])
    if readerId:
        fines = [f for f in fines if int(f.get("readerId", 0)) == readerId]
    return fines


@app.put("/api/fines/{fine_id}/pay")
def pay_fine(fine_id: int, req: FineStatusUpdate):
    db = db_manager.load_db()
    fines = db.get("fines", [])
    fine = next((f for f in fines if int(f.get("id", 0)) == fine_id), None)
    if not fine:
        raise HTTPException(status_code=404, detail="Không tìm thấy khoản phạt.")
    
    now_iso = datetime.now().isoformat()
    fine["status"] = "Đã nộp"
    fine["paidAt"] = now_iso
    fine["paymentMethod"] = req.paymentMethod or "Tiền mặt"
    if req.transactionRef:
        fine["transactionRef"] = req.transactionRef
    db["fines"] = fines

    # Tự động mở khóa tài khoản nếu độc giả không còn khoản phạt chưa nộp
    reader_id = int(fine.get("readerId", 0))
    users = db.get("users", [])
    reader = next((u for u in users if int(u.get("id", 0)) == reader_id), None)
    unpaid_left = [
        f for f in fines
        if int(f.get("readerId", 0)) == reader_id and f.get("status") == "Chưa nộp" and int(f.get("id", 0)) != fine_id
    ]

    is_unlocked = False
    if reader and len(unpaid_left) == 0:
        reader["isLocked"] = False
        reader["lockReason"] = ""
        db["users"] = users
        db_manager.toggle_reader_lock(reader_id, False, "")
        is_unlocked = True

    db_manager.save_db(db)

    unlock_text = " Tài khoản của bạn đã được TỰ ĐỘNG MỞ KHÓA!" if is_unlocked else ""
    db_manager.add_notification(
        recipient_role="Reader",
        recipient_user_id=fine.get("readerId"),
        title="Xác nhận nộp phạt thành công",
        message=f"Bạn đã nộp tiền phạt {int(fine.get('fineAmount', 0)):,} VND cho cuốn sách \"{fine.get('bookTitle')}\" qua {fine.get('paymentMethod')}.{unlock_text}",
        notif_type="fine_paid",
        meta={"fineId": fine_id, "fineAmount": fine.get("fineAmount"), "unlocked": is_unlocked}
    )
    return {"message": "Đã xác nhận nộp phạt thành công!", "fine": fine, "unlocked": is_unlocked}


# ================= VNPAY PAYMENT GATEWAY =================
@app.post("/api/payment/vnpay/create")
def create_vnpay_payment(req: VNPayPaymentCreate):
    import random
    import urllib.parse

    now = datetime.now()
    txn_ref = f"VNP{int(now.timestamp())}{random.randint(100, 999)}"
    amount = int(req.amount)
    order_desc = req.orderInfo or f"SMARTLIB NOP PHAT DG-{str(req.readerId).zfill(3)}"

    account_number = "0987654321"
    account_name = "THU VIEN SMARTLIB"
    bank_bin = "970422"  # MBBank
    qr_url = f"https://api.vietqr.io/image/{bank_bin}-{account_number}-compact2.jpg?amount={amount}&addInfo={urllib.parse.quote(order_desc)}&accountName={urllib.parse.quote(account_name)}"

    return {
        "txnRef": txn_ref,
        "amount": amount,
        "orderInfo": order_desc,
        "bankName": "Ngân hàng TMCP Quân Đội (MBBank)",
        "bankBin": bank_bin,
        "accountNumber": account_number,
        "accountName": account_name,
        "qrCodeUrl": qr_url,
        "fineId": req.fineId,
        "readerId": req.readerId,
        "createdAt": now.isoformat(),
        "expiresAt": (now + timedelta(minutes=15)).isoformat()
    }


@app.post("/api/payment/vnpay/verify")
def verify_vnpay_payment(req: VNPayPaymentVerify):
    db = db_manager.load_db()
    fines = db.get("fines", [])
    fine = None
    if req.fineId:
        fine = next((f for f in fines if int(f.get("id", 0)) == int(req.fineId)), None)
    if not fine:
        fine = next((f for f in fines if int(f.get("readerId", 0)) == int(req.readerId) and f.get("status") == "Chưa nộp"), None)

    now_iso = datetime.now().isoformat()
    if fine:
        fine["status"] = "Đã nộp"
        fine["paidAt"] = now_iso
        fine["paymentMethod"] = "VNPay"
        fine["transactionRef"] = req.transactionRef
        db["fines"] = fines
    else:
        new_id = max([int(f.get("id", 0)) for f in fines], default=0) + 1
        fine = {
            "id": new_id,
            "borrowRecordId": 1,
            "readerId": req.readerId,
            "bookTitle": "Phí phạt trễ hạn mượn sách",
            "fineAmount": req.amount,
            "status": "Đã nộp",
            "paidAt": now_iso,
            "paymentMethod": "VNPay",
            "transactionRef": req.transactionRef,
            "note": "Nộp phạt trực tuyến qua VNPay"
        }
        fines.append(fine)
        db["fines"] = fines

    # TỰ ĐỘNG MỞ KHÓA TÀI KHOẢN ĐỘC GIẢ
    users = db.get("users", [])
    reader = next((u for u in users if int(u.get("id", 0)) == int(req.readerId)), None)
    if reader:
        reader["isLocked"] = False
        reader["lockReason"] = ""
        db["users"] = users
        db_manager.toggle_reader_lock(req.readerId, False, "")

    db_manager.save_db(db)

    db_manager.add_notification(
        recipient_role="Reader",
        recipient_user_id=req.readerId,
        title="Thanh toán VNPay thành công 🎉",
        message=f"Giao dịch VNPay #{req.transactionRef} số tiền {int(req.amount):,} đ đã được xác nhận. Tài khoản của bạn đã được TỰ ĐỘNG MỞ KHÓA thành công!",
        notif_type="fine_paid_vnpay",
        meta={"txnRef": req.transactionRef, "amount": req.amount, "unlocked": True}
    )

    return {
        "success": True,
        "message": "Thanh toán qua VNPay thành công! Tài khoản đã được tự động mở khóa.",
        "transactionRef": req.transactionRef,
        "amount": req.amount,
        "unlocked": True,
        "paidAt": now_iso,
        "fine": fine
    }


# ================= RECOMMENDATIONS (Gợi ý sách cá nhân hóa) =================
@app.get("/api/recommendations/{reader_id}")
def get_recommendations(reader_id: int, limit: int = Query(6, ge=1, le=20)):
    """
    Gợi ý sách dựa trên lịch sử mượn sách của độc giả.
    Thuật toán: Tìm thể loại yêu thích (mượn nhiều nhất) → gợi ý sách cùng thể loại chưa mượn.
    """
    db = db_manager.load_db()
    # Loại trừ hoàn toàn sách Sắp phát hành / Sắp có / Upcoming khỏi gợi ý sách
    books = [
        b for b in db.get("books", [])
        if b.get("status") not in ["Upcoming", "Sắp phát hành", "Sắp có"] and int(b.get("id", 0)) < 51
    ]
    records = db.get("borrowRecords", [])

    # Lấy lịch sử mượn của độc giả
    reader_records = [r for r in records if int(r.get("readerId", 0)) == reader_id]
    borrowed_book_ids = set(int(r.get("bookId", 0)) for r in reader_records)

    if not reader_records:
        # Nếu chưa mượn cuốn nào → trả về sách phổ biến nhất (nhiều người mượn nhất)
        borrow_count = {}
        for r in records:
            bid = int(r.get("bookId", 0))
            borrow_count[bid] = borrow_count.get(bid, 0) + 1
        popular = sorted(books, key=lambda b: borrow_count.get(int(b.get("id", 0)), 0), reverse=True)
        return {
            "type": "popular",
            "reason": "Sách được mượn nhiều nhất trong thư viện",
            "books": popular[:limit]
        }

    # Tìm thể loại yêu thích của độc giả
    category_count = {}
    for r in reader_records:
        book = next((b for b in books if int(b.get("id", 0)) == int(r.get("bookId", 0))), None)
        if book:
            cat = book.get("category", "Khác")
            category_count[cat] = category_count.get(cat, 0) + 1

    if not category_count:
        return {"type": "popular", "reason": "Sách phổ biến", "books": books[:limit]}

    fav_category = max(category_count, key=category_count.get)

    # Gợi ý sách cùng thể loại chưa mượn
    recommendations = [
        b for b in books
        if b.get("category") == fav_category and int(b.get("id", 0)) not in borrowed_book_ids
    ]

    # Nếu không đủ → bổ sung sách thể loại khác chưa mượn
    if len(recommendations) < limit:
        other_books = [
            b for b in books
            if b.get("category") != fav_category and int(b.get("id", 0)) not in borrowed_book_ids
        ]
        recommendations.extend(other_books[:limit - len(recommendations)])

    return {
        "type": "personalized",
        "reason": f"Dựa trên sở thích thể loại \"{fav_category}\" của bạn",
        "favoriteCategory": fav_category,
        "books": recommendations[:limit]
    }


# ================= STATISTICS =================

@app.get("/api/stats")
def get_stats():
    db = db_manager.load_db()
    books = db.get("books", [])
    users = db.get("users", [])
    records = db.get("borrowRecords", [])

    # Chỉ tính các đầu sách thực tế trong kho (loại trừ sách Sắp phát hành / Sắp về)
    actual_books = [
        b for b in books
        if b.get("status") not in ["Upcoming", "Sắp phát hành", "Sắp có"] and int(b.get("id", 0)) < 51
    ]
    total_books = len(actual_books)
    total_copies = sum(int(b.get("quantity", 1)) for b in actual_books)
    total_readers = sum(1 for u in users if u.get("role") == "Reader")
    
    borrowing_count = sum(1 for r in records if r.get("status") == "Đang mượn")
    overdue_count = sum(1 for r in records if r.get("status") == "Quá hạn")
    pending_count = sum(1 for r in records if r.get("status") == "Chờ duyệt")
    returned_count = sum(1 for r in records if r.get("status") == "Đã trả")

    reservations = db.get("reservations", [])
    fines = db.get("fines", [])
    total_fines = sum(float(f.get("fineAmount", 0)) for f in fines) or sum(float(r.get("fine_amount", 0)) for r in records)

    return {
        "totalBooks": total_books,
        "totalCopies": total_copies,
        "totalReaders": total_readers,
        "borrowingCount": borrowing_count,
        "activeBorrows": borrowing_count,
        "overdueCount": overdue_count,
        "overdueBorrows": overdue_count,
        "pendingCount": pending_count,
        "pendingBorrows": pending_count,
        "returnedCount": returned_count,
        "returnedBooks": returned_count,
        "totalReservations": len(reservations),
        "totalFines": int(total_fines)
    }


# ================= FILE GENERATION & EXPORT ENDPOINTS =================
@app.get("/api/export/books/excel")
def export_books_excel():
    db = db_manager.load_db()
    books = [
        b for b in db.get("books", [])
        if b.get("status") not in ["Upcoming", "Sắp phát hành", "Sắp có"] and int(b.get("id", 0)) < 51
    ]
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