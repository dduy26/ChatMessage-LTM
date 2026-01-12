const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/auth.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const UserController = require('../controllers/user.controller');

// Route yêu cầu gửi mã OTP về Email
router.post('/request-otp', AuthController.requestOTP);
router.post('/verify-otp', AuthController.verifyOTP);
router.post("/request-verification", authMiddleware, AuthController.requestVerification);
router.get("/verify-email", AuthController.verifyEmail);

router.post('/register', AuthController.register);
router.get('/profile', authMiddleware, UserController.getProfile);
router.put('/update', authMiddleware, UserController.updateProfile);

router.post('/login', AuthController.login);

router.post('/forgot-password/send-otp', AuthController.forgotPassword);
// Route xác minh OTP và đặt lại mật khẩu
router.post('/forgot-password/reset', AuthController.resetPassword);
router.post("/logout", (req, res) => res.json({success: true, message: "Đăng xuất thành công!" }));
router.get('/debug-token', AuthController.debugToken); // Endpoint để debug token
router.post('/refresh-token', AuthController.refreshToken);

module.exports = router;