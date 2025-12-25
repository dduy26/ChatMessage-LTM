const prisma = require("../config/prisma");

class NotificationService {
    // Tạo thông báo mới
    static async create(data) {
        return prisma.notification.create({ data });
    }

    // Lấy danh sách thông báo của 1 User
    static async getByUserId(userId) {
        return prisma.notification.findMany({
        where: { userId: Number(userId) },
        orderBy: { createdAt: "desc" }
        });
    }

    // Đánh dấu là đã đọc (Đây là hàm PUT)
    static async markAsRead(id) {
        return prisma.notification.update({
        where: { id: Number(id) },
        data: { isRead: true }
        });
    }

    // Xóa thông báo
    static async delete(id) {
        return prisma.notification.delete({
        where: { id: Number(id) }
        });
    }
}

module.exports = NotificationService;