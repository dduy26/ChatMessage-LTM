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

    // Lấy tất cả attachments (ảnh/file) từ một conversation
    static async getByConversation(conversationId) {
        // Lấy tất cả messages có conversationId
        const messages = await prisma.message.findMany({
            where: { conversationId: Number(conversationId) },
            select: { id: true }
        });
        
        const messageIds = messages.map(m => m.id);
        
        return await prisma.messageAttachment.findMany({
            where: {
                messageId: { in: messageIds }
            },
            include: {
                message: {
                    select: {
                        id: true,
                        senderId: true,
                        createdAt: true,
                        sender: {
                            select: {
                                id: true,
                                fullName: true,
                                username: true,
                                avatar: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
    }

    // Lấy chỉ ảnh từ conversation
    static async getImagesByConversation(conversationId) {
        // Lấy tất cả messages có conversationId
        const messages = await prisma.message.findMany({
            where: { conversationId: Number(conversationId) },
            select: { id: true }
        });
        
        const messageIds = messages.map(m => m.id);
        
        return await prisma.messageAttachment.findMany({
            where: {
                messageId: { in: messageIds },
                fileType: {
                    contains: 'image'
                }
            },
            include: {
                message: {
                    select: {
                        id: true,
                        senderId: true,
                        createdAt: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
    }

    // Lấy chỉ file (không phải ảnh) từ conversation
    static async getFilesByConversation(conversationId) {
        // Lấy tất cả messages có conversationId
        const messages = await prisma.message.findMany({
            where: { conversationId: Number(conversationId) },
            select: { id: true }
        });
        
        const messageIds = messages.map(m => m.id);
        
        return await prisma.messageAttachment.findMany({
            where: {
                messageId: { in: messageIds },
                NOT: {
                    fileType: {
                        contains: 'image'
                    }
                }
            },
            include: {
                message: {
                    select: {
                        id: true,
                        senderId: true,
                        createdAt: true,
                        sender: {
                            select: {
                                id: true,
                                fullName: true,
                                username: true,
                                avatar: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
    }
}

module.exports = AttachmentService;