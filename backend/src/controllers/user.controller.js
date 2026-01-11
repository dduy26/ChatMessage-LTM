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
            req.json(user);
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
            // req.user được lấy từ Auth Middleware sau khi giải mã token
            const userId = req.user.userId;

            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { id: true, email: true, fullName: true, avatar: true, phoneNumber: true, username: true } // Không trả về password
            });

            if (!user) return res.status(404).json({ error: "Người dùng không tồn tại" });

            return res.status(200).json(user);
        } catch (error) {
            return res.status(500).json({ error: "Lỗi lấy thông tin: " + error.message });
        }
    }
}

module.exports = UserController;