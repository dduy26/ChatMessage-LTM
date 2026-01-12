const router = require("express").Router();
const MessageController = require("../controllers/message.controller");
const authMiddleware = require("../middlewares/auth.middleware");

// --- QUAN TRỌNG: BẮT BUỘC PHẢI CÓ MIDDLEWARE ---
// Để đảm bảo người gửi tin nhắn đã đăng nhập
router.use(authMiddleware);

// --- CÁC ROUTE ---

// 1. Tạo tin nhắn mới
// Bạn có thể giữ :conversationId trên URL nếu Controller của bạn đang lấy req.params.conversationId
// URL: POST /api/messages/:conversationId
router.post("/:conversationId", MessageController.create);

// 2. Lấy danh sách tin nhắn của một cuộc hội thoại
// URL: GET /api/messages/conversation/:conversationId
router.get("/conversation/:conversationId", MessageController.getByConversation);

// 3. Lấy chi tiết một tin nhắn (nếu cần)
router.get("/:messageId", MessageController.getById);

// 4. Cập nhật nội dung tin nhắn (VD: thu hồi, chỉnh sửa)
router.put("/:messageId", MessageController.update);

// 5. Xóa tin nhắn
router.delete("/:messageId", MessageController.remove);

module.exports = router;