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
            const senderId = req.user?.userId || req.user?.id; 
            
            if (!senderId) {
                return res.status(401).json({ error: "Bạn cần đăng nhập để thực hiện thao tác này" });
            }

            const { email } = req.body; 

            if (!email || !email.trim()) {
                return res.status(400).json({ error: "Vui lòng nhập email" });
            }

            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email.trim())) {
                return res.status(400).json({ error: "Email không hợp lệ" });
            }

            // Gọi service xử lý tìm kiếm và tạo lời mời
            const result = await FriendshipService.sendRequestByEmail(
                parseInt(senderId),
                email.trim()
            );
            
            res.status(201).json({ 
                message: "Đã gửi lời mời kết bạn thành công!",
                data: result 
            });
        } catch (err) {
            console.error("Lỗi sendRequest:", err);
            res.status(400).json({ error: err.message || "Không thể gửi lời mời kết bạn" });
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
        try {
            const {id} = req.params;
            const userId = req.user?.userId || req.user?.id;
            
            if (!userId) {
                return res.status(401).json({ error: "Bạn cần đăng nhập để thực hiện thao tác này" });
            }

            if (!id) {
                return res.status(400).json({ error: "Thiếu ID lời mời kết bạn" });
            }

            // ID là UUID string, không cần parse
            const result = await FriendshipService.acceptRequest(id, parseInt(userId));
            res.status(200).json({message : "Đã trở thành bạn bè!", data : result});
        }catch (error){
            console.error("Lỗi acceptRequest:", error);
            res.status(400).json({ error: error.message || "Không thể chấp nhận lời mời kết bạn" });
        }
    }
    // delete
    static async removeFriend(req,res){
        try{
            const {id} = req.params;
            const userId = req.user?.userId || req.user?.id;
            
            if (!userId) {
                return res.status(401).json({ error: "Bạn cần đăng nhập để thực hiện thao tác này" });
            }

            if (!id) {
                return res.status(400).json({ error: "Thiếu ID lời mời kết bạn" });
            }

            // ID là UUID string, không cần parse
            await FriendshipService.remove(id, parseInt(userId));
            res.json({ message: "Đã xóa lời mời kết bạn."});
        } catch (error){
            console.error("Lỗi removeFriend:", error);
            res.status(400).json({ error: error.message || "Không thể xóa lời mời kết bạn" });
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
