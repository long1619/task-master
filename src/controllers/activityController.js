import prisma from '../config/db.js';
import asyncHandler from '../utils/asyncHandler.js';
import AppError from '../utils/AppError.js';
import ActivityService from '../services/activityService.js';

export const ActivityController = {
  /**
   * GET /api/v1/todos/:id/activities - Lấy lịch sử dòng thời gian thao tác của công việc
   */
  getActivities: asyncHandler(async (req, res) => {
    const todoId = parseInt(req.params.id, 10);
    const userId = req.user.id;

    // Kiểm tra quyền truy cập công việc
    const todo = await prisma.todo.findFirst({
      where: { id: todoId, deletedAt: null },
      include: {
        workspace: {
          include: { members: true }
        }
      }
    });

    if (!todo) {
      throw new AppError('Không tìm thấy công việc tương ứng!', 404);
    }

    const isOwner = todo.userId === userId;
    const isAssignee = todo.assigneeId === userId;
    const isMember = todo.workspace?.members.some(m => m.userId === userId);
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAssignee && !isMember && !isAdmin) {
      throw new AppError('Bạn không có quyền xem lịch sử của công việc này!', 403);
    }

    const activities = await ActivityService.getTodoActivities(todoId);

    res.status(200).json({
      success: true,
      data: activities
    });
  })
};

export default ActivityController;
