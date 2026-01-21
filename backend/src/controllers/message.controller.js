const MessageService = require("../services/message.service");

class MessageController {
    static async create(req, res) {
        try {
            const conversationId = Number(req.params.conversationId);
            const { content } = req.body;
            const files = req.files || []; // lấy danh sách file đính kèm ở middleware nếu có

            let senderId = req.user ? req.user.userId : req.body.senderId;


            senderId = Number(senderId);

            if (!senderId || isNaN(senderId)) {
                return res.status(400).json({ 
                    error: "Thiếu ID người gửi (senderId). Vui lòng đăng nhập hoặc gửi kèm senderId trong body." 
                });
            }
            // truyền object dữ liệu và mảng files vào Service
            const msg = await MessageService.create({
                content: content || "",
                senderId: senderId,
                conversationId,
            },files);

            const io = req.app.get("io");

            if (io) {
                // Gửi vào room riêng của cuộc hội thoại này
                io.to(`conversation_${conversationId}`).emit("new message", msg);
                
                // Log có thêm thông tin về tệp đính kèm
                const fileCount = msg.attachments ? msg.attachments.length : 0;
                console.log(`Socket: [User ${senderId}] gửi ${fileCount} tệp vào phòng ${conversationId}`);
            }

            res.status(201).json(msg);
        } catch (err) {
            console.error("Lỗi Controller create:", err);
            res.status(400).json({ error: err.message });
        }
    }

    static async getByConversation(req, res) {
        try {
            const conversationId = Number(req.params.conversationId);
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