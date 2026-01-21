const prisma = require("../config/prisma");

class MessageService {
    static async create(data, files = []) {


        // Tạo tin nhắn và các bản ghi attachment cùng lúc trong 1 transaction
        const { content, senderId, conversationId, attachments } = data;

            return await prisma.message.create({
            data: {
                // Sử dụng content || "" để tránh lỗi 'Argument content is missing' 
                // nếu người dùng chỉ gửi ảnh mà không nhắn chữ
                content: content || "", 
                senderId: parseInt(senderId),
                conversationId: parseInt(conversationId),
                attachments: {
                create: attachments || [] // Mảng các tệp đã upload lên Cloudinary
                },
            },
            include: { 
                attachments: true, 
                sender: { 
                    select: { 
                        id: true, 
                        fullName: true, 
                        username: true, 
                        avatar: true,
                        isOnline: true 
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
                sender: { 
                    select: { 
                        id: true, 
                        fullName: true, 
                        username: true, 
                        avatar: true,
                        isOnline: true 
                    } 
                } // Lấy thông tin người gửi bao gồm avatar và trạng thái online
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