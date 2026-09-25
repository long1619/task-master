import asyncHandler from '../utils/asyncHandler.js';
import AdminService from '../services/adminService.js';

export const AdminController = {
  /**
   * GET /api/v1/admin/stats - Thống kê vận hành toàn hệ thống
   */
  getStats: asyncHandler(async (req, res) => {
    const stats = await AdminService.getSystemStats();

    res.status(200).json({
      success: true,
      data: stats
    });
  }),

  /**
   * GET /api/v1/admin/users - Lấy danh sách toàn bộ người dùng
   */
  getAllUsers: asyncHandler(async (req, res) => {
    const { page, limit, search, role, status } = req.query;

    const result = await AdminService.getAllUsers({
      page,
      limit,
      search,
      role,
      status
    });

    res.status(200).json({
      success: true,
      data: result.users,
      pagination: result.pagination
    });
  }),

  /**
   * PATCH /api/v1/admin/users/:id/toggle-lock - Khóa hoặc mở khóa tài khoản
   */
  toggleLock: asyncHandler(async (req, res) => {
    const result = await AdminService.toggleUserLock(req.params.id, req.user.id);

    res.status(200).json({
      success: true,
      message: result.message,
      data: result.user
    });
  }),

  /**
   * PATCH /api/v1/admin/users/:id/role - Thay đổi vai trò (user <-> admin)
   */
  changeRole: asyncHandler(async (req, res) => {
    const { role } = req.body;

    const result = await AdminService.changeUserRole(req.params.id, role, req.user.id);

    res.status(200).json({
      success: true,
      message: result.message,
      data: result.user
    });
  })
};

export default AdminController;
