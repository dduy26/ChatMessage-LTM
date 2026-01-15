const AuthService = require("../services/auth.service");
const prisma = require("../config/prisma");
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

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

            console.log("=== DEBUG REGISTER ===");
            console.log("Request body:", { email, username, hasPassword: !!password });

            // 1. Kiểm tra đầu vào
            if (!email || !password || !username) {
                return res.status(400).json({ error: "Email, password và username là bắt buộc" });
            }

            // 2. Kiểm tra email/username đã tồn tại chưa
            const existingUser = await prisma.user.findFirst({
                where: { OR: [{ email }, { username }] }
            });
            if (existingUser) {
                return res.status(400).json({ error: "Email hoặc Username đã được sử dụng" });
            }

            // 3. Mã hóa mật khẩu
            const hashedPassword = await bcrypt.hash(password, 10);
            console.log("Password đã được hash");

            // 4. Tạo User mới
            console.log("Đang tạo user trong database...");
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
            console.log("User đã được tạo:", { id: newUser.id, email: newUser.email });

            // 5. Verify user đã được lưu trong DB
            const verifyUser = await prisma.user.findUnique({
                where: { id: newUser.id }
            });
            if (!verifyUser) {
                console.error(" User không tồn tại sau khi tạo!");
                return res.status(500).json({ error: "Lỗi: User không được lưu vào database" });
            }
            console.log("Verified: User đã được lưu trong DB");

            // 6. Tạo Token JWT
            if (!process.env.JWT_SECRET) {
                console.error("JWT_SECRET không được cấu hình!");
                return res.status(500).json({ error: "Lỗi cấu hình server: JWT_SECRET không tồn tại" });
            }

            const token = jwt.sign(
                { userId: newUser.id, email: newUser.email, role: newUser.role },
                process.env.JWT_SECRET,
                { expiresIn: '7d' }
            );
            console.log("Token đã được tạo");

            return res.status(201).json({
                message: "Đăng ký tài khoản thành công",
                token,
                user: { id: newUser.id, email: newUser.email, fullName: newUser.fullName }
            });

        } catch (error) {
            console.error("Lỗi đăng ký:", error);
            console.error("Error stack:", error.stack);
            console.error("Error name:", error.name);
            console.error("Error code:", error.code);
            
            // Xử lý lỗi Prisma cụ thể
            if (error.code === 'P2002') {
                return res.status(400).json({ error: "Email hoặc Username đã được sử dụng" });
            }
            if (error.code === 'P1001') {
                return res.status(500).json({ error: "Không thể kết nối đến database. Vui lòng kiểm tra kết nối." });
            }
            
            return res.status(500).json({ error: "Lỗi đăng ký: " + error.message });
        }
    }

    static async login(req, res) {
        try {
            const { email, password } = req.body;

            console.log("=== DEBUG LOGIN ===");
            console.log("Email:", email, "Has password:", !!password);

            // Kiểm tra đầu vào
            if (!email || !password) {
                return res.status(400).json({ error: "Email và mật khẩu không được để trống" });
            }

            // Kiểm tra JWT_SECRET
            if (!process.env.JWT_SECRET) {
                console.error("JWT_SECRET không được cấu hình!");
                return res.status(500).json({ error: "Lỗi cấu hình server: JWT_SECRET không tồn tại" });
            }

            // Tìm user
            console.log("Đang tìm user trong database...");
            const user = await prisma.user.findUnique({ where: { email } });
            
            if (!user) {
                console.log(" User không tồn tại với email:", email);
                return res.status(401).json({ error: "Email hoặc mật khẩu không chính xác" });
            }
            console.log("Tìm thấy user:", { id: user.id, email: user.email });

            // So sánh mật khẩu
            console.log("Đang so sánh mật khẩu...");
            const isMatch = await bcrypt.compare(password, user.password);

            if (!isMatch) {
                console.log("Mật khẩu không khớp");
                return res.status(401).json({ error: "Email hoặc mật khẩu không chính xác" });
            }
            console.log("Mật khẩu khớp");

            // Tạo Token
            console.log("Đang tạo access token...");
            const accessToken = jwt.sign(
                { userId: user.id, email: user.email, role: user.role },
                process.env.JWT_SECRET,
                { expiresIn: '15m' } // Sửa từ '15p' thành '15m' (15 minutes)
            );

            const refreshToken = jwt.sign(
                { userId: user.id },
                process.env.REFRESH_TOKEN_SECRET || 'refresh_secret_key',
                { expiresIn: '7d' } 
            );
            console.log(" Tokens đã được tạo");

            // HTTPONLY COOKIE
            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: false, 
                sameSite: 'Lax',
                maxAge: 7 * 24 * 60 * 60 * 1000 
            });

            return res.status(200).json({
                message: "Đăng nhập thành công",
                accessToken,   
                user: {
                    id: user.id,
                    email: user.email,
                    fullName: user.fullName,
                    role: user.role
                }
            });

        } catch (error) {
            console.error(" Lỗi Login:", error);
            console.error("Error stack:", error.stack);
            console.error("Error name:", error.name);
            console.error("Error code:", error.code);
            
            // Xử lý lỗi Prisma cụ thể
            if (error.code === 'P1001') {
                return res.status(500).json({ error: "Không thể kết nối đến database. Vui lòng kiểm tra kết nối." });
            }
            
            return res.status(500).json({ error: "Lỗi đăng nhập: " + error.message });
        }
    }

    static async refreshToken(req, res) {
        const refreshToken = req.cookies.refreshToken; // Lấy từ Cookie ẩn
        if (!refreshToken) return res.status(401).send();

        try {
            const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
            const accessToken = jwt.sign(
                { userId: decoded.userId, email: decoded.email },
                process.env.JWT_SECRET,
                { expiresIn: '15m' }
            );
            res.json({ accessToken }); // Trả về Access Token mới
        } catch (err) {
            res.status(401).send();
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
            const { email, otp, newPassword } = req.body;

            if (!email || !otp || !newPassword) {
                return res.status(400).json({ error: "Thiếu thông tin cần thiết" });
            }

            const user = await prisma.user.findUnique({ where: { email } });
            if (!user) return res.status(404).json({ error: "Không tìm thấy người dùng" });

            // 1. Xác minh mã OTP 
            await AuthService.verifyOTP(user.id, otp, "FORGOT_PASSWORD");

            // 2. Nếu OTP đúng, tiến hành Hash mật khẩu mới
            const hashedPassword = await bcrypt.hash(newPassword, 10);

            // 3. Cập nhật vào DB
            await prisma.user.update({
                where: { id: Number(user.id) },
                data: { password: hashedPassword }
            });

            return res.status(200).json({ message: "Đặt lại mật khẩu thành công!" });
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }

    static async debugToken(req, res) {
        try {
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith("Bearer ")) {
                return res.status(400).json({ message: "Không tìm thấy token" });
            }

            const token = authHeader.split(" ")[1];
            const decoded = jwt.decode(token);
            
            return res.status(200).json({
                token: token.substring(0, 20) + "...", 
                tokenLength: token.length,
                decoded: decoded,
                userId: decoded?.userId,
                email: decoded?.email
            });
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    static async logout(req, res) {
        try {
            const authHeader = req.headers.authorization;
            const token = authHeader.split(" ")[1];
            const decoded = jwt.decode(token);
            const expiresAt = new Date(decoded.exp * 1000);

            await prisma.blackListedToken.upsert({
                where: { token: token },
                update: {}, 
                create: {
                    token: token,
                    expiresAt: expiresAt
                }
            });
            return res.status(200).json({ message: "Đăng xuất thành công!" });
        } catch (error) {
            return res.status(500).json({ message: "Có lỗi xảy ra khi đăng xuất" });
        }
    }   

    static async requestVerification(req, res) {
        try {
            const userId = req.user.userId;

            const user = await prisma.user.findUnique({ where: { id: userId } });
            if (!user) return res.status(404).json({ error: "Người dùng không tồn tại" });

            // Tạo token xác minh (hết hạn trong 15 phút)
            const verifyToken = jwt.sign(
                { email: user.email }, 
                process.env.JWT_SECRET, 
                { expiresIn: '15m' }
            );

            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.EMAIL_USER, 
                    pass: process.env.EMAIL_PASS  
                }
            });

            // Link dẫn tới hàm verifyEmail bên dưới
            const url = `http://localhost:5000/api/auth/verify-email?token=${verifyToken}`;

            await transporter.sendMail({
                to: user.email,
                subject: "Xác minh tài khoản của bạn",
                html: `
                    <div style="font-family: Arial, sans-serif; border: 1px solid #ddd; padding: 20px;">
                        <h2>Xác minh Email của bạn</h2>
                        <p>Chào ${user.fullName || user.username},</p>
                        <p>Vui lòng nhấn vào nút bên dưới để xác minh tài khoản và nhận Tích Xanh:</p>
                        <a href="${url}" style="background: #7360f2; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">XÁC MINH NGAY</a>
                        <p>Link này sẽ hết hạn sau 15 phút.</p>
                    </div>
                `
            });

            return res.status(200).json({ message: "Link xác minh đã được gửi vào Email của bạn!" });
        } catch (error) {
            console.error("Lỗi gửi mail:", error);
            return res.status(500).json({ error: "Không thể gửi email: " + error.message });
        }
    }

    static async verifyEmail(req, res) {
        try {
            const { token } = req.query;
            if (!token) return res.status(400).send("Thiếu mã token xác minh.");

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const userEmail = decoded.email;
            await prisma.user.update({
                where: { email: userEmail },
                data: { isVerified: true }
            });

            // Giao diện thông báo thành công cho người dùng trên trình duyệt
            return res.send(`
                <div style="text-align: center; margin-top: 50px; font-family: sans-serif;">
                    <h1 style="color: #22c55e;">Xác minh thành công! ✅</h1>
                    <p>Tài khoản của bạn đã được cấp tích xanh.</p>
                    <p>Bạn có thể quay lại ứng dụng và tải lại trang hồ sơ.</p>
                </div>
            `);
        } catch (error) {
            console.error("Lỗi verify email:", error);
            return res.status(400).send("<h1>Xác minh thất bại</h1><p>Link đã hết hạn hoặc không hợp lệ.</p>");
        }
    }
}

module.exports = AuthController;