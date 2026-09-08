import json
import os
import threading
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional

DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data", "database.json"))
_lock = threading.Lock()

FINE_PER_DAY = 2000  # 2.000 VND/ngày trễ hạn


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
                "email": "admin@smartlib.com",
                "phone": "0987 654 321",
                "address": "Hà Nội",
                "birthDate": "1990-01-01",
                "isActive": True
            },
            {
                "id": 2,
                "username": "reader",
                "password": "123",
                "passwordHash": "a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3",
                "fullName": "Độc giả",
                "role": "Reader",
                "email": "reader@smartlib.com",
                "phone": "0912 345 678",
                "address": "Hà Nội",
                "birthDate": "2000-01-15",
                "isActive": True
            }
        ],
        "books": [],
        "borrowRecords": [],
        "reservations": [],
        "fines": [],
        "notifications": []
    }


class DatabaseManager:
    def __init__(self, db_path: str = DB_PATH):
        self.db_path = db_path
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
                if "borrowRecords" not in data:
                    data["borrowRecords"] = []
                    dirty = True
                if "notifications" not in data:
                    data["notifications"] = []
                    dirty = True
                # Migration: thêm reservations và fines nếu chưa có
                if "reservations" not in data:
                    data["reservations"] = []
                    dirty = True
                if "fines" not in data:
                    data["fines"] = []
                    dirty = True
                if dirty:
                    with open(self.db_path, "w", encoding="utf-8") as f:
                        json.dump(data, f, ensure_ascii=False, indent=2)
            except Exception:
                with open(self.db_path, "w", encoding="utf-8") as f:
                    json.dump(get_default_db(), f, ensure_ascii=False, indent=2)

    def load_db(self) -> Dict[str, Any]:
        with _lock:
            with open(self.db_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            # Đảm bảo tất cả key luôn tồn tại khi load
            for key in ["borrowRecords", "notifications", "books", "users", "reservations", "fines"]:
                if key not in data:
                    data[key] = []
            return data

    def save_db(self, data: Dict[str, Any]):
        with _lock:
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
        """
        Tính tiền phạt trễ hạn.
        Quy tắc: 2.000 VND/ngày trễ hạn.
        Chỉ tính khi actualReturnDate > returnDate (dueDate).
        """
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
        """
        Lưu bản ghi tiền phạt vào bảng fines.
        Chỉ lưu khi có tiền phạt thực sự (> 0).
        """
        if fine_amount <= 0:
            return None
        db = self.load_db()
        fines = db.get("fines", [])
        # Tránh ghi trùng fine cho cùng 1 borrowRecord
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
            "dueDate": borrow_record.get("returnDate", ""),
            "actualReturnDate": borrow_record.get("actualReturnDate", ""),
            "fineAmount": fine_amount,
            "status": "Chưa nộp",  # Chưa nộp / Đã nộp
            "createdAt": datetime.now().isoformat()
        }
        fines.insert(0, fine_record)
        db["fines"] = fines
        self.save_db(db)
        return fine_record


db_manager = DatabaseManager()