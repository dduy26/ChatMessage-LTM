const FriendshipService = require("../services/friendship.service");

class FriendshipController{
    //create 
    static async sendRequest(req, res) {
        try {
            const senderId = req.user.userId || req.user.id; 
            const { email } = req.body; 

            if (!email) return res.status(400).json({ error: "Vui lòng nhập email" });

            // Gọi service xử lý tìm kiếm và tạo lời mời
            const result = await FriendshipService.sendRequestByEmail(
                parseInt(senderId),
                email
            );
            
            res.status(201).json(result);
        } catch (err) {
            res.status(400).json({ error: err.message });
        }
    }
    // read
    static async getFriends(req,res){
        try {
            const userId= req.user.id;
            const friends = await FriendshipService.getFriend(parseInt (userId));
            res.json(friends);
        } catch (error){
            res.status(500).json({ error: error.message });//500 lỗi server k mong muốn
        }
    }
    // update
    static async acceptRequest (req,res){
        try {// req.params: Lấy tham số trên URL.
            const {id} = req.params;
            const result = await FriendshipService.acceptRequest(id);
            res.status(200).json({message : " Đã trở thành bạn bè .", data : result});
        }catch (error){
            res.status(400).json({ error: error.message });
        }
    }
    // delete
    static async removeFriend(req,res){
        try{
            const {id} =req.params;
            await FriendshipService.remove(parseInt(id));
            res.json({ message: "Đã xóa bạn bè."});
        } catch (error){
            res.status(400).json({ error: error.message });
        }
    }

    static async sendRequestByEmail(senderId, email) {
        // 1. Tìm người dùng bằng email
        const receiver = await prisma.user.findUnique({ where: { email } });

        if (!receiver) throw new Error("Không tìm thấy người dùng với email này");

        if (receiver.id === senderId) throw new Error("Bạn không thể kết bạn với chính mình");

        // 2. Kiểm tra xem đã gửi lời mời chưa
        const existing = await prisma.friendship.findFirst({
            where: {
                OR: [
                    { userId: senderId, friendId: receiver.id },
                    { userId: receiver.id, friendId: senderId }
                ]
            }
        });

        if (existing) throw new Error("Yêu cầu đã tồn tại hoặc đã là bạn bè");

        // 3. Tạo lời mời
        return await prisma.friendship.create({
            data: {
                userId: senderId,
                friendId: receiver.id,
                status: 'PENDING'
            }
        });
    }
}
module.exports = FriendshipController;
