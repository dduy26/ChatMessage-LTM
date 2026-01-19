const prisma = require("../config/prisma");

class UserService {
    static create(data) {
        return prisma.user.create({ data });
    }

    static getAll() {
        return prisma.user.findMany({
            where: { deletedAt: null },
            orderBy: { createdAt: "desc" },
        });
    }

    static async getById(id) { 
        const numericId = Number(id);

        if (!id || isNaN(numericId)) {
            return null;
        }

        return await prisma.user.findUnique({
            where: { id: numericId },
        });
    }

    static update(id, data) { 
        return prisma.user.update({
            where: { id: Number(id) }, 
            data,
        });
    }

    static hardDelete(id) { 
        return prisma.user.delete({
            where: { id: Number(id) },
        });
    }
}

module.exports = UserService;