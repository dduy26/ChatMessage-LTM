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
            // 1. Kiểm tra dữ liệu từ Middleware 
            if (!req.user) {
                return res.status(401).json({ error: "Bạn chưa đăng nhập hoặc phiên làm việc hết hạn" });
            }

            // 2. Lấy ĐÚNG trường 'userId' từ Token
            const rawId = req.user.userId; 

            // 3. Ép kiểu về số nguyên để đảm bảo khớp với kiểu Int trong Schema
            const numericUserId = parseInt(rawId, 10);

            // 4. Kiểm tra NaN ngay tại Controller để tránh truyền lỗi xuống Service
            if (isNaN(numericUserId)) {
                console.error("Lỗi: Không tìm thấy userId hợp lệ trong req.user:", req.user);
                return res.status(400).json({ error: "ID người dùng không hợp lệ (NaN)" });
            }

            // 5. Gọi Service tìm kiếm người dùng
            const user = await UserService.getById(numericUserId);

            // 6. Kiểm tra nếu không tìm thấy người dùng trong DB
            if (!user) {
                return res.status(404).json({ error: "Tài khoản không tồn tại trên hệ thống" });
            }

            // 7. Loại bỏ mật khẩu trước khi trả về dữ liệu cho FE
            const { password, ...safeUserData } = user;
            return res.status(200).json(safeUserData);

        } catch (error) {
            console.error("Lỗi tại getProfile Controller:", error);
            return res.status(500).json({ error: "Lỗi hệ thống: " + error.message });
        }
    }

    static async updateProfile(req, res) {
        try {
            // Lấy userId từ authMiddleware đã decode
            const userId = parseInt(req.user.userId, 10); 
            const { fullName, phoneNumber, avatar } = req.body;

            const updatedUser = await prisma.user.update({
                where: { id: userId },
                data: { fullName, phoneNumber, avatar }
            });

            const { password, ...safeData } = updatedUser;
            res.status(200).json({ message: "Cập nhật thành công", user: safeData });
        } catch (error) {
            res.status(400).json({ error: "Lỗi cập nhật: " + error.message });
        }
    }
}

module.exports = UserController;