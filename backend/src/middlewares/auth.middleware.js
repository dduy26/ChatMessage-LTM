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
}
module.exports = authMiddleware;