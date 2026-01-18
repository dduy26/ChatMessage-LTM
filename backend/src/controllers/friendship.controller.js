const FriendshipService = require("../services/friendship.service");

class FriendshipController{
    static async getPendingRequests(req, res) {
        try {
            const userId = req.user.userId || req.user.id;
            const requests = await FriendshipService.getPendingRequests(userId);
            return res.status(200).json(requests);
        } catch(error) {
            return res.status(500).json({ error: error.message});
        }
    }

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
            const userId = req.user.userId || req.user.id;
            const friends = await FriendshipService.getFriend(parseInt(userId));
            res.json(friends);
        } catch (error){
            res.status(500).json({ error: error.message });//500 lỗi server k mong muốn
        }
    }
    // update
    static async acceptRequest (req,res){
        try {// req.params: Lấy tham số trên URL.
            const {id} = req.params;
            const result = await FriendshipService.acceptRequest(parseInt(id));
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

    // Tìm kiếm người dùng theo email
    static async searchUserByEmail(req, res) {
        try {
            const { email } = req.query;
            if (!email) {
                return res.status(400).json({ error: "Vui lòng nhập email" });
            }

            const user = await FriendshipService.searchUserByEmail(email);
            if (!user) {
                return res.status(404).json({ error: "Không tìm thấy người dùng với email này" });
            }

            return res.status(200).json(user);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }
}
module.exports = FriendshipController;
