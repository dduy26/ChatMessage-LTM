// backend/src/controllers/auth.controller.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const register = async (req, res) => {
    try {
        const { username, email, password, fullName } = req.body;

        // Kiểm tra user tồn tại
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { username: username },
                    { email: email }
                ]
            }
        });

        if (existingUser) {
            return res.status(400).json({ message: "Username hoặc Email đã tồn tại!" });
        }

        // Mã hóa mật khẩu
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Tạo user mới
        const newUser = await prisma.user.create({
            data: {
                username,
                email,
                password: hashedPassword,
                fullName,
                status: "ONLINE"
            }
        });

        return res.status(201).json({
            message: "Đăng ký thành công!",
            user: { id: newUser.id, username: newUser.username }
        });

    } catch (error) {
        console.error("Lỗi:", error);
        return res.status(500).json({ message: "Lỗi Server" });
    }
};

module.exports = { register };