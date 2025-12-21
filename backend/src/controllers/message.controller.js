const MessageService = require("../services/message.service");

class MessageController {
    static async create(req, res) {
        try {
            const conversationId = Number(req.params.id || req.params.conversationId);
            const { content, senderId } = req.body;
            const msg = await MessageService.create({
                content,
                senderId: Number(senderId),
                conversationId,
            });
            res.status(201).json(msg);
        } catch (err) {
            res.status(400).json({ error: err.message });
        }
    }

    static async getByConversation(req, res) {
        try {
            const conversationId = Number(req.params.id || req.params.conversationId);
            const msgs = await MessageService.getByConversation(conversationId);
            res.json(msgs);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    static async getById(req, res) {
        try {
            const id = Number(req.params.messageId);
            const msg = await MessageService.getById(id);
            if (!msg) return res.status(404).json({ error: "Không tìm thấy tin nhắn" });
            res.json(msg);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    static async update(req, res) {
        try {
            const id = Number(req.params.messageId);
            const msg = await MessageService.update(id, req.body);
            res.json(msg);
        } catch (err) {
            res.status(400).json({ error: err.message });
        }
    }

    static async remove(req, res) {
        try {
            const id = Number(req.params.messageId);
            await MessageService.delete(id);
            res.json({ message: "Đã xóa tin nhắn!" });
        } catch (err) {
            res.status(400).json({ error: err.message });
        }
    }
}

module.exports = MessageController;