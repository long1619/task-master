# 📋 LỘ TRÌNH PHÁT TRIỂN DỰ ÁN: TASKMASTER PRO API (TODO APP PRO)
> **Mục tiêu**: Xây dựng từ con số 0 một hệ thống RESTful API quản lý công việc (Todo/Task Management) hoàn chỉnh, chuẩn công nghiệp với Node.js & Express.js theo phương pháp cuốn chiếu 3 cấp độ.

---

## 🏗️ KIẾN TRÚC THƯ MỤC MỤC TIÊU (LAYERED ARCHITECTURE)

Dự án sẽ được tổ chức theo cấu trúc phân lớp chuyên nghiệp, tách biệt rõ ràng trách nhiệm của từng thành phần:

```text
nodejs-express-starter/
├── src/
│   ├── config/             # Cấu hình môi trường, database, biến toàn cục
│   │   └── db.js
│   ├── controllers/        # Tiếp nhận request, gọi service, trả về response
│   │   ├── authController.js
│   │   └── todoController.js
│   ├── services/           # Xử lý toàn bộ logic nghiệp vụ (Business Logic)
│   │   ├── authService.js
│   │   └── todoService.js
│   ├── models/             # Schema & định nghĩa dữ liệu (Mongoose/Prisma/Mock)
│   │   ├── User.js
│   │   └── Todo.js
│   ├── routes/             # Định tuyến URL API
│   │   ├── index.js
│   │   ├── authRoutes.js
│   │   └── todoRoutes.js
│   ├── middlewares/        # Các middleware trung gian
│   │   ├── authMiddleware.js     # Xác thực JWT
│   │   ├── errorMiddleware.js    # Bắt và xử lý lỗi tập trung
│   │   ├── validateMiddleware.js # Kiểm tra tính hợp lệ dữ liệu
│   │   └── uploadMiddleware.js   # Xử lý upload file
│   ├── validations/        # Schema validate dữ liệu (Zod)
│   │   ├── authValidation.js
│   │   └── todoValidation.js
│   └── utils/              # Các hàm tiện ích dùng chung
│       ├── AppError.js     # Class tùy biến lỗi kế thừa từ Error
│       └── asyncHandler.js # Hàm bọc async function để bỏ try-catch lặp lại
├── uploads/                # Thư mục chứa file tĩnh / đính kèm
├── .env.example            # File mẫu cấu hình môi trường
├── .env                    # Biến môi trường bí mật (không commit lên Git)
├── package.json
└── server.js               # Entry point (khởi chạy server và kết nối DB)
```

---

## 🟢 CẤP ĐỘ 1: NỀN TẢNG & KIẾN TRÚC CHUẨN (FOUNDATION)

### 1. Mục tiêu cấp độ 1
* Chuyển đổi mã nguồn từ file đơn lẻ (`server.js`) sang kiến trúc phân lớp (`Routes` $\to$ `Controllers` $\to$ `Services` $\to$ `Models`).
* Làm chủ cơ chế **Routing**, **Middleware** và quy chuẩn mã trạng thái HTTP (**HTTP Status Codes**).
* Xây dựng cơ chế **bắt lỗi tập trung (Global Error Handler)** để không bao giờ bị crash server.

### 2. Mô hình dữ liệu Todo (Schema)
| Trường dữ liệu | Kiểu dữ liệu | Bắt buộc | Mô tả |
| :--- | :--- | :---: | :--- |
| `id` | String / Number | ✅ | Định danh duy nhất |
| `title` | String | ✅ | Tiêu đề công việc (tối thiểu 3 ký tự) |
| `description`| String | ❌ | Chi tiết nội dung công việc |
| `status` | Enum | ✅ | `pending` \| `in_progress` \| `completed` (mặc định: `pending`) |
| `createdAt` | Date | ✅ | Thời gian tạo |
| `updatedAt` | Date | ✅ | Thời gian cập nhật lần cuối |

### 3. Danh sách API Endpoints Cấp độ 1
| Method | Endpoint | Mô tả | Mã HTTP thành công |
| :--- | :--- | :--- | :---: |
| `GET` | `/api/v1/todos` | Lấy danh sách tất cả todos (có thể lọc theo `?status=...`) | `200 OK` |
| `GET` | `/api/v1/todos/:id` | Lấy chi tiết một todo theo ID | `200 OK` |
| `POST` | `/api/v1/todos` | Tạo mới một công việc | `201 Created` |
| `PUT` | `/api/v1/todos/:id` | Cập nhật toàn bộ thông tin todo | `200 OK` |
| `PATCH` | `/api/v1/todos/:id/status` | Cập nhật nhanh trạng thái todo | `200 OK` |
| `DELETE` | `/api/v1/todos/:id` | Xóa một công việc | `204 No Content` |

### 4. Kỹ thuật cốt lõi cần làm chủ
* **`express.Router()`**: Chia nhỏ routes theo từng module độc lập.
* **`asyncHandler` Utility**: Wrapper function bọc ngoài các async controller, tự động đẩy error sang `next(err)` để tránh lặp đi lặp lại khối `try-catch`.
* **Custom `AppError`**: Tạo class `AppError extends Error` chứa `statusCode`, `status` (fail/error), `isOperational: true`.
* **Global Error Middleware**: Middleware nhận đủ 4 tham số `(err, req, res, next)` đặt ở cuối cùng của pipeline để định dạng response lỗi chuẩn JSON.
* **404 Not Found Middleware**: Bắt mọi URL không tồn tại.

---

## 🟡 CẤP ĐỘ 2: BẢO MẬT & ĐA NGƯỜI DÙNG (AUTHENTICATION & AUTHORIZATION)

### 1. Mục tiêu cấp độ 2
* Xây dựng hệ thống Đăng ký, Đăng nhập, cấp quyền bảo mật bằng **JWT (JSON Web Token)**.
* Giải quyết bài toán bảo mật cốt lõi: **Data Isolation / Authorization (Phân lập dữ liệu)**.
  > *Mỗi người dùng chỉ có quyền xem, sửa, xóa Todo của chính họ. Không thể truy cập dữ liệu của người khác dù biết ID.*

### 2. Mô hình dữ liệu mở rộng
#### User Schema:
| Trường dữ liệu | Kiểu dữ liệu | Bắt buộc | Mô tả |
| :--- | :--- | :---: | :--- |
| `id` | String / ObjectId | ✅ | Khóa chính |
| `name` | String | ✅ | Họ và tên người dùng |
| `email` | String | ✅ | Email đăng nhập (Unique, format email hợp lệ) |
| `password` | String | ✅ | Mật khẩu đã được băm (Bcrypt hash) |
| `role` | Enum | ✅ | `user` \| `admin` (mặc định: `user`) |
| `createdAt` | Date | ✅ | Ngày tạo tài khoản |

#### Todo Schema (Cập nhật):
* Thêm trường `userId` (Liên kết khoá ngoại tới `User.id`).

### 3. Danh sách API Endpoints Cấp độ 2
| Method | Endpoint | Bảo vệ (Auth)? | Mô tả |
| :--- | :--- | :---: | :--- |
| `POST` | `/api/v1/auth/register` | ❌ | Đăng ký tài khoản mới (mã hóa mật khẩu) |
| `POST` | `/api/v1/auth/login` | ❌ | Đăng nhập & nhận chuỗi Access Token (JWT) |
| `GET` | `/api/v1/auth/me` | ✅ | Lấy thông tin tài khoản hiện tại |
| `PUT` | `/api/v1/auth/change-password`| ✅ | Đổi mật khẩu |
| `GET` | `/api/v1/todos` | ✅ | **Chỉ trả về** danh sách Todo của user đang đăng nhập |
| `POST` | `/api/v1/todos` | ✅ | Tự động gán `userId` = `req.user.id` khi tạo |
| `GET` | `/api/v1/todos/:id` | ✅ | Kiểm tra quyền sở hữu trước khi trả về |
| `PUT` | `/api/v1/todos/:id` | ✅ | Kiểm tra quyền sở hữu trước khi cho phép sửa |
| `DELETE` | `/api/v1/todos/:id` | ✅ | Kiểm tra quyền sở hữu trước khi cho phép xóa |

### 4. Kỹ thuật cốt lõi cần làm chủ
* **Mã hóa mật khẩu (`bcryptjs`)**: Không bao giờ lưu plain-text password; sử dụng hàm băm với salt round (thường là 10-12).
* **JWT Authentication (`jsonwebtoken`)**:
  - Ký token (`jwt.sign`) khi đăng nhập thành công chứa `payload: { id, role }`.
  - Thiết lập thời gian hết hạn (`expiresIn: '1d'`).
* **Middleware `verifyToken` / `protect`**:
  - Đọc token từ header: `Authorization: Bearer <token>`.
  - Giải mã và xác thực token (`jwt.verify`).
  - Gán thông tin user vào `req.user` để các controller phía sau sử dụng.
* **Logic phân quyền sở hữu (Ownership Check)**:
  ```javascript
  if (todo.userId.toString() !== req.user.id.toString()) {
    throw new AppError('Bạn không có quyền thao tác trên tài nguyên này!', 403);
  }
  ```

---

## 🔴 CẤP ĐỘ 3: TÍNH NĂNG NÂNG CAO CỦA BACKEND CHUYÊN NGHIỆP (PRODUCTION-READY)

### 1. Mục tiêu cấp độ 3
* Tối ưu hóa hiệu năng, trải nghiệm người dùng với **Tìm kiếm, Lọc, Phân trang**.
* Đảm bảo tính toàn vẹn dữ liệu bằng **Validation Schema (Zod)**.
* Xử lý đa phương tiện: **Upload file đính kèm với Multer**.
* Gia cố bảo mật HTTP Headers và chống tấn công Bruteforce/DDoS.

### 2. Mô hình dữ liệu hoàn chỉnh (Todo Schema Pro)
* `id`, `userId`, `title`, `description`, `status`
* `priority`: `low` \| `medium` \| `high` (mặc định: `medium`)
* `dueDate`: Date (Hạn chót hoàn thành)
* `tags`: Array of Strings (ví dụ: `["work", "urgent", "meeting"]`)
* `attachments`: Array of Objects:
  - `fileName`: Tên file gốc
  - `filePath`: Đường dẫn tĩnh để tải file
  - `fileSize`: Dung lượng file (bytes)
  - `mimeType`: Kiểu file (`image/jpeg`, `application/pdf`...)

### 3. Danh sách tính năng & Endpoints Cấp độ 3
#### A. Phân trang, Tìm kiếm, Lọc & Sắp xếp (Search, Filter, Pagination, Sort)
* **Endpoint**: `GET /api/v1/todos`
* **Query Parameters hỗ trợ**:
  - `?page=1&limit=10`: Phân trang dữ liệu.
  - `?search=meeting`: Tìm kiếm chuỗi trong `title` hoặc `description`.
  - `?status=pending&priority=high`: Lọc kết hợp nhiều tiêu chí.
  - `?sortBy=dueDate:asc` hoặc `?sortBy=createdAt:desc`: Sắp xếp linh hoạt.
* **Cấu trúc JSON phản hồi chuẩn**:
  ```json
  {
    "success": true,
    "pagination": {
      "totalItems": 45,
      "totalPages": 5,
      "currentPage": 1,
      "limit": 10,
      "hasNextPage": true,
      "hasPrevPage": false
    },
    "data": [ ... ]
  }
  ```

#### B. Kiểm tra tính hợp lệ dữ liệu (Request Validation với Zod)
* Viết middleware validate tự động kiểm tra `req.body`, `req.query`, `req.params`.
* Trả về chi tiết từng lỗi validation (mã lỗi `400 Bad Request`) nếu client gửi dữ liệu sai (ví dụ: email sai định dạng, tiêu đề rỗng, độ dài mật khẩu < 6 ký tự...).

#### C. Upload File đính kèm (`multer`)
* **Endpoint**: `POST /api/v1/todos/:id/attachments`
* Cho phép upload ảnh đại diện hoặc tài liệu đính kèm (`.png`, `.jpg`, `.pdf`).
* Giới hạn kích thước file (tối đa 5MB) và kiểm tra định dạng file an toàn (mimetype filtering).
* Lưu trữ file trên đĩa cứng local (`/uploads`) và cung cấp đường dẫn truy cập qua `express.static`.

#### D. Tăng cường bảo mật & Giám sát
* **`helmet`**: Thiết lập các HTTP security headers chống XSS, clickjacking.
* **`cors`**: Cấu hình chia sẻ tài nguyên giữa các domain (White-list domain frontend).
* **`express-rate-limit`**: Giới hạn số lượng request từ 1 IP (chống spam login và brute-force).
* **`morgan`**: Ghi log chi tiết mọi request phục vụ việc debug và monitor.

---

## 🛠️ DANH SÁCH THƯ VIỆN & CÔNG CỤ THEO TỪNG CẤP ĐỘ

| Cấp độ | Thư viện / Công cụ | Mục đích sử dụng |
| :---: | :--- | :--- |
| **Level 1** | `express` | Web Framework cốt lõi |
| | `dotenv` | Quản lý biến môi trường an toàn |
| | `morgan` | HTTP request logger middleware |
| **Level 2** | `bcryptjs` | Băm và kiểm tra mật khẩu an toàn |
| | `jsonwebtoken` | Tạo và xác thực Access Token (JWT) |
| **Level 3** | `zod` | Schema validation cho dữ liệu đầu vào |
| | `multer` | Middleware tiếp nhận và xử lý upload file |
| | `cors` | Quản lý CORS header cho phép Frontend kết nối |
| | `helmet` | Tăng cường bảo mật HTTP headers |
| | `express-rate-limit` | Giới hạn tần suất request (Rate Limiter) |

---

## 🏁 TIÊU CHÍ HOÀN THÀNH (CHECKLIST NGHIỆM THU)

- [ ] **Level 1 Checklist**:
  - [ ] Đã tách thư mục: `routes`, `controllers`, `services`, `middlewares`, `utils`.
  - [ ] Viết xong `asyncHandler` và class `AppError`.
  - [ ] Global Error Handler hoạt động chính xác (bắt được cả lỗi đồng bộ và bất đồng bộ).
  - [ ] Test đầy đủ 5 phương thức CRUD cơ bản trên Postman / Thunder Client.

- [ ] **Level 2 Checklist**:
  - [ ] Đăng ký tài khoản mới $\to$ Mật khẩu trong DB đã được băm bằng bcrypt.
  - [ ] Đăng nhập đúng $\to$ Trả về JWT; Đăng nhập sai $\to$ Báo lỗi 401.
  - [ ] Viết xong middleware `protect` giải mã token.
  - [ ] User 1 không thể xem, sửa hoặc xóa Todo của User 2 (trả về 403 hoặc 404).

- [ ] **Level 3 Checklist**:
  - [ ] Query `GET /api/v1/todos?page=1&limit=5&status=completed&search=code` hoạt động mượt mà.
  - [ ] Toàn bộ input từ client đều được validate qua Zod trước khi đến Controller.
  - [ ] Upload được file đính kèm cho Todo và xem được file qua URL tĩnh.
  - [ ] Cài đặt đầy đủ `helmet`, `cors`, `rate-limit`.


tích hợp thêm AI