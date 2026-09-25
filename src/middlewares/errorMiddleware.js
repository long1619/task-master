import multer from 'multer';
import AppError from '../utils/AppError.js';

/**
 * Middleware xử lý khi không có route nào khớp với URL được gửi lên (404 Not Found)
 */
export const notFoundHandler = (req, res, next) => {
  const err = new AppError(`Đường dẫn [${req.method}] ${req.originalUrl} không tồn tại trên hệ thống!`, 404);
  next(err);
};

/**
 * Global Error Handling Middleware (4 tham số)
 * Bắt mọi lỗi được ném ra hoặc chuyển qua next(err) trong toàn bộ ứng dụng.
 */
export const globalErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Xử lý lỗi từ Multer (Upload File)
  if (err instanceof multer.MulterError) {
    err.statusCode = 400;
    err.status = 'fail';
    if (err.code === 'LIMIT_FILE_SIZE') {
      err.message = 'Dung lượng file vượt quá giới hạn tối đa cho phép (5MB)!';
    } else {
      err.message = `Lỗi tải tệp tin: ${err.message}`;
    }
  }

  // Chế độ phát triển (Development): Trả về đầy đủ thông tin lỗi và stack trace để tiện debug
  if (process.env.NODE_ENV === 'development') {
    return res.status(err.statusCode).json({
      success: false,
      status: err.status,
      message: err.message,
      error: err,
      stack: err.stack
    });
  }

  // Chế độ Production: Ẩn chi tiết lỗi nội bộ để đảm bảo an toàn bảo mật
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      status: err.status,
      message: err.message
    });
  }

  // Lỗi lập trình hoặc lỗi không xác định (Programming or unknown error)
  console.error('💥 LỖI KHÔNG XÁC ĐỊNH:', err);
  return res.status(500).json({
    success: false,
    status: 'error',
    message: 'Đã có lỗi nghiêm trọng xảy ra trên máy chủ!'
  });
};
