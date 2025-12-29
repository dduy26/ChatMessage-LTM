// backend/src/routes/auth.route.js
const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/auth.controller');

// Đảm bảo là route POST và gọi đúng hàm requestOTP
router.post('/request-otp', AuthController.requestOTP);
router.post('/verify-otp', AuthController.verifyOTP);

module.exports = router;