import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import UserModel from '../models/userModel.js';
import AppError from '../utils/AppError.js';

// Hàm tiện ích tạo mã JSON Web Token (Access Token - ngắn hạn)
const signAccessToken = (id, role) => {
  const secret = process.env.JWT_SECRET || 'taskmaster_super_secret_jwt_key_2026_@secure!';
  const expiresIn = process.env.JWT_ACCESS_EXPIRES_IN || '15m';

  return jwt.sign({ id, role }, secret, { expiresIn });
};

// Hàm tiện ích tạo và lưu Refresh Token vào Database (dài hạn - 7 ngày)
const generateAndSaveRefreshToken = async (userId, req = null) => {
  const token = crypto.randomBytes(40).toString('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 ngày

  const userAgent = req?.headers ? req.headers['user-agent'] : null;
  const ipAddress = req?.ip || (req?.headers ? req.headers['x-forwarded-for'] : null) || null;

  await UserModel.saveRefreshToken({
    userId,
    token,
    expiresAt,
    userAgent,
    ipAddress
  });

  return token;
};

// Regex kiểm tra định dạng email hợp lệ
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const AuthService = {
  /**
   * Đăng ký tài khoản người dùng mới
   */
  async register({ name, email, password }, req = null) {
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      throw new AppError('Họ và tên là bắt buộc và phải có ít nhất 2 ký tự!', 400);
    }

    if (!email || !EMAIL_REGEX.test(email.trim())) {
      throw new AppError('Định dạng email không hợp lệ!', 400);
    }

    if (!password || password.length < 6) {
      throw new AppError('Mật khẩu phải có độ dài tối thiểu 6 ký tự!', 400);
    }

    // Kiểm tra trùng email
    const existingUser = await UserModel.findByEmail(email);
    if (existingUser) {
      throw new AppError('Email này đã được đăng ký trên hệ thống. Vui lòng dùng email khác!', 400);
    }

    // Băm mật khẩu với bcrypt (Salt Rounds = 12)
    const hashedPassword = await bcrypt.hash(password, 12);

    // Lưu vào MySQL
    const newUser = await UserModel.create({
      name,
      email,
      password: hashedPassword,
      role: 'user'
    });

    // Tạo Access Token và Refresh Token
    const accessToken = signAccessToken(newUser.id, newUser.role);
    const refreshToken = await generateAndSaveRefreshToken(newUser.id, req);

    return {
      user: newUser,
      token: accessToken, // tương thích ngược
      accessToken,
      refreshToken
    };
  },

  /**
   * Đăng nhập tài khoản
   */
  async login({ email, password }, req = null) {
    if (!email || !password) {
      throw new AppError('Vui lòng cung cấp đầy đủ email và mật khẩu!', 400);
    }

    // Tìm người dùng theo email (bao gồm mật khẩu băm)
    const user = await UserModel.findByEmail(email);
    if (!user) {
      throw new AppError('Email hoặc mật khẩu không chính xác!', 401);
    }

    // So sánh mật khẩu plain text với mật khẩu băm trong database
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      throw new AppError('Email hoặc mật khẩu không chính xác!', 401);
    }

    // 🔒 Kiểm tra nếu tài khoản bị khóa
    if (user.isLocked) {
      throw new AppError('Tài khoản của bạn đã bị khóa bởi Quản trị viên! Vui lòng liên hệ hỗ trợ.', 403);
    }

    // Tạo Access Token và Refresh Token
    const accessToken = signAccessToken(user.id, user.role);
    const refreshToken = await generateAndSaveRefreshToken(user.id, req);

    // Loại bỏ password trước khi trả về client
    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isLocked: user.isLocked,
      createdAt: user.createdAt
    };

    return {
      user: safeUser,
      token: accessToken,
      accessToken,
      refreshToken
    };
  },

  /**
   * Làm mới Access Token thông qua Refresh Token (Token Rotation)
   */
  async refreshAccessToken(refreshTokenStr, req = null) {
    if (!refreshTokenStr) {
      throw new AppError('Refresh Token là bắt buộc!', 400);
    }

    const tokenRecord = await UserModel.findRefreshToken(refreshTokenStr);
    if (!tokenRecord) {
      throw new AppError('Refresh Token không tồn tại hoặc đã bị thu hồi. Vui lòng đăng nhập lại!', 401);
    }

    if (new Date() > new Date(tokenRecord.expiresAt)) {
      await UserModel.deleteRefreshToken(refreshTokenStr);
      throw new AppError('Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại!', 401);
    }

    const user = tokenRecord.user;
    if (!user) {
      throw new AppError('Người dùng không còn tồn tại trên hệ thống!', 401);
    }

    // 1. Tạo Access Token mới
    const newAccessToken = signAccessToken(user.id, user.role);

    // 2. Xoay vòng Refresh Token (Xóa token cũ, cấp token mới)
    await UserModel.deleteRefreshToken(refreshTokenStr);
    const newRefreshToken = await generateAndSaveRefreshToken(user.id, req);

    return {
      token: newAccessToken,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      user
    };
  },

  /**
   * Đăng xuất phiên hiện tại
   */
  async logout(refreshTokenStr) {
    if (refreshTokenStr) {
      await UserModel.deleteRefreshToken(refreshTokenStr);
    }
    return { success: true, message: 'Đăng xuất thành công!' };
  },

  /**
   * Đăng xuất khỏi mọi thiết bị
   */
  async logoutAll(userId) {
    await UserModel.deleteAllRefreshTokens(userId);
    return { success: true, message: 'Đã đăng xuất khỏi toàn bộ các thiết bị thành công!' };
  },

  /**
   * Xem danh sách các phiên đăng nhập đang hoạt động
   */
  async getSessions(userId) {
    return await UserModel.getActiveSessions(userId);
  },

  /**
   * Lấy thông tin cá nhân của người dùng đang đăng nhập
   */
  async getMe(userId) {
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new AppError('Người dùng không còn tồn tại trên hệ thống!', 404);
    }
    return user;
  },

  /**
   * Đổi mật khẩu
   */
  async changePassword(userId, { currentPassword, newPassword }) {
    if (!currentPassword || !newPassword) {
      throw new AppError('Vui lòng nhập cả mật khẩu hiện tại và mật khẩu mới!', 400);
    }

    if (newPassword.length < 6) {
      throw new AppError('Mật khẩu mới phải có ít nhất 6 ký tự!', 400);
    }

    // Lấy user kèm password
    const user = await UserModel.findByIdWithPassword(userId);

    if (!user) {
      throw new AppError('Người dùng không tồn tại!', 404);
    }

    // Kiểm tra mật khẩu cũ
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      throw new AppError('Mật khẩu hiện tại không chính xác!', 400);
    }

    // Băm mật khẩu mới và lưu
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);
    await UserModel.updatePassword(userId, hashedNewPassword);

    // Thu hồi toàn bộ refresh token cũ để buộc các thiết bị khác phải đăng nhập lại
    await UserModel.deleteAllRefreshTokens(userId);

    return { message: 'Đổi mật khẩu thành công! Các phiên đăng nhập trên thiết bị khác đã được đăng xuất để bảo mật.' };
  }
};

export default AuthService;
