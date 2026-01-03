const JWT = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    try {
        // 1. Lấy token từ header "Authorization"
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];

        if(!token) {
            return res.status(401).json({error: "Bạn cần đăng nhập để thực hiện thao tác này!"});
        }
        // 2. Giải mã và kiểm tra Token
        const decoded = JWT.verify(token, process.env.JWT_SECRET);

        // 3. Gắn thông tin user vào request để Controller sử dụng
        req.user = decoded;

        // 4. Cho phép đi tiếp vào Controller
        next();
    } catch(error) {
        return res.status(403).json({error: "Phiên đăng nhập hết hạn!"});
    }

    const verifyToken = async(req, res, next) => {
        const authHeader = req.headers.authorization;
        if (!authHeader) return res.status(401).json({ message: "Bạn chưa đăng nhập" });

        try {
            const isBlacklisted = await prisma.blacklistedToken.findUnique({
                where: { token: token }
            });

            if (isBlacklisted) {
                return res.status(401).json({ message: "Token này đã bị hủy (người dùng đã đăng xuất)" });
            }

            const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
            req.user = decoded;
            next();
        } catch(err) {
            return res.status(403).json({ message: "Token đã hết hạn" });
        }
    }
}
module.exports = authMiddleware;