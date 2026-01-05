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
        // Kiểm tra id có tồn tại và không phải null/undefined
        if (id === null || id === undefined || id === '') {
            console.log("getById: id không hợp lệ (null/undefined/empty):", id);
            return null;
        }

        // Chuyển đổi sang số
        const numericId = Number(id);

        // Kiểm tra sau khi convert
        if (isNaN(numericId) || numericId <= 0 || !Number.isInteger(numericId)) {
            console.log("getById: id không hợp lệ sau khi convert:", id, "->", numericId);
            return null;
        }

        console.log("getById: Đang tìm user với id:", numericId, "(type:", typeof numericId, ")");
        const user = await prisma.user.findUnique({
            where: { id: numericId },
        });
        
        if (user) {
            console.log("getById: Tìm thấy user:", { id: user.id, email: user.email, deletedAt: user.deletedAt });
        } else {
            console.log("getById: Không tìm thấy user với id:", numericId);
        }
        
        return user;
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