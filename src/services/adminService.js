import prisma from '../config/db.js';
import AppError from '../utils/AppError.js';

export const AdminService = {
  /**
   * Thống kê toàn bộ chỉ số vận hành của hệ thống
   */
  async getSystemStats() {
    const [
      totalUsers,
      totalAdmins,
      totalLockedUsers,
      totalTodos,
      completedTodos,
      pendingTodos,
      inProgressTodos,
      totalWorkspaces,
      totalComments,
      totalAttachments
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'admin' } }),
      prisma.user.count({ where: { isLocked: true } }),
      prisma.todo.count({ where: { deletedAt: null } }),
      prisma.todo.count({ where: { status: 'completed', deletedAt: null } }),
      prisma.todo.count({ where: { status: 'pending', deletedAt: null } }),
      prisma.todo.count({ where: { status: 'in_progress', deletedAt: null } }),
      prisma.workspace.count(),
      prisma.taskComment.count(),
      prisma.attachment.count()
    ]);

    const completionRate = totalTodos > 0 ? Math.round((completedTodos / totalTodos) * 100) : 0;

    return {
      users: {
        total: totalUsers,
        admins: totalAdmins,
        locked: totalLockedUsers,
        active: totalUsers - totalLockedUsers
      },
      todos: {
        total: totalTodos,
        completed: completedTodos,
        pending: pendingTodos,
        inProgress: inProgressTodos,
        completionRate
      },
      system: {
        workspaces: totalWorkspaces,
        comments: totalComments,
        attachments: totalAttachments
      }
    };
  },

  /**
   * Lấy danh sách toàn bộ người dùng kèm phân trang và bộ lọc
   */
  async getAllUsers({ page = 1, limit = 20, search = '', role = 'all', status = 'all' } = {}) {
    const pageNumber = Math.max(1, parseInt(page, 10) || 1);
    const pageSize = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
    const skip = (pageNumber - 1) * pageSize;

    const where = {};

    if (role && role !== 'all') {
      where.role = role;
    }

    if (status === 'locked') {
      where.isLocked = true;
    } else if (status === 'active') {
      where.isLocked = false;
    }

    if (search && search.trim()) {
      const keyword = search.trim();
      where.OR = [
        { name: { contains: keyword } },
        { email: { contains: keyword } }
      ];
    }

    const [users, totalItems] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isLocked: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              todos: true,
              assignedTodos: true,
              ownedWorkspaces: true
            }
          }
        }
      }),
      prisma.user.count({ where })
    ]);

    const totalPages = Math.ceil(totalItems / pageSize) || 1;

    return {
      users,
      pagination: {
        totalItems,
        totalPages,
        currentPage: pageNumber,
        limit: pageSize,
        hasNextPage: pageNumber < totalPages,
        hasPrevPage: pageNumber > 1
      }
    };
  },

  /**
   * Khóa hoặc mở khóa tài khoản người dùng
   */
  async toggleUserLock(targetUserId, currentAdminId) {
    const targetId = parseInt(targetUserId, 10);
    const adminId = parseInt(currentAdminId, 10);

    if (targetId === adminId) {
      throw new AppError('Bạn không thể tự khóa tài khoản của chính mình!', 400);
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: targetId }
    });

    if (!targetUser) {
      throw new AppError('Không tìm thấy người dùng này!', 404);
    }

    const updatedUser = await prisma.user.update({
      where: { id: targetId },
      data: { isLocked: !targetUser.isLocked },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isLocked: true
      }
    });

    return {
      message: updatedUser.isLocked
        ? `Đã khóa tài khoản người dùng "${updatedUser.name}"!`
        : `Đã mở khóa tài khoản người dùng "${updatedUser.name}" thành công!`,
      user: updatedUser
    };
  },

  /**
   * Chuyển đổi vai trò của người dùng (user <-> admin)
   */
  async changeUserRole(targetUserId, newRole, currentAdminId) {
    const targetId = parseInt(targetUserId, 10);
    const adminId = parseInt(currentAdminId, 10);

    if (targetId === adminId) {
      throw new AppError('Bạn không thể tự thay đổi vai trò của chính mình!', 400);
    }

    if (!['user', 'admin'].includes(newRole)) {
      throw new AppError('Vai trò chỉ chấp nhận: "user" hoặc "admin"!', 400);
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: targetId }
    });

    if (!targetUser) {
      throw new AppError('Không tìm thấy người dùng này!', 404);
    }

    const updatedUser = await prisma.user.update({
      where: { id: targetId },
      data: { role: newRole },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isLocked: true
      }
    });

    return {
      message: `Đã cập nhật vai trò của "${updatedUser.name}" thành ${newRole === 'admin' ? 'Quản trị viên (Admin)' : 'Người dùng (User)'}!`,
      user: updatedUser
    };
  }
};

export default AdminService;
