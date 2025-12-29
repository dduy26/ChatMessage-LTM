const nodemailer = require('nodemailer');
const prisma = require("../config/prisma");

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

class EmailService {
    // 1. Hàm gửi mail thật
    static async sendOTP(targetEmail, code) {
        if (!targetEmail || targetEmail === "") {
            throw new Error("Target email is undefined - No recipients defined");
        }

        const mailOptions = {
            from: `"Zalo Clone Support" <${process.env.EMAIL_USER}>`, 
            to: targetEmail, 
            subject: 'Mã xác minh tài khoản',
            html: `
                <div style="font-family: Arial, sans-serif; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
                    <h2 style="color: #007bff;">Mã xác minh của bạn</h2>
                    <p>Chào bạn, mã OTP để xác thực tài khoản của bạn là:</p>
                    <div style="background: #f4f4f4; padding: 10px; text-align: center;">
                        <span style="font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #007bff;">${code}</span>
                    </div>
                    <p>Mã này có hiệu lực trong <b>5 phút</b>. Vui lòng không chia sẻ mã này cho bất kỳ ai.</p>
                </div>
            `
        };

        console.log(">>> [Nodemailer] Đang gửi mail tới:", targetEmail);
        return await transporter.sendMail(mailOptions);
    }

    // 2. Lưu OTP vào Database (Cần xóa các OTP cũ trước khi lưu mới)
    static async saveOTP(userId, code, type) {
        await prisma.verificationCode.deleteMany({
            where: { userId: Number(userId), type: type }
        });

        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
        return await prisma.verificationCode.create({
            data: { 
                code, 
                type, 
                expiresAt, 
                userId: Number(userId) 
            }
        });
    }

    // 3. Xác minh OTP
    static async verifyOTP(userId, code, type) {
        const record = await prisma.verificationCode.findFirst({
            where: {
                userId: Number(userId),
                code,
                type,
                expiresAt: { gt: new Date() }
            },
            orderBy: { createdAt: 'desc' }
        });

        if (!record) throw new Error("Mã xác minh không hợp lệ hoặc đã hết hạn");

        // Xóa mã sau khi xác thực thành công
        await prisma.verificationCode.deleteMany({ 
            where: { userId: Number(userId), type } 
        });
        return true;
    }
}

module.exports = EmailService;