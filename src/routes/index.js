import express from 'express';
import todoRoutes from './todoRoutes.js';
import authRoutes from './authRoutes.js';
import notificationRoutes from './notificationRoutes.js';
import aiRoutes from './aiRoutes.js';
import workspaceRoutes from './workspaceRoutes.js';
import adminRoutes from './adminRoutes.js';

const router = express.Router();

// Trang thông tin tổng quan API v1 (Cấp độ 3: Production-Ready)
router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Chào mừng bạn đến với TaskMaster Pro API v1 (Production-Ready)',
    level: 'Cấp độ 3: Prisma ORM, Zod Validation, Multer Uploads, Rate Limiter, AI & Collaboration',
    endpoints: {
      health: 'GET /api/v1/health',
      auth: {
        register: 'POST /api/v1/auth/register',
        login: 'POST /api/v1/auth/login',
        me: 'GET /api/v1/auth/me (Bearer Token)',
        changePassword: 'PUT /api/v1/auth/change-password (Bearer Token)'
      },
      workspaces: 'GET /api/v1/workspaces',
      admin: 'GET /api/v1/admin/stats',
      todos: {
        getAll: 'GET /api/v1/todos?page=1&limit=10&search=&status=&priority=&sortBy= (Bearer Token)',
        getStats: 'GET /api/v1/todos/stats (Bearer Token)',
        getOne: 'GET /api/v1/todos/:id (Bearer Token)',
        create: 'POST /api/v1/todos (Bearer Token)',
        update: 'PUT /api/v1/todos/:id (Bearer Token)',
        updateStatus: 'PATCH /api/v1/todos/:id/status (Bearer Token)',
        delete: 'DELETE /api/v1/todos/:id (Bearer Token)',
        uploadAttachment: 'POST /api/v1/todos/:id/attachments (Multipart/form-data)',
        deleteAttachment: 'DELETE /api/v1/todos/:id/attachments/:attachmentId'
      }
    }
  });
});

// Kiểm tra sức khỏe API (Health check)
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API TaskMaster Pro đang hoạt động bình thường!',
    database: 'Prisma ORM + MySQL 8.4',
    level: 'Level 3: Production-Ready',
    timestamp: new Date().toISOString()
  });
});

// Gắn các module routes
router.use('/auth', authRoutes);
router.use('/todos', todoRoutes);
router.use('/notifications', notificationRoutes);
router.use('/ai', aiRoutes);
router.use('/workspaces', workspaceRoutes);
router.use('/admin', adminRoutes);

export default router;
