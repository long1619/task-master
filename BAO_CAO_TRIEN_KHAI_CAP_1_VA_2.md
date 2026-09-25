# 📑 BÁO CÁO KỸ THUẬT TRIỂN KHAI: CẤP ĐỘ 1 & CẤP ĐỘ 2
## DỰ ÁN: TASKMASTER PRO (NODE.JS + EXPRESS.JS + MYSQL)

---

## I. TỔNG QUAN HỆ THỐNG

Dự án **TaskMaster Pro** là một hệ thống RESTful API kết hợp giao diện Web hiện đại (Dark Luxury), được xây dựng từ nền tảng con số 0 với mục tiêu làm chủ toàn diện các kỹ thuật lập trình Backend trong hệ sinh thái **Node.js & Express.js**.

Hệ thống đã hoàn thành xuất sắc 2 giai đoạn cốt lõi:
* **🟢 Cấp độ 1 (Foundation):** Chuyển đổi mã nguồn từ monolithic sang kiến trúc phân lớp chuẩn công nghiệp (**Layered Architecture**), tích hợp cơ sở dữ liệu quan hệ **MySQL** qua Connection Pool, xử lý lỗi tập trung và xây dựng giao diện người dùng.
* **🟡 Cấp độ 2 (Auth & Data Isolation):** Tích hợp bảo mật đa người dùng với **JWT (JSON Web Token)**, mã hóa mật khẩu bằng **bcryptjs**, và thực thi cơ chế **Cô lập dữ liệu (Data Isolation)** — đảm bảo mỗi người dùng chỉ có quyền quản trị công việc của chính mình.

---

## II. CẤU TRÚC THƯ MỤC & VAI TRÒ TỪNG THÀNH PHẦN (LUỒNG FOLDER)

### 1. Sơ đồ cây thư mục dự án

```text
Express/
├── public/                       # [FRONTEND] Giao diện Web tĩnh phục vụ trực tiếp từ Express
│   ├── css/
│   │   └── style.css             # Thiết kế Dark Glassmorphism chuẩn Linear/Vercel
│   ├── js/
│   │   └── app.js                # Xử lý tương tác API (Fetch, JWT, State, DOM Events)
│   └── index.html                # Cấu trúc HTML5 (Dashboard, Form, Modals, Stats)
├── src/                          # [BACKEND] Mã nguồn lõi kiến trúc phân lớp
│   ├── config/
│   │   └── db.js                 # Cấu hình kết nối MySQL Pool & tự động tạo bảng (Migration)
│   ├── controllers/              # Tầng tiếp nhận HTTP Request & gửi Response
│   │   ├── authController.js     # Điều khiển luồng Đăng ký, Đăng nhập, Profile
│   │   └── todoController.js     # Điều khiển luồng CRUD Todos
│   ├── services/                 # Tầng xử lý Logic nghiệp vụ (Business Logic)
│   │   ├── authService.js        # Băm pass (bcrypt), sinh JWT, xác thực tài khoản
│   │   └── todoService.js        # Kiểm tra tính hợp lệ dữ liệu, kiểm tra quyền sở hữu
│   ├── models/                   # Tầng truy vấn trực tiếp Cơ sở dữ liệu (Database Layer)
│   │   ├── userModel.js          # Câu lệnh SQL thuần cho bảng `users`
│   │   └── todoModel.js          # Câu lệnh SQL thuần cho bảng `todos`
│   ├── routes/                   # Tầng định tuyến đường dẫn URL
│   │   ├── index.js              # Router tổng hợp (Gắn tiền tố /api/v1)
│   │   ├── authRoutes.js         # Định tuyến các API xác thực (/api/v1/auth)
│   │   └── todoRoutes.js         # Định tuyến các API công việc (/api/v1/todos)
│   ├── middlewares/              # Tầng trung gian can thiệp vào vòng đời Request
│   │   ├── authMiddleware.js     # Xác thực Bearer Token JWT (`protect`) & Phân quyền role
│   │   └── errorMiddleware.js    # Bắt lỗi 404 và Global Error Handler tập trung
│   └── utils/                    # Các tiện ích bổ trợ dùng chung
│       ├── AppError.js           # Class chuẩn hóa lỗi nghiệp vụ (Operational Errors)
│       └── asyncHandler.js       # Hàm bọc async loại bỏ các khối try-catch lặp lại
├── .env                          # Biến môi trường thực tế (Bảo mật, không commit Git)
├── .env.example                  # File mẫu biến môi trường
├── package.json                  # Khai báo dependency và script khởi chạy
└── server.js                     # File mồi (Entry Point) khởi động hệ thống
```

---

### 2. Sơ đồ luồng đi của dữ liệu (Request Lifecycle Flow)

Mọi yêu cầu từ Client gửi lên hệ thống đều tuân thủ nghiêm ngặt theo luồng 1 chiều:

```text
[CLIENT (Browser / Postman)]
            │  (Gửi HTTP Request: Method + URL + Headers + Body)
            ▼
┌─────────────────────────────────────────────────────────────────┐
│ server.js (Entry Point)                                         │
│   ├── express.json()             --> Parse JSON Body            │
│   ├── express.static('public')   --> Phục vụ giao diện web      │
│   └── morgan('dev')              --> Ghi log request vào console│
└─────────────────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────────┐
│ src/routes/index.js (Router Versioning /api/v1)                 │
│   ├── /auth   --> Chuyển tiếp tới src/routes/authRoutes.js      │
│   └── /todos  --> Chuyển tiếp tới src/routes/todoRoutes.js      │
└─────────────────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────────┐
│ src/middlewares/authMiddleware.js (protect)                     │
│   ├── Kiểm tra Header Authorization: Bearer <token>             │
│   ├── Giải mã JWT & kiểm tra người dùng tồn tại                 │
│   └── Gán thông tin người dùng vào req.user                     │
└─────────────────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────────┐
│ src/controllers/ (Bọc bởi asyncHandler)                         │
│   ├── Bóc tách tham số từ req.body, req.params, req.query       │
│   └── Gọi Service tương ứng kèm req.user.id                     │
└─────────────────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────────┐
│ src/services/ (Xử lý nghiệp vụ & Bảo vệ quyền sở hữu)          │
│   ├── Kiểm tra tính hợp lệ dữ liệu (Title, Email, Password...)  │
│   ├── Kiểm tra quyền: todo.user_id === req.user.id              │
│   └── Nếu vi phạm: ném throw new AppError(message, 403)         │
└─────────────────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────────┐
│ src/models/ (Thao tác MySQL an toàn)                            │
│   └── Thực thi câu lệnh SQL Parameterized (?, ?) qua Pool       │
└─────────────────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────────┐
│ MySQL Database Server (Laragon 3306)                            │
│   └── Đọc / Ghi dữ liệu thực tế trên đĩa cứng                   │
└─────────────────────────────────────────────────────────────────┘
            │
            ▼
[PHẢN HỒI KẾT QUẢ]:
- Thành công: Controller nhận kết quả -> trả về res.status(200/201).json(...)
- Thất bại: Lỗi ném ra được bắt tự động và chuyển về globalErrorHandler format chuẩn JSON.
```

---

## III. CHI TIẾT TRIỂN KHAI CẤP ĐỘ 1: CỐT LÕI & KIẾN TRÚC PHÂN LỚP

### 1. Kiến trúc phân lớp chuẩn (Layered Architecture)
* Tách bạch hoàn toàn trách nhiệm giữa: **Định tuyến (Routes)**, **Điều phối (Controllers)**, **Nghiệp vụ (Services)** và **Truy vấn Dữ liệu (Models)**.
* Giúp code không bị phình to trong 1 file, dễ dàng mở rộng và bảo trì sau này.

### 2. Tự động hóa Cơ sở dữ liệu MySQL (`src/config/db.js`)
* Kết nối MySQL hiệu năng cao qua **Connection Pool** bằng thư viện `mysql2/promise`.
* Tích hợp hàm `initDatabase()`:
  - Tự động kiểm tra và tạo database `taskmaster_db` nếu chưa tồn tại.
  - Tự động tạo bảng `todos`:
    ```sql
    CREATE TABLE IF NOT EXISTS todos (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      status ENUM('pending', 'in_progress', 'completed') DEFAULT 'pending',
      user_id INT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ```

### 3. Cơ chế bắt lỗi tập trung (Centralized Error Handling)
* **`AppError` (`src/utils/AppError.js`)**: Class tùy biến mở rộng từ `Error`, gán `statusCode`, phân loại `fail` (4xx) / `error` (5xx), đánh dấu `isOperational = true`.
* **`asyncHandler` (`src/utils/asyncHandler.js`)**: Higher-order function bọc các async controller, tự động đẩy reject sang `next(err)`, **xóa bỏ hoàn toàn việc lặp lại các khối `try-catch`**.
* **`globalErrorHandler` (`src/middlewares/errorMiddleware.js`)**: Middleware 4 tham số hứng mọi lỗi trong ứng dụng, định dạng response JSON nhất quán và không bao giờ để server bị crash.

### 4. Giao diện người dùng Web Frontend tĩnh (`public/`)
* Phục vụ trực tiếp qua middleware `app.use(express.static('public'))`.
* Phong cách **Dark Glassmorphism** hiện đại lấy cảm hứng từ Linear.app và Vercel:
  - Thẻ thống kê chỉ số và thanh tiến độ hoàn thành mục tiêu cập nhật thời gian thực.
  - Form thêm nhanh công việc với hỗ trợ phím tắt `Ctrl + Enter`.
  - Bộ lọc công việc dạng Pill (Tất cả, Chờ làm, Đang làm, Hoàn thành) và tìm kiếm tức thì.
  - Modal chỉnh sửa công việc và hiệu ứng checkbox tương tác sinh động.

---

## IV. CHI TIẾT TRIỂN KHAI CẤP ĐỘ 2: XÁC THỰC JWT & CÔ LẬP DỮ LIỆU

### 1. Nâng cấp Mô hình Dữ liệu MySQL
* Bổ sung bảng `users` để quản lý tài khoản:
  ```sql
  CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(191) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('user', 'admin') DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  ```
* Bổ sung khóa ngoại `user_id` trong bảng `todos` liên kết với `users(id)`:
  ```sql
  ALTER TABLE todos ADD CONSTRAINT fk_todos_user 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
  ```

### 2. Mã hóa mật khẩu an toàn với `bcryptjs`
* Tuyệt đối không lưu mật khẩu dạng văn bản gốc (plain text).
* Mật khẩu được băm một chiều với muối ngẫu nhiên độ an toàn cao (**Salt Rounds = 12**).
* Khi đăng nhập, sử dụng `bcrypt.compare()` để xác thực tính chính xác.

### 3. Cấp & Xác thực Quyền hạn bằng JSON Web Token (JWT)
* Cấp Access Token khi người dùng Đăng ký hoặc Đăng nhập thành công với thời hạn 7 ngày (`expiresIn: '7d'`).
* Middleware **`protect` (`src/middlewares/authMiddleware.js`)**:
  - Trích xuất token từ Header: `Authorization: Bearer <token>`.
  - Giải mã và xác thực chữ ký token bằng `JWT_SECRET`.
  - Truy vấn MySQL xác nhận tài khoản còn tồn tại và gán đối tượng `req.user`.

### 4. Cơ chế Cô lập Dữ liệu (Data Isolation / Ownership Authorization)
* **Nguyên tắc:** Dữ liệu của người nào chỉ người đó có quyền xem, sửa hoặc xóa.
* **Thực thi:**
  - Khi lấy danh sách: Chỉ truy vấn `WHERE user_id = req.user.id`.
  - Khi tạo mới: Tự động gán `user_id = req.user.id`.
  - Khi xem chi tiết, sửa hoặc xóa theo ID: Service kiểm tra:
    ```javascript
    if (todo.user_id !== userId) {
      throw new AppError('Bạn không có quyền thao tác trên tài nguyên này!', 403);
    }
    ```

### 5. Nâng cấp Giao diện Frontend Đa người dùng
* **Auth Navbar:** Hiển thị nút "Đăng nhập" khi chưa có phiên; hiển thị Avatar, tên người dùng và nút "Đăng xuất" khi đã đăng nhập.
* **Modal Xác thực:** Cho phép chuyển đổi qua lại giữa Form Đăng nhập và Đăng ký.
* **Tự động hóa Token:** Lưu trữ token vào `localStorage`, tự động gắn Bearer Token vào tất cả các request gửi đến `/api/v1/todos`.
* **Nút "Đăng nhập nhanh Demo":** Tự động tạo và đăng nhập tài khoản mẫu chỉ với 1 cú click để kiểm thử tức thì.

---

## V. BẢNG TỔNG HỢP TOÀN BỘ API ENDPOINTS (V1)

Địa chỉ gốc (Base URL): `http://localhost:5000/api/v1`

### 1. Nhóm API Xác thực (`/auth`)
| Method | Endpoint | Yêu cầu Token? | Chức năng | Trạng thái HTTP |
| :---: | :--- | :---: | :--- | :---: |
| `POST` | `/auth/register` | ❌ | Đăng ký tài khoản mới | `201 Created` |
| `POST` | `/auth/login` | ❌ | Đăng nhập nhận JWT Token | `200 OK` |
| `GET` | `/auth/me` | ✅ | Lấy thông tin tài khoản hiện tại | `200 OK` |
| `PUT` | `/auth/change-password` | ✅ | Đổi mật khẩu tài khoản | `200 OK` |

### 2. Nhóm API Quản lý Công việc (`/todos`)
*(Tất cả API Todo đều bắt buộc phải có Header: `Authorization: Bearer <token>`)*

| Method | Endpoint | Quyền hạn | Chức năng | Trạng thái HTTP |
| :---: | :--- | :---: | :--- | :---: |
| `GET` | `/todos` | Chủ sở hữu | Lấy toàn bộ danh sách công việc của tài khoản | `200 OK` |
| `GET` | `/todos?status=pending` | Chủ sở hữu | Lọc công việc của tài khoản theo trạng thái | `200 OK` |
| `GET` | `/todos/:id` | Chủ sở hữu | Xem chi tiết 1 công việc (Chặn nếu không sở hữu) | `200 OK` / `403` |
| `POST` | `/todos` | Chủ sở hữu | Tạo mới công việc gắn với tài khoản đang đăng nhập | `201 Created` |
| `PUT` | `/todos/:id` | Chủ sở hữu | Cập nhật thông tin công việc | `200 OK` / `403` |
| `PATCH`| `/todos/:id/status` | Chủ sở hữu | Đổi nhanh trạng thái hoàn thành | `200 OK` / `403` |
| `DELETE`| `/todos/:id` | Chủ sở hữu | Xóa công việc khỏi MySQL | `204 No Content` / `403` |

---

## VI. KẾT QUẢ KIỂM THỬ THỰC TẾ (AUTOMATED VERIFICATION)

Kịch bản kiểm thử độc lập tự động đã được thực hiện bằng script kiểm thử Node.js với kết quả như sau:

| STT | Tình huống kiểm thử | Dữ liệu đầu vào | Kết quả mong đợi | Kết quả thực tế | Đánh giá |
| :---: | :--- | :--- | :---: | :---: | :---: |
| **1** | Truy cập API Todos khi chưa đăng nhập | `GET /api/v1/todos` (Không Token) | `401 Unauthorized` | Mã 401: Yêu cầu đăng nhập | **ĐẠT** ✅ |
| **2** | Đăng ký người dùng 1 (Alice) | `name: Alice, password: 123` | `201 Created` + JWT | Mã 201 + Cấp JWT Token | **ĐẠT** ✅ |
| **3** | Alice tạo công việc riêng | `title: Việc riêng của Alice` | `201 Created` (`user_id = 1`) | Lưu vào MySQL gắn ID Alice | **ĐẠT** ✅ |
| **4** | Đăng ký người dùng 2 (Bob) | `name: Bob, password: 123` | `201 Created` + JWT | Mã 201 + Cấp JWT Token | **ĐẠT** ✅ |
| **5** | Bob lấy danh sách Todos | `GET /api/v1/todos` (Token Bob) | `count: 0` | Trả về 0 việc (Không lộ việc Alice) | **ĐẠT** ✅ |
| **6** | Bob cố tình xóa việc của Alice | `DELETE /todos/{id_Alice}` | `403 Forbidden` | Mã 403: Bị hệ thống chặn ngay | **ĐẠT** ✅ |

---

## VII. ĐỊNH HƯỚNG BƯỚC TIẾP THEO: CẤP ĐỘ 3

Sau khi hoàn thành xuất sắc nền tảng kiến trúc và bảo mật, hệ thống sẵn sàng bước vào **Cấp độ 3 (Production-Ready Backend)**:
1. **Tìm kiếm & Phân trang nâng cao:** Thêm tham số `?page=1&limit=10`, sắp xếp `sort`, lọc kết hợp nhiều điều kiện.
2. **Kiểm tra tính hợp lệ dữ liệu (Data Validation) với Zod:** Viết middleware schema validation tự động bắt lỗi từ client trước khi vào Controller.
3. **Upload File đính kèm với Multer:** Cho phép người dùng tải lên hình ảnh hoặc tài liệu ghi chú đính kèm công việc và phục vụ file tĩnh.
4. **Bảo mật tăng cường:** Tích hợp `helmet` (bảo vệ HTTP headers), `cors` và `express-rate-limit` (chống DDoS / spam request).
