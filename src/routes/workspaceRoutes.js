import express from 'express';
import WorkspaceController from '../controllers/workspaceController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Bắt buộc xác thực JWT
router.use(protect);

router
  .route('/')
  .get(WorkspaceController.getUserWorkspaces)
  .post(WorkspaceController.createWorkspace);

router
  .route('/:id')
  .get(WorkspaceController.getWorkspaceById);

router
  .route('/:id/members')
  .get(WorkspaceController.getWorkspaceMembers)
  .post(WorkspaceController.addMember);

router
  .route('/:id/members/:userId')
  .delete(WorkspaceController.removeMember);

export default router;
