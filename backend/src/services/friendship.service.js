const prisma = require("../config/prisma");

class FriendshipService {
    // 1. GỬI LỜI MỜI QUA EMAIL 
    static async sendRequestByEmail(senderId, email) {
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

        return prisma.friendship.create({
            data: {
                requesterId: senderId,
                addresseeId: receiver.id,
                status: "PENDING",
            }
        });
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
                        select: { 
                            id: true,
                            //username: true,
                            fullName: true, 
                            email: true, 
                            avatar: true 
                        }
                    }
                }
        });
    }

    static async acceptRequest(friendshipId){
        return prisma.friendship.update({
            where: { id: friendshipId }, 
            data: { status: "ACCEPTED" }, 
        });

    }
    static async remove(friendshipId){
        return prisma.friendship.delete({
            where: { id: friendshipId }, // tìm lời mời kết bạn theo ID
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
