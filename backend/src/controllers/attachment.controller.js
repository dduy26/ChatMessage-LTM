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
}

module.exports = AttachmentController;