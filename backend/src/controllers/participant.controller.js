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

    // Rời nhóm (self leave) - có thể xóa lịch sử
    static async leaveGroup(req, res) {
        try {
            const conversationId = Number(req.params.conversationId);
            const userId = req.user?.userId || req.user?.id;
            const { deleteHistory } = req.body; // true/false

            if (!userId) {
                return res.status(401).json({ error: "Bạn cần đăng nhập để thực hiện thao tác này" });
            }

            // Kiểm tra conversation có phải là GROUP không
            const prisma = require("../config/prisma");
            const conversation = await prisma.conversation.findUnique({
                where: { id: conversationId },
                include: {
                    participants: {
                        include: {
                            user: {
                                select: { id: true, fullName: true, username: true }
                            }
                        }
                    }
                }
            });

            if (!conversation) {
                return res.status(404).json({ error: "Không tìm thấy cuộc trò chuyện" });
            }

            if (conversation.type !== "GROUP") {
                return res.status(400).json({ error: "Chỉ có thể rời nhóm, không thể rời cuộc trò chuyện cá nhân" });
            }

            // Lấy thông tin user đang rời nhóm
            const leavingUser = await prisma.user.findUnique({
                where: { id: userId },
                select: { id: true, fullName: true, username: true }
            });

            // Nếu muốn xóa lịch sử, gọi MessageService
            if (deleteHistory) {
                const MessageService = require("../services/message.service");
                await MessageService.deleteAllByConversation(conversationId, userId);
            }

            // Rời nhóm
            await ParticipantService.removeParticipant(userId, conversationId);

            // Tạo system message thông báo người dùng đã rời nhóm
            const MessageService = require("../services/message.service");
            const systemMessage = await MessageService.create({
                content: `"${leavingUser?.fullName || leavingUser?.username || 'Người dùng'}" đã rời khỏi nhóm.`,
                senderId: userId, // Dùng userId của người rời để hiển thị tên
                conversationId: conversationId,
                attachments: []
            });

            // Broadcast system message đến tất cả thành viên còn lại trong nhóm
            const io = req.app.get("io");
            if (io) {
                const roomName = `conversation_${conversationId}`;
                io.to(roomName).emit("new message", systemMessage);
            }
            
            res.json({ 
                message: deleteHistory 
                    ? "Đã rời nhóm và xóa lịch sử trò chuyện" 
                    : "Đã rời nhóm thành công",
                systemMessage: systemMessage
            });
        } catch (err) {
            console.error("Lỗi rời nhóm:", err);
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