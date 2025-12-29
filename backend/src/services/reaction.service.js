const prisma = require("../config/prisma");

class ReactionService {
    // Toggle Reaction (Thả hoặc Gỡ cảm xúc)
    static async toggleReaction(messageId, participantId, emoji) {
        const mId = Number(messageId);
        const pId = Number(participantId);

        // Tìm xem participant này đã thả cảm xúc vào tin nhắn này chưa
        const existing = await prisma.reaction.findUnique({
            where: {
                messageId_participantId: {
                    messageId: mId,
                    participantId: pId
                }
            }
        });

        if (existing) {
            // Nếu trùng emoji cũ -> Xóa (Gỡ bỏ)
            if (existing.emoji === emoji) {
                return await prisma.reaction.delete({
                    where: { id: existing.id }
                });
            }
            // Nếu là emoji khác -> Cập nhật emoji mới
            return await prisma.reaction.update({
                where: { id: existing.id },
                data: { emoji }
            });
        }

        // Nếu chưa có -> Tạo mới
        return await prisma.reaction.create({
            data: {
                messageId: mId,
                participantId: pId,
                emoji
            }
        });
    }

    // Lấy danh sách cảm xúc của một tin nhắn (Kèm thông tin User)
    static async getByMessage(messageId) {
        return await prisma.reaction.findMany({
            where: { messageId: Number(messageId) },
            include: {
                participant: {
                    include: {
                        user: { select: { id: true, fullName: true, username: true } }
                    }
                }
            }
        });
    }

    // Xóa tất cả reaction của một tin nhắn (Dùng khi xóa tin nhắn)
    static async deleteByMessage(messageId) {
        return await prisma.reaction.deleteMany({
            where: { messageId: Number(messageId) }
        });
    }
}

module.exports = ReactionService;