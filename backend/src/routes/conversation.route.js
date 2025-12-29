const router = require("express").Router();
const ConversationController = require("../controllers/conversation.controller");

router.post("/", ConversationController.create);
router.get("/", ConversationController.getAll);
router.get("/:id", ConversationController.getById);
router.put("/:id", ConversationController.update);
router.delete("/:id", ConversationController.remove);

module.exports = router;
const MessageController = require("../controllers/message.controller");

// Tạo cuộc hội thoại mới (Cần thiết!)
router.post("/", ConversationController.create); 

// Lấy danh sách tất cả hội thoại của User (Cần thiết!)
router.get("/", ConversationController.getAll); 

// Gửi tin nhắn vào hội thoại
router.post("/:conversationId/messages", MessageController.create); 

// Lấy danh sách tin nhắn của hội thoại
router.get("/:conversationId/messages", MessageController.getByConversation); 


router.get("/:id", ConversationController.getById); 
router.put("/:id", ConversationController.update);
router.delete("/:id", ConversationController.remove);

module.exports = router;
