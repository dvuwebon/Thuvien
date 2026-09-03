import json
import os
import threading
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional

DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data", "database.json"))
_lock = threading.Lock()

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
            if "borrowRecords" not in data:
                data["borrowRecords"] = []
            if "notifications" not in data:
                data["notifications"] = []
            if "books" not in data:
                data["books"] = []
            if "users" not in data:
                data["users"] = []
            return data

    def save_db(self, data: Dict[str, Any]):
        with _lock:
            with open(self.db_path, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)

    def add_notification(self, recipient_role: str, title: str, message: str, notif_type: str = "general", recipient_user_id: Optional[int] = None, meta: Optional[Dict[str, Any]] = None):
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

db_manager = DatabaseManager()