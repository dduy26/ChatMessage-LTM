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
        // Thêm log này để kiểm tra thực tế Controller truyền gì xuống
        console.log(`UserService.getById nhận được: ${id} (Kiểu dữ liệu: ${typeof id})`);

        const numericId = parseInt(id, 10);
        
        if (isNaN(numericId)) {
            // Log này báo cho bạn biết biến truyền vào đang bị lỗi (thường là undefined)
            console.error("getById: id không hợp lệ sau khi convert:", id); 
            return null;
        }

        return await prisma.user.findUnique({
            where: { id: numericId }
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