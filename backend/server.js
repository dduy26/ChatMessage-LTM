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
        // --- GIỮ NGUYÊN LOGIC DEBUG TOKEN CỦA BẠN ---
        let token = socket.handshake.auth?.token || socket.handshake.query?.token;
        
        if (token && typeof token === 'string') {
            token = token.trim(); 
        }
        
        if(!token) {
            return next(new Error("Xác thực thất bại: Thiếu Token"));
        }

        const isBlacklisted = await prisma.blackListedToken.findUnique({
            where: { token: token }
        });

        if(isBlacklisted) {
            return next(new Error("Token đã bị vô hiệu hóa!"));
        }  
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Lấy thêm thông tin User từ DB để kiểm tra isVerified thực tế
        const userInDb = await prisma.user.findUnique({
            where: { id: Number(decoded.userId) }
        });

        if (!userInDb) return next(new Error("Người dùng không tồn tại"));

        socket.user = { ...decoded, isVerified: userInDb.isVerified }; 
        next();
    } catch(error) {
        if (error.name === 'JsonWebTokenError') return next(new Error("Token không hợp lệ"));
        if (error.name === 'TokenExpiredError') return next(new Error("Token đã hết hạn"));
        return next(new Error("Phiên đăng nhập không hợp lệ: " + error.message));
    }
});

io.on('connection', async (socket) => {
    try {
        const rawUserId = socket.user?.userId || socket.user?.id;
        const userId = Number(rawUserId);
        
        if (isNaN(userId)) {
            socket.disconnect();
            return;
        }

        socket.userId = userId;
        console.log(`User connected: ${userId} - Verified: ${socket.user.isVerified}`);

        await prisma.user.update({
            where: { id: userId },
            data: { 
                status: '#22c55e', // Trạng thái Online
                isOnline: true    
            }
        });
        
        // Gửi thông báo cho mọi người để cập nhật chấm xanh trên giao diện
        io.emit('user_status_change', { 
            userId, 
            status: '#22c55e', 
            isOnline: true,
            isVerified: socket.user.isVerified 
        });

    } catch (error) {
        console.error("Lỗi khi user kết nối:", error);
    }

    socket.on('disconnect', async () => {
        const userId = socket.userId;
        if (userId) {
            try {
                await prisma.user.update({
                    where: { id: userId },
                    data: { 
                        status: '#94a3b8', // Trạng thái Offline
                        isOnline: false,
                        lastSeen: new Date() 
                    }
                });

                // Thông báo mọi người user đã ngoại tuyến
                io.emit('user_status_change', { 
                    userId, 
                    status: '#94a3b8', 
                    isOnline: false 
                });
                
                console.log(`User ${userId} disconnected`);
            } catch (error) {
                console.error("Lỗi cập nhật status OFFLINE:", error);
            }
        }
    });
});

server.on('error', (error) => {
    console.error(' Server Error:', error.message);
});

server.listen(PORT, () => {
    console.log(` Backend running at http://localhost:${PORT}`);
});