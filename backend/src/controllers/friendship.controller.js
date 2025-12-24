const FriendshipService = require("../services/friendship.service");

class FriendshipController{
    //create 
    static async sendRequest(req,res){
        try{
            const senderId = req.user.id; // chưa đăng nhập thì bị lỗi 

            const receiverId = req.body;
            const result = await FriendshipService.sendRequest(
                parseInt(senderId),
                parseInt(receiverId)
            );
            res.status(201).json(result);//nhìn 201 fe sẽ biết tạo thành công 
        }catch (err){
            res.status(400).json({ error: err.message }); // lỗi 400 nếu client gửi sai
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
}
module.exports = FriendshipController;
