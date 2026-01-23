const express = require("express");
const router = express.Router();
const BlockListController = require("../controllers/blocklist.controller");
const authMiddleware = require("../middlewares/auth.middleware");

// Tất cả route blocklist đều yêu cầu đăng nhập
router.use(authMiddleware);

// Chặn / bỏ chặn và lấy danh sách chặn của chính mình
router.post("/block", BlockListController.block);
router.post("/unblock", BlockListController.unblock);
router.get("/me", BlockListController.getMyList);

module.exports = router;