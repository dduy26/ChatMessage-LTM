const prisma = require("../config/prisma");

class PinnedService {
    // Ghim hoặc Bỏ ghim (Toggle)
    static async togglePin(userId, conversationId) {
        // Kiểm tra hội thoại có tồn tại không
        const conversationExists = await prisma.conversation.findUnique({
            where: { id: Number(conversationId) }
        });
        if (!conversationExists) throw new Error("Hội thoại không tồn tại");

        // Kiểm tra trạng thái ghim hiện tại
        const existing = await prisma.pinnedConversation.findUnique({
            where: {
                userId_conversationId: {
                    userId: Number(userId),
                    conversationId: Number(conversationId)
                }
            }
        });

        // Nếu đã ghim thì xóa, chưa ghim thì tạo
        if (existing) {
            return await prisma.pinnedConversation.delete({
                where: { id: existing.id }
            });
        }

        return await prisma.pinnedConversation.create({
            data: {
                userId: Number(userId),
                conversationId: Number(conversationId)
            }
        });
    }

    // Lấy danh sách đã ghim của một User
    static async getPinnedByUserId(userId) {
        return await prisma.pinnedConversation.findMany({
            where: { userId: Number(userId) },
            include: {
                conversation: {
                    include: {
                        messages: { take: 1, orderBy: { createdAt: 'desc' } } 
                    }
                }
            }
        });
    }

    // Xóa tất cả ghim 
    static async clearAllPins(userId) {
        return await prisma.pinnedConversation.deleteMany({
            where: { userId: Number(userId) }
        });
    }
}

module.exports = PinnedService;