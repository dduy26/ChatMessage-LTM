// require('dotenv').config();
// const app = require('./src/app');
// const http = require('http'); 
// const { Server } = require('socket.io');
// const prisma = require('./src/config/prisma');
// const jwt = require('jsonwebtoken');
// const socketManager = require('./src/socket/socketManager');

// const PORT = process.env.PORT || 5000;

// const server = http.createServer(app);

// const io = new Server(server, {
//     cors: {
//         origin: "http://localhost:5173", 
//         methods: ["GET", "POST"],
//         credentials: true 
//     }
// });

// io.use(async(socket, next)=> {
//     try {
//         console.log("=== DEBUG SOCKET.IO AUTH ===");
//         console.log("socket.handshake.auth:", socket.handshake.auth);
//         console.log("socket.handshake.query:", socket.handshake.query);
//         console.log("socket.handshake.query type:", typeof socket.handshake.query);
//         console.log("socket.handshake.query keys:", socket.handshake.query ? Object.keys(socket.handshake.query) : "query is null/undefined");
        
//         // Truy cập token từ auth object trước
//         let token = null;
        
//         // Kiểm tra auth object
//         if (socket.handshake.auth) {
//             console.log("auth object có:", Object.keys(socket.handshake.auth));
//             if (socket.handshake.auth.token) {
//                 token = socket.handshake.auth.token;
//                 console.log("Lấy token từ auth.token");
//             }
//         }
        
//         // Nếu không có trong auth, thử lấy từ query
//         if (!token && socket.handshake.query) {
//             console.log("query object có keys:", Object.keys(socket.handshake.query));
            
//             // Kiểm tra từng key trong query để debug
//             for (const key in socket.handshake.query) {
//                 const value = socket.handshake.query[key];
//                 console.log(`  - Key: "${key}", Value type: ${typeof value}, Has value: ${!!value}`);
//                 if (key === 'token' || key.toLowerCase() === 'token') {
//                     console.log(`    -> Tìm thấy token ở key "${key}":`, value ? value.substring(0, 30) + "..." : "EMPTY");
//                 }
//             }
            
//             // Truy cập token trực tiếp - kiểm tra cả 'token' và 'Token'
//             if (socket.handshake.query.token) {
//                 token = socket.handshake.query.token;
//                 console.log("Lấy token từ query.token (lowercase)");
//             } else if (socket.handshake.query['token']) {
//                 token = socket.handshake.query['token'];
//                 console.log("Lấy token từ query['token']");
//             } else if (socket.handshake.query.Token) {
//                 token = socket.handshake.query.Token;
//                 console.log("Lấy token từ query.Token (uppercase)");
//             } else {
//                 // Tìm key có chứa 'token' (case insensitive)
//                 const tokenKey = Object.keys(socket.handshake.query).find(k => 
//                     k.toLowerCase().trim() === 'token'
//                 );
//                 if (tokenKey) {
//                     token = socket.handshake.query[tokenKey];
//                     console.log(`Lấy token từ query["${tokenKey}"]`);
//                 } else {
//                     console.log("Không tìm thấy key 'token' trong query");
//                     console.log("Toàn bộ query object:", JSON.stringify(socket.handshake.query, null, 2));
//                 }
//             }
//         }
        
//         // Xử lý token nếu có
//         if (token && typeof token === 'string') {
//             token = token.trim(); 
//         }
        
//         console.log("Token sau khi xử lý:", token ? token.substring(0, 50) + "..." : "KHÔNG CÓ");
//         console.log("Token type:", typeof token);
//         console.log("Token length:", token ? token.length : 0);
        
//         if(!token) {
//             console.error("Không tìm thấy token trong handshake");
//             console.error("auth object:", socket.handshake.auth);
//             console.error("query object:", socket.handshake.query);
//             return next(new Error("Xác thực thất bại: Thiếu Token"));
//         }

//         const isBlacklisted = await prisma.blackListedToken.findUnique({
//             where: { token: token }
//         });

//         console.log("Token trong Blacklist?:", isBlacklisted ? "CÓ" : "KHÔNG");

//         if(isBlacklisted) {
//             console.error("Token đã bị blacklist");
//             return next(new Error("Token đã bị vô hiệu hóa!"));
//         }  
        
//         const decoded = jwt.verify(token, process.env.JWT_SECRET);
//         console.log("Token hợp lệ, userId:", decoded.userId);
        
//         socket.user = decoded;
//         next();
//     } catch(error) {
//         console.error("Lỗi xác thực Socket.IO:", error.message);
//         console.error("Error stack:", error.stack);
        
//         if (error.name === 'JsonWebTokenError') {
//             return next(new Error("Token không hợp lệ"));
//         } else if (error.name === 'TokenExpiredError') {
//             return next(new Error("Token đã hết hạn"));
//         }
        
//         return next(new Error("Phiên đăng nhập không hợp lệ: " + error.message));
//     }
// });

// socketManager(io);
// // Lắng nghe lỗi server để tránh crash
// server.on('error', (error) => {
//     console.error(' Server Error:', error.message);
// });

// server.listen(PORT, () => {
//     console.log(` Backend running at http://localhost:${PORT}`);
// });

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
    app.set("io", io);
// --- PHẦN MIDDLEWARE XÁC THỰC (ĐÃ SỬA ĐỂ NHẬN HEADERS) ---
io.use(async(socket, next)=> {
    try {
        const token = socket.handshake.auth.token || socket.handshake.query.token;
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
        console.log(`✅ Kết nối thành công! User ID: ${decoded.userId}`);
        
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
    console.error('Server Error:', error.message);
});

// Bắt đầu chạy server
server.listen(PORT, () => {
    console.log(`Backend running at http://localhost:${PORT}`);
});