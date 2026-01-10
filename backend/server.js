require('dotenv').config();
const app = require('./src/app');
const http = require('http'); 
const { Server } = require('socket.io');
const prisma = require('./src/config/prisma');
const jwt = require('jsonwebtoken');

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173", 
        methods: ["GET", "POST"],
        credentials: true 
    }
});

io.use(async(socket, next)=> {
    try {
        console.log("=== DEBUG SOCKET.IO AUTH ===");
        console.log("socket.handshake.auth:", socket.handshake.auth);
        console.log("socket.handshake.query:", socket.handshake.query);
        
        let token = socket.handshake.auth?.token || socket.handshake.query?.token;
        
        if (token && typeof token === 'string') {
            token = token.trim(); 
        }
        
        console.log("Token nhận được:", token ? token.substring(0, 50) + "..." : "KHÔNG CÓ");
        
        if(!token) {
            console.error(" Không tìm thấy token trong handshake");
            return next(new Error("Xác thực thất bại: Thiếu Token"));
        }

        const isBlacklisted = await prisma.blackListedToken.findUnique({
            where: { token: token }
        });

        console.log("Token trong Blacklist?:", isBlacklisted ? "CÓ" : "KHÔNG");

        if(isBlacklisted) {
            console.error("Token đã bị blacklist");
            return next(new Error("Token đã bị vô hiệu hóa!"));
        }  
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log("Token hợp lệ, userId:", decoded.userId);
        
        socket.user = decoded;
        next();
    } catch(error) {
        console.error("Lỗi xác thực Socket.IO:", error.message);
        console.error("Error stack:", error.stack);
        
        if (error.name === 'JsonWebTokenError') {
            return next(new Error("Token không hợp lệ"));
        } else if (error.name === 'TokenExpiredError') {
            return next(new Error("Token đã hết hạn"));
        }
        
        return next(new Error("Phiên đăng nhập không hợp lệ: " + error.message));
    }
});

io.on('connection', async (socket) => {
    try {
        // Lấy userId từ token đã decode (phải ép kiểu Int nếu DB dùng Int)
        const rawUserId = socket.user?.userId || socket.user?.id;
        
        if (!rawUserId) {
            console.error("Socket không có userId trong user object:", socket.user);
            socket.disconnect();
            return;
        }

        const userId = Number(rawUserId);
        
        if (isNaN(userId) || userId <= 0 || !Number.isInteger(userId)) {
            console.error("userId không hợp lệ:", rawUserId, "->", userId);
            socket.disconnect();
            return;
        }

        console.log(`User connected: ${userId} (email: ${socket.user.email || 'N/A'})`);
        socket.userId = userId; // Lưu userId vào socket để dùng sau

        // Cập nhật trạng thái ONLINE khi kết nối thành công
        await prisma.user.update({
            where: { id: userId },
            data: { status: 'ONLINE' }
        });
        
        socket.broadcast.emit('user_online', userId);

    } catch (error) {
        console.error("Lỗi khi user kết nối:", error);
        socket.disconnect();
    }

    socket.on('disconnect', async () => {
        const userId = socket.userId;
        console.log(`User ${userId || 'unknown'} disconnected`);
        
        if (userId) {
            try {
                await prisma.user.update({
                    where: { id: userId },
                    data: { 
                        status: 'OFFLINE',
                        lastSeen: new Date() 
                    }
                });
                socket.broadcast.emit('user_offline', userId);
            } catch (error) {
                console.error("Lỗi cập nhật status OFFLINE:", error);
            }
        }
    });
});

// Lắng nghe lỗi server để tránh crash
server.on('error', (error) => {
    console.error(' Server Error:', error.message);
});

server.listen(PORT, () => {
    console.log(` Backend running at http://localhost:${PORT}`);
});