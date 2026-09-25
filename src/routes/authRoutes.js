import express from 'express';
import AuthController from '../controllers/authController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { validate } from '../middlewares/validateMiddleware.js';
import { registerSchema, loginSchema, changePasswordSchema } from '../validations/authValidation.js';

const router = express.Router();

// Routes công khai (Không cần đăng nhập) - Validate với Zod (Level 3)
router.post('/register', validate(registerSchema, 'body'), AuthController.register);
router.post('/login', validate(loginSchema, 'body'), AuthController.login);
router.post('/refresh-token', AuthController.refreshToken);
router.post('/logout', AuthController.logout);

// Routes được bảo vệ (Bắt buộc phải đăng nhập)
router.use(protect);
router.get('/me', AuthController.getMe);
router.put('/change-password', validate(changePasswordSchema, 'body'), AuthController.changePassword);
router.post('/logout-all', AuthController.logoutAll);
router.get('/sessions', AuthController.getSessions);

export default router;
