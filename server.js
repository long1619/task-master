import express from 'express';
import dotenv from 'dotenv';
import morgan from 'morgan';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import path from 'path';
import expressLayouts from 'express-ejs-layouts';
import { initDatabase } from './src/config/db.js';
import mainRouter from './src/routes/index.js';
import viewRouter from './src/routes/viewRoutes.js';
import { notFoundHandler, globalErrorHandler } from './src/middlewares/errorMiddleware.js';
import { initReminderCron } from './src/cron/reminderCron.js';

// Tải biến môi trường từ file .env
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// 0. Cấu hình View Engine EJS (đóng vai trò Blade/Template Engine) + Layout kế thừa chung
app.set('view engine', 'ejs');
app.set('views', path.join(process.cwd(), 'views'));
app.use(expressLayouts);
app.set('layout', 'layouts/main');

// 1. Tăng cường bảo mật HTTP Headers (Helmet - Level 3)
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        scriptSrcAttr: ["'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
        imgSrc: ["'self'", "data:", "blob:", "*"],
        connectSrc: ["'self'", "https://generativelanguage.googleapis.com"]
      }
    },
    crossOriginResourcePolicy: { policy: "cross-origin" }
  })
);

// 2. Quản lý chia sẻ tài nguyên CORS (Level 3)
app.use(cors());

// 3. Giới hạn tần suất request - Rate Limiting chống DDoS & Bruteforce (Level 3)
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 500, // Tối đa 500 request
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    status: 'fail',
    message: 'Bạn đã gửi quá nhiều yêu cầu trong thời gian ngắn. Vui lòng thử lại sau 15 phút!'
  }
});
app.use('/api', generalLimiter);

// Rate Limiter riêng cho Auth: Tối đa 30 lượt / 15 phút chống dò mật khẩu
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    status: 'fail',
    message: 'Quá nhiều lần thử xác thực. Vui lòng đợi 15 phút trước khi thử lại!'
  }
});
app.use('/api/v1/auth', authLimiter);

// 4. Built-in Middlewares
app.use(express.json()); // Đọc JSON trong body request
app.use(express.urlencoded({ extended: true })); // Đọc URL-encoded form data

// 5. Phục vụ tệp tĩnh (Frontend & Tệp đính kèm Uploads - Level 3)
app.use(express.static('public', {
  setHeaders: (res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');
  }
})); // Giao diện Web SPA
app.use('/uploads', express.static(path.resolve('uploads'))); // Tệp đính kèm người dùng tải lên

// 6. Logging Middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// 6.1 View Routes (MVC: Route -> Controller -> EJS View) - Trang giao diện chính
app.use('/', viewRouter);

// 7. API Info Endpoint
app.get('/api', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Chào mừng đến với TaskMaster Pro API (Production-Ready)',
    level: 'Cấp độ 3: Prisma ORM, Zod Validation, Multer File Uploads, Security & AI',
    endpoints: {
      healthCheck: 'GET /api/v1/health',
      getAllTodos: 'GET /api/v1/todos?page=1&limit=10&search=&status=&priority=&sortBy=',
      getStats: 'GET /api/v1/todos/stats',
      getTodoById: 'GET /api/v1/todos/:id',
      createTodo: 'POST /api/v1/todos',
      updateTodo: 'PUT /api/v1/todos/:id',
      updateStatus: 'PATCH /api/v1/todos/:id/status',
      deleteTodo: 'DELETE /api/v1/todos/:id',
      uploadAttachment: 'POST /api/v1/todos/:id/attachments',
      deleteAttachment: 'DELETE /api/v1/todos/:id/attachments/:attachmentId'
    }
  });
});

// 8. API Routes (v1)
app.use('/api/v1', mainRouter);

// 9. Middleware xử lý 404
app.use(notFoundHandler);

// 10. Global Error Handling Middleware (Bắt lỗi tập trung)
app.use(globalErrorHandler);

// 11. Khởi chạy Server
const startServer = async () => {
  try {
    await initDatabase();
    initReminderCron();

    app.listen(PORT, () => {
      console.log('====================================================');
      console.log(`🚀 TaskMaster Pro Server đang khởi chạy thành công tại:`);
      console.log(`👉 Web Interface: http://localhost:${PORT}`);
      console.log(`📡 API Endpoints : http://localhost:${PORT}/api/v1/todos`);
      console.log(`🛡️  Bảo mật       : Helmet, CORS & Rate Limiter đã kích hoạt`);
      console.log(`🗄️  Database     : Prisma ORM + MySQL 8.4`);
      console.log('====================================================');
    });
  } catch (error) {
    console.error('❌ Không thể khởi động server do lỗi kết nối Database!');
    process.exit(1);
  }
};

startServer();
