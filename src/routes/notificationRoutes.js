import express from 'express';
import { protect } from '../middlewares/authMiddleware.js';
import NotificationController from '../controllers/notificationController.js';

const router = express.Router();

// Bắt buộc xác thực người dùng
router.use(protect);

// POST /api/v1/notifications/send-digest - Kích hoạt gửi email nhắc việc thủ công
router.post('/send-digest', NotificationController.triggerDailyDigest);

export default router;
