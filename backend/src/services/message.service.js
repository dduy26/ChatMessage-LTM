const prisma = require("../config/prisma");

class MessageService {
    static async create(data) {
        return await prisma.message.create({
            data,
            include: {
                attachments: true,

                // Lấy thêm thông tin người gửi (để Frontend hiển thị Avatar/Tên ngay lập tức)
                sender: {
                    select: { id: true, username: true, fullName: true, avatar: true }
                },

                // Lấy Conversation kèm Participants
                conversation: {
                    include: {
                        participants: {
                            include: {
                                user: { select: { id: true, username: true } }
                            }
                        }
                    }
                }
            }
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
                sender: { select: { id: true, fullName: true, username: true, avatar: true } } // Lấy thông tin người gửi
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