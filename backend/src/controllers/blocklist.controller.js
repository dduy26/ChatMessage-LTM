const BlockListService = require("../services/blocklist.service");

class BlockListController {
    static async block(req, res) {
        try {
            const { blockerId, blockedId } = req.body;
            const result = await BlockListService.blockUser(blockerId, blockedId);
            res.status(201).json({ message: "Đã chặn người dùng", result });
        } catch (err) {
            res.status(400).json({ error: err.message });
        }
    }

    static async unblock(req, res) {
        try {
            const { blockerId, blockedId } = req.body;
            await BlockListService.unblockUser(blockerId, blockedId);
            res.json({ message: "Đã bỏ chặn thành công" });
        } catch (err) {
            res.status(400).json({ error: err.message });
        }
    }

    static async getMyList(req, res) {
        try {
            const blockerId = Number(req.params.userId);
            const list = await BlockListService.getMyBlockList(blockerId);
            res.json(list);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
}

module.exports = BlockListController;