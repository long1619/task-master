import express from 'express';
import { aiController } from '../controllers/aiController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

// POST /api/v1/ai/chat - Trò chuyện với TaskMaster AI Co-pilot (Yêu cầu đăng nhập JWT)
router.post('/chat', protect, aiController.chatWithCoPilot);

// POST /api/v1/ai/voice-task - Tạo công việc bằng giọng nói tiếng Việt
router.post('/voice-task', protect, aiController.parseVoiceTask);

// POST /api/v1/ai/send-briefing-email - Gửi email bản tin tóm tắt ngày mới của AI
router.post('/send-briefing-email', protect, aiController.sendBriefingEmail);

export default router;
