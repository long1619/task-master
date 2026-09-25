/**
 * Custom Error Class dùng để định nghĩa các lỗi nghiệp vụ có chủ đích (Operational Errors)
 * Giúp chuẩn hóa mã trạng thái HTTP (statusCode) và thông báo lỗi (message).
 */
class AppError extends Error {
  /**
   * @param {string} message - Thông điệp mô tả lỗi
   * @param {number} statusCode - Mã trạng thái HTTP (400, 401, 403, 404, 500...)
   */
  constructor(message, statusCode) {
    super(message);

    this.statusCode = statusCode;
    // Nếu statusCode bắt đầu bằng 4 (4xx) thì status là 'fail', ngược lại là 'error' (5xx)
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    // Đánh dấu đây là lỗi nghiệp vụ đã được dự trù trước, không phải bug lập trình ngoài ý muốn
    this.isOperational = true;

    // Giữ lại stack trace chuẩn trừ constructor này
    Error.captureStackTrace(this, this.constructor);
  }
}

export default AppError;
