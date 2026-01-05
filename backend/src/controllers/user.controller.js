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
            console.log("Dữ liệu Payload từ Token:", req.user); 
            console.log("req.user.userId:", req.user.userId);
            console.log("req.user.id:", req.user.id);

            const userId = req.user.userId || req.user.id;

            if (!userId) {
                console.error("Token không chứa userId hoặc id");
                return res.status(400).json({ message: "Token không chứa ID hợp lệ" });
            }

            // Đảm bảo userId là số
            const numericUserId = Number(userId);
            console.log("userId sau khi convert:", numericUserId);
            
            if (isNaN(numericUserId) || numericUserId <= 0) {
                console.error("❌ userId không hợp lệ:", userId);
                return res.status(400).json({ message: "ID người dùng không hợp lệ" });
            }

            console.log("Đang tìm user với id:", numericUserId);
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
            return res.status(500).json({ message: "Lỗi hệ thống: " + error.message });
        }
    }
}

module.exports = UserController;