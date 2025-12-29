const AuthService = require("../services/auth.service");
const prisma = require("../config/prisma");

class AuthController {
    // SỬA TẠI ĐÂY: Phải là (req, res) để lấy dữ liệu và trả về phản hồi
    static async requestOTP(req, res) { 
        try {
            // 1. Lấy dữ liệu từ body của request
            const { email, type } = req.body;
            
            // Kiểm tra dữ liệu đầu vào
            if (!email || !type) {
                return res.status(400).json({ error: "Email và type là bắt buộc" });
            }

            // 2. Tìm User trong DB
            const user = await prisma.user.findUnique({ where: { email } });
            
            if (!user) {
                return res.status(400).json({ error: "Email không tồn tại trong hệ thống" });
            }

            // 3. Gọi Service: Phải bọc { email, type } trong dấu ngoặc nhọn 
            // để truyền dưới dạng 1 Object duy nhất khớp với Service
            const result = await AuthService.requestOTP({ email, type });

            // Trả về phản hồi thành công
            return res.status(200).json({ 
                message: `Mã OTP xác minh ${type} đã được gửi về email của bạn`,
                userId: result.userId 
            });
        } catch (error) {
            console.error("Lỗi tại AuthController:", error.message);
            // res lúc này đã được định nghĩa ở tham số hàm nên sẽ không còn lỗi ReferenceError
            return res.status(500).json({ error: "Lỗi hệ thống: " + error.message });
        }
    }

    static async verifyOTP(req, res) {
        try {
            const { userId, code, type } = req.body;
            
            if (!userId || !code || !type) {
                return res.status(400).json({ error: "Thiếu thông tin xác thực" });
            }

            // Gọi logic xác thực mã từ Service
            await AuthService.verifyOTP(userId, code, type);
            
            return res.status(200).json({ message: "Xác minh mã thành công!" });
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }
}

module.exports = AuthController;