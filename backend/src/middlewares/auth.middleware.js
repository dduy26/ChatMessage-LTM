// const JWT = require('jsonwebtoken');

// const authMiddleware = (req, res, next) => {
//     try {
//         // 1. Lấy token từ header "Authorization"
//         const authHeader = req.headers.authorization;
//         const token = authHeader && authHeader.split(' ')[1];

//         if(!token) {
//             return res.status(401).json({error: "Bạn cần đăng nhập để thực hiện thao tác này!"});
//         }
//         // 2. Giải mã và kiểm tra Token
//         const decoded = JWT.verify(token, process.env.JWT_SECRET);

//         // 3. Gắn thông tin user vào request để Controller sử dụng
//         req.user = decoded;

//         // 4. Cho phép đi tiếp vào Controller
//         next();
//     } catch(error) {
//         return res.status(403).json({error: "Phiên đăng nhập hết hạn!"});
//     }
// }
// module.exports = authMiddleware;
const JWT = require('jsonwebtoken');
// 1. Import Prisma để kết nối Database
const prisma = require("../config/prisma"); 

// 2. Thêm từ khóa 'async' vì chúng ta phải chờ DB trả lời
const authMiddleware = async (req, res, next) => {
    try {
        // --- BƯỚC 1: LẤY TOKEN ---
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];

        if(!token) {
            return res.status(401).json({error: "Bạn cần đăng nhập để thực hiện thao tác này!"});
        }

        // --- BƯỚC 2 (QUAN TRỌNG): KIỂM TRA SỔ ĐEN ---
        // Hỏi Database xem token này có nằm trong bảng BlacklistedToken không
        const isBlacklisted = await prisma.blacklistedToken.findUnique({
            where: { token: token }
        });

        if (isBlacklisted) {
            // Nếu có tên trong sổ đen -> Cấm cửa ngay lập tức
            return res.status(403).json({error: "Phiên đăng nhập đã kết thúc (Đã đăng xuất)!"});
        }

        // --- BƯỚC 3: XÁC THỰC TOKEN ---
        // Nếu không bị cấm thì mới Verify chữ ký và hạn sử dụng
        const decoded = JWT.verify(token, process.env.JWT_SECRET);

        // --- BƯỚC 4: GẮN USER VÀO REQUEST ---
        req.user = decoded;

        // Cho phép đi tiếp
        next();

    } catch(error) {
        // Lỗi này xảy ra khi Token hết hạn hoặc sai chữ ký
        return res.status(403).json({error: "Token không hợp lệ hoặc đã hết hạn!"});
    }
}

module.exports = authMiddleware;