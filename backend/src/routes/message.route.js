const router = require("express").Router();
const MessageController = require("../controllers/message.controller");

// Lấy chi tiết một tin nhắn
// URL: GET /api/messages/:messageId
router.get("/:messageId", MessageController.getById);

// Cập nhật nội dung tin nhắn
// URL: PUT /api/messages/:messageId
router.put("/:messageId", MessageController.update);

// Xóa tin nhắn
// URL: DELETE /api/messages/:messageId
router.delete("/:messageId", MessageController.remove);

module.exports = router;