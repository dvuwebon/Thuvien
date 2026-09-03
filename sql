IF DB_ID(N'SmartLibDB') IS NULL
    CREATE DATABASE SmartLibDB;
GO
USE SmartLibDB;
GO

-- ==========================================
-- 1. BẢNG NGƯỜI DÙNG (Quản lý phân quyền)
-- ==========================================
IF OBJECT_ID(N'Users', N'U') IS NULL
BEGIN
CREATE TABLE Users (
    UserID INT IDENTITY(1,1) PRIMARY KEY,
    Username VARCHAR(50) NOT NULL UNIQUE,
    PasswordHash VARCHAR(256) NOT NULL, -- Trong thực tế cần băm mật khẩu (BCrypt/Argon2)
    FullName NVARCHAR(100) NOT NULL,
    Role VARCHAR(20) NOT NULL CHECK (Role IN ('Admin', 'Reader')),
    IsActive BIT DEFAULT 1,
    CreatedAt DATETIME DEFAULT GETDATE()
);
END;

-- ==========================================
-- 2. BẢNG SÁCH (Kho dữ liệu nền tảng cho AI)
-- ==========================================
IF OBJECT_ID(N'Books', N'U') IS NULL
BEGIN
CREATE TABLE Books (
    BookID INT IDENTITY(1,1) PRIMARY KEY,
    Title NVARCHAR(255) NOT NULL,
    Author NVARCHAR(100),
    Category NVARCHAR(100),
    Quantity INT NOT NULL DEFAULT 1 CHECK (Quantity > 0),
    Description NVARCHAR(MAX),
    Status NVARCHAR(50) DEFAULT N'Sẵn sàng' CHECK (Status IN (N'Sẵn sàng', N'Đang cho mượn', N'Bảo trì')),
    PublishedYear INT,
    CreatedAt DATETIME DEFAULT GETDATE()
);
END;
IF COL_LENGTH(N'Books', N'Quantity') IS NULL
    ALTER TABLE Books ADD Quantity INT NOT NULL CONSTRAINT DF_Books_Quantity DEFAULT 1;
GO

-- ==========================================
-- 3. BẢNG LỊCH SỬ MƯỢN TRẢ
-- ==========================================
IF OBJECT_ID(N'BorrowRecords', N'U') IS NULL
BEGIN
CREATE TABLE BorrowRecords (
    RecordID INT IDENTITY(1,1) PRIMARY KEY,
    UserID INT NOT NULL FOREIGN KEY REFERENCES Users(UserID),
    BookID INT NOT NULL FOREIGN KEY REFERENCES Books(BookID),
    BorrowDate DATETIME DEFAULT GETDATE(),
    DueDate DATETIME NOT NULL,
    ReturnDate DATETIME NULL,
    Status NVARCHAR(50) DEFAULT N'Đang mượn' CHECK (Status IN (N'Đang mượn', N'Đã trả', N'Quá hạn')),
    Notes NVARCHAR(255)
);
END;
GO

IF COL_LENGTH(N'Users', N'BirthDate') IS NULL ALTER TABLE Users ADD BirthDate DATE NULL;
IF COL_LENGTH(N'Users', N'Phone') IS NULL ALTER TABLE Users ADD Phone NVARCHAR(30) NULL;
IF COL_LENGTH(N'Users', N'Address') IS NULL ALTER TABLE Users ADD Address NVARCHAR(255) NULL;
IF COL_LENGTH(N'Users', N'Email') IS NULL ALTER TABLE Users ADD Email NVARCHAR(100) NULL;
GO

-- ==========================================
-- 4. BẢNG LƯU TRỮ LỊCH SỬ CHAT VỚI AI (Tuỳ chọn)
-- Mục đích: Phân tích hành vi để tinh chỉnh Prompt
-- ==========================================
IF OBJECT_ID(N'AiChatLogs', N'U') IS NULL
BEGIN
CREATE TABLE AiChatLogs (
    LogID INT IDENTITY(1,1) PRIMARY KEY,
    UserID INT NULL FOREIGN KEY REFERENCES Users(UserID),
    UserMessage NVARCHAR(MAX) NOT NULL,
    AiResponse NVARCHAR(MAX) NOT NULL,
    Timestamp DATETIME DEFAULT GETDATE()
);
END;

-- ==========================================
-- THÊM DỮ LIỆU MẪU (Mock Data)
-- ==========================================

-- Mật khẩu mẫu '123' được lưu dưới dạng SHA-256 để khớp API.
IF NOT EXISTS (SELECT 1 FROM Users WHERE Username = 'admin')
    INSERT INTO Users (Username, PasswordHash, FullName, Role, IsActive)
    VALUES ('admin', 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3', N'Quản trị', 'Admin', 1);
IF NOT EXISTS (SELECT 1 FROM Users WHERE Username = 'user')
    INSERT INTO Users (Username, PasswordHash, FullName, Role, IsActive)
    VALUES ('user', 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3', N'Độc giả', 'Reader', 1);
UPDATE Users
SET PasswordHash = 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3'
WHERE Username IN ('admin', 'user');

-- Thêm dữ liệu sách
IF NOT EXISTS (SELECT 1 FROM Books WHERE Title = N'Clean Code')
    INSERT INTO Books (Title, Author, Category, Quantity, Description, Status) VALUES
    (N'Clean Code', 'Robert C. Martin', N'Công nghệ thông tin', 5, N'Hướng dẫn viết mã sạch, tối ưu và dễ bảo trì cho kỹ sư phần mềm.', N'Sẵn sàng');
IF NOT EXISTS (SELECT 1 FROM Books WHERE Title = N'Tâm lý học tội phạm')
    INSERT INTO Books (Title, Author, Category, Quantity, Description, Status) VALUES
    (N'Tâm lý học tội phạm', 'Stanton E. Samenow', N'Tâm lý - Xã hội', 1, N'Phân tích hành vi, suy nghĩ và động cơ của những kẻ phạm tội.', N'Sẵn sàng');
IF NOT EXISTS (SELECT 1 FROM Books WHERE Title = N'ASP.NET Core MVC')
    INSERT INTO Books (Title, Author, Category, Quantity, Description, Status) VALUES
    (N'ASP.NET Core MVC', 'Microsoft Press', N'Công nghệ thông tin', 1, N'Tài liệu học lập trình web backend, thiết kế giao diện web với C# và .NET.', N'Đang cho mượn');
IF NOT EXISTS (SELECT 1 FROM Books WHERE Title = N'Đắc Nhân Tâm')
    INSERT INTO Books (Title, Author, Category, Quantity, Description, Status) VALUES
    (N'Đắc Nhân Tâm', 'Dale Carnegie', N'Kỹ năng sống', 3, N'Nghệ thuật giao tiếp, thu phục lòng người và xây dựng mối quan hệ tốt đẹp.', N'Sẵn sàng');

-- Thêm dữ liệu mượn trả
IF NOT EXISTS (SELECT 1 FROM BorrowRecords)
    INSERT INTO BorrowRecords (UserID, BookID, BorrowDate, DueDate, Status)
    SELECT u.UserID, b.BookID, DATEADD(DAY, -5, GETDATE()), DATEADD(DAY, 9, GETDATE()), N'Đang mượn'
    FROM Users u CROSS JOIN Books b
    WHERE u.Username = 'user' AND b.Title = N'ASP.NET Core MVC';