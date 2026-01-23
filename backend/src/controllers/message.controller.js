const MessageService = require("../services/message.service");
const BlockListService = require("../services/blocklist.service");
const ConversationService = require("../services/conversation.service");

class MessageController {
    static async create(req, res) {
        try {
            const conversationId = Number(req.params.conversationId);
            // Với multer, content sẽ được parse từ req.body
            const content = req.body.content || "";
            const files = req.files || []; // lấy danh sách file đính kèm ở middleware nếu có

            let senderId = req.user ? req.user.userId : req.body.senderId;

            senderId = Number(senderId);

            if (!senderId || isNaN(senderId)) {
                return res.status(400).json({ 
                    error: "Thiếu ID người gửi (senderId). Vui lòng đăng nhập hoặc gửi kèm senderId trong body." 
                });
            }

            // Kiểm tra blocklist cho chat 1-1
            const conversation = await ConversationService.getById(conversationId);
            if (!conversation) {
                return res.status(404).json({ error: "Không tìm thấy cuộc trò chuyện" });
            }

            if (conversation.type === "DIRECT") {
                const otherParticipant = conversation.participants.find(
                    (p) => p.userId !== senderId
                );
                const receiverId = otherParticipant?.userId;

                if (receiverId) {
                    const isBlocked = await BlockListService.isBlocked(senderId, receiverId);
                    if (isBlocked) {
                        return res.status(403).json({
                            error: "Bạn hoặc người kia đã chặn nhau, không thể gửi tin nhắn.",
                        });
                    }
                }
            }

            // Log để debug
            console.log(`[Message] User ${senderId} gửi tin nhắn đến conversation ${conversationId}`);
            console.log(`[Message] Content: "${content}"`);
            console.log(`[Message] Files: ${files.length} file(s)`);
            
            // Log chi tiết file object để debug
            if (files.length > 0) {
                console.log(`[Message] File object structure:`, JSON.stringify(files[0], null, 2));
            }

            // Xử lý files từ Cloudinary: chuyển đổi sang format attachments
            // CloudinaryStorage trả về: path (URL), filename (public_id), originalname, mimetype, size
            const attachments = files.map((file, index) => {
                try {
                    // Cloudinary trả về URL trong file.path hoặc file.url
                    const fileUrl = file.path || file.url || file.secure_url;
                    // public_id từ filename
                    const publicId = file.filename || file.public_id;
                    // Tên file gốc
                    const fileName = file.originalname || file.filename || `file-${index}`;
                    // MIME type
                    const fileType = file.mimetype || file.resource_type || 'application/octet-stream';
                    // Kích thước file
                    const fileSize = file.size || file.bytes || null;

                    if (!fileUrl) {
                        throw new Error(`File ${index} không có URL: ${JSON.stringify(file)}`);
                    }

                    return {
                        fileUrl: fileUrl,
                        publicId: publicId,
                        fileName: fileName,
                        fileType: fileType,
                        fileSize: fileSize
                    };
                } catch (fileError) {
                    console.error(`[Message] Lỗi xử lý file ${index}:`, fileError);
                    throw new Error(`Lỗi xử lý file ${index}: ${fileError.message}`);
                }
            });

            // truyền object dữ liệu và mảng attachments vào Service
            const msg = await MessageService.create({
                content: content.trim() || "", // Trim và đảm bảo không null
                senderId: senderId,
                conversationId,
                attachments: attachments // Truyền attachments vào data
            });

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
            console.error("Error stack:", err.stack);
            // Trả về 500 cho lỗi server, 400 cho lỗi validation
            const statusCode = err.message.includes('validation') || err.message.includes('Thiếu') ? 400 : 500;
            res.status(statusCode).json({ 
                error: err.message || "Lỗi khi tạo tin nhắn",
                details: process.env.NODE_ENV === 'development' ? err.stack : undefined
            });
        }
    }

    static async getByConversation(req, res) {
        try {
            const conversationId = Number(req.params.conversationId);
            const userId = req.user?.userId || req.user?.id;
            
            // Lấy participantId của user hiện tại để filter messages đã bị xóa
            let participantId = null;
            if (userId) {
                const prisma = require("../config/prisma");
                const participant = await prisma.participant.findFirst({
                    where: {
                        userId: Number(userId),
                        conversationId: conversationId
                    }
                });
                participantId = participant?.id || null;
            }
            
            const msgs = await MessageService.getByConversation(conversationId, participantId);
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

    // Xóa tất cả lịch sử trò chuyện trong một conversation
    static async deleteConversationHistory(req, res) {
        try {
            const conversationId = Number(req.params.conversationId);
            const userId = req.user?.userId || req.user?.id;

            if (!userId) {
                return res.status(401).json({ error: "Bạn cần đăng nhập để thực hiện thao tác này" });
            }

            const result = await MessageService.deleteAllByConversation(conversationId, userId);
            res.json(result);
        } catch (err) {
            console.error("Lỗi xóa lịch sử trò chuyện:", err);
            res.status(400).json({ error: err.message });
        }
    }
}

module.exports = MessageController;