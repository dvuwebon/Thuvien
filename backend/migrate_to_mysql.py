"""
Kịch bản di chuyển toàn bộ dữ liệu từ database.json sang MySQL (SmartLib Migration Script)
Cách dùng:
    python backend/migrate_to_mysql.py
"""
import os
import sys
import json
import logging

# Thêm thư mục backend vào sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from mysql_db import (
    MySQLDatabaseManager,
    UserModel,
    BookModel,
    BorrowRecordModel,
    ReservationModel,
    FineModel,
    NotificationModel,
    MYSQL_HOST,
    MYSQL_PORT,
    MYSQL_USER,
    MYSQL_DATABASE
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("migrate")


def run_migration():
    json_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data", "database.json"))
    if not os.path.exists(json_path):
        logger.error(f"Không tìm thấy file {json_path}")
        return False

    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    logger.info("=== BẮT ĐẦU DI CHUYỂN DỮ LIỆU TỪ DATABASE.JSON SANG MYSQL ===")
    logger.info(f"Cấu hình MySQL đích: {MYSQL_USER}@{MYSQL_HOST}:{MYSQL_PORT}/{MYSQL_DATABASE}")

    db_manager = MySQLDatabaseManager()
    if not db_manager.is_connected():
        logger.error("❌ Không thể kết nối tới MySQL Server!")
        logger.error("Gợi ý khắc phục:")
        logger.error("1. Hãy đảm bảo MySQL Server đang bật (qua XAMPP, Laragon, hoặc Docker).")
        logger.error("2. Kiểm tra lại thông tin đăng nhập trong file .env (MYSQL_USER, MYSQL_PASSWORD, MYSQL_PORT).")
        return False

    session = db_manager.SessionLocal()
    try:
        # 1. Di chuyển Users
        users_data = data.get("users", [])
        u_count = 0
        for u in users_data:
            uid = u.get("id")
            existing = session.query(UserModel).filter_by(id=uid).first()
            if not existing:
                new_u = UserModel(
                    id=uid,
                    username=u.get("username"),
                    password_hash=u.get("passwordHash", "a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3"),
                    full_name=u.get("fullName", "Người dùng"),
                    role=u.get("role", "Reader"),
                    email=u.get("email"),
                    phone=u.get("phone"),
                    address=u.get("address"),
                    is_active=bool(u.get("isActive", True))
                )
                session.add(new_u)
                u_count += 1
        session.commit()
        logger.info(f"✓ Đã di chuyển {u_count} tài khoản người dùng vào bảng `users`.")

        # 2. Di chuyển Books
        books_data = data.get("books", [])
        b_count = 0
        for b in books_data:
            bid = b.get("id")
            existing = session.query(BookModel).filter_by(id=bid).first()
            qty = int(b.get("quantity", 1))
            avail = int(b.get("available", qty))
            if not existing:
                new_b = BookModel(
                    id=bid,
                    title=b.get("title", "Sách"),
                    author=b.get("author", "Chưa rõ"),
                    category=b.get("category", "Chung"),
                    quantity=qty,
                    available_copies=avail,
                    description=b.get("desc") or b.get("description", ""),
                    image_url=b.get("imageUrl"),
                    status=b.get("status", "Sẵn sàng" if avail > 0 else "Hết sách")
                )
                session.add(new_b)
                b_count += 1
            else:
                existing.quantity = qty
                existing.available_copies = avail
        session.commit()
        logger.info(f"✓ Đã di chuyển {b_count} đầu sách vào bảng `books` (Tổng {len(books_data)} cuốn).")

        # 3. Đồng bộ lại dữ liệu hoàn chỉnh qua save_db
        db_manager.save_db(data)
        logger.info("✓ Đã nạp đầy đủ các bảng `borrow_records`, `reservations`, `fines`, `notifications`.")

        # Thống kê sau khi di chuyển
        final_users = session.query(UserModel).count()
        final_books = session.query(BookModel).count()
        final_borrows = session.query(BorrowRecordModel).count()
        final_res = session.query(ReservationModel).count()
        final_fines = session.query(FineModel).count()
        final_notifs = session.query(NotificationModel).count()

        logger.info("==================================================")
        logger.info("🎉 DI CHUYỂN DỮ LIỆU SANG MYSQL HOÀN TẤT THÀNH CÔNG!")
        logger.info(f"- Người dùng (users): {final_users} bản ghi")
        logger.info(f"- Kho sách (books): {final_books} đầu sách")
        logger.info(f"- Phiếu mượn (borrow_records): {final_borrows} bản ghi")
        logger.info(f"- Đặt trước (reservations): {final_res} bản ghi")
        logger.info(f"- Tiền phạt (fines): {final_fines} bản ghi")
        logger.info(f"- Thông báo (notifications): {final_notifs} bản ghi")
        logger.info("==================================================")
        return True
    except Exception as e:
        session.rollback()
        logger.error(f"❌ Lỗi trong quá trình di chuyển: {e}")
        return False
    finally:
        session.close()


if __name__ == "__main__":
    run_migration()
