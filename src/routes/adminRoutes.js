import express from 'express';
import AdminController from '../controllers/adminController.js';
import { protect, restrictTo } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Bắt buộc đăng nhập VÀ có vai trò 'admin'
router.use(protect);
router.use(restrictTo('admin'));

router.get('/stats', AdminController.getStats);
router.get('/users', AdminController.getAllUsers);
router.patch('/users/:id/toggle-lock', AdminController.toggleLock);
router.patch('/users/:id/role', AdminController.changeRole);

export default router;
