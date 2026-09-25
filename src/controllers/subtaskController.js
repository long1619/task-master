import prisma from '../config/db.js';
import aiService from '../services/aiService.js';

export const SubtaskController = {
  /**
   * AI tự động chia nhỏ công việc thành subtasks và lưu vào DB
   * POST /api/v1/todos/:id/subtasks/ai-generate
   */
  async generateAiSubtasks(req, res, next) {
    try {
      const todoId = parseInt(req.params.id, 10);
      const userId = req.user.id;

      const todo = await prisma.todo.findFirst({
        where: { id: todoId, userId, deletedAt: null }
      });

      if (!todo) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy công việc hoặc bạn không có quyền thao tác!'
        });
      }

      // Gọi AI sinh subtasks
      const aiResult = await aiService.generateSubtasks({
        title: todo.title,
        description: todo.description
      });

      if (!aiResult.subtasks || aiResult.subtasks.length === 0) {
        return res.status(500).json({
          success: false,
          message: 'Không thể sinh việc con từ AI lúc này.'
        });
      }

      // Lưu các subtasks mới vào cơ sở dữ liệu
      const createData = aiResult.subtasks.map(s => ({
        todoId: todo.id,
        title: s.title,
        completed: false
      }));

      await prisma.subtask.createMany({
        data: createData
      });

      // Lấy danh sách subtasks đầy đủ sau khi tạo
      const updatedSubtasks = await prisma.subtask.findMany({
        where: { todoId: todo.id },
        orderBy: { createdAt: 'asc' }
      });

      return res.status(200).json({
        success: true,
        message: `Đã dùng AI phân rã thành công ${aiResult.subtasks.length} việc con!`,
        data: {
          todoId: todo.id,
          subtasks: updatedSubtasks,
          source: aiResult.source
        }
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Thêm việc con thủ công
   * POST /api/v1/todos/:id/subtasks
   */
  async createSubtask(req, res, next) {
    try {
      const todoId = parseInt(req.params.id, 10);
      const userId = req.user.id;
      const { title } = req.body;

      if (!title || !title.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Tiêu đề việc con không được để trống!'
        });
      }

      const todo = await prisma.todo.findFirst({
        where: { id: todoId, userId, deletedAt: null }
      });

      if (!todo) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy công việc tương ứng!'
        });
      }

      const subtask = await prisma.subtask.create({
        data: {
          todoId: todo.id,
          title: title.trim(),
          completed: false
        }
      });

      return res.status(201).json({
        success: true,
        message: 'Đã thêm việc con mới thành công!',
        data: subtask
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Đảo trạng thái hoàn thành của việc con (toggle)
   * PATCH /api/v1/todos/:id/subtasks/:subtaskId/toggle
   */
  async toggleSubtask(req, res, next) {
    try {
      const todoId = parseInt(req.params.id, 10);
      const subtaskId = parseInt(req.params.subtaskId, 10);
      const userId = req.user.id;

      // Kiểm tra quyền sở hữu công việc cha
      const todo = await prisma.todo.findFirst({
        where: { id: todoId, userId, deletedAt: null }
      });

      if (!todo) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy công việc cha tương ứng!'
        });
      }

      const subtask = await prisma.subtask.findFirst({
        where: { id: subtaskId, todoId: todo.id }
      });

      if (!subtask) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy việc con cần cập nhật!'
        });
      }

      const updated = await prisma.subtask.update({
        where: { id: subtask.id },
        data: { completed: !subtask.completed }
      });

      // Kiểm tra nếu tất cả subtask đều xong, có thể gợi ý cập nhật task cha
      const allSubtasks = await prisma.subtask.findMany({
        where: { todoId: todo.id }
      });
      const completedCount = allSubtasks.filter(s => s.completed).length;
      const allDone = allSubtasks.length > 0 && completedCount === allSubtasks.length;

      return res.status(200).json({
        success: true,
        message: updated.completed ? 'Đã đánh dấu hoàn thành việc con!' : 'Đã chuyển việc con về chờ làm!',
        data: {
          subtask: updated,
          progress: {
            completedCount,
            totalCount: allSubtasks.length,
            allDone
          }
        }
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Xóa một việc con
   * DELETE /api/v1/todos/:id/subtasks/:subtaskId
   */
  async deleteSubtask(req, res, next) {
    try {
      const todoId = parseInt(req.params.id, 10);
      const subtaskId = parseInt(req.params.subtaskId, 10);
      const userId = req.user.id;

      const todo = await prisma.todo.findFirst({
        where: { id: todoId, userId, deletedAt: null }
      });

      if (!todo) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy công việc cha!'
        });
      }

      await prisma.subtask.delete({
        where: { id: subtaskId }
      });

      return res.status(200).json({
        success: true,
        message: 'Đã xóa việc con thành công!'
      });
    } catch (err) {
      next(err);
    }
  }
};

export default SubtaskController;
