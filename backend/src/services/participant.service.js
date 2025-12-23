const prisma = require("../config/prisma");

class ParticipantService {
    // Thêm thành viên vào cuộc hội thoại
    static async addParticipant(data) {
        const { userId, conversationId, role } = data;
        return prisma.participant.create({
            data: {userId: Number(userId), conversationId: Number(conversationId), role: role || "MEMBER",

            },
            include: {
                user: {
                    select: {
                        id: true, username: true, email: true
                    }
                }
            }
        });
    }
    // Lấy danh sách thành viên của một cuộc hội thoại
    static async    getByConversation(conversationId) {
        return prisma.participant.findMany ({
            where: {conversationId: Number(conversationId), },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        email: true,
                        phoneNumber: true
                    }
                }
            }
        });
    }
    // Kiểm tra xem User có phải thành viên của hội thoại không
    static async checkMembership(userId, conversationId) {
        return prisma.participant.findFirst({
            where: {
                userId: Number(userId),
                conversationId: Number(conversationId),
            }
        });
    }
    // Xóa thành viên khỏi cuộc hội thoại (Rời nhóm hoặc bị mời ra)
    static async removeParticipant(userId, conversationId) {
        return prisma.participant.deleteMany({
            where: {
                userId: Number(userId),
                conversationId: Number(conversationId),
            }
        });
    }

    // Cập nhật vai trò (Ví dụ: Chuyển lên Admin)
    static async updateRole(userId, conversationId, newRole) {
        return prisma.participant.updateMany({
            where: {
                userId: Number(userId),
                conversationId: Number(conversationId),
            },
            data: {
                role: newRole
            }
        });
    }
}
module.exports = ParticipantService;