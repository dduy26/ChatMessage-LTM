const router = require('express').Router();
const prisma = require('../config/prisma');

router.get('/', (req, res) => {
    res.json({ status: 'OK' });
});

// Endpoint để kiểm tra cấu hình môi trường và database
router.get('/env-check', async (req, res) => {
    try {
        const envCheck = {
            DATABASE_URL: process.env.DATABASE_URL ? '✅ Đã cấu hình' : '❌ Chưa cấu hình',
            JWT_SECRET: process.env.JWT_SECRET ? '✅ Đã cấu hình' : '❌ Chưa cấu hình',
            REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET ? '✅ Đã cấu hình' : '⚠️ Chưa cấu hình (dùng mặc định)',
            EMAIL_USER: process.env.EMAIL_USER ? '✅ Đã cấu hình' : '⚠️ Chưa cấu hình',
            EMAIL_PASS: process.env.EMAIL_PASS ? '✅ Đã cấu hình' : '⚠️ Chưa cấu hình',
            PORT: process.env.PORT || '5000 (mặc định)'
        };

        // Kiểm tra kết nối database
        let dbStatus = '❌ Lỗi kết nối';
        let userCount = 0;
        try {
            await prisma.$queryRaw`SELECT 1`;
            dbStatus = '✅ Kết nối thành công';
            
            // Đếm số user trong database
            userCount = await prisma.user.count();
        } catch (error) {
            dbStatus = `❌ Lỗi: ${error.message}`;
        }

        res.json({
            environment: envCheck,
            database: dbStatus,
            userCount: userCount,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Endpoint để kiểm tra user có tồn tại trong DB không (debug)
router.get('/check-user/:email', async (req, res) => {
    try {
        const { email } = req.params;
        const user = await prisma.user.findUnique({
            where: { email },
            select: {
                id: true,
                email: true,
                username: true,
                fullName: true,
                createdAt: true
            }
        });

        if (!user) {
            return res.status(404).json({ 
                exists: false, 
                message: "User không tồn tại trong database" 
            });
        }

        return res.json({
            exists: true,
            user: user,
            message: "User tồn tại trong database"
        });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});

module.exports = router;
