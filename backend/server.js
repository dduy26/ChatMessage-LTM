require('dotenv').config();
const app = require('./src/app');
const http = require('http'); 
const { Server } = require('socket.io');
const prisma = require('./src/config/prisma');
const jwt = require('jsonwebtoken');
const socketManager = require('./src/socket/socketManager');

// Kiểm tra biến môi trường quan trọng khi khởi động
const requiredEnvVars = ['JWT_SECRET', 'DATABASE_URL'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
    console.error('LỖI: Thiếu các biến môi trường bắt buộc:', missingEnvVars.join(', '));
    console.error(' Vui lòng kiểm tra file .env hoặc cấu hình Docker!');
    process.exit(1);
}

console.log(' Tất cả biến môi trường bắt buộc đã được cấu hình');
console.log(' Database URL:', process.env.DATABASE_URL ? 'Đã cấu hình' : 'Chưa cấu hình');
console.log(' JWT_SECRET:', process.env.JWT_SECRET ? 'Đã cấu hình' : 'Chưa cấu hình');

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"],
        credentials: true
    }
});
    app.set("io", io);
 // Thiết lập xác thực cho Socket.IO
    io.use(async(socket, next)=> {
    try {
        let token = socket.handshake.auth.token || socket.handshake.query.token;
        if(!token) {
            return next(new Error("Xác thực thất bại: Thiếu Token"));
        }

        // Xử lý chuỗi token (nếu có chữ Bearer)
        if (typeof token === 'string' && token.startsWith("Bearer ")) {
            token = token.split(" ")[1];
        }
        token = token.trim();

        // 2. Check Blacklist
        const isBlacklisted = await prisma.blackListedToken.findUnique({
            where: { token: token }
        });

        //Kiểm tra token đã 401 
        if(isBlacklisted) {
            return next(new Error("Token đã bị vô hiệu hóa!"));
        }  
        
        // 3. Giải mã JWT
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.user = decoded;
        console.log(` Kết nối thành công! User ID: ${decoded.userId}`);
        
        next();
    } catch(error) {
        next(new Error("Phiên đăng nhập không hợp lệ"));
    }
});
//gọi socketManager
socketManager(io);

// Lắng nghe lỗi server để tránh crash
server.on('error', (error) => {
    console.error('Server Error:', error.message);
});

// Bắt đầu chạy server
server.listen(PORT, () => {
    console.log(`Backend running at http://localhost:${PORT}`);
});