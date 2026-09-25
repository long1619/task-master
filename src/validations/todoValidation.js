import { z } from 'zod';

/**
 * Schema kiểm tra tạo mới Todo
 */
export const createTodoSchema = z.object({
  title: z
    .string({ required_error: 'Tiêu đề công việc là bắt buộc!' })
    .trim()
    .min(3, 'Tiêu đề công việc phải có ít nhất 3 ký tự!')
    .max(255, 'Tiêu đề công việc tối đa 255 ký tự!'),
  description: z
    .string()
    .optional()
    .nullable(),
  status: z
    .enum(['pending', 'in_progress', 'completed'], {
      errorMap: () => ({ message: 'Trạng thái chỉ chấp nhận: pending, in_progress, completed!' })
    })
    .default('pending'),
  priority: z
    .enum(['low', 'medium', 'high'], {
      errorMap: () => ({ message: 'Mức độ ưu tiên chỉ chấp nhận: low, medium, high!' })
    })
    .default('medium'),
  dueDate: z
    .string()
    .refine((val) => !val || !isNaN(Date.parse(val)), {
      message: 'Hạn chót phải là định dạng thời gian hợp lệ!'
    })
    .optional()
    .nullable(),
  tags: z
    .union([
      z.array(z.string()),
      z.string().transform(str => str.split(',').map(s => s.trim()).filter(Boolean))
    ])
    .optional()
    .default([]),
  workspaceId: z.coerce.number().int().positive().optional().nullable(),
  assigneeId: z.coerce.number().int().positive().optional().nullable()
});

/**
 * Schema kiểm tra cập nhật Todo
 */
export const updateTodoSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, 'Tiêu đề công việc phải có ít nhất 3 ký tự!')
    .max(255, 'Tiêu đề công việc tối đa 255 ký tự!')
    .optional(),
  description: z
    .string()
    .optional()
    .nullable(),
  status: z
    .enum(['pending', 'in_progress', 'completed'], {
      errorMap: () => ({ message: 'Trạng thái chỉ chấp nhận: pending, in_progress, completed!' })
    })
    .optional(),
  priority: z
    .enum(['low', 'medium', 'high'], {
      errorMap: () => ({ message: 'Mức độ ưu tiên chỉ chấp nhận: low, medium, high!' })
    })
    .optional(),
  dueDate: z
    .string()
    .refine((val) => !val || !isNaN(Date.parse(val)), {
      message: 'Hạn chót phải là định dạng thời gian hợp lệ!'
    })
    .optional()
    .nullable(),
  tags: z
    .union([
      z.array(z.string()),
      z.string().transform(str => str.split(',').map(s => s.trim()).filter(Boolean))
    ])
    .optional(),
  workspaceId: z.coerce.number().int().positive().optional().nullable(),
  assigneeId: z.coerce.number().int().positive().optional().nullable()
});

/**
 * Schema kiểm tra cập nhật nhanh trạng thái
 */
export const updateStatusSchema = z.object({
  status: z.enum(['pending', 'in_progress', 'completed'], {
    required_error: 'Trạng thái là bắt buộc!',
    errorMap: () => ({ message: 'Trạng thái chỉ chấp nhận: pending, in_progress, completed!' })
  })
});

/**
 * Schema kiểm tra query parameters tìm kiếm, phân trang, lọc & sắp xếp
 */
export const queryTodoSchema = z.object({
  page: z.coerce.number().int().positive().default(1).optional(),
  limit: z.coerce.number().int().positive().max(100).default(10).optional(),
  search: z.string().optional(),
  status: z.enum(['all', 'pending', 'in_progress', 'completed']).optional(),
  priority: z.enum(['all', 'low', 'medium', 'high']).optional(),
  sortBy: z.string().optional(),
  workspaceId: z.coerce.number().int().positive().optional().nullable()
});
