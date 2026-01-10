const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/auth.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const UserController = require('../controllers/user.controller');

router.post('/request-otp', AuthController.requestOTP);
router.post('/verify-otp', AuthController.verifyOTP);

router.post('/register', AuthController.register);
router.get('/profile', authMiddleware, UserController.getProfile);

router.post('/login', AuthController.login);

router.post('/forgot-password', AuthController.forgotPassword);
router.post('/reset-password', AuthController.resetPassword);
router.post('/logout', authMiddleware, AuthController.logout);
router.get('/debug-token', AuthController.debugToken); // Endpoint để debug token

module.exports = router;