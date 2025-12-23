const router = require("express").Router();
const ConversationController = require("../controllers/conversation.controller");
const MessageController = require("../controllers/message.controller");

// 1. Các route thao tác trực tiếp với Conversation 
router.get("/:id", ConversationController.getById); 
router.put("/:id", ConversationController.update);
router.delete("/:id", ConversationController.remove);

// 2. Các route quản lý tin nhắn trong hội thoại
router.post("/:conversationId/messages", MessageController.create); 
router.get("/:conversationId/messages", MessageController.getByConversation); 

module.exports = router;