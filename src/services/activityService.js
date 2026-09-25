import prisma from '../config/db.js';

export const ActivityService = {
  /**
   * Ghi lại nhật ký hoạt động trên thẻ công việc
   * @param {Object} params
   * @param {number} params.todoId - ID công việc
   * @param {number} params.userId - ID người thực hiện
   * @param {string} params.action - Loại hành động: 'created' | 'status_changed' | 'priority_changed' | 'due_date_changed' | 'assigned' | 'comment_added' | 'subtask_toggled' | 'updated'
   * @param {string} params.description - Mô tả chi tiết bằng tiếng Việt
   */
  async logActivity({ todoId, userId, action, description }) {
    try {
      if (!todoId || !userId) return null;

      return await prisma.activityLog.create({
        data: {
          todoId: parseInt(todoId, 10),
          userId: parseInt(userId, 10),
          action,
          description: description || ''
        }
      });
    } catch (err) {
      console.warn('⚠️ [ActivityService] Không thể ghi audit log:', err.message);
      return null;
    }
  },

  /**
   * Lấy toàn bộ dòng thời gian lịch sử thao tác của một công việc
   * @param {number} todoId
   */
  async getTodoActivities(todoId) {
    return await prisma.activityLog.findMany({
      where: {
        todoId: parseInt(todoId, 10)
      },
      orderBy: {
        createdAt: 'desc'
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
  }
};

export default ActivityService;
