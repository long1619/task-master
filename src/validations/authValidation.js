import { z } from 'zod';

/**
 * Schema kiểm tra dữ liệu đăng ký tài khoản
 */
export const registerSchema = z.object({
  name: z
    .string({ required_error: 'Họ và tên là bắt buộc!' })
    .trim()
    .min(2, 'Họ và tên phải có ít nhất 2 ký tự!')
    .max(100, 'Họ và tên tối đa 100 ký tự!'),
  email: z
    .string({ required_error: 'Email là bắt buộc!' })
    .trim()
    .email('Định dạng địa chỉ email không hợp lệ!'),
  password: z
    .string({ required_error: 'Mật khẩu là bắt buộc!' })
    .min(6, 'Mật khẩu phải có độ dài tối thiểu 6 ký tự!')
    .max(100, 'Mật khẩu tối đa 100 ký tự!')
});

/**
 * Schema kiểm tra dữ liệu đăng nhập
 */
export const loginSchema = z.object({
  email: z
    .string({ required_error: 'Email là bắt buộc!' })
    .trim()
    .email('Định dạng địa chỉ email không hợp lệ!'),
  password: z
    .string({ required_error: 'Mật khẩu là bắt buộc!' })
    .min(1, 'Mật khẩu không được để trống!')
});

/**
 * Schema kiểm tra đổi mật khẩu
 */
export const changePasswordSchema = z.object({
  currentPassword: z
    .string({ required_error: 'Mật khẩu hiện tại là bắt buộc!' })
    .min(1, 'Vui lòng nhập mật khẩu hiện tại!'),
  newPassword: z
    .string({ required_error: 'Mật khẩu mới là bắt buộc!' })
    .min(6, 'Mật khẩu mới phải có tối thiểu 6 ký tự!')
});
