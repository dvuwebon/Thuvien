from pydantic import BaseModel, Field
from typing import Optional, List, Any
from datetime import datetime

class LoginRequest(BaseModel):
    username: str
    password: str

class RegisterRequest(BaseModel):
    username: str
    password: str
    fullName: str
    phone: str
    email: Optional[str] = None
    address: Optional[str] = None
    birthDate: Optional[str] = None

class UpdateProfileRequest(BaseModel):
    fullName: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    birthDate: Optional[str] = None

class ChangePasswordRequest(BaseModel):
    currentPassword: str
    newPassword: str

class BookCreate(BaseModel):
    title: str
    author: Optional[str] = "Chưa rõ"
    category: Optional[str] = "Khác"
    quantity: int = 1
    desc: Optional[str] = ""
    imageUrl: Optional[str] = None

class BookUpdate(BaseModel):
    title: Optional[str] = None
    author: Optional[str] = None
    category: Optional[str] = None
    quantity: Optional[int] = None
    desc: Optional[str] = None
    imageUrl: Optional[str] = None

class ReaderCreate(BaseModel):
    fullName: str
    username: Optional[str] = None
    password: Optional[str] = "123"
    email: Optional[str] = ""
    phone: Optional[str] = ""
    address: Optional[str] = ""
    birthDate: Optional[str] = None

class ReaderUpdate(BaseModel):
    fullName: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    birthDate: Optional[str] = None

class BorrowRequestCreate(BaseModel):
    bookId: int
    userId: Optional[int] = None
    readerName: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    birthDate: Optional[str] = None
    borrowType: Optional[str] = "Mượn về nhà"
    status: Optional[str] = "Chờ duyệt"

class BorrowStatusUpdate(BaseModel):
    status: str

class NotificationReadRequest(BaseModel):
    role: Optional[str] = None
    userId: Optional[int] = None