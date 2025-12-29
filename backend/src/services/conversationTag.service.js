const prisma = require("../config/prisma");

class ConversationTagService {
    //  Gắn một Tag vào cuộc hội thoại
    static async assignTag(conversationId, tagId) {
        return await prisma.conversationTag.create({
            data: {
                conversationId: Number(conversationId),
                tagId: tagId // Vì tagId của bạn là UUID (String)
            },
            include: {
                tag: true, // Trả về thông tin chi tiết của Tag sau khi gắn
                conversation: { select: { title: true } }
            }
        });
    }

    //  Lấy tất cả các Tag của một cuộc hội thoại cụ thể
    static async getTagsByConversation(conversationId) {
        return await prisma.conversationTag.findMany({
            where: { conversationId: Number(conversationId) },
            include: { tag: true }
        });
    }

    // Gỡ Tag khỏi cuộc hội thoại
    static async removeTag(conversationId, tagId) {
        return await prisma.conversationTag.delete({
            where: {
                conversationId_tagId: {
                    conversationId: Number(conversationId),
                    tagId: tagId
                }
            }
        });
    }

    // 4. Lấy danh sách cuộc hội thoại theo Tag Name (Lọc)
    static async getConversationsByTagName(tagName) {
        return await prisma.conversationTag.findMany({
            where: {
                tag: { name: tagName }
            },
            include: {
                conversation: true
            }
        });
    }
}

module.exports = ConversationTagService;