const prisma = require("../config/prisma");

class MessageService {
    static create(data) {
        return prisma.message.create({ data });
    }

    static getByConversation(conversationId) {
        return prisma.message.findMany({
        where: { conversationId: Number(conversationId) },
        orderBy: { createdAt: "asc" },
        });
    }
}

module.exports = MessageService;
