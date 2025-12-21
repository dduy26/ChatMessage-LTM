const router = require("express").Router();
const MessageController = require("../controllers/message.controller");

router.post("/conversations/:id/messages", MessageController.create);
router.get("/conversations/:id/messages", MessageController.getAll);
router.get("/messages/:messageId", MessageController.getById);
router.put("/messages/:messageId", MessageController.update);
router.delete("/messages/:messageId", MessageController.remove);

module.exports = router;
