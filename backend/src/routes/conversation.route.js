const router = require("express").Router();
const ConversationController = require("../controllers/conversation.controller");
const MessageController = require("../controllers/message.controller");

router.post("/", ConversationController.create);
router.get("/", ConversationController.getAll);
router.get("/:id", ConversationController.getById);
router.put("/:id", ConversationController.update);
router.delete("/:id", ConversationController.remove);

router.post("/:conversationId/messages", MessageController.create);
router.get("/:conversationId/messages", MessageController.getByConversation);

module.exports = router;
