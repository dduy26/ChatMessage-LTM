const router = require("express").Router();
const NotificationController = require("../controllers/notification.controller");

router.post("/", NotificationController.create);
router.get("/user/:userId", NotificationController.getMyNotifications);
router.put("/:id/read", NotificationController.read); 
router.delete("/:id", NotificationController.remove);

module.exports = router;