const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/auth.controller');

router.post('/request-otp', AuthController.requestOTP);
router.post('/verify-otp', AuthController.verifyOTP);

module.exports = router;