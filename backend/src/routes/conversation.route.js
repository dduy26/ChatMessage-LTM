const router = require("express").Router();
const ConversationController = require("../controllers/conversation.controller");
const MessageController = require("../controllers/message.controller");

// --- Các route cho Conversation ---
router.post("/", ConversationController.create);
router.get("/", ConversationController.getAll);
router.get("/:id", ConversationController.getById);
router.put("/:id", ConversationController.update);
router.delete("/:id", ConversationController.remove);

// --- Các route cho Message thuộc về Conversation ---
// Đảm bảo dùng đúng tên hàm "getAll" từ MessageController
router.post("/:conversationId/messages", MessageController.create);
router.get("/:conversationId/messages", MessageController.getByConversation); 

module.exports = router;