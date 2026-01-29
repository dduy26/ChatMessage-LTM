const prisma = require("../config/prisma");
const { encryptText, decryptText } = require("../utils/encryption");

class MessageService {
    static async create(data, files = []) {
        // Tạo tin nhắn và các bản ghi attachment cùng lúc trong 1 transaction
        const { content, senderId, conversationId, attachments } = data;

        try {
            const created = await prisma.message.create({
                data: {
                    // Sử dụng content || "" để tránh lỗi 'Argument content is missing' 
                    // nếu người dùng chỉ gửi ảnh mà không nhắn chữ
                    content: encryptText(content || ""), 
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

            // Trả về plaintext cho client
            return { ...created, content: decryptText(created.content) };
        } catch (error) {
            console.error("[MessageService] Lỗi khi tạo message:", error);
            console.error("[MessageService] Data:", JSON.stringify(data, null, 2));
            throw error;
        }
    }

    // Lọc tin nhắn để không hiện những tin mà Participant này đã "Xóa phía tôi"
    static async getByConversation(conversationId, participantId = null) {
        const whereClause = { conversationId: Number(conversationId) };

        if (participantId) {
            whereClause.NOT = {
                deletedBy: {
                    some: { participantId: Number(participantId) }
                }
            };
        }

        const messages = await prisma.message.findMany({
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

        return (messages || []).map((m) => ({
            ...m,
            content: decryptText(m.content),
        }));
    }

    static async getById(id) {
        const msg = await prisma.message.findUnique({
            where: { id: Number(id) },
            include: { attachments: true }
        });
        if (!msg) return msg;
        return { ...msg, content: decryptText(msg.content) };
    }

    static update(id, data) {
        const updateData = { ...data };
        if (Object.prototype.hasOwnProperty.call(updateData, "content")) {
            updateData.content = encryptText(updateData.content || "");
        }

        return prisma.message.update({
            where: { id: Number(id) },
            data: updateData,
        });
    }

    static delete(id) {
        return prisma.message.delete({
            where: { id: Number(id) },
        });
    }

    // Xóa tất cả messages trong một conversation (xóa lịch sử trò chuyện)
    static async deleteAllByConversation(conversationId, userId) {
        // Kiểm tra user có phải là participant không
        const participant = await prisma.participant.findFirst({
            where: {
                userId: Number(userId),
                conversationId: Number(conversationId)
            }
        });

        if (!participant) {
            throw new Error("Bạn không phải thành viên của cuộc trò chuyện này");
        }

        // Xóa tất cả messages bằng cách đánh dấu là đã xóa cho participant này
        // Sử dụng DeletedMessage để đánh dấu tất cả messages đã bị xóa
        const messages = await prisma.message.findMany({
            where: { conversationId: Number(conversationId) },
            select: { id: true }
        });

        // Tạo các bản ghi DeletedMessage cho tất cả messages
        const deletedRecords = messages.map(msg => ({
            messageId: msg.id,
            participantId: participant.id
        }));

        // Sử dụng createMany với skipDuplicates để tránh lỗi nếu đã có
        await prisma.deletedMessage.createMany({
            data: deletedRecords,
            skipDuplicates: true
        });

        return { 
            message: "Đã xóa lịch sử trò chuyện", 
            deletedCount: messages.length 
        };
    }
}

module.exports = MessageService;