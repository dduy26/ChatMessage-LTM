const prisma = require("../config/prisma");

class ConversationService {
    static create(data) {
        return prisma.conversation.create({ data });
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
                // Tìm participant khác (không phải user hiện tại)
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
