/**
 * Wrapper function bọc ngoài các async controller
 * Thay thế hoàn toàn việc phải viết try-catch lặp đi lặp lại.
 * Nếu controller ném lỗi hoặc promise reject, hàm này tự động chuyển lỗi sang next(error)
 * để chuyển tiếp về Global Error Middleware xử lý.
 *
 * @param {Function} fn - Async controller function (req, res, next)
 * @returns {Function} Express middleware function
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

export default asyncHandler;
