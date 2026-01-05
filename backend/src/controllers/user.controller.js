const UserService = require("../services/user.service");

class UserController {
    // CREATE
    static async create(req,res) {
        try {
            const user = await UserService.create(req.body);
            res.status(201).json(user);
        } catch(err) {
            res.status(400).json({ error: err.message });
        }
    }
    // READ:
    static async getAll(req,res) {
        try {
            const users = await UserService.getAll();
            res.json(users);
        } catch(err) {
            console.error("getAll error:", err);
            res.status(500).json({ error: err.message });
        }
    }
    // READ: by id
    static async getAllById(req,res) {
        try {
            const id = Number(req.params.id);
            const user = await UserService.getById(id);
            if (!user) return res.status(404).json({ message: "Không tìm thấy tài khoản!" });
            res.json(user);
        }catch(err) {
            res.status(400).json({ error: err.message });
        }
    }
    // UPDATE
    static async update(req,res) {
        try {
            const id = Number(req.params.id);
            const user = await UserService.update(id, req.body);
            res.json(user);
        }catch(err) {
            res.status(400).json({ error: err.message});
        }
    }
    // DELETE (soft)
    static async remove(req, res) {
        try {
            const id = Number(req.params.id);
            // Dùng hardDelete để xóa sạch khỏi DB phục vụ việc test đăng ký lại
            const user = await UserService.hardDelete(id); 
            res.json({ message: "Đã xóa vĩnh viễn tài khoản!", user });
        } catch(err) {
            res.status(400).json({ error: "Không thể xóa: " + err.message });
        }
    }

    static async getProfile(req, res) {
        try {
            // Log để kiểm tra payload thực tế từ Token
            console.log("=== DEBUG GET PROFILE ===");
            console.log("req.user:", req.user);
            console.log("req.user type:", typeof req.user);
            console.log("req.user keys:", req.user ? Object.keys(req.user) : "req.user is null/undefined");
            console.log("Dữ liệu Payload từ Token:", JSON.stringify(req.user, null, 2)); 
            console.log("req.user.userId:", req.user?.userId, "(type:", typeof req.user?.userId, ")");
            console.log("req.user.id:", req.user?.id, "(type:", typeof req.user?.id, ")");

            // Kiểm tra req.user có tồn tại không
            if (!req.user) {
                console.error("req.user không tồn tại!");
                return res.status(401).json({ 
                    message: "Token không hợp lệ hoặc chưa được xác thực"
                });
            }

            // Lấy userId từ token - ưu tiên userId trước
            const userId = req.user.userId ?? req.user.id;

            console.log("userId sau khi extract:", userId, "(type:", typeof userId, ")");

            if (userId === null || userId === undefined) {
                console.error("Token không chứa userId hoặc id. Token payload:", req.user);
                return res.status(400).json({ 
                    message: "Token không chứa ID hợp lệ",
                    debug: { tokenPayload: req.user }
                });
            }

            // Đảm bảo userId là số - xử lý cả trường hợp string
            let numericUserId;
            if (typeof userId === 'string') {
                numericUserId = parseInt(userId, 10);
                console.log("userId là string, convert từ:", userId, "->", numericUserId);
            } else {
                numericUserId = Number(userId);
                console.log("userId không phải string, convert từ:", userId, "->", numericUserId);
            }
            
            console.log("userId sau khi convert:", numericUserId, "(type:", typeof numericUserId, ")");
            
            // Kiểm tra kỹ hơn
            if (numericUserId === null || numericUserId === undefined || 
                isNaN(numericUserId) || numericUserId <= 0 || 
                !Number.isInteger(numericUserId)) {
                console.error("userId không hợp lệ sau khi convert:", userId, "->", numericUserId);
                console.error("Chi tiết:", {
                    original: userId,
                    converted: numericUserId,
                    isNaN: isNaN(numericUserId),
                    isInteger: Number.isInteger(numericUserId),
                    isPositive: numericUserId > 0
                });
                return res.status(400).json({ 
                    message: "ID người dùng không hợp lệ",
                    debug: { 
                        originalUserId: userId,
                        convertedUserId: numericUserId,
                        tokenPayload: req.user 
                    }
                });
            }

            console.log("userId hợp lệ, đang tìm user với id:", numericUserId, "(type:", typeof numericUserId, ")");
            const user = await UserService.getById(numericUserId);

            if (!user) {
                console.error("Không tìm thấy user với id:", numericUserId);
                return res.status(404).json({ 
                    message: "Không tìm thấy tài khoản!",
                    debug: {
                        userId: numericUserId,
                        tokenPayload: req.user
                    }
                });
            }

            console.log("Tìm thấy user:", user.id, user.email);
            return res.status(200).json(user);
        } catch (error) {
            console.error("Lỗi getProfile:", error);
            console.error("Stack trace:", error.stack);
            return res.status(500).json({ message: "Lỗi hệ thống: " + error.message });
        }
    }
}

module.exports = UserController;