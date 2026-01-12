const router = require("express").Router();
const UserController = require("../controllers/user.controller");
const authorize = require("../middlewares/role.middleware");
const authMiddleware = require("../middlewares/auth.middleware");
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir); 
    },
    filename: (req, file, cb) => {
        cb(null, "avatar-" + Date.now() + path.extname(file.originalname)); 
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 2 * 1024 * 1024 } // Giới hạn 2MB
});

router.post('/upload-avatar', authMiddleware, upload.single('avatar'), UserController.updateAvatar);
router.get("/profile", authMiddleware, UserController.getProfile);
router.put("/update", authMiddleware, UserController.updateProfile);
router.get("/", authMiddleware, authorize("ADMIN"), UserController.getAll);
router.get("/:id", authMiddleware, authorize("ADMIN"), UserController.getAllById);
router.delete("/:id", authMiddleware, authorize("ADMIN"), UserController.remove);

module.exports = router;