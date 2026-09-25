import asyncHandler from '../utils/asyncHandler.js';
import WorkspaceService from '../services/workspaceService.js';

export const WorkspaceController = {
  /**
   * GET /api/v1/workspaces - Lấy danh sách không gian làm việc của người dùng
   */
  getUserWorkspaces: asyncHandler(async (req, res) => {
    const workspaces = await WorkspaceService.getUserWorkspaces(req.user.id);

    res.status(200).json({
      success: true,
      data: workspaces
    });
  }),

  /**
   * POST /api/v1/workspaces - Tạo không gian làm việc / dự án mới
   */
  createWorkspace: asyncHandler(async (req, res) => {
    const { name, description } = req.body;

    const workspace = await WorkspaceService.createWorkspace({
      name,
      description,
      ownerId: req.user.id
    });

    res.status(201).json({
      success: true,
      message: `Đã tạo không gian làm việc "${workspace.name}" thành công!`,
      data: workspace
    });
  }),

  /**
   * GET /api/v1/workspaces/:id - Chi tiết không gian làm việc
   */
  getWorkspaceById: asyncHandler(async (req, res) => {
    const workspace = await WorkspaceService.getWorkspaceById(req.params.id, req.user.id);

    res.status(200).json({
      success: true,
      data: workspace
    });
  }),

  /**
   * POST /api/v1/workspaces/:id/members - Mời thành viên mới vào dự án qua email
   */
  addMember: asyncHandler(async (req, res) => {
    const { email, role } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp email của thành viên muốn mời!'
      });
    }

    const result = await WorkspaceService.addMember({
      workspaceId: req.params.id,
      email,
      role,
      currentUserId: req.user.id
    });

    res.status(200).json({
      success: true,
      message: result.message,
      data: result.member
    });
  }),

  /**
   * DELETE /api/v1/workspaces/:id/members/:userId - Xóa thành viên khỏi dự án
   */
  removeMember: asyncHandler(async (req, res) => {
    const result = await WorkspaceService.removeMember({
      workspaceId: req.params.id,
      targetUserId: req.params.userId,
      currentUserId: req.user.id
    });

    res.status(200).json({
      success: true,
      message: result.message
    });
  }),

  /**
   * GET /api/v1/workspaces/:id/members - Lấy danh sách thành viên để chọn Assignee
   */
  getWorkspaceMembers: asyncHandler(async (req, res) => {
    const members = await WorkspaceService.getWorkspaceMembers(req.params.id, req.user.id);

    res.status(200).json({
      success: true,
      data: members
    });
  })
};

export default WorkspaceController;
