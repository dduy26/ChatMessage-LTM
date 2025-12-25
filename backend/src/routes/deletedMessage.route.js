const express = require("express");
const router = express.Router();
const DeletedMessageController = require("../controllers/deletedMessage.controller");

// POST: Ẩn tin nhắn phía tôi
router.post("/:messageId", DeletedMessageController.deleteForMe);

// DELETE: Khôi phục tin nhắn đã ẩn
router.delete("/:messageId", DeletedMessageController.undoDeleteForMe);

module.exports = router;