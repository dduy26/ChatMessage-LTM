const router = require("express").Router();
const UserController = require("../controllers/user.controller");
const authorize = require("../middlewares/role.middleware");
const authMiddleware = require("../middlewares/auth.middleware");
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Ảnh sẽ lưu vào thư mục này
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Đặt tên file duy nhất
    }
});

const upload = multer({ storage: storage });

// Route upload avatar
router.post('/upload-avatar', authMiddleware, upload.single('avatar'), UserController.updateAvatar);

// CRUD
router.post("/", UserController.create);
router.get("/", UserController.getAll);
router.get("/:id", UserController.getAllById);
router.put("/:id", UserController.update);
router.delete("/:id", UserController.remove);

router.get("/", authMiddleware, authorize("ADMIN"), UserController.getAll);
router.delete("/:id", authMiddleware, authorize("ADMIN"), UserController.remove);



module.exports = router;
