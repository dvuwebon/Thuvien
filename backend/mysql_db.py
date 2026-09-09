import os
import time
import json
import logging
from datetime import datetime, date
from typing import Dict, Any, List, Optional
from urllib.parse import quote_plus

from sqlalchemy import (
    create_engine, Column, Integer, String, Text, DateTime, Date,
    Numeric, Boolean, JSON, ForeignKey, Enum as SQLEnum, text
)
from sqlalchemy.orm import declarative_base, sessionmaker, relationship, scoped_session

logger = logging.getLogger("smartlib.mysql")

# Tự động đọc file .env từ thư mục gốc nếu có
def _load_env():
    env_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".env"))
    if os.path.exists(env_path):
        try:
            with open(env_path, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith("#") and "=" in line:
                        k, v = line.split("=", 1)
                        k = k.strip()
                        v = v.strip().strip('"').strip("'")
                        if k not in os.environ:
                            os.environ[k] = v
        except Exception:
            pass

_load_env()

# Cấu hình biến môi trường kết nối MySQL
MYSQL_HOST = os.getenv("MYSQL_HOST", "localhost")
MYSQL_PORT = int(os.getenv("MYSQL_PORT", 3306))
MYSQL_USER = os.getenv("MYSQL_USER", "root")
MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD", "root")
MYSQL_DATABASE = os.getenv("MYSQL_DATABASE", "smartlib_db")

FINE_PER_DAY = 2000

# Cache bộ nhớ đệm RAM cho kho sách (giảm tải đọc base64 ảnh mỗi request)
_BOOKS_CACHE = {"data": None, "cached_at": 0}
BOOKS_CACHE_TTL = 15  # Cache 15 giây

def invalidate_books_cache():
    _BOOKS_CACHE["data"] = None
    _BOOKS_CACHE["cached_at"] = 0

Base = declarative_base()


class UserModel(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(50), nullable=False, unique=True, index=True)
    password_hash = Column(String(256), nullable=False)
    full_name = Column(String(100), nullable=False)
    role = Column(String(20), nullable=False, default="Reader")
    email = Column(String(100), nullable=True)
    phone = Column(String(30), nullable=True)
    address = Column(String(255), nullable=True)
    birth_date = Column(Date, nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "UserID": self.id,
            "username": self.username,
            "password": "123",  # Plaintext fallback cho demo
            "passwordHash": self.password_hash,
            "fullName": self.full_name,
            "FullName": self.full_name,
            "role": self.role,
            "Role": self.role,
            "email": self.email or "",
            "phone": self.phone or "",
            "address": self.address or "",
            "birthDate": self.birth_date.isoformat() if self.birth_date else None,
            "isActive": bool(self.is_active)
        }


class BookModel(Base):
    __tablename__ = "books"

    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String(255), nullable=False, index=True)
    author = Column(String(100), nullable=False, default="Chưa rõ")
    category = Column(String(100), nullable=False, default="Chung", index=True)
    quantity = Column(Integer, nullable=False, default=1)
    available_copies = Column(Integer, nullable=False, default=1)
    description = Column(Text, nullable=True)
    image_url = Column(Text, nullable=True)
    status = Column(String(50), nullable=False, default="Sẵn sàng")
    published_year = Column(Integer, nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "title": self.title,
            "author": self.author,
            "category": self.category,
            "quantity": self.quantity,
            "available": self.available_copies,
            "borrowed": max(0, self.quantity - self.available_copies),
            "desc": self.description or "",
            "description": self.description or "",
            "imageUrl": self.image_url,
            "status": self.status,
            "publishedYear": self.published_year
        }


class BorrowRecordModel(Base):
    __tablename__ = "borrow_records"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    book_id = Column(Integer, ForeignKey("books.id", ondelete="CASCADE"), nullable=False, index=True)
    borrow_date = Column(DateTime, nullable=False, default=datetime.utcnow)
    due_date = Column(DateTime, nullable=False)
    return_date = Column(DateTime, nullable=True)
    actual_return_date = Column(DateTime, nullable=True)
    borrow_type = Column(String(50), nullable=False, default="Mượn về nhà")
    fine_amount = Column(Numeric(12, 2), nullable=False, default=0.00)
    overdue_days = Column(Integer, nullable=False, default=0)
    status = Column(String(50), nullable=False, default="Chờ duyệt", index=True)
    notes = Column(String(255), nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    user = relationship("UserModel")
    book = relationship("BookModel")

    def to_dict(self) -> Dict[str, Any]:
        user_name = self.user.full_name if self.user else ""
        book_title = self.book.title if self.book else ""
        return {
            "id": self.id,
            "readerId": self.user_id,
            "userId": self.user_id,
            "readerName": user_name,
            "bookId": self.book_id,
            "bookTitle": book_title,
            "borrowDate": self.borrow_date.isoformat() if self.borrow_date else None,
            "returnDate": self.due_date.isoformat() if self.due_date else None,
            "dueDate": self.due_date.isoformat() if self.due_date else None,
            "actualReturnDate": self.actual_return_date.isoformat() if self.actual_return_date else None,
            "borrowType": self.borrow_type,
            "fine_amount": float(self.fine_amount or 0.0),
            "fineAmount": float(self.fine_amount or 0.0),
            "overdue_days": self.overdue_days,
            "overdueDays": self.overdue_days,
            "status": self.status,
            "notes": self.notes
        }


class ReservationModel(Base):
    __tablename__ = "reservations"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    book_id = Column(Integer, ForeignKey("books.id", ondelete="CASCADE"), nullable=False, index=True)
    reserved_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    priority = Column(Integer, nullable=False, default=1)
    expires_at = Column(DateTime, nullable=False)
    status = Column(String(50), nullable=False, default="Waiting", index=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    user = relationship("UserModel")
    book = relationship("BookModel")

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "readerId": self.user_id,
            "userId": self.user_id,
            "readerName": self.user.full_name if self.user else "",
            "bookId": self.book_id,
            "bookTitle": self.book.title if self.book else "",
            "reservedAt": self.reserved_at.isoformat() if self.reserved_at else None,
            "priority": self.priority,
            "expiresAt": self.expires_at.isoformat() if self.expires_at else None,
            "status": self.status
        }


class FineModel(Base):
    __tablename__ = "fines"

    id = Column(Integer, primary_key=True, autoincrement=True)
    record_id = Column(Integer, ForeignKey("borrow_records.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    book_id = Column(Integer, ForeignKey("books.id", ondelete="CASCADE"), nullable=False)
    due_date = Column(DateTime, nullable=False)
    actual_return_date = Column(DateTime, nullable=False)
    fine_amount = Column(Numeric(12, 2), nullable=False, default=0.00)
    status = Column(String(50), nullable=False, default="Chưa nộp", index=True)
    paid_at = Column(DateTime, nullable=True)
    note = Column(String(255), nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    user = relationship("UserModel")
    book = relationship("BookModel")

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "borrowRecordId": self.record_id,
            "recordId": self.record_id,
            "readerId": self.user_id,
            "userId": self.user_id,
            "readerName": self.user.full_name if self.user else "",
            "bookId": self.book_id,
            "bookTitle": self.book.title if self.book else "",
            "dueDate": self.due_date.isoformat() if self.due_date else None,
            "actualReturnDate": self.actual_return_date.isoformat() if self.actual_return_date else None,
            "fineAmount": float(self.fine_amount or 0.0),
            "status": self.status,
            "paidAt": self.paid_at.isoformat() if self.paid_at else None,
            "note": self.note
        }


class NotificationModel(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, autoincrement=True)
    recipient_role = Column(String(20), nullable=False, index=True)
    recipient_user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String(50), nullable=False, default="general")
    is_read = Column(Boolean, nullable=False, default=False, index=True)
    meta_json = Column(JSON, nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    def to_dict(self) -> Dict[str, Any]:
        d = {
            "id": self.id,
            "recipientRole": self.recipient_role,
            "recipientUserId": self.recipient_user_id,
            "title": self.title,
            "message": self.message,
            "type": self.type,
            "isRead": bool(self.is_read),
            "createdAt": self.created_at.isoformat() if self.created_at else None
        }
        if self.meta_json and isinstance(self.meta_json, dict):
            d.update(self.meta_json)
        return d


class MySQLDatabaseManager:
    """
    Quản lý kết nối và thao tác dữ liệu trực tiếp trên Cơ sở dữ liệu MySQL thực tế.
    """
    def __init__(
        self,
        host: str = MYSQL_HOST,
        port: int = MYSQL_PORT,
        user: str = MYSQL_USER,
        password: str = MYSQL_PASSWORD,
        database: str = MYSQL_DATABASE
    ):
        self.host = host
        self.port = port
        self.user = user
        self.password = password
        self.database = database
        self.engine = None
        self.SessionLocal = None
        self._is_connected = False
        self._init_connection()

    def _get_connection_url(self, with_db: bool = True) -> str:
        encoded_pass = quote_plus(self.password)
        db_part = f"/{self.database}" if with_db else ""
        return f"mysql+pymysql://{self.user}:{encoded_pass}@{self.host}:{self.port}{db_part}?charset=utf8mb4"

    def _init_connection(self):
        try:
            # 1. Kết nối tới MySQL server (không chỉ định DB để tạo DB nếu chưa có)
            root_engine = create_engine(self._get_connection_url(with_db=False), echo=False, pool_pre_ping=True)
            with root_engine.connect() as conn:
                conn.execute(text(f"CREATE DATABASE IF NOT EXISTS `{self.database}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"))
                conn.commit()

            # 2. Kết nối trực tiếp vào Database đã tạo
            self.engine = create_engine(
                self._get_connection_url(with_db=True),
                echo=False,
                pool_size=10,
                max_overflow=20,
                pool_pre_ping=True
            )
            self.SessionLocal = scoped_session(sessionmaker(autocommit=False, autoflush=False, bind=self.engine))

            # 3. Tự động tạo các bảng nếu chưa có
            Base.metadata.create_all(bind=self.engine)
            self._is_connected = True
            logger.info(f"✓ Đã kết nối thành công tới MySQL Database [{self.database}] tại {self.host}:{self.port}")
            self._ensure_seed_data()
        except Exception as e:
            self._is_connected = False
            logger.warning(f"Chưa thể kết nối tới MySQL ({self.host}:{self.port}/{self.database}): {e}")

    def is_connected(self) -> bool:
        if not self._is_connected or not self.engine:
            return False
        try:
            with self.engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            return True
        except Exception:
            return False

    def _ensure_seed_data(self):
        """Khởi tạo tài khoản và kho sách 50 cuốn nếu CSDL MySQL mới khởi tạo"""
        session = self.SessionLocal()
        try:
            # 1. Users
            u_count = session.query(UserModel).count()
            if u_count == 0:
                admin = UserModel(
                    id=1,
                    username="admin",
                    password_hash="a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3",
                    full_name="Quản trị viên",
                    role="Admin",
                    email="admin@smartlib.edu.vn",
                    phone="0987 654 321",
                    address="Phòng Quản lý Thư viện, ĐHQG Hà Nội"
                )
                reader = UserModel(
                    id=2,
                    username="reader",
                    password_hash="a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3",
                    full_name="Trần Thị Mai",
                    role="Reader",
                    email="mai.tran@smartlib.edu.vn",
                    phone="0901 234 567",
                    address="Khu KTX Sinh viên Mễ Trì, Thanh Xuân, Hà Nội"
                )
                librarian = UserModel(
                    id=3,
                    username="librarian",
                    password_hash="a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3",
                    full_name="Thủ thư Nguyễn Văn Hưng",
                    role="Librarian",
                    email="librarian@smartlib.edu.vn",
                    phone="0912 888 999",
                    address="Bộ phận Nghiệp vụ Thư viện, ĐHQG Hà Nội"
                )
                session.add_all([admin, reader, librarian])
                session.commit()
                logger.info("✓ Đã nạp thành công 3 tài khoản mẫu vào bảng users trong MySQL.")

            # 2. Books & Other Tables (Seed từ tệp SQL thuần nếu trống)
            b_count = session.query(BookModel).count()
            if b_count == 0:
                sql_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "database", "smartlib_mysql.sql"))
                if os.path.exists(sql_path):
                    with open(sql_path, "r", encoding="utf-8") as f:
                        sql_content = f.read()
                    
                    # Thực thi các câu lệnh INSERT từ tệp smartlib_mysql.sql
                    for statement in sql_content.split(";\n"):
                        stmt = statement.strip()
                        if stmt and not stmt.upper().startswith("CREATE DATABASE") and not stmt.upper().startswith("USE ") and not stmt.upper().startswith("SET "):
                            try:
                                session.execute(text(stmt))
                            except Exception as ex:
                                logger.debug(f"Bỏ qua câu lệnh: {ex}")
                    session.commit()
                    logger.info("✓ Đã nạp thành công 50 đầu sách và dữ liệu ban đầu từ database/smartlib_mysql.sql vào MySQL.")
        except Exception as e:
            session.rollback()
            logger.error(f"Lỗi khi nạp seed data MySQL: {e}")
        finally:
            session.close()

    def _load_from_local_sqlite(self) -> Dict[str, Any]:
        """Dự phòng an toàn: đọc dữ liệu từ CSDL cục bộ khi MySQL tạm thời ngắt kết nối"""
        db_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "database", "smartlib_local.db"))
        if not os.path.exists(db_path):
            return {
                "users": [],
                "books": [],
                "borrowRecords": [],
                "reservations": [],
                "fines": [],
                "notifications": []
            }
        try:
            sqlite_engine = create_engine(f"sqlite:///{db_path}")
            SqliteSession = sessionmaker(bind=sqlite_engine)
            session = SqliteSession()
            users = [u.to_dict() for u in session.query(UserModel).all()]
            books = [b.to_dict() for b in session.query(BookModel).all()]
            borrows = [br.to_dict() for br in session.query(BorrowRecordModel).all()]
            reservations = [res.to_dict() for res in session.query(ReservationModel).all()]
            fines = [f.to_dict() for f in session.query(FineModel).all()]
            notifications = [n.to_dict() for n in session.query(NotificationModel).order_by(NotificationModel.id.desc()).all()]
            session.close()
            logger.info(f"✓ Đã nạp dữ liệu dự phòng từ smartlib_local.db ({len(books)} sách, {len(users)} người dùng)")
            return {
                "users": users,
                "books": books,
                "borrowRecords": borrows,
                "reservations": reservations,
                "fines": fines,
                "notifications": notifications
            }
        except Exception as ex:
            logger.error(f"Lỗi khi đọc SQLite dự phòng: {ex}")
            return {
                "users": [],
                "books": [],
                "borrowRecords": [],
                "reservations": [],
                "fines": [],
                "notifications": []
            }

    def load_db(self) -> Dict[str, Any]:
        """
        Đọc toàn bộ dữ liệu từ các bảng MySQL và trả về Dict tương thích với schema hệ thống.
        Tự động dùng RAM cache cho danh sách sách để đạt phản hồi siêu nhanh < 3ms.
        Có cơ chế Dual-Engine Fallback tự động sang SQLite nếu máy tính chưa kịp khởi động MySQL.
        """
        if not self.SessionLocal:
            self._init_connection()
        if not self.SessionLocal:
            return self._load_from_local_sqlite()

        session = self.SessionLocal()
        try:
            users = [u.to_dict() for u in session.query(UserModel).all()]
            
            # Lấy sách từ RAM cache nếu còn hạn
            now = time.time()
            if _BOOKS_CACHE["data"] is not None and (now - _BOOKS_CACHE["cached_at"]) < BOOKS_CACHE_TTL:
                books = _BOOKS_CACHE["data"]
            else:
                books = [b.to_dict() for b in session.query(BookModel).all()]
                _BOOKS_CACHE["data"] = books
                _BOOKS_CACHE["cached_at"] = now

            borrows = [br.to_dict() for br in session.query(BorrowRecordModel).all()]
            reservations = [res.to_dict() for res in session.query(ReservationModel).all()]
            fines = [f.to_dict() for f in session.query(FineModel).all()]
            notifications = [n.to_dict() for n in session.query(NotificationModel).order_by(NotificationModel.id.desc()).all()]

            return {
                "users": users,
                "books": books,
                "borrowRecords": borrows,
                "reservations": reservations,
                "fines": fines,
                "notifications": notifications
            }
        except Exception as e:
            logger.error(f"Lỗi khi load_db từ MySQL, chuyển sang SQLite dự phòng: {e}")
            return self._load_from_local_sqlite()
        finally:
            session.close()

    def save_db(self, data: Dict[str, Any]):
        """
        Đồng bộ toàn bộ dữ liệu từ Dict vào các bảng MySQL quan hệ.
        """
        invalidate_books_cache()
        if not self.SessionLocal:
            self._init_connection()
        if not self.SessionLocal:
            return
        session = self.SessionLocal()
        try:
            # 1. Sync Books
            for b in data.get("books", []):
                bid = b.get("id")
                if not bid:
                    continue
                existing_book = session.query(BookModel).filter_by(id=bid).first()
                qty = int(b.get("quantity", 1))
                avail = int(b.get("available", qty))
                if existing_book:
                    existing_book.title = b.get("title", existing_book.title)
                    existing_book.author = b.get("author", existing_book.author)
                    existing_book.category = b.get("category", existing_book.category)
                    existing_book.quantity = qty
                    existing_book.available_copies = avail
                    existing_book.description = b.get("desc") or b.get("description") or existing_book.description
                    existing_book.image_url = b.get("imageUrl") or existing_book.image_url
                    existing_book.status = b.get("status", "Sẵn sàng" if avail > 0 else "Hết sách")
                else:
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

            # 2. Sync Users
            for u in data.get("users", []):
                uid = u.get("id")
                if not uid:
                    continue
                existing_user = session.query(UserModel).filter_by(id=uid).first()
                if existing_user:
                    existing_user.full_name = u.get("fullName", existing_user.full_name)
                    existing_user.email = u.get("email", existing_user.email)
                    existing_user.phone = u.get("phone", existing_user.phone)
                    existing_user.address = u.get("address", existing_user.address)
                    existing_user.role = u.get("role", existing_user.role)
                else:
                    new_u = UserModel(
                        id=uid,
                        username=u.get("username", f"user{uid}"),
                        password_hash=u.get("passwordHash", "a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3"),
                        full_name=u.get("fullName", "Người dùng"),
                        role=u.get("role", "Reader"),
                        email=u.get("email"),
                        phone=u.get("phone"),
                        address=u.get("address")
                    )
                    session.add(new_u)

            # 3. Sync BorrowRecords
            for br in data.get("borrowRecords", []):
                brid = br.get("id")
                if not brid:
                    continue
                existing_br = session.query(BorrowRecordModel).filter_by(id=brid).first()
                due_dt = datetime.fromisoformat(br.get("returnDate") or br.get("dueDate")) if (br.get("returnDate") or br.get("dueDate")) else datetime.utcnow()
                borrow_dt = datetime.fromisoformat(br.get("borrowDate")) if br.get("borrowDate") else datetime.utcnow()
                actual_dt = datetime.fromisoformat(br.get("actualReturnDate")) if br.get("actualReturnDate") else None

                if existing_br:
                    existing_br.status = br.get("status", existing_br.status)
                    existing_br.fine_amount = float(br.get("fine_amount") or br.get("fineAmount") or 0.0)
                    existing_br.overdue_days = int(br.get("overdue_days") or br.get("overdueDays") or 0)
                    existing_br.actual_return_date = actual_dt
                else:
                    new_br = BorrowRecordModel(
                        id=brid,
                        user_id=br.get("readerId") or br.get("userId") or 2,
                        book_id=br.get("bookId") or 1,
                        borrow_date=borrow_dt,
                        due_date=due_dt,
                        actual_return_date=actual_dt,
                        borrow_type=br.get("borrowType", "Mượn về nhà"),
                        fine_amount=float(br.get("fine_amount") or br.get("fineAmount") or 0.0),
                        overdue_days=int(br.get("overdue_days") or br.get("overdueDays") or 0),
                        status=br.get("status", "Chờ duyệt")
                    )
                    session.add(new_br)

            # 4. Sync Reservations
            for res in data.get("reservations", []):
                resid = res.get("id")
                if not resid:
                    continue
                existing_res = session.query(ReservationModel).filter_by(id=resid).first()
                if existing_res:
                    existing_res.status = res.get("status", existing_res.status)
                    existing_res.priority = int(res.get("priority", existing_res.priority))
                else:
                    exp_dt = datetime.fromisoformat(res.get("expiresAt")) if res.get("expiresAt") else datetime.utcnow()
                    new_res = ReservationModel(
                        id=resid,
                        user_id=res.get("readerId") or res.get("userId") or 2,
                        book_id=res.get("bookId") or 1,
                        priority=int(res.get("priority", 1)),
                        expires_at=exp_dt,
                        status=res.get("status", "Waiting")
                    )
                    session.add(new_res)

            # 5. Sync Fines
            for f in data.get("fines", []):
                fid = f.get("id")
                if not fid:
                    continue
                existing_fine = session.query(FineModel).filter_by(id=fid).first()
                if existing_fine:
                    existing_fine.status = f.get("status", existing_fine.status)
                    existing_fine.fine_amount = float(f.get("fineAmount", existing_fine.fine_amount))
                else:
                    due_dt = datetime.fromisoformat(f.get("dueDate")) if f.get("dueDate") else datetime.utcnow()
                    act_dt = datetime.fromisoformat(f.get("actualReturnDate")) if f.get("actualReturnDate") else datetime.utcnow()
                    new_fine = FineModel(
                        id=fid,
                        record_id=f.get("borrowRecordId") or f.get("recordId") or 1,
                        user_id=f.get("readerId") or f.get("userId") or 2,
                        book_id=f.get("bookId") or 1,
                        due_date=due_dt,
                        actual_return_date=act_dt,
                        fine_amount=float(f.get("fineAmount", 0.0)),
                        status=f.get("status", "Chưa nộp")
                    )
                    session.add(new_fine)

            # 6. Sync Notifications
            for n in data.get("notifications", []):
                nid = n.get("id")
                if not nid:
                    continue
                existing_notif = session.query(NotificationModel).filter_by(id=nid).first()
                if existing_notif:
                    existing_notif.is_read = bool(n.get("isRead", False))

            session.commit()
        except Exception as e:
            session.rollback()
            logger.error(f"Lỗi khi save_db vào MySQL: {e}")
        finally:
            session.close()

    def mark_notification_read(self, notif_id: int):
        session = self.SessionLocal()
        try:
            notif = session.query(NotificationModel).filter_by(id=notif_id).first()
            if notif:
                notif.is_read = True
                session.commit()
        except Exception as e:
            session.rollback()
            logger.error(f"Lỗi khi mark_notification_read: {e}")
        finally:
            session.close()

    def mark_all_notifications_read(self, role: Optional[str] = None, user_id: Optional[int] = None):
        session = self.SessionLocal()
        try:
            q = session.query(NotificationModel)
            if role in ("Admin", "Librarian"):
                q = q.filter(NotificationModel.recipient_role.in_(["Admin", "Librarian"]))
            elif role == "Reader":
                q = q.filter(NotificationModel.recipient_role == "Reader")
                if user_id:
                    q = q.filter((NotificationModel.recipient_user_id == user_id) | (NotificationModel.recipient_user_id.is_(None)))
            q.update({NotificationModel.is_read: True}, synchronize_session=False)
            session.commit()
        except Exception as e:
            session.rollback()
            logger.error(f"Lỗi khi mark_all_notifications_read: {e}")
        finally:
            session.close()

    def delete_notification(self, notif_id: int):
        session = self.SessionLocal()
        try:
            notif = session.query(NotificationModel).filter_by(id=notif_id).first()
            if notif:
                session.delete(notif)
                session.commit()
        except Exception as e:
            session.rollback()
            logger.error(f"Lỗi khi delete_notification: {e}")
        finally:
            session.close()

    def clear_read_notifications(self, role: Optional[str] = None, user_id: Optional[int] = None):
        session = self.SessionLocal()
        try:
            q = session.query(NotificationModel).filter(NotificationModel.is_read == True)
            if role in ("Admin", "Librarian"):
                q = q.filter(NotificationModel.recipient_role.in_(["Admin", "Librarian"]))
            elif role == "Reader":
                q = q.filter(NotificationModel.recipient_role == "Reader")
                if user_id:
                    q = q.filter((NotificationModel.recipient_user_id == user_id) | (NotificationModel.recipient_user_id.is_(None)))
            q.delete(synchronize_session=False)
            session.commit()
        except Exception as e:
            session.rollback()
            logger.error(f"Lỗi khi clear_read_notifications: {e}")
        finally:
            session.close()

    def add_notification(
        self,
        recipient_role: str,
        title: str,
        message: str,
        notif_type: str = "general",
        recipient_user_id: Optional[int] = None,
        meta: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        session = self.SessionLocal()
        try:
            notif = NotificationModel(
                recipient_role=recipient_role,
                recipient_user_id=recipient_user_id,
                title=title,
                message=message,
                type=notif_type,
                is_read=False,
                meta_json=meta or {},
                created_at=datetime.utcnow()
            )
            session.add(notif)
            session.commit()
            session.refresh(notif)
            return notif.to_dict()
        except Exception as e:
            session.rollback()
            logger.error(f"Lỗi khi add_notification vào MySQL: {e}")
            return {
                "id": 9999,
                "recipientRole": recipient_role,
                "title": title,
                "message": message,
                "type": notif_type,
                "isRead": False,
                "createdAt": datetime.utcnow().isoformat()
            }
        finally:
            session.close()

    def calculate_fine(self, record: Dict[str, Any]) -> float:
        try:
            due_str = record.get("returnDate") or record.get("dueDate")
            actual_str = record.get("actualReturnDate")
            if not due_str or not actual_str:
                return 0.0
            due = datetime.fromisoformat(due_str)
            actual = datetime.fromisoformat(actual_str)
            overdue_days = (actual.date() - due.date()).days
            if overdue_days > 0:
                return float(overdue_days * FINE_PER_DAY)
        except Exception:
            pass
        return 0.0

    def save_fine_record(self, borrow_record: Dict[str, Any], fine_amount: float) -> Optional[Dict[str, Any]]:
        if fine_amount <= 0:
            return None
        session = self.SessionLocal()
        try:
            brid = borrow_record.get("id")
            existing = session.query(FineModel).filter_by(record_id=brid).first()
            due_dt = datetime.fromisoformat(borrow_record.get("returnDate") or borrow_record.get("dueDate"))
            act_dt = datetime.fromisoformat(borrow_record.get("actualReturnDate"))

            if existing:
                existing.fine_amount = fine_amount
                session.commit()
                session.refresh(existing)
                return existing.to_dict()

            fine = FineModel(
                record_id=brid,
                user_id=borrow_record.get("readerId") or borrow_record.get("userId") or 2,
                book_id=borrow_record.get("bookId") or 1,
                due_date=due_dt,
                actual_return_date=act_dt,
                fine_amount=fine_amount,
                status="Chưa nộp"
            )
            session.add(fine)
            session.commit()
            session.refresh(fine)
            return fine.to_dict()
        except Exception as e:
            session.rollback()
            logger.error(f"Lỗi khi save_fine_record vào MySQL: {e}")
            return None
        finally:
            session.close()

