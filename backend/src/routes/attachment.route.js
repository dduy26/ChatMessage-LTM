const express = require("express");
const router = express.Router();
const AttachmentController = require("../controllers/attachment.controller");

// Route CRUD cho Attachment
router.post("/", AttachmentController.create);
router.get("/message/:messageId", AttachmentController.getByMessage);
router.delete("/:id", AttachmentController.remove);

module.exports = router;