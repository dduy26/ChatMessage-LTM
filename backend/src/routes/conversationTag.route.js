const express = require("express");
const router = express.Router();
const ConversationTagController = require("../controllers/conversationTag.controller");

// Gắn tag vào hội thoại
router.post("/:conversationId", ConversationTagController.assign);

// Lấy danh sách tag của hội thoại
router.get("/:conversationId", ConversationTagController.getTags);

// Gỡ tag khỏi hội thoại
router.delete("/:conversationId/:tagId", ConversationTagController.remove);

module.exports = router;