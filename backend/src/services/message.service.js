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

    static getById(id) {
        return prisma.message.findUnique({
            where: { id: Number(id) },
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