import express from 'express';
import TodoController from '../controllers/todoController.js';
import SubtaskController from '../controllers/subtaskController.js';
import CommentController from '../controllers/commentController.js';
import ActivityController from '../controllers/activityController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { validate } from '../middlewares/validateMiddleware.js';
import { upload } from '../middlewares/uploadMiddleware.js';
import {
  createTodoSchema,
  updateTodoSchema,
  updateStatusSchema,
  queryTodoSchema
} from '../validations/todoValidation.js';

const router = express.Router();

// 🔒 Bắt buộc toàn bộ các route Todo phải được xác thực qua JWT token
router.use(protect);

// Endpoints đặc biệt (Đặt trước /:id để tránh xung đột params)
router.get('/stats', TodoController.getTodoStats);
router.get('/analytics', TodoController.getAnalytics);
router.get('/export', TodoController.exportExcel);
router.get('/trash', TodoController.getTrash);
router.delete('/trash/empty', TodoController.emptyTrash);

// Bulk Actions & Import (Excel/CSV)
router.patch('/bulk/status', TodoController.bulkUpdateStatus);
router.patch('/bulk/priority', TodoController.bulkUpdatePriority);
router.delete('/bulk', TodoController.bulkSoftDelete);
router.get('/import/template', TodoController.downloadTemplate);
router.post('/import', upload.single('file'), TodoController.importTodos);

router
  .route('/')
  .get(validate(queryTodoSchema, 'query'), TodoController.getAllTodos)
  .post(validate(createTodoSchema, 'body'), TodoController.createTodo);

router
  .route('/:id')
  .get(TodoController.getTodoById)
  .put(validate(updateTodoSchema, 'body'), TodoController.updateTodo)
  .delete(TodoController.deleteTodo);

router
  .route('/:id/status')
  .patch(validate(updateStatusSchema, 'body'), TodoController.updateTodoStatus);

// Endpoints Thùng rác (Khôi phục & Xóa vĩnh viễn)
router.patch('/:id/restore', TodoController.restoreTodo);
router.delete('/:id/permanent', TodoController.permanentDelete);

// Endpoints Quản lý Tệp đính kèm (Multer File Upload - Level 3)
router.post('/:id/attachments', upload.single('file'), TodoController.uploadAttachment);
router.delete('/:id/attachments/:attachmentId', TodoController.deleteAttachment);

// Endpoints Quản lý Việc con & AI Subtasks (Next-Gen AI)
router.post('/:id/subtasks/ai-generate', SubtaskController.generateAiSubtasks);
router.post('/:id/subtasks', SubtaskController.createSubtask);
router.patch('/:id/subtasks/:subtaskId/toggle', SubtaskController.toggleSubtask);
router.delete('/:id/subtasks/:subtaskId', SubtaskController.deleteSubtask);

// Endpoints Bình luận & Trao đổi (Task Comments)
router.get('/:id/comments', CommentController.getComments);
router.post('/:id/comments', CommentController.createComment);
router.delete('/:id/comments/:commentId', CommentController.deleteComment);

// Endpoints Nhật ký Hoạt động (Activity Audit Log)
router.get('/:id/activities', ActivityController.getActivities);

export default router;
