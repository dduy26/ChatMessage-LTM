const ParticipantService = require("../services/participant.service");

class ParticipantController {
    // Thêm thành viên vào nhóm
    static async create(req, res) {
        try {
            const { userId, conversationId, role } = req.body;
            
            // Kiểm tra xem đã là thành viên chưa
            const isMember = await ParticipantService.checkMembership(userId, conversationId);
            if (isMember) {
                return res.status(400).json({ error: "Người dùng này đã có trong cuộc hội thoại!" });
            }

            const participant = await ParticipantService.addParticipant({ userId, conversationId, role });
            res.status(201).json(participant);
        } catch (err) {
            res.status(400).json({ error: err.message });
        }
    }

    // Lấy danh sách thành viên của một hội thoại
    static async getByConversation(req, res) {
        try {
            const { conversationId } = req.params; 
            const participants = await ParticipantService.getByConversation(conversationId);
            
            if (!participants || participants.length === 0) {
                return res.status(404).json({ message: "Không tìm thấy thành viên nào cho hội thoại này!" });
            }
            
            res.json(participants);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    // Xóa thành viên (hoặc rời nhóm)
    static async remove(req, res) {
        try {
            const { conversationId, userId } = req.params;
            await ParticipantService.removeParticipant(userId, conversationId);
            res.json({ message: "Đã xóa thành viên khỏi cuộc hội thoại!" });
        } catch (err) {
            res.status(400).json({ error: err.message });
        }
    }

    // Cập nhật vai trò (Admin/Member)
    static async updateRole(req, res) {
        try {
            const { conversationId, userId } = req.params;
            const { role } = req.body;
            await ParticipantService.updateRole(userId, conversationId, role);
            res.json({ message: "Đã cập nhật vai trò thành công!" });
        } catch (err) {
            res.status(400).json({ error: err.message });
        }
    }
}
module.exports = ParticipantController;