const router = require("express").Router();
const ConversationController = require("../controllers/conversation.controller");
const authMiddleware = require("../middlewares/auth.middleware");

// --- QUAN TRỌNG: Kích hoạt Middleware ---
// Dòng này phải nằm TRÊN các route bên dưới.
// Nó đảm bảo req.user luôn tồn tại trước khi vào Controller.
router.use(authMiddleware); 

// --- Định nghĩa Route Conversation ---

// 1. Tạo hội thoại mới (POST /api/conversations)
router.post("/", ConversationController.create);

// 2. Lấy danh sách hội thoại của mình (GET /api/conversations)
router.get("/", ConversationController.getAll);

// 3. Lấy chi tiết, Sửa, Xóa
router.get("/:id", ConversationController.getById);
router.put("/:id", ConversationController.update);
router.delete("/:id", ConversationController.remove);

module.exports = router;