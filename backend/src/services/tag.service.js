    const prisma = require("../config/prisma");

    class TagService {
    
    // 1. Tạo thẻ mới (Có thể có màu hoặc không)
    static async create(data) {
        // data gồm: { name: "Developer", color: "#FF0000" }
        
        // Kiểm tra trùng tên
        const existing = await prisma.tag.findUnique({
        where: { name: data.name }
        });
        
        if (existing) throw new Error("Thẻ này đã tồn tại");

        return prisma.tag.create({ data });
    }

    // 2. Lấy tất cả các thẻ đang có trong hệ thống
    static getAll() {
        return prisma.tag.findMany();
    }

    // 3. Gắn thẻ cho User (Add Tag to User)
    static async assignTagToUser(userId, tagId) {
        // Kiểm tra xem thẻ có tồn tại không
        const tag = await prisma.tag.findUnique({ where: { id: tagId } });
        if (!tag) throw new Error("Thẻ không tồn tại");

        // Dùng update User để nối quan hệ (connect)
        return prisma.user.update({
        where: { id: userId },
        data: {
            tags: {
            connect: { id: tagId }
            }
        },
        include: { tags: true } // Trả về user kèm luôn danh sách tag mới
        });
    }

    // 4. Gỡ thẻ khỏi User (Remove Tag from User)
    static async removeTagFromUser(userId, tagId) {
        return prisma.user.update({
        where: { id: userId },
        data: {
            tags: {
            disconnect: { id: tagId }
            }
        },
        include: { tags: true }
        });
    }
    }

    module.exports = TagService;