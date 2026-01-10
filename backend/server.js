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
        const token = socket.handshake.auth.token || socket.handshake.query.token;
        if(!token) {
            return next(new Error("Xác thực thất bại: Thiếu Token"));
        }

        const isBlacklisted = await prisma.blackListedToken.findUnique({
            where: { token: token }
        });

        //Kiểm tra token đã 401 
        if(isBlacklisted) {
            return next(new Error("Token đã bị vô hiệu hóa!"));
        }  
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.user = decoded;
        next();
    } catch(error) {
        next(new Error("Phiên đăng nhập không hợp lệ"));
    }
});

io.on('connection', async (socket) => {
    // Lấy userId từ token đã decode (phải ép kiểu Int nếu DB dùng Int)
    const userId = parseInt(socket.user.userId);
    console.log(`User connected: ${userId}`);

    try {
        // Cập nhật trạng thái ONLINE khi kết nối thành công
        await prisma.user.update({
            where: { id: userId },
            data: { status: 'ONLINE' }
        });
        
        // Thông báo cho các user khác (nếu cần)
        socket.broadcast.emit('user_online', userId);

    } catch (error) {
        console.error("Lỗi cập nhật status ONLINE:", error);
    }

    socket.on('disconnect', async () => {
        console.log(`User ${userId} disconnected`);
        try {
            // Cập nhật trạng thái OFFLINE khi ngắt kết nối
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
    });
});

// Lắng nghe lỗi server để tránh crash
server.on('error', (error) => {
    console.error(' Server Error:', error.message);
});

server.listen(PORT, () => {
    console.log(` Backend running at http://localhost:${PORT}`);
});