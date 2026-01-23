const router = require("express").Router();
const MessageController = require("../controllers/message.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const multer = require("multer");
const { storage } = require("../config/cloudinary");

// Cấu hình multer để xử lý file upload
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 } // Giới hạn 10MB
});

// --- QUAN TRỌNG: BẮT BUỘC PHẢI CÓ MIDDLEWARE ---
// Để đảm bảo người gửi tin nhắn đã đăng nhập
router.use(authMiddleware);

// --- CÁC ROUTE ---

// 1. Tạo tin nhắn mới
// Bạn có thể giữ :conversationId trên URL nếu Controller của bạn đang lấy req.params.conversationId
// URL: POST /api/messages/:conversationId
// Sử dụng upload.array('files') để nhận nhiều file từ FormData với key 'files'
router.post("/:conversationId", (req, res, next) => {
    upload.array('files', 10)(req, res, (err) => {
        if (err) {
            console.error("Multer error:", err);
            // Multer errors
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ error: "File quá lớn. Kích thước tối đa là 10MB" });
            }
            if (err.code === 'LIMIT_FILE_COUNT') {
                return res.status(400).json({ error: "Quá nhiều file. Tối đa 10 file mỗi lần" });
            }
            if (err.code === 'LIMIT_UNEXPECTED_FILE') {
                return res.status(400).json({ error: "Tên field không đúng. Sử dụng 'files' để upload" });
            }
            return res.status(500).json({ error: "Lỗi khi upload file: " + err.message });
        }
        next();
    });
}, MessageController.create);

// 2. Lấy danh sách tin nhắn của một cuộc hội thoại
// URL: GET /api/messages/conversation/:conversationId
router.get("/conversation/:conversationId", MessageController.getByConversation);

// 3. Lấy chi tiết một tin nhắn (nếu cần)
router.get("/:messageId", MessageController.getById);

// 4. Cập nhật nội dung tin nhắn (VD: thu hồi, chỉnh sửa)
router.put("/:messageId", MessageController.update);

// 5. Xóa tin nhắn
router.delete("/:messageId", MessageController.remove);

// 6. Xóa lịch sử trò chuyện
router.delete("/conversation/:conversationId/history", MessageController.deleteConversationHistory);

module.exports = router;