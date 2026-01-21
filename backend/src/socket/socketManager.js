const prisma = require("../config/prisma");

// Map để lưu trữ socket connections theo userId
const userSockets = new Map();

module.exports = (io) => {
    io.on("connection", async (socket) => {
        try {
            const rawUserId = socket.user?.userId || socket.user?.id;
            const userId = Number(rawUserId);

            if (!userId || isNaN(userId)) {
                console.log("Socket connected but no valid User ID found");
                return socket.disconnect();
            }

            socket.userId = userId;
            console.log(`Socket Connected: ${socket.id} (User ID: ${userId})`);

            // Lưu socket vào map theo userId (một user có thể có nhiều socket nếu mở nhiều tab)
            if (!userSockets.has(userId)) {
                userSockets.set(userId, []);
            }
            userSockets.get(userId).push(socket);

            // Cập nhật isOnline
            await prisma.user.update({
                where: { id: userId },
                data: { isOnline: true }
            });
            socket.broadcast.emit('user_status_change', { userId, isOnline: true });

        } catch (error) {
            console.error("Connection Error:", error.message);
        }

        // 1. Tham gia vào Room
        socket.on("join_conversation", (conversationId) => {
            const roomName = `conversation_${conversationId}`;
            socket.join(roomName);
            console.log(`User ${socket.userId} joined Room: ${roomName}`);
        });

        // 2. Rời phòng chat
        socket.on("leave_conversation", (conversationId) => {
            socket.leave(`conversation_${conversationId}`);
        });

        // 3. Lắng nghe tin nhắn mới từ phía client
        socket.on("send_message", (newMessage) => {
            const roomName = `conversation_${newMessage.conversationId}`;
            // Gửi tin nhắn đến mọi người trong phòng trừ người gửi
            socket.to(roomName).emit("new message", newMessage);
        });

        socket.on("disconnect", async () => {
            if (socket.userId) {
                console.log(` User Disconnected: ${socket.userId}`);
                try {
                    // Xóa socket khỏi map
                    const userSocketList = userSockets.get(socket.userId);
                    if (userSocketList) {
                        const index = userSocketList.indexOf(socket);
                        if (index > -1) {
                            userSocketList.splice(index, 1);
                        }
                        // Nếu không còn socket nào, xóa key khỏi map
                        if (userSocketList.length === 0) {
                            userSockets.delete(socket.userId);
                        }
                    }

                    // Cập nhật isOnline: false và lưu lastSeen (chỉ khi không còn socket nào)
                    if (!userSockets.has(socket.userId)) {
                        await prisma.user.update({
                            where: { id: socket.userId },
                            data: { 
                                isOnline: false, 
                                lastSeen: new Date() 
                            }
                        });
                        
                        socket.broadcast.emit('user_status_change', { 
                            userId: socket.userId, 
                            isOnline: false 
                        });
                    }
                } catch (error) {
                    console.error(" Error updating offline status:", error);
                }
            }
        });
    });

    // Export function để emit đến user cụ thể
    io.emitToUser = (userId, event, data) => {
        const sockets = userSockets.get(Number(userId));
        if (sockets && sockets.length > 0) {
            sockets.forEach(socket => {
                socket.emit(event, data);
            });
        }
    };

    return io;
};