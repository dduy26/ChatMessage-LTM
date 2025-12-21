const prisma = require("../config/prisma");

class ConversationService {
    static create(data) {
        return prisma.conversation.create({ data });
    }

    static getAll() {
        return prisma.conversation.findMany({
        orderBy: { createdAt: "desc" },
        });
    }

    static getById(id) {
        return prisma.conversation.findUnique({
        where: { id: Number(id) },
        });
    }

    static update(id, data) {
        return prisma.conversation.update({
        where: { id },
        data,
        });
    }

    static delete(id) {
        return prisma.conversation.delete({
        where: { id },
        });
    }
}

module.exports = ConversationService;
