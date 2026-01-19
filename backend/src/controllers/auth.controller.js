const AuthService = require("../services/auth.service");
const prisma = require("../config/prisma");
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

// Kiểm tra biến môi trường khi module được load
if (!process.env.JWT_SECRET) {
    console.warn("CẢNH BÁO: JWT_SECRET chưa được cấu hình!");
}
if (!process.env.REFRESH_TOKEN_SECRET) {
    console.warn("CẢNH BÁO: REFRESH_TOKEN_SECRET chưa được cấu hình, sẽ dùng giá trị mặc định!");
}

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
                return res.status(400).json({ error: "Email, password và username là bắt buộc" });
            }

            // 1.1. Kiểm tra biến môi trường quan trọng
            if (!process.env.JWT_SECRET) {
                console.error("LỖI: JWT_SECRET chưa được cấu hình trong biến môi trường!");
                return res.status(500).json({ error: "Lỗi cấu hình hệ thống: Thiếu JWT_SECRET" });
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

            // 4. Tạo User mới - Sử dụng transaction để đảm bảo atomicity
            console.log("Đang tạo user mới với email:", email, "username:", username);
            
            let newUser;
            try {
                newUser = await prisma.user.create({
                    data: {
                        email,
                        username,
                        password: hashedPassword,
                        fullName,
                        phoneNumber,
                        role: role || 'USER'
                    }
                });
                console.log("User đã được tạo thành công với ID:", newUser.id);
            } catch (dbError) {
                console.error("Lỗi khi tạo user trong database:", dbError);
                throw new Error("Không thể tạo tài khoản: " + dbError.message);
            }

            // 4.1. Verify lại user đã được lưu vào DB
            const verifyUser = await prisma.user.findUnique({ 
                where: { id: newUser.id },
                select: { id: true, email: true, username: true }
            });
            
            if (!verifyUser) {
                console.error("LỖI NGHIÊM TRỌNG: User vừa tạo không tồn tại trong database!");
                return res.status(500).json({ error: "Lỗi hệ thống: Không thể xác minh tài khoản đã được tạo" });
            }
            
            console.log("Đã xác minh user tồn tại trong DB:", verifyUser.email);

            // 5. Tạo Token JWT giống như login (Để FE lưu lại và dùng cho Middleware)
            const userId = Number(newUser.id);
            if (isNaN(userId) || userId <= 0 || !Number.isInteger(userId)) {
                console.error("newUser.id không hợp lệ:", newUser.id);
                return res.status(500).json({ error: "Lỗi hệ thống: ID người dùng không hợp lệ" });
            }
            
            // Tạo AccessToken và RefreshToken giống login
            let accessToken, refreshToken;
            try {
                accessToken = jwt.sign(
                    { userId: userId, email: newUser.email, role: newUser.role },
                    process.env.JWT_SECRET,
                    { expiresIn: '15m' } 
                );

                refreshToken = jwt.sign(
                    { userId },
                    process.env.REFRESH_TOKEN_SECRET || 'refresh_secret_key',
                    { expiresIn: '7d' } 
                );
                console.log("Đã tạo JWT tokens thành công");
            } catch (tokenError) {
                console.error("Lỗi khi tạo JWT tokens:", tokenError);
                // User đã được tạo nhưng token lỗi - vẫn trả về success nhưng cảnh báo
                return res.status(500).json({ 
                    error: "Tài khoản đã được tạo nhưng không thể tạo token đăng nhập. Vui lòng đăng nhập lại." 
                });
            }

            // HTTPONLY COOKIE cho refreshToken
            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: false, 
                sameSite: 'Lax',
                maxAge: 7 * 24 * 60 * 60 * 1000 
            });

            console.log("Đăng ký thành công cho user ID:", userId, "Email:", email);

            return res.status(201).json({
                message: "Đăng ký tài khoản thành công",
                accessToken,
                user: { 
                    id: newUser.id, 
                    email: newUser.email, 
                    fullName: newUser.fullName,
                    role: newUser.role
                }
            });

        } catch (error) {
            console.error("Lỗi trong quá trình đăng ký:", error);
            console.error("Chi tiết lỗi:", error.message);
            console.error("Stack trace:", error.stack);
            return res.status(500).json({ error: "Lỗi đăng ký: " + error.message });
        }
    }

    static async login(req, res) {
        try {
            const { email, password } = req.body;

            // Kiểm tra đầu vào
            if (!email || !password) {
                return res.status(400).json({ error: "Vui lòng nhập đầy đủ email và mật khẩu" });
            }

            // Tìm user
            const user = await prisma.user.findUnique({ where: { email } });
            if (!user) {
                return res.status(401).json({ error: "Tài khoản hoặc mật khẩu không đúng" });
            }

            // Kiểm tra tài khoản có bị khóa không
            if (user.isBanned) {
                return res.status(403).json({ 
                    error: "Tài khoản của bạn đã bị khóa", 
                    reason: user.banReason || "Vui lòng liên hệ quản trị viên" 
                });
            }

            const isMatch = await bcrypt.compare(password, user.password);

            if (!isMatch) {
                return res.status(401).json({ error: "Tài khoản hoặc mật khẩu không đúng" });
            }

            const userId = Number(user.id);

            // Tạo Token
            const accessToken = jwt.sign(
                { userId, email: user.email, role: user.role },
                process.env.JWT_SECRET,
                { expiresIn: '15m' } 
            );

            const refreshToken = jwt.sign(
                { userId },
                process.env.REFRESH_TOKEN_SECRET || 'refresh_secret_key',
                { expiresIn: '7d' } 
            );

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
            console.error("Lỗi Login:", error);
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
            if (!authHeader || !authHeader.startsWith("Bearer ")) {
                return res.status(400).json({ error: "Không tìm thấy token" });
            }

            const token = authHeader.split(" ")[1];
            if (!token) {
                return res.status(400).json({ error: "Token không hợp lệ" });
            }

            const decoded = jwt.decode(token);
            if (!decoded || !decoded.exp) {
                return res.status(400).json({ error: "Token không hợp lệ" });
            }

            const expiresAt = new Date(decoded.exp * 1000);

            // Lưu token vào blacklist
            await prisma.blackListedToken.upsert({
                where: { token: token },
                update: {}, 
                create: {
                    token: token,
                    expiresAt: expiresAt
                }
            });

            // Xóa refreshToken cookie
            res.clearCookie('refreshToken', {
                httpOnly: true,
                secure: false,
                sameSite: 'Lax'
            });

            console.log("User đã đăng xuất thành công, token đã được blacklist");

            return res.status(200).json({ message: "Đăng xuất thành công!" });
        } catch (error) {
            console.error("Lỗi khi đăng xuất:", error);
            return res.status(500).json({ error: "Có lỗi xảy ra khi đăng xuất: " + error.message });
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