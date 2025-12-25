const express = require("express");
const router = express.Router();
const ReportController = require("../controllers/report.controller");

router.post("/", ReportController.create);          // Người dùng gửi report
router.get("/", ReportController.getAll);           // Admin xem danh sách
router.patch("/:id", ReportController.updateStatus); // Admin cập nhật trạng thái
router.delete("/:id", ReportController.delete);      // Admin xóa report

module.exports = router;