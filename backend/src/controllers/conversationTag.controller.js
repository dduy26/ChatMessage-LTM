const ConversationTagService = require("../services/conversationTag.service");

class ConversationTagController {
    // Gắn tag
    static async assign(req, res) {
        try {
            const { conversationId } = req.params;
            const { tagId } = req.body;
            const result = await ConversationTagService.assignTag(conversationId, tagId);
            res.status(201).json(result);
        } catch (err) {
            res.status(400).json({ error: "Không thể gắn tag. Có thể tag đã tồn tại hoặc ID sai." });
        }
    }

    // Lấy danh sách tag của 1 group
    static async getTags(req, res) {
        try {
            const { conversationId } = req.params;
            const tags = await ConversationTagService.getTagsByConversation(conversationId);
            res.json(tags);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    // Gỡ tag
    static async remove(req, res) {
        try {
            const { conversationId, tagId } = req.params;
            await ConversationTagService.removeTag(conversationId, tagId);
            res.json({ message: "Đã gỡ tag thành công" });
        } catch (err) {
            res.status(400).json({ error: "Không tìm thấy liên kết để xóa" });
        }
    }
}

module.exports = ConversationTagController;