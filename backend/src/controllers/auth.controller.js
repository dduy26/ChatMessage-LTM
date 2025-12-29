const AuthService = require("../services/auth.service"); 
const prisma = require("../config/prisma");

class AuthController {
    static async requestOTP(req, res) {
        try {
            // 1. Kiểm tra đầu vào từ Postman
            const { email, type } = req.body;
            
            if (!email || !type) {
                return res.status(400).json({ error: "Email và type là bắt buộc" });
            }

            // 2. Tìm User trong DB
            const user = await prisma.user.findUnique({ where: { email } });
            
            if (!user) {
                return res.status(400).json({ error: "Email không tồn tại trong hệ thống" });
            }

            // 3. Gọi Service (Đảm bảo Service này có hàm requestOTP nhận email và type)
            const result = await AuthService.requestOTP(email, type);

            res.status(200).json({ 
                message: `Mã OTP xác minh ${type} đã được gửi về email của bạn`,
                userId: result.userId 
            });
        } catch (error) {
            console.error("Lỗi tại AuthController:", error.message);
            res.status(500).json({ error: "Lỗi hệ thống: " + error.message });
        }
    }

    static async verifyOTP(req, res) {
        try {
            const { userId, code, type } = req.body;
            
            if (!userId || !code || !type) {
                return res.status(400).json({ error: "Thiếu thông tin xác thực" });
            }

            await AuthService.verifyOTP(userId, code, type);
            
            res.status(200).json({ message: "Xác minh mã thành công!" });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
}

module.exports = AuthController;