const prisma = require("../config/prisma");

class FriendshipService {
    // gửi lời mời kết bạn
    static async sendFriendRequest(senderId, receiverId){
        if (senderId === receiverId){
            throw new Error(" không thể gửi lời mời kết bạn cho bản thân");
        }
        const existing = await prisma.friendship.findFirst({
        where: {
                OR: [
                    { requesterId: senderId, addresseeId: receiverId }, // Chiều đi
                    { requesterId: receiverId, addresseeId: senderId }  // Chiều về
                ]
            }
        });
        if (existing) {
            throw new Error("Lời mời kết bạn đã tồn tại hoặc hai người đã là bạn bè");
        }
        return prisma.friendship.create({
        data: {
            requesterId: senderId, // người gửi
            addresseeId: receiverId, // người nhận
            status: "PENDING", // trạng thái chờ xác nhận
        }
    });
    }
    static async acceptRequest(friendshipId){
        return prisma.friendship.update({
            where: { id: friendshipId }, // tìm lời mời kết bạn theo ID
            data: { status: "ACCEPTED" }, // cập nhật trạng thái thành bạn bè
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
