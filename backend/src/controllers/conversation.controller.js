const ConversationService = require("../services/conversation.service");

class ConversationController {

    // 1. TẠO HỘI THOẠI (Sửa để tự lấy ID người tạo từ Token)
    static async create(req, res) {
        try {
            // Lấy ID mình từ Token (người gửi yêu cầu)
            const senderId = req.user.userId;
            // Lấy ID người muốn chat cùng từ Body
            const { userId } = req.body; 

            if (!userId) {
                return res.status(400).json({ error: "Thiếu userId người nhận (người muốn chat cùng)" });
            }

            // Gọi Service chuẩn (Logic check trùng hoặc tạo mới)
            const convo = await ConversationService.create(senderId, Number(userId));
            
            res.status(201).json(convo);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: err.message });
        }
    }

    // CREATE GROUP
    static async createGroup(req, res) {
        try {
            const ownerId = req.user?.userId || req.user?.id;
            const { title, memberIds } = req.body;

            if (!title) {
                return res.status(400).json({ error: "Vui lòng nhập tên nhóm" });
            }
            if (!memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
                return res.status(400).json({ error: "Vui lòng chọn thành viên cho nhóm" });
            }

            const group = await ConversationService.createGroup({
                title,
                memberIds,
                ownerId: Number(ownerId)
            });

            return res.status(201).json(group);
        } catch (error) {
            console.error("Lỗi tạo nhóm:", error);
            return res.status(400).json({ error: error.message || "Không thể tạo nhóm" });
        }
    }

    // READ: ALL 
    static async getAll(req,res) {
        try {
            const userId = req.user?.userId || req.user?.id;
            const convos = await ConversationService.getAll(Number(userId));
            res.json(convos);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    } 

    // 3. LẤY CHI TIẾT 1 HỘI THOẠI
    static async getById(req, res) {
        try {
            const id = Number(req.params.id);
            const convo = await ConversationService.getById(id);
            
            if (!convo) return res.status(404).json({ error: "Không tìm thấy hội thoại!" });
            
            // SỬA LỖI: Thêm dòng này để trả dữ liệu về
            res.json(convo); 
        } catch (err) {
            res.status(400).json({ error: err.message });
        }
    }

    // 4. CẬP NHẬT (Ví dụ đổi tên nhóm chat)
    static async update(req, res) {
        try {
            const id = Number(req.params.id);
            const convo = await ConversationService.update(id, req.body);
            res.json(convo);
        } catch (err) {
            res.status(400).json({ error: err.message });
        }
    }

    // 5. XÓA HỘI THOẠI
    static async remove(req, res) {
        try {
            const id = Number(req.params.id);
            await ConversationService.delete(id);
            res.json({ message: "Đã xóa hội thoại!" });
        } catch (err) {
            res.status(400).json({ error: err.message });
        }
    }
}

module.exports = ConversationController;