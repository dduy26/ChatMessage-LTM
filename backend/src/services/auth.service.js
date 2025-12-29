const prisma = require("../config/prisma");
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

class AuthService {
    // 1. Gửi Email OTP
    static async sendEmailOTP(to, code, type) {
        if (!to || typeof to !== 'string') throw new Error("No recipients defined");

        const emailContent = {
            "REGISTER": { subject: "Kích hoạt tài khoản Zalo Clone", title: "Chào mừng thành viên mới!", desc: "Cảm ơn bạn đã đăng ký. Mã xác nhận của bạn là:" },
            "FORGOT_PASSWORD": { subject: "Khôi phục mật khẩu", title: "Đặt lại mật khẩu", desc: "Chúng tôi nhận được yêu cầu đổi mật khẩu. Mã xác minh của bạn là:" },
            "VERIFY_DEVICE": { subject: "Xác minh thiết bị mới", title: "Bảo mật tài khoản", desc: "Hệ thống phát hiện đăng nhập từ thiết bị lạ. Mã xác minh của bạn là:" }
        };

        const content = emailContent[type] || { subject: "Xác minh OTP", title: "Mã xác nhận", desc: "Mã xác minh của bạn là:" };

        const mailOptions = {
            from: `"Zalo Clone Security" <${process.env.EMAIL_USER}>`,
            to: to,
            subject: content.subject,
            html: `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7f6; padding: 30px; border-radius: 10px;">
                <div style="max-width: 500px; margin: auto; background: white; padding: 25px; border-radius: 15px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); border-top: 6px solid #0068ff;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <h2 style="color: #0068ff; margin: 0; font-size: 24px;">${content.title}</h2>
                    </div>
                    <p style="color: #444; font-size: 16px; line-height: 1.6; text-align: center;">${content.desc}</p>
                    
                    <div style="background: #ebf3ff; border: 2px dashed #0068ff; border-radius: 10px; padding: 20px; text-align: center; margin: 25px 0;">
                        <span style="font-size: 36px; font-weight: bold; color: #0068ff; letter-spacing: 10px;">${code}</span>
                    </div>
                    
                    <p style="color: #888; font-size: 13px; text-align: center; margin-top: 20px;">
                        Mã này có hiệu lực trong <b>5 phút</b>. Vì lý do bảo mật, tuyệt đối không chia sẻ mã này cho bất kỳ ai.
                    </p>
                    <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                    <p style="color: #bbb; font-size: 11px; text-align: center;">
                        Đây là email tự động, vui lòng không phản hồi.<br>
                        © 2025 Zalo Clone - Hệ thống bảo mật 2 lớp.
                    </p>
                </div>
            </div>
            `
        };

        return await transporter.sendMail(mailOptions);
    }

    // 2. Yêu cầu mã OTP
    static async requestOTP({ email, type }) {
        if (!email) throw new Error("Email không được để trống");

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) throw new Error("Email không tồn tại trong hệ thống!");

        const code = Math.floor(100000 + Math.random() * 900000).toString();

        await prisma.verificationCode.upsert({
            where: { userId_type: { userId: user.id, type: type } },
            update: { code, expiresAt: new Date(Date.now() + 5 * 60 * 1000) },
            create: {
                code,
                type,
                userId: user.id,
                expiresAt: new Date(Date.now() + 5 * 60 * 1000)
            }
        });

        await this.sendEmailOTP(email, code, type);
        return { userId: user.id };
    }

    // 3. XÁC MINH MÃ OTP (HÀM BẠN ĐANG THIẾU)
    static async verifyOTP(userId, code, type) {
        // Tìm mã trong database
        const record = await prisma.verificationCode.findFirst({
            where: {
                userId: Number(userId), 
                code: code,
                type: type,
                expiresAt: { gt: new Date() } 
            }
        });

        if (!record) {
            throw new Error("Mã xác minh không đúng hoặc đã hết hạn");
        }

        // Sau khi xác minh thành công, xóa mã để bảo mật
        await prisma.verificationCode.delete({
            where: { id: record.id }
        });

        return true;
    }
}

module.exports = AuthService;