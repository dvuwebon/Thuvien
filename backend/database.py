import os
import sys
import logging
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

FINE_PER_DAY = 2000  # 2.000 VND/ngày trễ hạn

from mysql_db import MySQLDatabaseManager


class DatabaseManager:
    """
    Quản trị CSDL Quan hệ MySQL 8.0 Chuẩn 3NF:
    100% dữ liệu (Sách, Độc giả, Phiếu mượn, Đặt trước, Tiền phạt, Thông báo)
    được lưu trữ, truy vấn và commit trực tiếp trên máy chủ MySQL thực tế.
    """
    def __init__(self):
        self.mysql_mgr = MySQLDatabaseManager()
        self._active_engine = "mysql"
        if not self.mysql_mgr.is_connected():
            logger.warning("⚠️ Chưa kết nối được MySQL Server! Hãy đảm bảo dịch vụ MySQL đang chạy trên máy tính hoặc Docker.")
        else:
            logger.info("⚡ SmartLib đang vận hành 100% trên CƠ SỞ DỮ LIỆU MYSQL 8.0 (smartlib_db).")

    @property
    def active_engine(self) -> str:
        return "mysql"

    def is_connected(self) -> bool:
        return self.mysql_mgr.is_connected()

    def load_db(self) -> Dict[str, Any]:
        """Đọc trực tiếp dữ liệu từ các bảng MySQL"""
        if not self.mysql_mgr.is_connected():
            self.mysql_mgr._init_connection()
        return self.mysql_mgr.load_db()

    def save_db(self, data: Dict[str, Any]):
        """Lưu và đồng bộ trực tiếp các bản ghi vào MySQL"""
        if not self.mysql_mgr.is_connected():
            self.mysql_mgr._init_connection()
        self.mysql_mgr.save_db(data)

    def add_notification(
        self,
        recipient_role: str,
        title: str,
        message: str,
        notif_type: str = "general",
        recipient_user_id: Optional[int] = None,
        meta: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Tạo thông báo mới lưu trực tiếp vào bảng notifications trong MySQL"""
        return self.mysql_mgr.add_notification(
            recipient_role=recipient_role,
            title=title,
            message=message,
            notif_type=notif_type,
            recipient_user_id=recipient_user_id,
            meta=meta
        )

    def calculate_fine(self, record: Dict[str, Any]) -> float:
        """Tính toán tiền phạt trễ hạn theo công thức số ngày trễ * 2.000 đ"""
        return self.mysql_mgr.calculate_fine(record)

    def save_fine_record(self, borrow_record: Dict[str, Any], fine_amount: float) -> Optional[Dict[str, Any]]:
        """Lưu phiếu phạt vi phạm trực tiếp vào bảng fines trong MySQL"""
        return self.mysql_mgr.save_fine_record(borrow_record, fine_amount)


# Khởi tạo Singleton Database Manager kết nối trực tiếp MySQL
db_manager = DatabaseManager()
