const router = require("express").Router();
const UserController = require("../controllers/user.controller");

// CRUD
router.post("/", UserController.create);
router.get("/", UserController.getAll);
router.get("/:id", UserController.getAllById);
router.put("/:id", UserController.update);
router.delete("/:id", UserController.remove);

module.exports = router;
