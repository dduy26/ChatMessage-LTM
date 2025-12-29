const router = require('express').Router();
const PinnedController = require('../controllers/pinned.controller');

// Đăng ký các endpoint
router.post('/toggle', PinnedController.togglePin);
router.get('/list', PinnedController.getList);
router.delete('/clear', PinnedController.clearPins);

module.exports = router;