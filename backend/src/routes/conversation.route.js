const router = require("express").Router();
const ConversationController = require("../controllers/conversation.controller");
const MessageController = require("../controllers/message.controller");
const authMiddleware = require("../middlewares/auth.middleware");

// Tạo cuộc hội thoại mới
router.post("/", authMiddleware, ConversationController.create); 

// Lấy danh sách tất cả hội thoại của User
router.get("/", authMiddleware, ConversationController.getAll); 

// Gửi tin nhắn vào hội thoại
router.post("/:conversationId/messages", authMiddleware, MessageController.create); 

// Lấy danh sách tin nhắn của hội thoại
router.get("/:conversationId/messages", authMiddleware, MessageController.getByConversation); 

router.get("/:id", authMiddleware, ConversationController.getById); 
router.put("/:id", authMiddleware, ConversationController.update);
router.delete("/:id", authMiddleware, ConversationController.remove);

module.exports = router;
