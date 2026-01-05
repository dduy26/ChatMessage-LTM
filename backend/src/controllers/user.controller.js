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
            
            const user = await UserService.hardDelete(id); 
            res.json({ message: "Đã xóa vĩnh viễn tài khoản!", user });
        } catch(err) {
            res.status(400).json({ error: "Không thể xóa: " + err.message });
        }
    }

    static async getProfile(req, res) {
        try {
            // 1. Phải dùng '.userId' vì AuthController lưu như vậy
            const userIdFromToken = req.user?.userId; 

            // 2. Kiểm tra nếu không lấy được ID từ token
            if (!userIdFromToken) {
                console.error("❌ Không tìm thấy userId trong req.user:", req.user);
                return res.status(401).json({ error: "Token không chứa userId hợp lệ" });
            }

            // 3. Truyền trực tiếp userIdFromToken vào Service (Service sẽ tự ép kiểu)
            const user = await UserService.getById(userIdFromToken);

            if (!user) {
                return res.status(404).json({ error: "Tài khoản không tồn tại" });
            }

            return res.status(200).json(user);
        } catch (error) {
            console.error("Lỗi getProfile:", error);
            return res.status(500).json({ error: "Lỗi hệ thống: " + error.message });
        }
    }
}

module.exports = UserController;