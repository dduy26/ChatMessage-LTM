    const TagService = require("../services/tag.service");

    class TagController {

    // Tạo thẻ mới
    static async createTag(req, res) {
        try {
        // req.body = { name: "VIP", color: "#FFD700" }
        const tag = await TagService.create(req.body);
        res.status(201).json(tag);
        } catch (error) {
        res.status(400).json({ error: error.message });
        }
    }

    // Lấy danh sách thẻ
    static async getAllTags(req, res) {
        try {
        const tags = await TagService.getAll();
        res.json(tags);
        } catch (error) {
        res.status(500).json({ error: error.message });
        }
    }

    // Gán thẻ cho chính mình (hoặc cho user khác nếu có quyền)
    static async assignTag(req, res) {
        try {
        const userId = req.user.id; // Lấy ID của người đang đăng nhập
        const { tagId } = req.body; // Lấy ID của thẻ muốn gắn

        // Nhớ parseInt cho userId vì User ID là số
        const result = await TagService.assignTagToUser(parseInt(userId), tagId);
        res.json({ message: "Đã gắn thẻ thành công", user: result });
        } catch (error) {
        res.status(400).json({ error: error.message });
        }
    }

    // Gỡ thẻ
    static async removeTag(req, res) {
        try {
        const userId = req.user.id;
        const { tagId } = req.params; // Lấy tagId từ URL

        const result = await TagService.removeTagFromUser(parseInt(userId), tagId);
        res.json({ message: "Đã gỡ thẻ", user: result });
        } catch (error) {
        res.status(400).json({ error: error.message });
        }
    }
    }

    module.exports = TagController;