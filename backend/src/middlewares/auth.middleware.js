const JWT = require('jsonwebtoken');
const prisma = require("../config/prisma"); 

const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ error: "Bạn cần đăng nhập để thực hiện thao tác này!" });
        }

        const isBlacklisted = await prisma.blackListedToken.findUnique({
            where: { token: token }
        });

        console.log("Token gửi lên:", token);
        console.log("Tìm thấy trong Blacklist?:", isBlacklisted ? "CÓ" : "KHÔNG");

        if (isBlacklisted) {
            return res.status(401).json({ error: "Token đã bị vô hiệu hóa!" });
        }

        const decoded = JWT.verify(token, process.env.JWT_SECRET);
        
        // Đảm bảo decoded có userId
        if (!decoded || (!decoded.userId && !decoded.id)) {
            console.error("❌ Token không chứa userId hoặc id:", decoded);
            return res.status(401).json({ error: "Token không hợp lệ: thiếu thông tin người dùng" });
        }

        console.log("=== DEBUG MIDDLEWARE ===");
        console.log("Token giải mã thành công!:", JSON.stringify(decoded, null, 2));
        console.log("decoded.userId:", decoded.userId, "(type:", typeof decoded.userId, ")");
        console.log("decoded.id:", decoded.id, "(type:", typeof decoded.id, ")");
        console.log("decoded keys:", Object.keys(decoded));
        
        // Đảm bảo userId là số nếu có
        if (decoded.userId !== undefined && decoded.userId !== null) {
            const userIdNum = Number(decoded.userId);
            if (!isNaN(userIdNum) && Number.isInteger(userIdNum) && userIdNum > 0) {
                decoded.userId = userIdNum; // Đảm bảo là số
            }
        }
        
        req.user = decoded;
        
        next();
    } catch (error) {
        return res.status(401).json({ error: "Phiên đăng nhập không hợp lệ hoặc đã hết hạn!" });
    }
};

module.exports = authMiddleware;