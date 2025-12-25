const router = require("express").Router();
const DeviceController = require("../controllers/device.controller");

// [POST] Tạo mới hoặc cập nhật nhanh (Upsert)
router.post("/", DeviceController.register);

// [GET] Lấy danh sách thiết bị của User
router.get("/user/:userId", DeviceController.getMyDevices);

// [PUT] Cập nhật chi tiết thiết bị theo ID
router.put("/:id", DeviceController.update);

// [DELETE] Xóa thiết bị
router.delete("/:id", DeviceController.logoutDevice);

module.exports = router;