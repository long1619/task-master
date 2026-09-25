import prisma from '../config/db.js';
import AppError from '../utils/AppError.js';

export const WorkspaceService = {
  /**
   * Lấy danh sách các không gian làm việc mà người dùng là chủ sở hữu hoặc thành viên
   */
  async getUserWorkspaces(userId) {
    const uid = parseInt(userId, 10);

    return await prisma.workspace.findMany({
      where: {
        OR: [
          { ownerId: uid },
          { members: { some: { userId: uid } } }
        ]
      },
      orderBy: { createdAt: 'desc' },
      include: {
        owner: {
          select: { id: true, name: true, email: true, role: true }
        },
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, role: true }
            }
          },
          orderBy: { joinedAt: 'asc' }
        },
        _count: {
          select: { todos: true, members: true }
        }
      }
    });
  },

  /**
   * Tạo một không gian làm việc / dự án mới
   */
  async createWorkspace({ name, description, ownerId }) {
    if (!name || !name.trim()) {
      throw new AppError('Tên không gian làm việc không được để trống!', 400);
    }

    const uid = parseInt(ownerId, 10);

    // Tạo workspace và tự động thêm owner vào bảng workspace_members
    return await prisma.workspace.create({
      data: {
        name: name.trim(),
        description: description ? description.trim() : null,
        ownerId: uid,
        members: {
          create: {
            userId: uid,
            role: 'owner'
          }
        }
      },
      include: {
        owner: {
          select: { id: true, name: true, email: true }
        },
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        },
        _count: {
          select: { todos: true, members: true }
        }
      }
    });
  },

  /**
   * Lấy chi tiết không gian làm việc
   */
  async getWorkspaceById(id, userId) {
    const wsId = parseInt(id, 10);
    const uid = parseInt(userId, 10);

    const workspace = await prisma.workspace.findUnique({
      where: { id: wsId },
      include: {
        owner: {
          select: { id: true, name: true, email: true, role: true }
        },
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, role: true }
            }
          },
          orderBy: { joinedAt: 'asc' }
        },
        todos: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
          include: {
            assignee: {
              select: { id: true, name: true, email: true }
            },
            subtasks: true
          }
        },
        _count: {
          select: { todos: true, members: true }
        }
      }
    });

    if (!workspace) {
      throw new AppError('Không tìm thấy không gian làm việc này!', 404);
    }

    // Kiểm tra quyền truy cập
    const isMember = workspace.members.some(m => m.userId === uid);
    const isOwner = workspace.ownerId === uid;

    if (!isMember && !isOwner) {
      throw new AppError('Bạn không có quyền truy cập vào không gian làm việc này!', 403);
    }

    return workspace;
  },

  /**
   * Mời thành viên mới vào workspace qua email
   */
  async addMember({ workspaceId, email, role = 'member', currentUserId }) {
    const wsId = parseInt(workspaceId, 10);
    const uid = parseInt(currentUserId, 10);

    const workspace = await prisma.workspace.findUnique({
      where: { id: wsId },
      include: { members: true }
    });

    if (!workspace) {
      throw new AppError('Không tìm thấy không gian làm việc!', 404);
    }

    // Chỉ owner hoặc admin của workspace mới có quyền mời
    const currentMember = workspace.members.find(m => m.userId === uid);
    if (!currentMember || (workspace.ownerId !== uid && currentMember.role !== 'admin')) {
      throw new AppError('Chỉ Trưởng dự án (Owner) hoặc Admin mới có quyền mời thành viên!', 403);
    }

    // Tìm người dùng theo email
    const targetUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() }
    });

    if (!targetUser) {
      throw new AppError(`Không tìm thấy người dùng với email "${email}". Người dùng cần đăng ký tài khoản trước khi tham gia!`, 404);
    }

    // Kiểm tra đã là thành viên chưa
    const alreadyMember = workspace.members.some(m => m.userId === targetUser.id);
    if (alreadyMember) {
      throw new AppError(`Người dùng "${targetUser.name}" (${email}) đã là thành viên của dự án này rồi!`, 400);
    }

    // Thêm thành viên
    const newMember = await prisma.workspaceMember.create({
      data: {
        workspaceId: wsId,
        userId: targetUser.id,
        role: ['admin', 'member'].includes(role) ? role : 'member'
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true }
        }
      }
    });

    return {
      message: `Đã thêm thành công "${targetUser.name}" vào dự án!`,
      member: newMember
    };
  },

  /**
   * Xóa thành viên khỏi không gian làm việc
   */
  async removeMember({ workspaceId, targetUserId, currentUserId }) {
    const wsId = parseInt(workspaceId, 10);
    const targetId = parseInt(targetUserId, 10);
    const uid = parseInt(currentUserId, 10);

    const workspace = await prisma.workspace.findUnique({
      where: { id: wsId }
    });

    if (!workspace) {
      throw new AppError('Không tìm thấy không gian làm việc!', 404);
    }

    if (workspace.ownerId !== uid) {
      throw new AppError('Chỉ Trưởng dự án (Owner) mới có quyền xóa thành viên!', 403);
    }

    if (workspace.ownerId === targetId) {
      throw new AppError('Không thể xóa Trưởng dự án khỏi không gian làm việc!', 400);
    }

    await prisma.workspaceMember.delete({
      where: {
        workspaceId_userId: {
          workspaceId: wsId,
          userId: targetId
        }
      }
    });

    return { success: true, message: 'Đã xóa thành viên khỏi dự án!' };
  },

  /**
   * Lấy danh sách thành viên trong workspace để chọn Giao việc (Assignee)
   */
  async getWorkspaceMembers(workspaceId, currentUserId) {
    const wsId = parseInt(workspaceId, 10);
    const uid = parseInt(currentUserId, 10);

    const workspace = await prisma.workspace.findUnique({
      where: { id: wsId },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, role: true }
            }
          },
          orderBy: { joinedAt: 'asc' }
        }
      }
    });

    if (!workspace) {
      throw new AppError('Không tìm thấy không gian làm việc!', 404);
    }

    const isMember = workspace.members.some(m => m.userId === uid) || workspace.ownerId === uid;
    if (!isMember) {
      throw new AppError('Bạn không thuộc không gian làm việc này!', 403);
    }

    return workspace.members.map(m => ({
      id: m.user.id,
      name: m.user.name,
      email: m.user.email,
      workspaceRole: m.role
    }));
  }
};

export default WorkspaceService;
