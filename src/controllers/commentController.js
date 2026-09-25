import prisma from '../config/db.js';
import asyncHandler from '../utils/asyncHandler.js';
import AppError from '../utils/AppError.js';
import ActivityService from '../services/activityService.js';

export const CommentController = {
  /**
   * GET /api/v1/todos/:id/comments - Lấy danh sách bình luận của công việc
   */
  getComments: asyncHandler(async (req, res) => {
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
      throw new AppError('Bạn không có quyền xem bình luận của công việc này!', 403);
    }

    const comments = await prisma.taskComment.findMany({
      where: { todoId },
      orderBy: { createdAt: 'asc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    });

    res.status(200).json({
      success: true,
      data: comments
    });
  }),

  /**
   * POST /api/v1/todos/:id/comments - Thêm bình luận mới vào công việc
   */
  createComment: asyncHandler(async (req, res) => {
    const todoId = parseInt(req.params.id, 10);
    const userId = req.user.id;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Nội dung bình luận không được để trống!'
      });
    }

    const todo = await prisma.todo.findFirst({
      where: { id: todoId, deletedAt: null }
    });

    if (!todo) {
      throw new AppError('Không tìm thấy công việc để bình luận!', 404);
    }

    const comment = await prisma.taskComment.create({
      data: {
        todoId,
        userId,
        content: content.trim()
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    });

    // Ghi audit log
    const preview = content.trim().length > 50 ? `${content.trim().substring(0, 47)}...` : content.trim();
    await ActivityService.logActivity({
      todoId,
      userId,
      action: 'comment_added',
      description: `Đã gửi một bình luận: "${preview}"`
    });

    res.status(201).json({
      success: true,
      message: 'Đã gửi bình luận thành công!',
      data: comment
    });
  }),

  /**
   * DELETE /api/v1/todos/:id/comments/:commentId - Xóa bình luận
   */
  deleteComment: asyncHandler(async (req, res) => {
    const todoId = parseInt(req.params.id, 10);
    const commentId = parseInt(req.params.commentId, 10);
    const userId = req.user.id;

    const comment = await prisma.taskComment.findFirst({
      where: { id: commentId, todoId }
    });

    if (!comment) {
      throw new AppError('Không tìm thấy bình luận cần xóa!', 404);
    }

    // Chỉ tác giả của comment, người tạo task hoặc admin mới được xóa
    const todo = await prisma.todo.findUnique({ where: { id: todoId } });
    const canDelete = comment.userId === userId || todo?.userId === userId || req.user.role === 'admin';

    if (!canDelete) {
      throw new AppError('Bạn không có quyền xóa bình luận này!', 403);
    }

    await prisma.taskComment.delete({
      where: { id: commentId }
    });

    res.status(200).json({
      success: true,
      message: 'Đã xóa bình luận thành công!'
    });
  })
};

export default CommentController;
