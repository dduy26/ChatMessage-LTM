const router = require("express").Router();
const UserController = require("../controllers/user.controller");
const authorize = require("../middlewares/role.middleware");
const authMiddleware = require("../middlewares/auth.middleware");

// CRUD
router.post("/", UserController.create);
router.get("/", UserController.getAll);
router.get("/:id", UserController.getAllById);
router.put("/:id", UserController.update);
router.delete("/:id", UserController.remove);

router.get("/", authMiddleware, authorize("ADMIN"), UserController.getAll);
router.delete("/:id", authMiddleware, authorize("ADMIN"), UserController.remove);


module.exports = router;
