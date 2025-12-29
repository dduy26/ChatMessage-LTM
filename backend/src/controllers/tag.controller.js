const TagService = require("../services/tag.service");

class TagController {
    // 1. [CREATE] Tạo tag mới trong hệ thống
    static async createTag(req, res) {
        try {
            const { name, color } = req.body;
            if (!name) return res.status(400).json({ error: "Tên tag là bắt buộc" });
            
            const result = await TagService.createTag(req.body);
            res.status(201).json(result);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }

    // 2. [READ] Lấy toàn bộ danh sách các tag
    static async getAll(req, res) {
        try {
            const result = await TagService.getAll();
            res.status(200).json(result);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }

    // 3. [UPDATE] Cập nhật thông tin của một tag (dựa vào UUID)
    static async updateTag(req, res) {
        try {
            const { id } = req.params; // Lấy UUID từ URL
            const result = await TagService.updateTag(id, req.body);
            res.status(200).json(result);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }

    // 4. [DELETE] Xóa hoàn toàn một tag khỏi hệ thống
    static async deleteTag(req, res) {
        try {
            const { id } = req.params;
            await TagService.deleteTag(id);
            res.status(200).json({ message: "Đã xóa tag thành công" });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }

    // 5. [ASSIGN] Gắn thẻ cho một User
    
    static async assignTag(req, res) {
        try {
            
            const userId = req.user?.id || req.body.userId; 
            const { tagId } = req.body;

            if (!userId || !tagId) {
                return res.status(400).json({ error: "Thiếu userId hoặc tagId" });
            }

            const result = await TagService.assignToUser(userId, tagId);
            res.status(200).json(result);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }

    // 6. [REMOVE] Gỡ thẻ khỏi User
    static async removeTag(req, res) {
        try {
            const userId = req.user?.id || req.body.userId;
            const { tagId } = req.body;

            if (!userId || !tagId) {
                return res.status(400).json({ error: "Thiếu userId hoặc tagId" });
            }

            const result = await TagService.removeFromUser(userId, tagId);
            res.status(200).json(result);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
}

module.exports = TagController;