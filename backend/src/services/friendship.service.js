const prisma = require("../config/prisma");

class FriendshipService {
    static async sendRequest(requesterId, addresseeId) {
        if (requesterId === addresseeId) {
            throw new Error("Không thể gửi lời mời kết bạn cho chính mình.");
        }
    
    // tìm bản ghi đầu tiên , ktra xem đã có lời mời kết bạn giữa 2 người dùng chưa
        const existing = await prisma.friendship.findFirst({
        where: {
            OR: [
                { requesterId: requesterId, addresseeId: addresseeId },
                { requesterId: addresseeId, addresseeId: requesterId }
            ]
    }
});
        // ktra nếu đã tồn tại lời mời kết bạn
        if (existing) throw new Error("Đã tồn tại lời mời kết bạn giữa hai người dùng này.");
        // nếu chưa tồn tại thì tạo lời mời kết bạn mới trong db
        return prisma.friendship.create({
            data: {
                requesterId,  // ID người gửi lời mời kết bạn
                addresseeId, // ID người nhận lời mời kết bạn
                status: 'PENDING' // Trạng thái chờ xác nhận
            }
        });
    }

    static acceptRequest(id) {
        return prisma.friendship.update({
            where: { id },
            data: { status: 'ACCEPTED' } // Cập nhật trạng thái thành đã chấp nhận
        });
    }
    static removeRequest(id) {
        return prisma.friendship.delete({
            where: { id } // Xóa lời mời kết bạn dựa trên ID
        });
    }
    static async getListFriends(userId) {
        const list = await prisma.friendship.findMany({
            where: {
                OR: [
                    { requesterId: userId, status: 'ACCEPTED' },
                    { addresseeId: userId, status: 'ACCEPTED' }
                ]
            },
            include: {
                requester:{ select: { id: true, username: true, email: true } },
                addressee:{ select: { id: true, username: true, email: true } }
            }
        });
        return list.map(item => item.requesterId === userId ? item.addressee : item.requester);
    }
    static getPendingRequests(userId) {
        return prisma.friendship.findMany({
            where: {
                addresseeId: userId,
                status: 'PENDING'
            },
            include: {
                requester: { select: { id: true, username: true, avatar: true } }
            }
        });
    }

}
module.exports = FriendshipService;