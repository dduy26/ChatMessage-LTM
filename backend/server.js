require('dotenv').config();
const app = require('./src/app');
const http = require('http'); 
const { Server } = require('socket.io');
const prisma = require('./src/config/prisma');
const jwt = require('jsonwebtoken');

// Kiểm tra biến môi trường quan trọng khi khởi động
const requiredEnvVars = ['JWT_SECRET', 'DATABASE_URL'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
    console.error('❌ LỖI: Thiếu các biến môi trường bắt buộc:', missingEnvVars.join(', '));
    console.error('⚠️  Vui lòng kiểm tra file .env hoặc cấu hình Docker!');
    process.exit(1);
}

console.log('✅ Tất cả biến môi trường bắt buộc đã được cấu hình');
console.log('📊 Database URL:', process.env.DATABASE_URL ? 'Đã cấu hình' : 'Chưa cấu hình');
console.log('🔐 JWT_SECRET:', process.env.JWT_SECRET ? 'Đã cấu hình' : 'Chưa cấu hình');

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
            data: { isOnline: true }
        });
        
        // Thông báo cho các user khác về trạng thái online
        socket.broadcast.emit('user_status_change', {
            userId: userId,
            isOnline: true
        });

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
                    isOnline: false,
                    lastSeen: new Date() 
                }
            });
            // Thông báo cho các user khác về trạng thái offline
            socket.broadcast.emit('user_status_change', {
                userId: userId,
                isOnline: false
            });
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