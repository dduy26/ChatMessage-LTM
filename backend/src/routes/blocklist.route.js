const express = require("express");
const router = express.Router();
const BlockListController = require("../controllers/blocklist.controller");

router.post("/block", BlockListController.block);
router.post("/unblock", BlockListController.unblock);
router.get("/:userId", BlockListController.getMyList);

module.exports = router;