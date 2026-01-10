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
    const numericId = Number(id); // Chuyển đổi tham số truyền vào thành số
    if (isNaN(numericId)) {
        console.error("getById: id không hợp lệ:", id);
        return null;
    }
    return await prisma.user.findUnique({
        where: { id: numericId } // Tìm kiếm theo ID kiểu Int
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