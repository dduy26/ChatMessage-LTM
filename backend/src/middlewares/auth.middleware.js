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

        if (isBlacklisted) {
            return res.status(401).json({ error: "Token đã bị vô hiệu hóa!" });
        }

        const decoded = JWT.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        // Đảm bảo tương thích với cả req.user.id và req.user.userId
        if (decoded.userId && !decoded.id) {
            req.user.id = decoded.userId;
        }
        
        next();
    } catch (error) {
        return res.status(403).json({ error: "Phiên đăng nhập không hợp lệ hoặc đã hết hạn!" });
    }
};

module.exports = authMiddleware;