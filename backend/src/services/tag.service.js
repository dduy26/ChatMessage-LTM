const prisma = require("../config/prisma");

class TagService {
    // Tạo Tag mới (Danh mục thẻ)
    static async createTag(data) {
        return await prisma.tag.create({
            data: {
                name: data.name,
                color: data.color
            }
        });
    }

    // Lấy tất cả Tag có trong hệ thống
    static async getAll() {
        return await prisma.tag.findMany({
            include: {
                _count: { select: { users: true } } 
            }
        });
    }

    // Cập nhật thông tin Tag 
    static async updateTag(id, data) {
        return await prisma.tag.update({
            where: { id: id },
            data: data
        });
    }

    // Xóa Tag khỏi hệ thống 
    static async deleteTag(id) {
        return await prisma.tag.delete({
            where: { id: id }
        });
    }

    // Gắn thẻ cho User
    static async assignToUser(userId, tagId) {
        return await prisma.user.update({
            where: { id: Number(userId) },
            data: {
                tags: { connect: { id: tagId } } 
            },
            include: { tags: true }
        });
    }

    // Gỡ thẻ khỏi User
    static async removeFromUser(userId, tagId) {
        return await prisma.user.update({
            where: { id: Number(userId) },
            data: {
                tags: { disconnect: { id: tagId } } 
            },
            include: { tags: true }
        });
    }
}

module.exports = TagService;