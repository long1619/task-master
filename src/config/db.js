import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Khởi tạo Prisma Client Singleton chuẩn công nghiệp
 */
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error']
});

/**
 * Kiểm tra kết nối Cơ sở dữ liệu khi khởi động Server
 */
export const initDatabase = async () => {
  try {
    await prisma.$connect();
    console.log('✅ Đã kết nối MySQL Database qua Prisma Client thành công!');

    // Đảm bảo có tài khoản Admin mẫu để thử nghiệm RBAC
    const adminEmail = 'admin@taskmaster.dev';
    const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
    if (!existingAdmin) {
      const bcrypt = (await import('bcryptjs')).default;
      const hashedPassword = await bcrypt.hash('Admin@123456', 12);
      await prisma.user.create({
        data: {
          name: 'Quản trị viên Hệ thống',
          email: adminEmail,
          password: hashedPassword,
          role: 'admin'
        }
      });
      console.log('👑 [ADMIN SEED] Đã khởi tạo tài khoản Quản trị viên: admin@taskmaster.dev / Admin@123456');
    }
  } catch (error) {
    console.error('❌ Không thể kết nối tới MySQL thông qua Prisma:');
    console.error(error.message);
    throw error;
  }
};

export default prisma;
