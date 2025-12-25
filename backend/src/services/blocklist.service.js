const prisma = require("../config/prisma");

class BlockListService {
    // Chặn người dùng
    static async blockUser(blockerId, blockedId) {
        if (blockerId === blockedId) {
            throw new Error("Bạn không thể tự chặn chính mình");
        }
        return await prisma.blockList.create({
            data: {
                blockerId: Number(blockerId),
                blockedId: Number(blockedId)
            }
        });
    }

    // Bỏ chặn
    static async unblockUser(blockerId, blockedId) {
        return await prisma.blockList.delete({
            where: {
                blockerId_blockedId: {
                    blockerId: Number(blockerId),
                    blockedId: Number(blockedId)
                }
            }
        });
    }

    // Lấy danh sách những người mình đã chặn
    static async getMyBlockList(blockerId) {
        return await prisma.blockList.findMany({
            where: { blockerId: Number(blockerId) },
            include: {
                blocked: {
                    select: { id: true, username: true, fullName: true }
                }
            }
        });
    }

    // Kiểm tra xem có đang bị chặn không (Dùng cho logic gửi tin nhắn)
    static async isBlocked(userA, userB) {
        const block = await prisma.blockList.findFirst({
            where: {
                OR: [
                    { blockerId: userA, blockedId: userB },
                    { blockerId: userB, blockedId: userA }
                ]
            }
        });
        return !!block;
    }
}

module.exports = BlockListService;