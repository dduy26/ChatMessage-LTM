// src/services/email.service.js
const nodemailer = require('nodemailer');
const prisma = require("../config/prisma");

class EmailService {
    static async sendOTP(targetEmail, code) {
        // KIỂM TRA: Nếu targetEmail không có giá trị, dừng lại ngay để tránh lỗi 500
        if (!targetEmail) {
            throw new Error("Target email is undefined - No recipients defined");
        }

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const mailOptions = {
            // Sửa lại: Dùng đúng email người gửi để tránh bị đánh dấu spam
            from: `"Zalo Clone" <${process.env.EMAIL_USER}>`, 
            to: targetEmail, // Biến này PHẢI có giá trị
            subject: 'Mã xác minh tài khoản',
            html: `<h3>Mã xác minh của bạn là: <b style="color: blue;">${code}</b></h3>
                    <p>Mã này sẽ hết hạn sau 5 phút. Vui lòng không chia sẻ cho bất kỳ ai.</p>`
        };

        console.log("Đang gửi mail tới:", targetEmail); // Debug xem email có đúng không
        return await transporter.sendMail(mailOptions);
    }

    // Các hàm saveOTP và verifyOTP của bạn đã ổn
    static async saveOTP(userId, code, type) {
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
        return await prisma.verificationCode.create({
            data: { code, type, expiresAt, userId: Number(userId) } // Nên ép kiểu Number cho chắc
        });
    }

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

        await prisma.verificationCode.deleteMany({ 
            where: { userId: Number(userId), type } 
        });
        return true;
    }
}

module.exports = EmailService;