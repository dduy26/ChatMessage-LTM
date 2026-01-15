const AuthService = require("../services/auth.service");
const prisma = require("../config/prisma");
const { Prisma } = require("@prisma/client");
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

class AuthController {
    static async requestOTP(req, res) {
        try {
            const { email, type } = req.body;
            
            console.log("Dữ liệu nhận được:", { email, type });

            if (!email || !type) {
                return res.status(400).json({ error: "Thiếu email hoặc loại xác thực (type)" });
            }

            const user = await prisma.user.findUnique({ where: { email } });
            if (!user) {
                return res.status(400).json({ error: "Email này chưa được đăng ký trong hệ thống" });
            }

            // Truyền vào 1 Object duy nhất
            const result = await AuthService.requestOTP({ email, type });

            return res.status(200).json({ 
                message: `Mã OTP xác minh ${type} đã được gửi thành công`,
                userId: result.userId 
            });

        } catch (error) {
            console.error("LỖI CHI TIẾT:", error);
            return res.status(500).json({ 
                error: "Lỗi hệ thống: " + error.message 
            });
        }
    }

    static async verifyOTP(req, res) {
        try {
            const { userId, code, type } = req.body;
            if (!userId || !code || !type) {
                return res.status(400).json({ error: "Vui lòng nhập đầy đủ userId, code và type" });
            }

            await AuthService.verifyOTP(userId, code, type);
            return res.status(200).json({ message: "Xác minh thành công!" });

        } catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }

    static async register(req, res) {
        try {
            const { email, password, fullName, phoneNumber, username, role } = req.body;

            // 1. Kiểm tra đầu vào
            if (!email || !password || !username) {
                return res.status(400).json({ 
                    message: "Email, mật khẩu và tên đăng nhập là bắt buộc" 
                });
            }

            // 2. Kiểm tra email/username/phoneNumber đã tồn tại chưa
            const existingUser = await prisma.user.findFirst({
                where: { OR: [{ email }, { username }, { phoneNumber }] }
            });
            if (existingUser) {
                let conflictField = "thông tin tài khoản";
                if (existingUser.email === email) conflictField = "Email";
                else if (existingUser.username === username) conflictField = "Tên đăng nhập";
                else if (existingUser.phoneNumber === phoneNumber) conflictField = "Số điện thoại";

                return res.status(400).json({ 
                    message: `${conflictField} đã được sử dụng. Vui lòng chọn ${conflictField.toLowerCase()} khác.` 
                });
            }

            // 3. Mã hóa mật khẩu
            const hashedPassword = await bcrypt.hash(password, 10);

            // 4. Tạo User mới
            const newUser = await prisma.user.create({
                data: {
                    email,
                    username,
                    password: hashedPassword,
                    fullName,
                    phoneNumber,
                    role: role || 'USER'
                }
            });

            // Đảm bảo dữ liệu đã được commit vào database
            console.log("User đã được tạo thành công:", {
                id: newUser.id,
                email: newUser.email,
                username: newUser.username,
                createdAt: newUser.createdAt
            });

            // Xác minh lại dữ liệu đã được lưu vào DB
            const verifyUser = await prisma.user.findUnique({
                where: { id: newUser.id }
            });
            if (verifyUser) {
                console.log("Đã xác minh: User tồn tại trong database với ID:", verifyUser.id);
            } else {
                console.error("LỖI: User không tìm thấy sau khi tạo!");
            }

            // 5. Tạo Token JWT (Để FE lưu lại và dùng cho Middleware)
            const token = jwt.sign(
                {   userId: newUser.id.toString(), 
                    email: newUser.email, 
                    role: newUser.role },
                process.env.JWT_SECRET,
                { expiresIn: '7d' } // Token hết hạn sau 7 ngày
            );

            return res.status(201).json({
                message: "Đăng ký tài khoản thành công",
                token,
                user: { id: newUser.id, email: newUser.email, fullName: newUser.fullName }
            });

        } catch (error) {
            // Bắt lỗi unique constraint của Prisma (phòng khi vẫn lọt qua bước check ở trên)
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
                const targets = error.meta?.target || [];
                const field = Array.isArray(targets) ? targets[0] : targets;

                let fieldLabel = "Thông tin";
                if (field === "email") fieldLabel = "Email";
                else if (field === "username") fieldLabel = "Tên đăng nhập";
                else if (field === "phoneNumber") fieldLabel = "Số điện thoại";

                return res.status(400).json({
                    message: `${fieldLabel} đã tồn tại. Vui lòng sử dụng ${fieldLabel.toLowerCase()} khác.`
                });
            }

            console.error("Lỗi đăng ký:", error);
            return res.status(500).json({ 
                message: "Lỗi đăng ký: " + error.message 
            });
        }
    }

    static async login(req, res) {
        try {
            const { email, password } = req.body;

            // 1. Kiểm tra đầu vào
            if (!email || !password) {
                return res.status(400).json({ error: "Email và mật khẩu không được để trống" });
            }

            // 2. Tìm người dùng qua email
            const user = await prisma.user.findUnique({
                where: { email }
            });

            if (!user) {
                return res.status(401).json({ error: "Email hoặc mật khẩu không chính xác" });
            }

            // 3. So sánh mật khẩu 
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(401).json({ error: "Email hoặc mật khẩu không chính xác" });
            }

            // 4. Create Token JWT 
            const token = jwt.sign(
                { 
                    userId: user.id, 
                    email: user.email,
                    role: user.role 
                },
                process.env.JWT_SECRET,
                { expiresIn: '7d' }
            );

            // 5. Trả về kết quả thành công
            return res.status(200).json({
                message: "Đăng nhập thành công",
                token,
                user: {
                    id: user.id,
                    email: user.email,
                    fullName: user.fullName,
                    role: user.role
                }
            });

        } catch (error) {
            return res.status(500).json({ error: "Lỗi đăng nhập: " + error.message });
        }
    }

    static async forgotPassword(req, res) {
        try {
            const { email } = req.body;
            if (!email) return res.status(400).json({ error: "Vui lòng cung cấp email" });

            const result = await AuthService.requestOTP({ 
                email, 
                type: "FORGOT_PASSWORD" 
            });
            
            return res.status(200).json({
                message: "Mã OTP đặt lại mật khẩu đã được gửi tới email của bạn",
                userId: result.userId
            });
        } catch (error) {
            console.error("Lỗi quên mật khẩu:", error); 
            return res.status(500).json({ error: error.message });
        }
    }

    static async resetPassword(req, res) {
        try {
            const { userId, code, newPassword } = req.body;

            if (!userId || !code || !newPassword) {
                return res.status(400).json({ error: "Thiếu thông tin cần thiết" });
            }

            // 1. Xác minh mã OTP 
            await AuthService.verifyOTP(Number(userId), code, "FORGOT_PASSWORD");

            // 2. Nếu OTP đúng, tiến hành Hash mật khẩu mới
            const hashedPassword = await bcrypt.hash(newPassword, 10);

            // 3. Cập nhật vào DB
            await prisma.user.update({
                where: { id: Number(userId) },
                data: { password: hashedPassword }
            });

            return res.status(200).json({ message: "Đặt lại mật khẩu thành công!" });
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }

    static async logout(req, res) {
        try {
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith("Bearer ")) {
                return res.status(400).json({ message: "Không tìm thấy token hợp lệ" });
            }

            const token = authHeader.split(" ")[1];

            // 1. Giải mã token để lấy thời gian hết hạn (exp)
            const decoded = jwt.decode(token);
            if (!decoded || !decoded.exp) {
                return res.status(400).json({ message: "Token không hợp lệ" });
            }

            const expiresAt = new Date(decoded.exp * 1000);

            // 2. Lưu vào BlackListedToken 
            await prisma.blacklistedToken.upsert({
                where: { token: token },
                update: {}, 
                create: {
                    token: token,
                    expiresAt: expiresAt
                }
            });

            // 3. (Tùy chọn) Cập nhật trạng thái người dùng
            if (req.user && req.user.userId) {
                await prisma.user.update({
                    where: { id: parseInt(req.user.userId) },
                    data: { status: 'OFFLINE', lastSeen: new Date() }
                });
            }

            return res.status(200).json({ message: "Đăng xuất thành công, Token đã bị hủy!" });

        } catch (error) {
            console.error("Lỗi logout:", error);
            return res.status(500).json({ message: "Có lỗi xảy ra khi đăng xuất" });
        }
    }
}

module.exports = AuthController;