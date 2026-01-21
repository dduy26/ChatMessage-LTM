const ConversationService = require("../services/conversation.service");

class ConversationController {
    static async createDirect(req, res) {
        try {
            const senderId = req.user.userId; // Lấy từ authMiddleware
            const { receiverId } = req.body;

            if (!receiverId) return res.status(400).json({ error: "Missing receiverId" });

            const conversation = await ConversationService.createDirect(senderId, receiverId);
            res.status(201).json(conversation);
        } catch (err) {
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
        static async getAll(req, res) {
            try {
                // 1. Lấy ID thô từ middleware
                const rawUserId = req.user?.userId || req.user?.id;
                
                // 2. Ép kiểu sang số
                const userId = Number(rawUserId);

                // 3. Kiểm tra tính hợp lệ của ID
                if (!userId || isNaN(userId)) {
                    return res.status(401).json({ error: "Xác thực người dùng thất bại hoặc ID không hợp lệ" });
                }

                // 4. Gọi Service với ID đã được làm sạch
                const convos = await ConversationService.getAll(userId);
                res.json(convos);
            } catch (err) {
                console.error("Lỗi Controller getAll:", err);
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