import path from 'path';
import fs from 'fs/promises';
import ExcelJS from 'exceljs';
import TodoModel from '../models/todoModel.js';
import AppError from '../utils/AppError.js';
import ActivityService from './activityService.js';
import { sendTaskAssignmentEmail } from './emailService.js';

export const TodoService = {
  /**
   * Lấy danh sách todos của người dùng kèm phân trang, tìm kiếm, lọc & sắp xếp (Level 3)
   */
  async getAllTodos(userId, queryOptions = {}) {
    return await TodoModel.findAll(userId, queryOptions);
  },

  /**
   * Lấy thống kê công việc (Tổng, Chờ làm, Đang làm, Hoàn thành)
   */
  async getTodoStats(userId) {
    const all = await TodoModel.findAllRaw(userId);
    const total = all.length;
    const pending = all.filter(t => t.status === 'pending').length;
    const inProgress = all.filter(t => t.status === 'in_progress').length;
    const completed = all.filter(t => t.status === 'completed').length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      total,
      pending,
      inProgress,
      completed,
      completionRate
    };
  },

  /**
   * Lấy chi tiết todo theo ID và kiểm tra quyền sở hữu hoặc quyền thành viên
   */
  async getTodoById(id, userId, userRole = 'user') {
    const todoId = parseInt(id, 10);
    if (isNaN(todoId)) {
      throw new AppError('ID công việc phải là một số nguyên hợp lệ!', 400);
    }

    const todo = await TodoModel.findById(todoId);
    if (!todo) {
      throw new AppError(`Không tìm thấy công việc nào với ID = ${todoId}`, 404);
    }

    const uid = parseInt(userId, 10);
    const isOwner = todo.userId === uid;
    const isAssignee = todo.assigneeId === uid;
    const isMember = todo.workspace?.members?.some(m => m.userId === uid);
    const isAdmin = userRole === 'admin';

    if (!isOwner && !isAssignee && !isMember && !isAdmin) {
      throw new AppError('Bạn không có quyền truy cập vào công việc này!', 403);
    }

    return todo;
  },

  /**
   * Tạo mới một todo gắn với userId (hỗ trợ Priority, DueDate, Tags, Workspace, Assignee)
   */
  async createTodo({ title, description, status, priority, dueDate, tags, userId, workspaceId, assigneeId, user }) {
    const newTodo = await TodoModel.create({
      title,
      description,
      status,
      priority,
      dueDate,
      tags,
      userId,
      workspaceId,
      assigneeId
    });

    // Ghi nhật ký hoạt động tạo việc
    await ActivityService.logActivity({
      todoId: newTodo.id,
      userId,
      action: 'created',
      description: 'Đã tạo công việc mới'
    });

    // Nếu có người được giao việc và khác người tạo -> Gửi email thông báo
    if (newTodo.assigneeId && newTodo.assigneeId !== parseInt(userId, 10)) {
      const assignerUser = user || { id: userId, name: 'Người tạo việc', email: '' };
      sendTaskAssignmentEmail({
        assigneeId: newTodo.assigneeId,
        task: {
          title: newTodo.title,
          priority: newTodo.priority,
          dueDate: newTodo.dueDate,
          description: newTodo.description,
          workspaceName: newTodo.workspace?.name
        },
        assigner: assignerUser
      }).catch(err => console.warn('Lỗi gửi email giao việc:', err.message));

      await ActivityService.logActivity({
        todoId: newTodo.id,
        userId,
        action: 'assigned',
        description: `Đã phân công công việc cho "${newTodo.assignee?.name || 'thành viên'}"`
      });
    }

    return newTodo;
  },

  /**
   * Cập nhật thông tin todo của đúng người dùng hoặc người có quyền
   */
  async updateTodo(id, userId, updateData, user) {
    const todoId = parseInt(id, 10);
    if (isNaN(todoId)) {
      throw new AppError('ID công việc phải là một số nguyên hợp lệ!', 400);
    }

    const oldTodo = await this.getTodoById(todoId, userId, user?.role);
    const updatedTodo = await TodoModel.update(todoId, userId, updateData);

    // Kiểm tra và ghi log hoạt động tự động
    try {
      if (updateData.status && updateData.status !== oldTodo.status) {
        await ActivityService.logActivity({
          todoId,
          userId,
          action: 'status_changed',
          description: `Đã đổi trạng thái từ "${oldTodo.status}" sang "${updatedTodo.status}"`
        });
      }

      if (updateData.priority && updateData.priority !== oldTodo.priority) {
        await ActivityService.logActivity({
          todoId,
          userId,
          action: 'priority_changed',
          description: `Đã đổi mức ưu tiên từ "${oldTodo.priority}" sang "${updatedTodo.priority}"`
        });
      }

      if (updateData.dueDate !== undefined) {
        const oldDue = oldTodo.dueDate ? new Date(oldTodo.dueDate).getTime() : null;
        const newDue = updatedTodo.dueDate ? new Date(updatedTodo.dueDate).getTime() : null;
        if (oldDue !== newDue) {
          await ActivityService.logActivity({
            todoId,
            userId,
            action: 'due_date_changed',
            description: updatedTodo.dueDate ? 'Đã cập nhật lại thời hạn chót' : 'Đã xóa thời hạn chót'
          });
        }
      }

      if (updateData.assigneeId !== undefined && updateData.assigneeId !== oldTodo.assigneeId) {
        if (updatedTodo.assigneeId) {
          await ActivityService.logActivity({
            todoId,
            userId,
            action: 'assigned',
            description: `Đã giao công việc cho "${updatedTodo.assignee?.name || 'thành viên'}"`
          });

          // Gửi email thông báo cho người mới được giao việc
          if (updatedTodo.assigneeId !== parseInt(userId, 10)) {
            const assignerUser = user || { id: userId, name: 'Người quản lý', email: '' };
            sendTaskAssignmentEmail({
              assigneeId: updatedTodo.assigneeId,
              task: {
                title: updatedTodo.title,
                priority: updatedTodo.priority,
                dueDate: updatedTodo.dueDate,
                description: updatedTodo.description,
                workspaceName: updatedTodo.workspace?.name
              },
              assigner: assignerUser
            }).catch(err => console.warn('Lỗi gửi email giao việc:', err.message));
          }
        } else {
          await ActivityService.logActivity({
            todoId,
            userId,
            action: 'assigned',
            description: 'Đã hủy phân công người nhận việc'
          });
        }
      }
    } catch (logErr) {
      console.warn('Lỗi ghi audit log khi update task:', logErr.message);
    }

    return updatedTodo;
  },

  /**
   * Xóa mềm một todo (chuyển vào thùng rác để có thể Hoàn tác)
   */
  async softDeleteTodo(id, userId) {
    const todo = await this.getTodoById(id, userId);
    await TodoModel.softDelete(todo.id);
    return { success: true, message: 'Đã chuyển công việc vào thùng rác', todo };
  },

  /**
   * Lấy danh sách công việc trong thùng rác
   */
  async getTrashTodos(userId) {
    return await TodoModel.findTrash(userId);
  },

  /**
   * Khôi phục công việc từ thùng rác
   */
  async restoreTodo(id, userId) {
    const todo = await this.getTodoById(id, userId);
    await TodoModel.restore(todo.id);
    return { success: true, message: 'Khôi phục công việc thành công!', todo };
  },

  /**
   * Xóa vĩnh viễn một todo (kèm xóa file vật lý đính kèm)
   */
  async permanentDeleteTodo(id, userId) {
    const todo = await this.getTodoById(id, userId);

    // Xóa các file vật lý trên đĩa cứng nếu có attachments
    if (todo.attachments && todo.attachments.length > 0) {
      for (const att of todo.attachments) {
        try {
          const filePath = path.resolve('uploads', path.basename(att.filePath));
          await fs.unlink(filePath);
        } catch (err) {
          console.warn(`Không thể xóa file vật lý: ${att.filePath}`, err.message);
        }
      }
    }

    await TodoModel.delete(todo.id);
    return { success: true, message: 'Đã xóa vĩnh viễn công việc!' };
  },

  /**
   * Dọn sạch toàn bộ thùng rác của người dùng
   */
  async emptyTrash(userId) {
    const trashItems = await TodoModel.findTrash(userId);

    // Xóa file vật lý của tất cả attachment trong thùng rác
    for (const item of trashItems) {
      if (item.attachments && item.attachments.length > 0) {
        for (const att of item.attachments) {
          try {
            const filePath = path.resolve('uploads', path.basename(att.filePath));
            await fs.unlink(filePath);
          } catch (err) {
            console.warn(`Không thể xóa file vật lý: ${att.filePath}`);
          }
        }
      }
    }

    const result = await TodoModel.emptyTrash(userId);
    return { success: true, message: `Đã dọn sạch thùng rác (${result.count} công việc)!` };
  },

  /**
   * Thống kê năng suất chuyên sâu (Productivity Analytics)
   */
  async getAnalytics(userId) {
    const all = await TodoModel.findAllRaw(userId);
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const total = all.length;
    const pending = all.filter(t => t.status === 'pending').length;
    const inProgress = all.filter(t => t.status === 'in_progress').length;
    const completed = all.filter(t => t.status === 'completed').length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Phân tích quá hạn và hôm nay
    let overdue = 0;
    let dueToday = 0;
    for (const t of all) {
      if (t.dueDate && t.status !== 'completed') {
        const due = new Date(t.dueDate);
        if (due < now) {
          overdue++;
        } else if (due >= startOfToday && due <= endOfToday) {
          dueToday++;
        }
      }
    }

    // Phân bổ mức độ ưu tiên
    const priorityBreakdown = {
      high: all.filter(t => t.priority === 'high').length,
      medium: all.filter(t => t.priority === 'medium').length,
      low: all.filter(t => t.priority === 'low').length
    };

    // Phân bổ trạng thái
    const statusBreakdown = {
      pending,
      in_progress: inProgress,
      completed
    };

    // Năng suất 7 ngày qua (Thống kê theo từng ngày)
    const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    const weeklyProductivity = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0);
      const dayEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

      const dayStr = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
      const dayLabel = `${dayNames[d.getDay()]} (${dayStr})`;

      // Task hoàn thành trong ngày này (xét theo updatedAt khi status = completed)
      const completedCount = all.filter(t => {
        if (t.status !== 'completed' || !t.updatedAt) return false;
        const updated = new Date(t.updatedAt);
        return updated >= dayStart && updated <= dayEnd;
      }).length;

      // Task tạo trong ngày này
      const createdCount = all.filter(t => {
        const created = new Date(t.createdAt);
        return created >= dayStart && created <= dayEnd;
      }).length;

      weeklyProductivity.push({
        date: dayStr,
        label: dayLabel,
        completedCount,
        createdCount
      });
    }

    return {
      overview: {
        total,
        pending,
        inProgress,
        completed,
        completionRate,
        overdue,
        dueToday
      },
      priorityBreakdown,
      statusBreakdown,
      weeklyProductivity
    };
  },

  /**
   * Xuất báo cáo công việc ra file Excel (.xlsx) với ExcelJS
   */
  async exportToExcel(userId) {
    const todos = await TodoModel.findAllRaw(userId);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'TaskMaster Pro';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Báo Cáo Công Việc', {
      views: [{ showGridLines: true }]
    });

    // Định nghĩa cột
    sheet.columns = [
      { header: 'ID', key: 'id', width: 8 },
      { header: 'Tiêu đề công việc', key: 'title', width: 32 },
      { header: 'Chi tiết nội dung', key: 'description', width: 40 },
      { header: 'Trạng thái', key: 'statusText', width: 18 },
      { header: 'Mức ưu tiên', key: 'priorityText', width: 15 },
      { header: 'Hạn chót', key: 'dueDateText', width: 22 },
      { header: 'Tệp đính kèm', key: 'attachmentsCount', width: 15 },
      { header: 'Ngày tạo', key: 'createdAtText', width: 20 }
    ];

    // Tạo style cho tiêu đề Header (Màu xanh Indigo thương hiệu sang trọng)
    const headerRow = sheet.getRow(1);
    headerRow.height = 28;
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4F46E5' } // Indigo sang trọng
      };
      cell.font = {
        name: 'Segoe UI',
        size: 11,
        bold: true,
        color: { argb: 'FFFFFFFF' }
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE0E7FF' } },
        bottom: { style: 'medium', color: { argb: 'FF3730A3' } }
      };
    });

    const statusMap = {
      pending: '⏳ Chờ thực hiện',
      in_progress: '🚀 Đang xử lý',
      completed: '✅ Đã hoàn thành'
    };

    const priorityMap = {
      low: '🟢 Thấp (Low)',
      medium: '🟡 Vừa (Medium)',
      high: '🔴 Cao (High)'
    };

    const pad = n => n.toString().padStart(2, '0');
    const formatDate = (date) => {
      if (!date) return '-';
      const d = new Date(date);
      if (isNaN(d.getTime())) return '-';
      return `${pad(d.getHours())}:${pad(d.getMinutes())} • ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
    };

    // Đổ dữ liệu
    todos.forEach((t, idx) => {
      const row = sheet.addRow({
        id: t.id,
        title: t.title,
        description: t.description || 'Không có mô tả',
        statusText: statusMap[t.status] || t.status,
        priorityText: priorityMap[t.priority] || t.priority,
        dueDateText: formatDate(t.dueDate),
        attachmentsCount: (t.attachments && t.attachments.length) ? `${t.attachments.length} tệp` : '0',
        createdAtText: formatDate(t.createdAt)
      });

      row.height = 24;
      row.eachCell((cell, colNumber) => {
        cell.font = { name: 'Segoe UI', size: 10 };
        cell.alignment = { vertical: 'middle', wrapText: colNumber === 3 };
        cell.border = {
          bottom: { style: 'thin', color: { argb: 'FFF1F5F9' } },
          left: { style: 'thin', color: { argb: 'FFF1F5F9' } },
          right: { style: 'thin', color: { argb: 'FFF1F5F9' } }
        };

        // Zebra striping
        if (idx % 2 === 1) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF8FAFC' }
          };
        }
      });
    });

    // Tạo buffer Excel
    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  },

  /**
   * Cập nhật trạng thái hàng loạt
   */
  async bulkUpdateStatus(ids, userId, status) {
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new AppError('Danh sách ID công việc không được để trống!', 400);
    }
    if (!['pending', 'in_progress', 'completed'].includes(status)) {
      throw new AppError('Trạng thái công việc không hợp lệ!', 400);
    }
    const result = await TodoModel.bulkUpdateStatus(ids, userId, status);
    return { success: true, count: result.count, message: `Đã cập nhật trạng thái cho ${result.count} công việc!` };
  },

  /**
   * Cập nhật mức ưu tiên hàng loạt
   */
  async bulkUpdatePriority(ids, userId, priority) {
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new AppError('Danh sách ID công việc không được để trống!', 400);
    }
    if (!['low', 'medium', 'high'].includes(priority)) {
      throw new AppError('Mức độ ưu tiên không hợp lệ!', 400);
    }
    const result = await TodoModel.bulkUpdatePriority(ids, userId, priority);
    return { success: true, count: result.count, message: `Đã cập nhật mức ưu tiên cho ${result.count} công việc!` };
  },

  /**
   * Xóa mềm hàng loạt (chuyển vào thùng rác)
   */
  async bulkSoftDelete(ids, userId) {
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new AppError('Danh sách ID công việc không được để trống!', 400);
    }
    const result = await TodoModel.bulkSoftDelete(ids, userId);
    return { success: true, count: result.count, message: `Đã chuyển ${result.count} công việc vào thùng rác!` };
  },

  /**
   * Tạo file Excel mẫu (.xlsx) để người dùng tải về điền
   */
  async generateExcelTemplate() {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Mau_Nhap_Cong_Viec');

    sheet.columns = [
      { header: 'Tiêu đề (*)', key: 'title', width: 30 },
      { header: 'Mô tả chi tiết', key: 'description', width: 35 },
      { header: 'Trạng thái (pending/in_progress/completed)', key: 'status', width: 25 },
      { header: 'Mức ưu tiên (low/medium/high)', key: 'priority', width: 22 },
      { header: 'Hạn chót (YYYY-MM-DD HH:mm)', key: 'dueDate', width: 25 }
    ];

    sheet.getRow(1).height = 26;
    sheet.getRow(1).eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } };
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });

    sheet.addRow({
      title: 'Thiết kế giao diện Dark Mode',
      description: 'Chuyển đổi bảng màu Obsidian và kiểm tra độ tương phản',
      status: 'pending',
      priority: 'high',
      dueDate: '2026-09-25 18:00'
    });
    sheet.addRow({
      title: 'Họp tổng kết tuần',
      description: 'Báo cáo tiến độ hoàn thành các tính năng với team',
      status: 'in_progress',
      priority: 'medium',
      dueDate: '2026-09-26 09:30'
    });
    sheet.addRow({
      title: 'Tối ưu hóa cơ sở dữ liệu MySQL',
      description: 'Tạo indexes cho các truy vấn phân trang và tìm kiếm',
      status: 'completed',
      priority: 'low',
      dueDate: '2026-09-27 12:00'
    });

    return await workbook.xlsx.writeBuffer();
  },

  /**
   * Nhập hàng loạt công việc từ file Excel (.xlsx hoặc .csv)
   */
  async importFromExcel(userId, file) {
    if (!file) {
      throw new AppError('Vui lòng chọn file Excel (.xlsx, .csv) để nhập!', 400);
    }

    const workbook = new ExcelJS.Workbook();
    const filePath = file.path;

    try {
      if (file.originalname && file.originalname.toLowerCase().endsWith('.csv')) {
        await workbook.csv.readFile(filePath);
      } else {
        await workbook.xlsx.readFile(filePath);
      }
    } catch (readErr) {
      try { await fs.unlink(filePath); } catch (_) {}
      throw new AppError('File Excel không đúng định dạng hoặc bị lỗi cấu trúc!', 400);
    }

    const sheet = workbook.worksheets[0];
    if (!sheet) {
      try { await fs.unlink(filePath); } catch (_) {}
      throw new AppError('File Excel không chứa bất kỳ trang tính nào!', 400);
    }

    const tasksToCreate = [];
    const statusMap = {
      'pending': 'pending', 'chờ làm': 'pending', 'chờ thực hiện': 'pending',
      'in_progress': 'in_progress', 'đang làm': 'in_progress', 'đang xử lý': 'in_progress',
      'completed': 'completed', 'đã xong': 'completed', 'đã hoàn thành': 'completed'
    };
    const priorityMap = {
      'high': 'high', 'cao': 'high',
      'medium': 'medium', 'vừa': 'medium', 'trung bình': 'medium',
      'low': 'low', 'thấp': 'low'
    };

    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Bỏ qua dòng tiêu đề Header

      const title = row.getCell(1).text ? row.getCell(1).text.trim() : '';
      if (!title || title.length < 3) return; // Bỏ qua dòng không có tiêu đề hợp lệ

      const description = row.getCell(2).text ? row.getCell(2).text.trim() : null;
      const rawStatus = (row.getCell(3).text || '').toLowerCase().trim();
      const rawPriority = (row.getCell(4).text || '').toLowerCase().trim();
      const rawDueDate = row.getCell(5).text ? row.getCell(5).text.trim() : null;

      const status = statusMap[rawStatus] || 'pending';
      const priority = priorityMap[rawPriority] || 'medium';

      let dueDate = null;
      if (rawDueDate) {
        const parsed = new Date(rawDueDate);
        if (!isNaN(parsed.getTime())) dueDate = parsed;
      }

      tasksToCreate.push({
        title,
        description,
        status,
        priority,
        dueDate
      });
    });

    // Xóa file tạm sau khi đã đọc
    try { await fs.unlink(filePath); } catch (_) {}

    if (tasksToCreate.length === 0) {
      throw new AppError('Không tìm thấy dòng dữ liệu công việc hợp lệ nào trong file (Tiêu đề tối thiểu 3 ký tự)!', 400);
    }

    const result = await TodoModel.bulkCreate(tasksToCreate, userId);
    return {
      success: true,
      importedCount: result.count,
      message: `Đã nhập thành công ${result.count} công việc vào hệ thống!`
    };
  },

  /**
   * Tải tệp đính kèm lên cho một Todo
   */
  async uploadAttachment(todoId, userId, file) {
    if (!file) {
      throw new AppError('Vui lòng chọn một file để tải lên!', 400);
    }

    // Kiểm tra quyền sở hữu Todo
    await this.getTodoById(todoId, userId);

    // Đường dẫn truy cập static công khai
    const publicPath = `/uploads/${file.filename}`;

    const attachment = await TodoModel.addAttachment(todoId, {
      fileName: file.originalname,
      filePath: publicPath,
      fileSize: file.size,
      mimeType: file.mimetype
    });

    return attachment;
  },

  /**
   * Xóa một tệp đính kèm theo ID
   */
  async deleteAttachment(attachmentId, userId) {
    const id = parseInt(attachmentId, 10);
    if (isNaN(id)) {
      throw new AppError('ID tệp đính kèm không hợp lệ!', 400);
    }

    const attachment = await TodoModel.findAttachmentById(id);
    if (!attachment) {
      throw new AppError('Không tìm thấy tệp đính kèm!', 404);
    }

    // Kiểm tra quyền sở hữu Todo chứa attachment
    if (attachment.todo.userId !== parseInt(userId, 10)) {
      throw new AppError('Bạn không có quyền xóa tệp đính kèm này!', 403);
    }

    // Xóa file vật lý trên ổ cứng
    try {
      const diskPath = path.resolve('uploads', path.basename(attachment.filePath));
      await fs.unlink(diskPath);
    } catch (err) {
      console.warn(`File vật lý không tồn tại hoặc đã bị xóa: ${attachment.filePath}`);
    }

    await TodoModel.deleteAttachment(id);
    return true;
  }
};

export default TodoService;
