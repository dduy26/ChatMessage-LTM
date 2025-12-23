const router = require("express").Router();
const ParticipantController = require("../controllers/participant.controller");

// 1. Thêm thành viên vào nhóm
// POST: http://localhost:5000/api/participants
router.post("/", ParticipantController.create);

// 2. Lấy danh sách thành viên của 1 hội thoại
// GET: http://localhost:5000/api/participants/conversation/:conversationId
router.get("/conversation/:conversationId", ParticipantController.getByConversation);

// 3. Cập nhật vai trò (ADMIN/MEMBER)
// PUT: http://localhost:5000/api/participants/conversation/:conversationId/user/:userId
router.put("/conversation/:conversationId/user/:userId", ParticipantController.updateRole);

// 4. Xóa thành viên hoặc Rời nhóm
// DELETE: http://localhost:5000/api/participants/conversation/:conversationId/user/:userId
router.delete("/conversation/:conversationId/user/:userId", ParticipantController.remove);

module.exports = router;