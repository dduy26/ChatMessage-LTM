const JWT = require('jsonwebtoken');
const prisma = require("../config/prisma"); 

const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader) {
            console.log(" Không có Authorization header");
            return res.status(401).json({ error: "Bạn cần đăng nhập để thực hiện thao tác này!" });
        }

        if (!authHeader.startsWith('Bearer ')) {
            console.log(" Authorization header không đúng format (thiếu 'Bearer ')");
            return res.status(401).json({ error: "Token không hợp lệ!" });
        }

        const token = authHeader.split(' ')[1];

        if (!token) {
            console.log(" Không có token sau 'Bearer '");
            return res.status(401).json({ error: "Bạn cần đăng nhập để thực hiện thao tác này!" });
        }

        const isBlacklisted = await prisma.blackListedToken.findUnique({
            where: { token: token }
        });

        if (isBlacklisted) {
            console.log(" Token đã bị blacklist");
            return res.status(401).json({ error: "Token đã bị vô hiệu hóa!" });
        }

        const decoded = JWT.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        // Đảm bảo tương thích với cả req.user.id và req.user.userId
        if (decoded.userId && !decoded.id) {
            req.user.id = decoded.userId;
        }
        
        console.log("✅ Token hợp lệ cho user ID:", decoded.userId);
        next();
    } catch (error) {
        console.error(" Lỗi xác thực token:", error.message);
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!" });
        }
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: "Token không hợp lệ!" });
        }
        return res.status(403).json({ error: "Phiên đăng nhập không hợp lệ hoặc đã hết hạn!" });
    }
};

module.exports = authMiddleware;