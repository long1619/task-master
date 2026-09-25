import TodoService from '../services/todoService.js';
import asyncHandler from '../utils/asyncHandler.js';

export const TodoController = {
  /**
   * GET /api/v1/todos - Lấy danh sách todos có phân trang, tìm kiếm, lọc & sắp xếp (Level 3)
   */
  getAllTodos: asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { page, limit, search, status, priority, sortBy } = req.query;

    const result = await TodoService.getAllTodos(userId, {
      page,
      limit,
      search,
      status,
      priority,
      sortBy
    });

    res.status(200).json({
      success: true,
      pagination: result.pagination,
      data: result.todos
    });
  }),

  /**
   * GET /api/v1/todos/stats - Lấy số liệu thống kê công việc của người dùng
   */
  getTodoStats: asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const stats = await TodoService.getTodoStats(userId);

    res.status(200).json({
      success: true,
      data: stats
    });
  }),

  /**
   * GET /api/v1/todos/:id - Lấy chi tiết todo theo ID (kiểm tra quyền sở hữu)
   */
  getTodoById: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    const todo = await TodoService.getTodoById(id, userId);

    res.status(200).json({
      success: true,
      data: todo
    });
  }),

  /**
   * POST /api/v1/todos - Tạo mới một todo (hỗ trợ Priority, DueDate, Tags, Workspace, Assignee)
   */
  createTodo: asyncHandler(async (req, res) => {
    const { title, description, status, priority, dueDate, tags, workspaceId, assigneeId } = req.body;
    const userId = req.user.id;

    const newTodo = await TodoService.createTodo({
      title,
      description,
      status,
      priority,
      dueDate,
      tags,
      userId,
      workspaceId,
      assigneeId,
      user: req.user
    });

    res.status(201).json({
      success: true,
      message: 'Tạo công việc mới thành công!',
      data: newTodo
    });
  }),

  /**
   * PUT /api/v1/todos/:id - Cập nhật thông tin todo của người dùng
   */
  updateTodo: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    const { title, description, status, priority, dueDate, tags, workspaceId, assigneeId } = req.body;

    const updatedTodo = await TodoService.updateTodo(id, userId, {
      title,
      description,
      status,
      priority,
      dueDate,
      tags,
      workspaceId,
      assigneeId
    }, req.user);

    res.status(200).json({
      success: true,
      message: 'Cập nhật công việc thành công!',
      data: updatedTodo
    });
  }),

  /**
   * PATCH /api/v1/todos/:id/status - Cập nhật nhanh trạng thái todo
   */
  updateTodoStatus: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    const { status } = req.body;

    const updatedTodo = await TodoService.updateTodo(id, userId, { status }, req.user);

    res.status(200).json({
      success: true,
      message: 'Cập nhật trạng thái công việc thành công!',
      data: updatedTodo
    });
  }),

  /**
   * DELETE /api/v1/todos/:id - Xóa mềm một todo (chuyển vào thùng rác)
   */
  deleteTodo: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    const result = await TodoService.softDeleteTodo(id, userId);

    res.status(200).json({
      success: true,
      message: result.message,
      data: result.todo
    });
  }),

  /**
   * GET /api/v1/todos/trash - Lấy danh sách công việc trong thùng rác
   */
  getTrash: asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const trashItems = await TodoService.getTrashTodos(userId);

    res.status(200).json({
      success: true,
      data: trashItems
    });
  }),

  /**
   * PATCH /api/v1/todos/:id/restore - Khôi phục công việc từ thùng rác
   */
  restoreTodo: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    const result = await TodoService.restoreTodo(id, userId);

    res.status(200).json({
      success: true,
      message: result.message,
      data: result.todo
    });
  }),

  /**
   * DELETE /api/v1/todos/:id/permanent - Xóa vĩnh viễn công việc
   */
  permanentDelete: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    const result = await TodoService.permanentDeleteTodo(id, userId);

    res.status(200).json({
      success: true,
      message: result.message
    });
  }),

  /**
   * DELETE /api/v1/todos/trash/empty - Dọn sạch toàn bộ thùng rác
   */
  emptyTrash: asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const result = await TodoService.emptyTrash(userId);

    res.status(200).json({
      success: true,
      message: result.message
    });
  }),

  /**
   * GET /api/v1/todos/analytics - Thống kê năng suất chuyên sâu
   */
  getAnalytics: asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const analytics = await TodoService.getAnalytics(userId);

    res.status(200).json({
      success: true,
      data: analytics
    });
  }),

  /**
   * GET /api/v1/todos/export - Xuất danh sách công việc ra file Excel (.xlsx)
   */
  exportExcel: asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const buffer = await TodoService.exportToExcel(userId);

    const nowStr = new Date().toISOString().slice(0, 10);
    const fileName = `TaskMaster_Bao_Cao_${nowStr}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(buffer);
  }),

  /**
   * POST /api/v1/todos/:id/attachments - Tải tệp tin đính kèm cho Todo (Multer)
   */
  uploadAttachment: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    const file = req.file;

    const attachment = await TodoService.uploadAttachment(id, userId, file);

    res.status(201).json({
      success: true,
      message: 'Tải tệp đính kèm lên thành công!',
      data: attachment
    });
  }),

  /**
   * DELETE /api/v1/todos/:id/attachments/:attachmentId - Xóa tệp đính kèm
   */
  deleteAttachment: asyncHandler(async (req, res) => {
    const { attachmentId } = req.params;
    const userId = req.user.id;
    await TodoService.deleteAttachment(attachmentId, userId);

    res.status(200).json({
      success: true,
      message: 'Đã xóa tệp đính kèm thành công!'
    });
  }),

  /**
   * PATCH /api/v1/todos/bulk/status - Cập nhật trạng thái hàng loạt
   */
  bulkUpdateStatus: asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { ids, status } = req.body;
    const result = await TodoService.bulkUpdateStatus(ids, userId, status);

    res.status(200).json(result);
  }),

  /**
   * PATCH /api/v1/todos/bulk/priority - Cập nhật mức ưu tiên hàng loạt
   */
  bulkUpdatePriority: asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { ids, priority } = req.body;
    const result = await TodoService.bulkUpdatePriority(ids, userId, priority);

    res.status(200).json(result);
  }),

  /**
   * DELETE /api/v1/todos/bulk - Xóa mềm hàng loạt (chuyển vào thùng rác)
   */
  bulkSoftDelete: asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { ids } = req.body;
    const result = await TodoService.bulkSoftDelete(ids, userId);

    res.status(200).json(result);
  }),

  /**
   * GET /api/v1/todos/import/template - Tải file Excel mẫu để nhập dữ liệu
   */
  downloadTemplate: asyncHandler(async (req, res) => {
    const buffer = await TodoService.generateExcelTemplate();

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="TaskMaster_Mau_Nhap_Cong_Viec.xlsx"');
    res.send(buffer);
  }),

  /**
   * POST /api/v1/todos/import - Nhập hàng loạt công việc từ Excel/CSV
   */
  importTodos: asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const file = req.file;
    const result = await TodoService.importFromExcel(userId, file);

    res.status(201).json(result);
  })
};

export default TodoController;
