const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class AttachmentService {
    // Lưu thông tin đính kèm
    static async create(data) {
        return await prisma.messageAttachment.create({
            data: {
                messageId: Number(data.messageId),
                fileUrl: data.fileUrl,
                publicId: data.publicId,
                fileName: data.fileName,
                fileType: data.fileType,
                fileSize: data.fileSize
            }
        });
    }

    // Lấy danh sách đính kèm của một tin nhắn
    static async getByMessage(messageId) {
        return await prisma.messageAttachment.findMany({
            where: { messageId: Number(messageId) }
        });
    }

    // Xóa một đính kèm
    static async delete(id) {
        return await prisma.messageAttachment.delete({
            where: { id: Number(id) }
        });
    }
}

module.exports = AttachmentService;