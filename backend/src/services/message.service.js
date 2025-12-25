const prisma = require("../config/prisma");

class MessageService {
    // Nâng cấp: Tự động kết nối với Attachments nếu có dữ liệu gửi kèm
    static create(data) {
        return prisma.message.create({ 
            data,
            include: { attachments: true } // Trả về kèm file đính kèm sau khi tạo
        });
    }

    // Lọc tin nhắn để không hiện những tin mà Participant này đã "Xóa phía tôi"
    static getByConversation(conversationId, participantId = null) {
        const whereClause = { conversationId: Number(conversationId) };

        if (participantId) {
            whereClause.NOT = {
                deletedBy: {
                    some: { participantId: Number(participantId) }
                }
            };
        }

        return prisma.message.findMany({
            where: whereClause,
            include: { 
                attachments: true, // Lấy kèm file đính kèm
                sender: { select: { id: true, fullName: true, username: true } } // Lấy thông tin người gửi
            },
            orderBy: { createdAt: "asc" },
        });
    }

    static getById(id) {
        return prisma.message.findUnique({
            where: { id: Number(id) },
            include: { attachments: true }
        });
    }

    static update(id, data) {
        return prisma.message.update({
            where: { id: Number(id) },
            data,
        });
    }

    static delete(id) {
        return prisma.message.delete({
            where: { id: Number(id) },
        });
    }
}

module.exports = MessageService;