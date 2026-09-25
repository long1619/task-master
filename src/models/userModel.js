import prisma from '../config/db.js';

export const UserModel = {
    /**
     * Tìm người dùng theo email (Bao gồm cả hash password để so khớp khi đăng nhập)
     */
    async findByEmail(email) {
        return await prisma.user.findUnique({
            where: { email: email.toLowerCase().trim() }
        });
    },

    /**
     * Tìm người dùng theo ID (Loại bỏ password nhạy cảm)
     */
    async findById(id) {
        return await prisma.user.findUnique({
            where: { id: parseInt(id, 10) },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                isLocked: true,
                createdAt: true,
                updatedAt: true
            }
        });
    },

    /**
     * Tìm người dùng theo ID kèm password (Dùng cho đổi mật khẩu)
     */
    async findByIdWithPassword(id) {
        return await prisma.user.findUnique({
            where: { id: parseInt(id, 10) }
        });
    },

    /**
     * Tạo tài khoản người dùng mới
     */
    async create({ name, email, password, role = 'user' }) {
        return await prisma.user.create({
            data: {
                name: name.trim(),
                email: email.toLowerCase().trim(),
                password,
                role
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                isLocked: true,
                createdAt: true,
                updatedAt: true
            }
        });
    },

    /**
     * Cập nhật mật khẩu mới
     */
    async updatePassword(id, hashedPassword) {
        return await prisma.user.update({
            where: { id: parseInt(id, 10) },
            data: { password: hashedPassword }
        });
    },

    /**
     * Lưu trữ một Refresh Token mới vào database
     */
    async saveRefreshToken({ userId, token, expiresAt, userAgent = null, ipAddress = null }) {
        return await prisma.refreshToken.create({
            data: {
                userId: parseInt(userId, 10),
                token,
                expiresAt,
                userAgent,
                ipAddress
            }
        });
    },

    /**
     * Tìm Refresh Token hợp lệ kèm thông tin User
     */
    async findRefreshToken(token) {
        return await prisma.refreshToken.findUnique({
            where: { token },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                        isLocked: true,
                        createdAt: true
                    }
                }
            }
        });
    },

    /**
     * Xóa một Refresh Token (khi logout hoặc xoay vòng token)
     */
    async deleteRefreshToken(token) {
        return await prisma.refreshToken.deleteMany({
            where: { token }
        });
    },

    /**
     * Đăng xuất khỏi mọi thiết bị: Xóa toàn bộ Refresh Token của User
     */
    async deleteAllRefreshTokens(userId) {
        return await prisma.refreshToken.deleteMany({
            where: { userId: parseInt(userId, 10) }
        });
    },

    /**
     * Lấy danh sách các phiên đăng nhập đang hoạt động của User
     */
    async getActiveSessions(userId) {
        return await prisma.refreshToken.findMany({
            where: {
                userId: parseInt(userId, 10),
                expiresAt: { gt: new Date() }
            },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                userAgent: true,
                ipAddress: true,
                createdAt: true,
                expiresAt: true
            }
        });
    }
};

export default UserModel;
