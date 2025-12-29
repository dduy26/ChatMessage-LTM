const prisma = require("../config/prisma");
const nodemailer = require("nodemailer");

// Khởi tạo Transporter một lần duy nhất để dùng chung
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

class AuthService {
    // 1. Hàm gửi email linh hoạt
    static async sendEmailOTP(to, code, type) {
        // Cấu hình tiêu đề và thông điệp theo từng loại
        const emailContent = {
            "REGISTER": {
                subject: "Xác minh đăng ký tài khoản mới",
                title: "Kích hoạt tài khoản",
                desc: "Cảm ơn bạn đã tham gia. Mã xác nhận đăng ký của bạn là:"
            },
            "FORGOT_PASSWORD": {
                subject: "Khôi phục mật khẩu tài khoản",
                title: "Đặt lại mật khẩu",
                desc: "Bạn đã yêu cầu đặt lại mật khẩu. Mã xác minh của bạn là:"
            },
            "VERIFY_DEVICE": {
                subject: "Cảnh báo đăng nhập thiết bị lạ",
                title: "Xác minh thiết bị",
                desc: "Hệ thống phát hiện đăng nhập từ thiết bị mới. Mã xác minh là:"
            }
        };

        // Lấy nội dung tương ứng hoặc dùng mặc định
        const content = emailContent[type] || {
            subject: "Mã xác minh hệ thống",
            title: "Xác minh OTP",
            desc: "Mã xác minh của bạn là:"
        };

        const mailOptions = {
            from: `"Zalo Support" <${process.env.EMAIL_USER}>`,
            to: to,
            subject: content.subject,
            html: `
                <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 500px; margin: auto; border: 1px solid #e0e0e0; border-radius: 10px; padding: 20px; color: #333;">
                    <div style="text-align: center; border-bottom: 2px solid #007bff; padding-bottom: 10px; margin-bottom: 20px;">
                        <h2 style="color: #007bff; margin: 0;">${content.title}</h2>
                    </div>
                    <p style="font-size: 16px;">${content.desc}</p>
                    <div style="background: #f8f9fa; border-radius: 5px; padding: 15px; text-align: center; margin: 20px 0;">
                        <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #007bff;">${code}</span>
                    </div>
                    <p style="font-size: 14px; color: #666;">Mã này có hiệu lực trong <b>5 phút</b>. Tuyệt đối không chia sẻ mã này cho bất kỳ ai để bảo mật tài khoản.</p>
                    <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                    <p style="font-size: 12px; color: #999; text-align: center;">Đây là email tự động, vui lòng không phản hồi.</p>
                </div>
            `
        };

        return await transporter.sendMail(mailOptions);
    }

    // 2. Hàm yêu cầu mã tổng quát
    static async requestOTP(email, type) {
        // Tìm User
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) throw new Error("Email không tồn tại trong hệ thống!");

        // Xóa tất cả các mã cũ của User này và Loại này (dọn dẹp DB)
        await prisma.verificationCode.deleteMany({
            where: { userId: user.id, type: type }
        });

        // Tạo mã mới
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

        // Lưu bản ghi mới
        await prisma.verificationCode.create({
            data: {
                code,
                type,
                expiresAt,
                userId: user.id
            }
        });

        // Gửi mail dựa trên type
        await this.sendEmailOTP(email, code, type);

        return { userId: user.id, email: user.email };
    }
}

module.exports = AuthService;