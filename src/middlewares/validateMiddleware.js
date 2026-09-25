/**
 * Middleware kiểm tra dữ liệu đầu vào sử dụng Zod Schema (Level 3)
 * @param {import('zod').ZodSchema} schema - Zod Schema định nghĩa
 * @param {'body' | 'query' | 'params'} [source='body'] - Nguồn dữ liệu cần kiểm tra
 */
export const validate = (schema, source = 'body') => (req, res, next) => {
  const result = schema.safeParse(req[source]);

  if (!result.success) {
    const issues = result.error?.issues || result.error?.errors || [];
    const errorDetails = issues.map(err => ({
      field: Array.isArray(err.path) ? err.path.join('.') : (err.path || source),
      message: err.message
    }));

    return res.status(400).json({
      success: false,
      status: 'fail',
      message: errorDetails[0]?.message || 'Dữ liệu gửi lên không hợp lệ!',
      errors: errorDetails
    });
  }

  // Gán lại dữ liệu đã qua sanitize/parse
  req[source] = result.data;
  next();
};

export default validate;
