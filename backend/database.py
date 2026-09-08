import os
import json
import logging
import threading
from datetime import datetime
from typing import Dict, Any, List, Optional

logger = logging.getLogger("smartlib.database")

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

DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data", "database.json"))
FINE_PER_DAY = 2000  # 2.000 VND/ngày trễ hạn

# Cấu hình loại cơ sở dữ liệu: 'mysql' hoặc 'json'
DB_ENGINE = os.getenv("DB_ENGINE", "mysql").strip().lower()


def get_default_db() -> Dict[str, Any]:
    return {
        "users": [
            {
                "id": 1,
                "username": "admin",
                "password": "123",
                "passwordHash": "a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3",
                "fullName": "Quản trị viên",
                "role": "Admin",
                "email": "admin@smartlib.edu.vn",
                "phone": "0987 654 321",
                "address": "Phòng Quản lý Thư viện, ĐHQG Hà Nội",
                "birthDate": "1990-01-01",
                "isActive": True
            },
            {
                "id": 2,
                "username": "reader",
                "password": "123",
                "passwordHash": "a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3",
                "fullName": "Trần Thị Mai",
                "role": "Reader",
                "email": "mai.tran@smartlib.edu.vn",
                "phone": "0901 234 567",
                "address": "Khu KTX Sinh viên Mễ Trì, Thanh Xuân, Hà Nội",
                "birthDate": "2002-10-20",
                "isActive": True
            },
            {
                "id": 3,
                "username": "librarian",
                "password": "123",
                "passwordHash": "a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3",
                "fullName": "Thủ thư Nguyễn Văn Hưng",
                "role": "Librarian",
                "email": "librarian@smartlib.edu.vn",
                "phone": "0912 888 999",
                "address": "Bộ phận Nghiệp vụ Thư viện, ĐHQG Hà Nội",
                "birthDate": "1995-05-12",
                "isActive": True
            }
        ],
        "books": [],
        "borrowRecords": [],
        "reservations": [],
        "fines": [],
        "notifications": []
    }


class JSONDatabaseManager:
    """Lớp quản lý lưu trữ JSON fallback"""
    def __init__(self, db_path: str = DB_PATH):
        self.db_path = db_path
        self._lock = threading.Lock()
        os.makedirs(os.path.dirname(self.db_path), exist_ok=True)
        self._ensure_db()

    def _ensure_db(self):
        if not os.path.exists(self.db_path):
            with open(self.db_path, "w", encoding="utf-8") as f:
                json.dump(get_default_db(), f, ensure_ascii=False, indent=2)
        else:
            try:
                with open(self.db_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                dirty = False
                if "users" not in data or not data["users"]:
                    data["users"] = get_default_db()["users"]
                    dirty = True
                else:
                    if not any(u.get("username") == "librarian" for u in data["users"]):
                        data["users"].append({
                            "id": 3,
                            "username": "librarian",
                            "password": "123",
                            "passwordHash": "a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3",
                            "fullName": "Thủ thư Nguyễn Văn Hưng",
                            "role": "Librarian",
                            "email": "librarian@smartlib.edu.vn",
                            "phone": "0912 888 999",
                            "address": "Bộ phận Nghiệp vụ Thư viện, ĐHQG Hà Nội",
                            "birthDate": "1995-05-12",
                            "isActive": True
                        })
                        dirty = True
                for key in ["borrowRecords", "notifications", "reservations", "fines"]:
                    if key not in data:
                        data[key] = []
                        dirty = True

                if dirty:
                    with open(self.db_path, "w", encoding="utf-8") as f:
                        json.dump(data, f, ensure_ascii=False, indent=2)
            except Exception:
                with open(self.db_path, "w", encoding="utf-8") as f:
                    json.dump(get_default_db(), f, ensure_ascii=False, indent=2)

    def load_db(self) -> Dict[str, Any]:
        with self._lock:
            with open(self.db_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            for key in ["borrowRecords", "notifications", "books", "users", "reservations", "fines"]:
                if key not in data:
                    data[key] = []
            return data

    def save_db(self, data: Dict[str, Any]):
        with self._lock:
            with open(self.db_path, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)

    def add_notification(
        self,
        recipient_role: str,
        title: str,
        message: str,
        notif_type: str = "general",
        recipient_user_id: Optional[int] = None,
        meta: Optional[Dict[str, Any]] = None
    ):
        db = self.load_db()
        notifs = db.get("notifications", [])
        new_id = max([int(n.get("id", 0)) for n in notifs], default=0) + 1
        notif = {
            "id": new_id,
            "recipientRole": recipient_role,
            "recipientUserId": recipient_user_id,
            "title": title,
            "message": message,
            "type": notif_type,
            "isRead": False,
            "createdAt": datetime.now().isoformat()
        }
        if meta:
            notif["meta"] = dict(meta)
            notif.update(meta)
        notifs.insert(0, notif)
        db["notifications"] = notifs
        self.save_db(db)
        return notif

    def calculate_fine(self, record: Dict[str, Any]) -> float:
        try:
            due_str = record.get("returnDate", "")
            actual_str = record.get("actualReturnDate", "")
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
        db = self.load_db()
        fines = db.get("fines", [])
        existing = next((f for f in fines if f.get("borrowRecordId") == borrow_record.get("id")), None)
        if existing:
            existing["fineAmount"] = fine_amount
            existing["updatedAt"] = datetime.now().isoformat()
            db["fines"] = fines
            self.save_db(db)
            return existing
        new_id = max([int(f.get("id", 0)) for f in fines], default=0) + 1
        fine_record = {
            "id": new_id,
            "borrowRecordId": borrow_record.get("id"),
            "bookId": borrow_record.get("bookId"),
            "bookTitle": borrow_record.get("bookTitle", ""),
            "readerId": borrow_record.get("readerId"),
            "readerName": borrow_record.get("readerName", ""),
            "dueDate": borrow_record.get("returnDate"),
            "actualReturnDate": borrow_record.get("actualReturnDate"),
            "fineAmount": fine_amount,
            "status": "Chưa nộp",
            "createdAt": datetime.now().isoformat()
        }
        fines.insert(0, fine_record)
        db["fines"] = fines
        self.save_db(db)
        return fine_record


class UnifiedDatabaseManager:
    """
    Quản trị CSDL linh hoạt:
    - Nếu DB_ENGINE='mysql' và kết nối MySQL sẵn sàng: 100% dữ liệu thực tế lưu trên MySQL.
    - Nếu MySQL chưa bật: Chuyển sang JSON fallback kèm cảnh báo rõ ràng để hệ thống không bị gián đoạn.
    """
    def __init__(self):
        self.engine_type = DB_ENGINE
        self.json_mgr = JSONDatabaseManager()
        self.mysql_mgr = None
        self._active_engine = "json"

        if self.engine_type == "mysql":
            try:
                from mysql_db import MySQLDatabaseManager
                self.mysql_mgr = MySQLDatabaseManager()
                if self.mysql_mgr.is_connected():
                    self._active_engine = "mysql"
                    logger.info("⚡ SmartLib đang chạy trên CƠ SỞ DỮ LIỆU THỰC TẾ MYSQL 8.0")
                else:
                    logger.warning("⚠️ MySQL chưa sẵn sàng (chưa bật MySQL Server). Đang dùng chế độ dự phòng database.json.")
                    self._active_engine = "json"
            except Exception as e:
                logger.warning(f"⚠️ Không thể khởi tạo MySQL adapter ({e}). Dùng JSON dự phòng.")
                self._active_engine = "json"
        else:
            self._active_engine = "json"
            logger.info("ℹ️ SmartLib đang chạy chế độ lưu trữ JSON (DB_ENGINE=json).")

    @property
    def active_engine(self) -> str:
        return self._active_engine

    def load_db(self) -> Dict[str, Any]:
        if self._active_engine == "mysql" and self.mysql_mgr:
            return self.mysql_mgr.load_db()
        return self.json_mgr.load_db()

    def save_db(self, data: Dict[str, Any]):
        if self._active_engine == "mysql" and self.mysql_mgr:
            self.mysql_mgr.save_db(data)
            # Lưu bản sao backup vào JSON để luôn đồng bộ dự phòng
            try:
                self.json_mgr.save_db(data)
            except Exception:
                pass
        else:
            self.json_mgr.save_db(data)

    def add_notification(
        self,
        recipient_role: str,
        title: str,
        message: str,
        notif_type: str = "general",
        recipient_user_id: Optional[int] = None,
        meta: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        if self._active_engine == "mysql" and self.mysql_mgr:
            res = self.mysql_mgr.add_notification(recipient_role, title, message, notif_type, recipient_user_id, meta)
            try:
                self.json_mgr.add_notification(recipient_role, title, message, notif_type, recipient_user_id, meta)
            except Exception:
                pass
            return res
        return self.json_mgr.add_notification(recipient_role, title, message, notif_type, recipient_user_id, meta)

    def calculate_fine(self, record: Dict[str, Any]) -> float:
        if self._active_engine == "mysql" and self.mysql_mgr:
            return self.mysql_mgr.calculate_fine(record)
        return self.json_mgr.calculate_fine(record)

    def save_fine_record(self, borrow_record: Dict[str, Any], fine_amount: float) -> Optional[Dict[str, Any]]:
        if self._active_engine == "mysql" and self.mysql_mgr:
            res = self.mysql_mgr.save_fine_record(borrow_record, fine_amount)
            try:
                self.json_mgr.save_fine_record(borrow_record, fine_amount)
            except Exception:
                pass
            return res
        return self.json_mgr.save_fine_record(borrow_record, fine_amount)


# Khởi tạo Singleton Database Manager
db_manager = UnifiedDatabaseManager()