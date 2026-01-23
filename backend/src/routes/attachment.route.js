const express = require("express");
const router = express.Router();
const AttachmentController = require("../controllers/attachment.controller");

const authMiddleware = require("../middlewares/auth.middleware");

// Tất cả routes cần authentication
router.use(authMiddleware);

// Route CRUD cho Attachment
router.post("/", AttachmentController.create);
router.get("/message/:messageId", AttachmentController.getByMessage);
router.get("/conversation/:conversationId", AttachmentController.getByConversation);
router.get("/conversation/:conversationId/images", AttachmentController.getImagesByConversation);
router.get("/conversation/:conversationId/files", AttachmentController.getFilesByConversation);
router.delete("/:id", AttachmentController.remove);

module.exports = router;