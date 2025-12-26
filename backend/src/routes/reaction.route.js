const express = require("express");
const router = express.Router();
const ReactionController = require("../controllers/reaction.controller");

// Thả hoặc đổi emoji: POST /api/reactions/:messageId
router.post("/:messageId", ReactionController.toggle);

// Xem ai đã thả gì: GET /api/reactions/:messageId
router.get("/:messageId", ReactionController.getByMessage);

module.exports = router;