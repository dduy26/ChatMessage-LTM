    const FriendshipService = require("../services/friendship.service");

    class FriendshipController {
    // 1. Gửi lời mời kết bạn
        static async sendRequest(req, res) {
        try {
        const requesterId = req.user.id; // Lấy từ Token (User đang đăng nhập)
        const { targetUserId } = req.body; // Lấy ID người muốn kết bạn

        if (!targetUserId) {
            return res.status(400).json({ error: "Thiếu targetUserId" });
        }

        // Ép kiểu User ID sang số nguyên
        const result = await FriendshipService.sendRequest(
            parseInt(requesterId),
            parseInt(targetUserId)
        );
        
        res.status(201).json(result);
        } catch (error) {
        res.status(400).json({ error: error.message });
        }
    }

    // 2. Chấp nhận lời mời
    static async acceptRequest(req, res) {
        try {
        const { id } = req.params; // Đây là Friendship ID (UUID string) -> Giữ nguyên
        const userId = req.user.id; // User ID (Int) -> Dùng để check quyền (nếu cần kỹ hơn)

        // Service của bạn đang nhận vào ID của friendship
        const result = await FriendshipService.acceptRequest(id);
        
        res.json({ message: "Đã trở thành bạn bè!", data: result });
        } catch (error) {
        res.status(400).json({ error: error.message });
        }
    }

    // 3. Hủy kết bạn / Từ chối / Xóa lời mời
    static async removeFriendship(req, res) {
        try {
        const { id } = req.params; // Friendship ID (UUID string)
        await FriendshipService.remove(id);
        res.json({ message: "Đã xóa quan hệ bạn bè/lời mời" });
        } catch (error) {
        res.status(400).json({ error: error.message });
        }
    }

    // 4. Lấy danh sách bạn bè
    static async getFriends(req, res) {
        try {
        const userId = req.user.id;
        const friends = await FriendshipService.getFriends(parseInt(userId));
        res.json(friends);
        } catch (error) {
        res.status(500).json({ error: error.message });
        }
    }

    // 5. Lấy danh sách lời mời đang chờ (Để hiện thông báo)
    static async getPending(req, res) {
        try {
        const userId = req.user.id;
        const requests = await FriendshipService.getPendingRequests(parseInt(userId));
        res.json(requests);
        } catch (error) {
        res.status(500).json({ error: error.message });
        }
    }
    }

    module.exports = FriendshipController;