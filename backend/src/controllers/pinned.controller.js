const PinnedService = require("../services/pinned.service");

class PinnedController {
    // Xử lý ghim/bỏ ghim
    static async togglePin(req, res) {
        try {
            const { userId, conversationId } = req.body;
            if (!userId || !conversationId) {
                return res.status(400).json({ error: "Thiếu userId hoặc conversationId" });
            }
            const result = await PinnedService.togglePin(userId, conversationId);
            res.status(200).json({
                message: result.id ? "Đã ghim hội thoại" : "Đã bỏ ghim hội thoại",
                data: result
            });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }

    // Lấy danh sách
    static async getList(req, res) {
        try {
            const userId = req.query.userId || req.body.userId;
            if (!userId) return res.status(400).json({ error: "Thiếu userId" });
            
            const result = await PinnedService.getPinnedByUserId(userId);
            res.status(200).json(result);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }

    // Xóa tất cả ghim
    static async clearPins(req, res) {
        try {
            const { userId } = req.body;
            await PinnedService.clearAllPins(userId);
            res.status(200).json({ message: "Đã xóa toàn bộ danh sách ghim" });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
}

module.exports = PinnedController;