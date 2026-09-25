import jwt from 'jsonwebtoken';
import UserModel from '../models/userModel.js';
import AppError from '../utils/AppError.js';
import asyncHandler from '../utils/asyncHandler.js';

/**
 * Middleware xác thực JSON Web Token (JWT)
 * Kiểm tra xem request có gửi kèm Bearer Token hợp lệ hay không.
 * Nếu hợp lệ, gán thông tin user vào req.user.
 */
export const protect = asyncHandler(async (req, res, next) => {
  let token;

  // 1. Lấy token từ header Authorization
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  // 2. Nếu không có token gửi lên
  if (!token) {
    throw new AppError('Bạn chưa đăng nhập! Vui lòng đăng nhập để truy cập tài nguyên này.', 401);
  }

  // 3. Xác thực và giải mã token
  const secret = process.env.JWT_SECRET || 'taskmaster_super_secret_jwt_key_2026_@secure!';
  let decoded;
  try {
    decoded = jwt.verify(token, secret);
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      throw new AppError('Mã token không hợp lệ! Vui lòng đăng nhập lại.', 401);
    }
    if (err.name === 'TokenExpiredError') {
      throw new AppError('Phiên đăng nhập đã hết hạn! Vui lòng đăng nhập lại.', 401);
    }
    throw err;
  }

  // 4. Kiểm tra xem người dùng trong token có còn tồn tại trong MySQL không
  const currentUser = await UserModel.findById(decoded.id);
  if (!currentUser) {
    throw new AppError('Người dùng của token này không còn tồn tại trên hệ thống!', 401);
  }

  // 🔒 Kiểm tra nếu tài khoản bị khóa bởi Quản trị viên
  if (currentUser.isLocked) {
    throw new AppError('Tài khoản của bạn đã bị khóa bởi Quản trị viên! Vui lòng liên hệ hỗ trợ.', 403);
  }

  // 5. Gán user vào request để các controller tiếp theo sử dụng
  req.user = currentUser;
  next();
});

/**
 * Middleware phân quyền theo vai trò (Role-based Authorization)
 * Ví dụ: restrictTo('admin')
 */
export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError('Bạn không có quyền thực hiện hành động này!', 403));
    }
    next();
  };
};

export default { protect, restrictTo };
