const prisma = require("../config/prisma");

class ConversationService {
    static create(data) {
        return prisma.conversation.create({ data });
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

    static getById(id) {
        return prisma.conversation.findUnique({
        where: { id },
        });
    }

    static update(id, data) {
        return prisma.conversation.update({
        where: { id },
        data,
        });
    }

    static delete(id) {
        return prisma.conversation.delete({
        where: { id },
        });
    }
}

module.exports = ConversationService;
