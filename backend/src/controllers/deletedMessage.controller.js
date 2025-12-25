const DeletedMessageService = require("../services/deletedMessage.service");

class DeletedMessageController {
    static async deleteForMe(req, res) {
        try {
            const { messageId } = req.params;
            const { participantId } = req.body;
            
            const result = await DeletedMessageService.create(messageId, participantId);
            res.status(201).json({ message: "Tin nhắn đã được ẩn phía bạn", result });
        } catch (err) {
            res.status(400).json({ error: "Tin nhắn đã xóa hoặc thông tin không hợp lệ" });
        }
    }

    static async undoDeleteForMe(req, res) {
        try {
            const { messageId } = req.params;
            const { participantId } = req.body;
            
            await DeletedMessageService.undoDelete(messageId, participantId);
            res.json({ message: "Đã khôi phục tin nhắn hiển thị" });
        } catch (err) {
            res.status(400).json({ error: err.message });
        }
    }
}

module.exports = DeletedMessageController;