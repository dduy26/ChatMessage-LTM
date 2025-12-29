const prisma = require("../config/prisma");
const nodemailer = require("nodemailer");

// Khởi tạo Transporter một lần duy nhất để dùng chung cho hiệu suất cao
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

class AuthService {
    // 1. Hàm gửi email linh hoạt theo từng loại (type)
    static async sendEmailOTP(to, code, type) {
        // Cấu hình nội dung email tương ứng với mục đích sử dụng
        const emailContent = {
            "REGISTER": {
                subject: "Xác minh đăng ký tài khoản mới",
                title: "Kích hoạt tài khoản",
                desc: "Chào mừng bạn! Mã xác nhận đăng ký của bạn là:"
            },
            "FORGOT_PASSWORD": {
                subject: "Khôi phục mật khẩu tài khoản",
                title: "Đặt lại mật khẩu",
                desc: "Hệ thống nhận được yêu cầu đổi mật khẩu. Mã xác minh của bạn là:"
            },
            "VERIFY_DEVICE": {
                subject: "Cảnh báo đăng nhập thiết bị lạ",
                title: "Xác minh thiết bị",
                desc: "Hệ thống phát hiện đăng nhập từ thiết bị mới. Mã xác minh là:"
            }
        };

        const content = emailContent[type] || {
            subject: "Mã xác minh hệ thống",
            title: "Xác minh OTP",
            desc: "Mã xác minh của bạn là:"
        };

        const mailOptions = {
            from: `"Zalo Clone" <${process.env.EMAIL_USER}>`, // Quan trọng: Phải khớp với email gửi
            to: to,
            subject: content.subject,
            html: `
                <div style="font-family: 'Segoe UI', sans-serif; max-width: 500px; margin: auto; border: 1px solid #e0e0e0; border-radius: 10px; padding: 20px;">
                    <div style="text-align: center; border-bottom: 2px solid #007bff; padding-bottom: 10px; margin-bottom: 20px;">
                        <h2 style="color: #007bff; margin: 0;">${content.title}</h2>
                    </div>
                    <p style="font-size: 16px;">${content.desc}</p>
                    <div style="background: #f8f9fa; border-radius: 5px; padding: 15px; text-align: center; margin: 20px 0;">
                        <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #007bff;">${code}</span>
                    </div>
                    <p style="font-size: 14px; color: #666;">Mã này có hiệu lực trong <b>5 phút</b>. Vui lòng không chia sẻ mã này cho bất kỳ ai.</p>
                </div>
            `
        };

        return await transporter.sendMail(mailOptions);
    }

    // 2. Hàm xử lý yêu cầu OTP 
    static async requestOTP({ email, type }) {
        // 1. Tìm User (Lúc này email đã là chuỗi String chuẩn)
        const user = await prisma.user.findUnique({ 
            where: { email: email } 
        });

        if (!user) throw new Error("Email không tồn tại trong hệ thống!");

        // 2. Dọn dẹp mã cũ
        await prisma.verificationCode.deleteMany({
            where: { userId: user.id, type: type }
        });

        // 3. Tạo mã mới
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

        await prisma.verificationCode.create({
            data: {
                code,
                type,
                expiresAt,
                userId: user.id
            }
        });

        // 4. Gửi email
        await this.sendEmailOTP(email, code, type);

        return { userId: user.id, email: user.email };
    }

    // 3. Hàm xác minh mã OTP người dùng nhập
    static async verifyOTP(userId, code, type) {
        const record = await prisma.verificationCode.findFirst({
            where: {
                userId: Number(userId),
                code: code,
                type: type,
                expiresAt: { gt: new Date() } // Phải còn hạn
            },
            orderBy: { createdAt: 'desc' }
        });

        if (!record) throw new Error("Mã xác minh không đúng hoặc đã hết hạn");

        // Xóa mã sau khi dùng xong để bảo mật
        await prisma.verificationCode.deleteMany({
            where: { userId: Number(userId), type: type }
        });

        return true;
    }
}

module.exports = AuthService;