const router = require("express").Router();
const ConversationController = require("../controllers/conversation.controller");
const authMiddleware = require("../middlewares/auth.middleware");

// Tất cả các route bên dưới đều cần xác thực
router.use(authMiddleware);

// 1. CHỈ CẦN MỘT POST DUY NHẤT CHO CHAT 1-1
// Route này sẽ xử lý logic: Nếu đã có chat thì trả về, chưa có thì tạo mới
router.post("/direct", ConversationController.createDirect); 

// 2. Tạo cuộc trò chuyện nhóm (giữ nguyên nếu bạn vẫn muốn dùng nhóm)
router.post("/group", ConversationController.createGroup);

// 3. Lấy danh sách hội thoại để hiển thị ở Sidebar
router.get("/", ConversationController.getAll); 

// 4. Các route bổ trợ khác
router.get("/:id", ConversationController.getById); 
router.put("/:id", ConversationController.update);
router.delete("/:id", ConversationController.remove);

module.exports = router;