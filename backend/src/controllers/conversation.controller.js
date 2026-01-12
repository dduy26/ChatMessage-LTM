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

    // 2. LẤY DANH SÁCH CHAT CỦA MÌNH (Không lấy hết database nữa!)
    static async getAll(req, res) {
        try {
            // Chỉ lấy những hội thoại mà User này có tham gia
            const userId = req.user.userId;
            const convos = await ConversationService.getByUserId(userId);
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