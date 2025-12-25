const router = require("express").Router();
const TaskController = require("../controllers/task.controller");

// Tạo Task
router.post("/", TaskController.create);

// Lấy danh sách Task của một cuộc hội thoại cụ thể
router.get("/conversation/:conversationId", TaskController.getByConversation);

// Cập nhật Task theo ID
router.put("/:id", TaskController.update);

// Xóa Task theo ID
router.delete("/:id", TaskController.remove);

module.exports = router;