const prisma = require("../config/prisma");

class ConversationService {
    
    // 1. Logic tạo hội thoại thông minh
    // Kiểm tra nếu đã có chat 1-1 rồi thì trả về cái cũ, chưa có mới tạo cái mới
    static async create(senderId, receiverId) {
        // Tìm hội thoại cũ giữa 2 người này
        const existingConversation = await prisma.conversation.findFirst({
            where: {
                AND: [
                    { participants: { some: { userId: senderId } } },
                    { participants: { some: { userId: receiverId } } },
                    { isGroup: false } // Chỉ check chat 1-1
                ]
            },
            include: {
                participants: {
                    include: { user: { select: { id: true, username: true, fullName: true, avatar: true } } }
                }
            }
        });

        // Nếu đã có -> Trả về luôn
        if (existingConversation) {
            return existingConversation;
        }

        // Nếu chưa -> Tạo mới
        return await prisma.conversation.create({
            data: {
                // Tạo Conversation và tạo luôn 2 dòng Participants
                participants: {
                    create: [
                        { userId: senderId },
                        { userId: receiverId }
                    ]
                }
            },
            include: {
                participants: {
                    include: { user: { select: { id: true, username: true, fullName: true, avatar: true } } }
                }
            }
        });
    }

    // 2. Lấy danh sách hội thoại MÀ USER ĐANG THAM GIA (Thay cho getAll)
    static async getByUserId(userId) {
        return await prisma.conversation.findMany({
            where: {
                participants: {
                    some: { userId: Number(userId) }
                }
            },
            include: {
                // Lấy thông tin thành viên để hiện Avatar/Tên nhóm
                participants: {
                    include: { user: { select: { id: true, username: true, fullName: true, avatar: true } } }
                },
                // Lấy 1 tin nhắn cuối cùng để hiện preview (VD: "User A: Hello...")
                messages: {
                    take: 1,
                    orderBy: { createdAt: 'desc' }
                }
            },
            orderBy: { updatedAt: 'desc' } // Chat nào mới nhất lên đầu
        });
    }

    // 3. Lấy chi tiết 1 hội thoại (Kèm tin nhắn và thành viên)
    static async getById(id) {
        return await prisma.conversation.findUnique({
            where: { id },
            include: {
                participants: {
                    include: { user: { select: { id: true, username: true, fullName: true, avatar: true } } }
                }
            }
        });
    }

    // 4. Update (Đổi tên nhóm, ảnh nhóm...)
    static async update(id, data) {
        return await prisma.conversation.update({
            where: { id },
            data,
        });
    }

    // 5. Xóa hội thoại
    static async delete(id) {
        return await prisma.conversation.delete({
            where: { id },
        });
    }
}

module.exports = ConversationService;