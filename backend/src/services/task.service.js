const prisma = require("../config/prisma");

class TaskService {
    // Tạo Task mới
    static async create(data) {
        return prisma.task.create({
            data: {
                ...data,
                conversationId: Number(data.conversationId),
                creatorId: Number(data.creatorId),
                assigneeId: data.assigneeId ? Number(data.assigneeId) : null,
                dueDate: data.dueDate ? new Date(data.dueDate) : null
            }
        });
    }

    // Lấy tất cả Task trong một cuộc hội thoại (Nhóm)
    static async getByConversation(conversationId) {
        return prisma.task.findMany({
            where: { conversationId: Number(conversationId) },
            include: {
                assignee: { select: { id: true, fullName: true, avatar: true } },
                creator: { select: { id: true, fullName: true } }
            },
            orderBy: { createdAt: "desc" }
        });
    }

    // Cập nhật Task (Trạng thái, Người được giao, Tiêu đề...)
    static async update(id, data) {
        return prisma.task.update({
            where: { id: Number(id) },
            data: {
                ...data,
                assigneeId: data.assigneeId ? Number(data.assigneeId) : undefined,
                dueDate: data.dueDate ? new Date(data.dueDate) : undefined
            }
        });
    }

    // Xóa Task
    static async delete(id) {
        return prisma.task.delete({
            where: { id: Number(id) }
        });
    }
}

module.exports = TaskService;