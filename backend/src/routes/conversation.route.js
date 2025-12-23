const router = require("express").Router();
const ConversationController = require("../controllers/conversation.controller");

router.post("/", ConversationController.create);
router.get("/", ConversationController.getAll);
router.get("/:id", ConversationController.getById);
router.put("/:id", ConversationController.update);
router.delete("/:id", ConversationController.remove);

module.exports = router;
