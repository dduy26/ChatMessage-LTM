const router = require("express").Router();
const MessageController = require("../controllers/message.controller");

// 1. Tạo tin nhắn mới (Cần có :conversationId trên URL)
// URL: POST /api/messages/:conversationId
router.post("/:conversationId", MessageController.create);

// 2. Lấy danh sách tin nhắn của một cuộc hội thoại
// URL: GET /api/messages/conversation/:conversationId
router.get("/conversation/:conversationId", MessageController.getByConversation);


// Lấy chi tiết một tin nhắn
router.get("/:messageId", MessageController.getById);

// Cập nhật nội dung tin nhắn
router.put("/:messageId", MessageController.update);

// Xóa tin nhắn
router.delete("/:messageId", MessageController.remove);

module.exports = router;