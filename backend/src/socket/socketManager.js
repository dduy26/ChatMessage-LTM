const prisma = require("../config/prisma"); // Import Prisma để update trạng thái

module.exports = (io) => {
    io.on("connection", async (socket) => {
        
        try {
            // Lấy userId từ token (đã được middleware xác thực bên server.js)
            const rawUserId = socket.user?.userId || socket.user?.id;
            
            if (!rawUserId) {
                console.log(" Socket connected but no User ID found");
                socket.disconnect();
                return;
            }

            const userId = Number(rawUserId);
            socket.userId = userId; // Lưu userId vào session của socket để dùng khi disconnect

            console.log(`✅ Socket Connected: ${socket.id} (User ID: ${userId})`);

            // Cập nhật DB: User này đang ONLINE
            await prisma.user.update({
                where: { id: userId },
                data: { status: 'ONLINE' }
            });
            
            // Báo cho mọi người biết User này vừa Online (để cập nhật list friend)
            socket.broadcast.emit('user_online', userId);

        } catch (error) {
            console.error(" Connection Error:", error.message);
            socket.disconnect();
            return;
        }


        // 1. Setup Room cá nhân
        socket.on("setup", (userData) => {
            if (userData?.id) {
                socket.join(userData.id);
                socket.emit("connected");
            }
        });

        // 2. Tham gia vào Room Chat
        socket.on("join chat", (room) => {
            socket.join(room);
            console.log(`User joined Chat Room: ${room}`);
        });

        // 3. Xử lý tin nhắn mới
        socket.on("new message", (newMessageRecieved) => {
            var chat = newMessageRecieved.conversation;

            if (!chat.participants) return console.log(" Chat participants not defined");

            chat.participants.forEach((participant) => {
                // Không gửi lại cho chính người gửi
                if (participant.userId === newMessageRecieved.senderId) return;

                // Gửi tin nhắn đến Room cá nhân của từng người nhận
                socket.in(participant.userId).emit("message received", newMessageRecieved);
            });
        });

        // 4. Xử lý ngắt kết nối
        socket.on("disconnect", async () => {
            console.log(`🔌 User Disconnected: ${socket.userId || 'Unknown'}`);
            
            if (socket.userId) {
                try {
                    // Cập nhật DB: User OFFLINE và lưu thời gian
                    await prisma.user.update({
                        where: { id: socket.userId },
                        data: { 
                            status: 'OFFLINE',
                            lastSeen: new Date() 
                        }
                    });
                    // Báo cho mọi người biết
                    socket.broadcast.emit('user_offline', socket.userId);
                } catch (error) {
                    console.error(" Error updating offline status:", error);
                }
            }
        });
    });
};