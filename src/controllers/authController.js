import AuthService from '../services/authService.js';
import asyncHandler from '../utils/asyncHandler.js';

export const AuthController = {
  /**
   * POST /api/v1/auth/register - Đăng ký tài khoản
   */
  register: asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;
    const { user, token, accessToken, refreshToken } = await AuthService.register({ name, email, password }, req);

    res.status(201).json({
      success: true,
      message: 'Đăng ký tài khoản thành công!',
      token,
      accessToken,
      refreshToken,
      data: {
        user
      }
    });
  }),

  /**
   * POST /api/v1/auth/login - Đăng nhập tài khoản
   */
  login: asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const { user, token, accessToken, refreshToken } = await AuthService.login({ email, password }, req);

    res.status(200).json({
      success: true,
      message: 'Đăng nhập thành công!',
      token,
      accessToken,
      refreshToken,
      data: {
        user
      }
    });
  }),

  /**
   * POST /api/v1/auth/refresh-token - Cấp lại Access Token mới bằng Refresh Token
   */
  refreshToken: asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;
    const result = await AuthService.refreshAccessToken(refreshToken, req);

    res.status(200).json({
      success: true,
      message: 'Làm mới phiên làm việc thành công!',
      token: result.accessToken,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      data: {
        user: result.user
      }
    });
  }),

  /**
   * POST /api/v1/auth/logout - Đăng xuất thiết bị hiện tại
   */
  logout: asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;
    const result = await AuthService.logout(refreshToken);

    res.status(200).json({
      success: true,
      message: result.message
    });
  }),

  /**
   * POST /api/v1/auth/logout-all - Đăng xuất toàn bộ các thiết bị
   */
  logoutAll: asyncHandler(async (req, res) => {
    const result = await AuthService.logoutAll(req.user.id);

    res.status(200).json({
      success: true,
      message: result.message
    });
  }),

  /**
   * GET /api/v1/auth/sessions - Danh sách các phiên đăng nhập
   */
  getSessions: asyncHandler(async (req, res) => {
    const sessions = await AuthService.getSessions(req.user.id);

    res.status(200).json({
      success: true,
      data: {
        sessions
      }
    });
  }),

  /**
   * GET /api/v1/auth/me - Lấy thông tin cá nhân
   */
  getMe: asyncHandler(async (req, res) => {
    const user = await AuthService.getMe(req.user.id);

    res.status(200).json({
      success: true,
      data: {
        user
      }
    });
  }),

  /**
   * PUT /api/v1/auth/change-password - Đổi mật khẩu
   */
  changePassword: asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const result = await AuthService.changePassword(req.user.id, { currentPassword, newPassword });

    res.status(200).json({
      success: true,
      message: result.message
    });
  })
};

export default AuthController;
