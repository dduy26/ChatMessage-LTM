const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class DeletedMessageService {
    // Tạo bản ghi xóa (Xóa phía tôi)
    static async create(messageId, participantId) {
        return await prisma.deletedMessage.create({
            data: {
                messageId: Number(messageId),
                participantId: Number(participantId)
            }
        });
    }

    // Lấy danh sách các ID tin nhắn mà participant này đã xóa
    static async getDeletedIdsByParticipant(participantId) {
        const deleted = await prisma.deletedMessage.findMany({
            where: { participantId: Number(participantId) },
            select: { messageId: true }
        });
        return deleted.map(d => d.messageId);
    }

    // Khôi phục tin nhắn (Nếu lỡ tay xóa phía tôi)
    static async undoDelete(messageId, participantId) {
        return await prisma.deletedMessage.delete({
            where: {
                messageId_participantId: {
                    messageId: Number(messageId),
                    participantId: Number(participantId)
                }
            }
        });
    }
}

module.exports = DeletedMessageService;