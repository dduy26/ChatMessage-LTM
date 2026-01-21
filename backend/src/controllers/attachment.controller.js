const AttachmentService = require("../services/attachment.service");

class AttachmentController {
    // CREATE: Thường được gọi nội bộ hoặc sau khi upload Cloudinary thành công
    static async create(req, res) {
        try {
            const attachment = await AttachmentService.create(req.body);
            res.status(201).json(attachment);
        } catch (err) {
            res.status(400).json({ error: err.message });
        }
    }

    // READ: Lấy đính kèm theo tin nhắn
    static async getByMessage(req, res) {
        try {
            const messageId = Number(req.params.messageId);
            const attachments = await AttachmentService.getByMessage(messageId);
            res.json(attachments);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    // DELETE
    static async remove(req, res) {
        try {
            const id = Number(req.params.id);
            await AttachmentService.delete(id);
            res.json({ message: "Đã xóa file đính kèm thành công!" });
        } catch (err) {
            res.status(400).json({ error: err.message });
        }
    }

    // Lấy tất cả attachments từ conversation
    static async getByConversation(req, res) {
        try {
            const conversationId = Number(req.params.conversationId);
            const attachments = await AttachmentService.getByConversation(conversationId);
            res.json(attachments);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    // Lấy chỉ ảnh từ conversation
    static async getImagesByConversation(req, res) {
        try {
            const conversationId = Number(req.params.conversationId);
            const images = await AttachmentService.getImagesByConversation(conversationId);
            res.json(images);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    // Lấy chỉ file từ conversation
    static async getFilesByConversation(req, res) {
        try {
            const conversationId = Number(req.params.conversationId);
            const files = await AttachmentService.getFilesByConversation(conversationId);
            res.json(files);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
}

module.exports = AttachmentController;