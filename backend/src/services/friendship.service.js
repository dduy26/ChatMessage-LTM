const prisma = require("../config/prisma");

class FriendshipService {
    // 0. TÌM KIẾM NGƯỜI DÙNG THEO EMAIL
    static async searchUserByEmail(email) {
        const user = await prisma.user.findUnique({
            where: { email },
            select: {
                id: true,
                email: true,
                fullName: true,
                avatar: true
            }
        });
        return user;
    }

    // 1. GỬI LỜI MỜI QUA EMAIL 
    static async sendRequestByEmail(senderId, email, io = null) {
        // Tìm User có email đó trước
        const receiver = await prisma.user.findUnique({ where: { email } });
        
        if (!receiver) {
            throw new Error("Không tìm thấy người dùng với email này!");
        }

        if (senderId === receiver.id) {
            throw new Error("Bạn không thể gửi lời mời kết bạn cho bản thân");
        }

        // Kiểm tra xem đã có bản ghi nào giữa 2 người chưa
        const existing = await prisma.friendship.findFirst({
            where: {
                OR: [
                    { requesterId: senderId, addresseeId: receiver.id },
                    { requesterId: receiver.id, addresseeId: senderId }
                ]
            }
        });

        if (existing) {
            throw new Error("Lời mời đã tồn tại hoặc hai người đã là bạn bè");
        }

        // Lấy thông tin người gửi để tạo notification
        const sender = await prisma.user.findUnique({
            where: { id: senderId },
            select: { id: true, fullName: true, username: true, avatar: true }
        });

        // Tạo friendship request
        const friendship = await prisma.friendship.create({
            data: {
                requesterId: senderId,
                addresseeId: receiver.id,
                status: "PENDING",
            },
            include: {
                requester: {
                    select: { id: true, fullName: true, username: true, avatar: true }
                }
            }
        });

        // Tạo notification cho người nhận
        const notification = await prisma.notification.create({
            data: {
                userId: receiver.id,
                title: "Lời mời kết bạn mới",
                content: `${sender?.fullName || sender?.username || 'Người dùng'} đã gửi cho bạn lời mời kết bạn`,
                type: "FRIENDSHIP_REQUEST",
                isRead: false
            }
        });

        // Gửi real-time notification qua socket nếu có io instance
        if (io && typeof io.emitToUser === 'function') {
            try {
                console.log(`[Friendship] Gửi thông báo real-time đến user ${receiver.id}`);
                io.emitToUser(receiver.id, 'new_friendship_request', {
                    friendship: {
                        id: friendship.id,
                        requester: friendship.requester,
                        status: friendship.status,
                        createdAt: friendship.createdAt
                    },
                    notification: {
                        id: notification.id,
                        title: notification.title,
                        content: notification.content,
                        type: notification.type,
                        isRead: notification.isRead,
                        createdAt: notification.createdAt
                    }
                });
                console.log(`[Friendship] Đã gửi thông báo thành công đến user ${receiver.id}`);
            } catch (socketError) {
                console.error('[Friendship] Lỗi khi gửi socket notification:', socketError);
                // Không throw error để không ảnh hưởng đến việc tạo friendship
            }
        } else {
            console.warn(`[Friendship] Không thể gửi real-time notification: io=${!!io}, emitToUser=${io && typeof io.emitToUser}`);
        }

        return friendship;
    }

    // 2. LẤY DANH SÁCH LỜI MỜI ĐANG CHỜ
    static async getPendingRequests(userId) {
        return prisma.friendship.findMany({
            where: {
                addresseeId: userId, // Tôi là người nhận
                status: "PENDING"
            },
            include: {
                requester: { 
                        select: { id: true, fullName: true, email: true, avatar: true }
                    }
                }
        });
    }

static async acceptRequest(friendshipId, userId) {
        // 1. Kiểm tra lời mời có tồn tại không
        const friendship = await prisma.friendship.findUnique({
            where: { id: friendshipId }
        });

        if (!friendship) throw new Error("Không tìm thấy lời mời kết bạn");
        if (friendship.addresseeId !== userId) throw new Error("Bạn không có quyền chấp nhận");
        if (friendship.status !== "PENDING") throw new Error("Lời mời đã được xử lý");

        // 2. Chạy Transaction để tạo đồng thời Friendship và Conversation
        return prisma.$transaction(async (tx) => {
            // Cập nhật trạng thái kết bạn
            const updatedFriendship = await tx.friendship.update({
                where: { id: friendshipId },
                data: { status: "ACCEPTED" },
            });

            // Kiểm tra xem trước đó đã có cuộc hội thoại nào giữa 2 người chưa (tránh tạo trùng)
            const existingChat = await tx.conversation.findFirst({
                where: {
                    type: "DIRECT",
                    AND: [
                        { participants: { some: { userId: friendship.requesterId } } },
                        { participants: { some: { userId: friendship.addresseeId } } }
                    ]
                }
            });

            if (!existingChat) {
                // Tạo cuộc hội thoại mới và thêm 2 thành viên
                await tx.conversation.create({
                    data: {
                        type: "DIRECT",
                        participants: {
                            create: [
                                { userId: friendship.requesterId, role: "MEMBER" },
                                { userId: friendship.addresseeId, role: "MEMBER" }
                            ]
                        }
                    }
                });
            }

            return updatedFriendship;
        });
    }
    
    static async remove(friendshipId, userId){
        // Kiểm tra friendship có tồn tại không
        const friendship = await prisma.friendship.findUnique({
            where: { id: friendshipId }
        });

        if (!friendship) {
            throw new Error("Không tìm thấy lời mời kết bạn");
        }

        // Kiểm tra user có phải là người gửi hoặc người nhận không
        if (friendship.requesterId !== userId && friendship.addresseeId !== userId) {
            throw new Error("Bạn không có quyền xóa lời mời kết bạn này");
        }

        return prisma.friendship.delete({
            where: { id: friendshipId },
        });
    }
    static async getFriend(userId){
        const list = await prisma.friendship.findMany({
            where :{
                status : "ACCEPTED",
                OR: [ { requesterId:userId }, { addresseeId:userId } ] // tìm tất cả bạn bè của userId 
            },
            include :{
                requester : {select :{ id:true , username:true, avatar:true }},
                addressee : {select :{ id:true , username:true, avatar:true }}
            
        }
        
    });

        return list.map(item => {
        if (item.requesterId === userId) return item.addressee;
        
            return item.requester;
            
        });
    }
}
module .exports = FriendshipService;
