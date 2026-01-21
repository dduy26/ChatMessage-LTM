const prisma = require("../config/prisma");

class ConversationService {
    
    // 1. Logic tạo hội thoại thông minh
    // Kiểm tra nếu đã có chat 1-1 rồi thì trả về cái cũ, chưa có mới tạo cái mới
static async create(senderId, receiverId) {
    // 1. Tìm hội thoại 1-1 đã tồn tại giữa 2 người
    const existingConversation = await prisma.conversation.findFirst({
        where: {
            type: "DIRECT",
            AND: [
                { participants: { some: { userId: Number(senderId) } } },
                { participants: { some: { userId: Number(receiverId) } } }
            ]
        },
        include: {
            participants: {
                include: { user: { select: { id: true, username: true, fullName: true, avatar: true, isOnline: true } } }
            }
        }
    });

    // 2. Nếu đã có rồi, trả về luôn cái cũ
    if (existingConversation) return existingConversation;

    // 3. Nếu chưa có, dùng Transaction để tạo mới hoàn toàn
    return await prisma.$transaction(async (tx) => {
        // Tạo cuộc hội thoại mới
        const newConversation = await tx.conversation.create({
            data: { type: "DIRECT" }
        });

        // Thêm đồng thời cả 2 người vào bảng Participant
        await tx.participant.createMany({
            data: [
                { userId: Number(senderId), conversationId: newConversation.id, role: "MEMBER" },
                { userId: Number(receiverId), conversationId: newConversation.id, role: "MEMBER" }
            ]
        });

        // Trả về dữ liệu đầy đủ kèm thông tin User để FE hiển thị ngay
        return await tx.conversation.findUnique({
            where: { id: newConversation.id },
            include: {
                participants: {
                    include: { user: { select: { id: true, username: true, fullName: true, avatar: true, isOnline: true } } }
                }
            }
        });
    });
}
    static async createGroup({ title, memberIds, ownerId }) {
        // Tạo cuộc trò chuyện nhóm
        const conversation = await prisma.conversation.create({
            data: {
                type: "GROUP",
                title: title || "Nhóm mới"
            }
        });

        // Thêm owner và các thành viên được chọn vào nhóm
        const participantIds = Array.from(new Set([ownerId, ...memberIds]));

        await prisma.participant.createMany({
            data: participantIds.map(id => ({
                userId: Number(id),
                conversationId: conversation.id,
                role: id === ownerId ? "ADMIN" : "MEMBER"
            }))
        });

        // Lấy lại conversation kèm participants để trả về cho FE
        const fullConversation = await prisma.conversation.findUnique({
            where: { id: conversation.id },
            include: {
                participants: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                username: true,
                                fullName: true,
                                avatar: true,
                                isOnline: true
                            }
                        }
                    }
                }
            }
        });

        return fullConversation;
    }

    static getAll(userId) {
        return prisma.conversation.findMany({
            where: {
                participants: {
                    some: {
                        userId: userId
                    }
                }
            },
            include: {
                participants: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                username: true,
                                fullName: true,
                                avatar: true,
                                isOnline: true
                            }
                        }
                    }
                },
                messages: {
                    take: 1,
                    orderBy: { createdAt: "desc" },
                    include: {
                        sender: {
                            select: {
                                id: true,
                                username: true,
                                fullName: true,
                                avatar: true,
                                isOnline: true
                            }
                        }
                    }
                }
            },
            orderBy: { createdAt: "desc" },
        }).then(conversations => {
            // Transform conversations để dễ sử dụng ở frontend
            return conversations.map(conv => {
                if (conv.type === "GROUP") {
                    return {
                        id: conv.id,
                        type: conv.type,
                        title: conv.title || "Nhóm",
                        avatar: null,
                        participantId: null,
                        isOnline: false,
                        participants: conv.participants.map(p => ({
                            id: p.user.id,
                            username: p.user.username,
                            fullName: p.user.fullName,
                            avatar: p.user.avatar,
                            isOnline: p.user.isOnline
                        })),
                        createdAt: conv.createdAt,
                        lastMessage: conv.messages[0] || null
                    };
                }

                // DIRECT conversation
                const otherParticipant = conv.participants.find(p => p.userId !== userId);
                const otherUser = otherParticipant?.user;
                
                return {
                    id: conv.id,
                    type: conv.type,
                    title: conv.title || otherUser?.fullName || otherUser?.username || "Người dùng",
                    avatar: otherUser?.avatar,
                    participantId: otherUser?.id,
                    isOnline: otherUser?.isOnline || false,
                    createdAt: conv.createdAt,
                    lastMessage: conv.messages[0] || null
                };
            });
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