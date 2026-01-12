const UserService = require("../services/user.service");
const prisma = require("../config/prisma");

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
            if (!req.user) {
                return res.status(401).json({ error: "Bạn chưa đăng nhập hoặc phiên làm việc hết hạn" });
            }
            const rawId = req.user.userId; 
            const numericUserId = parseInt(rawId, 10);

            if (isNaN(numericUserId)) {
                console.error("Lỗi: Không tìm thấy userId hợp lệ trong req.user:", req.user);
                return res.status(400).json({ error: "ID người dùng không hợp lệ (NaN)" });
            }

            const user = await UserService.getById(numericUserId);

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
            const userId = parseInt(req.user.userId, 10); 
            const { fullName, phoneNumber, bio, status } = req.body; 

            const updatedUser = await prisma.user.update({
                where: { id: userId },
                data: { 
                    fullName, 
                    phoneNumber, 
                    bio
                }
            });

            const { password, ...safeData } = updatedUser;
            res.status(200).json({ 
                message: "Cập nhật hồ sơ thành công", 
                user: safeData 
            });
        } catch (error) {
            console.error("Lỗi updateProfile:", error);
            res.status(400).json({ error: "Lỗi cập nhật: " + error.message });
        }
    }

    static async updateAvatar(req, res) {
        try {
            const userId = req.user.userId; 
            if (!req.file) return res.status(400).json({ error: "Vui lòng chọn ảnh" });

            const avatarUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
            const updatedUser = await prisma.user.update({
                where: { id: Number(userId) },
                data: { avatar: avatarUrl }
            });

            const { password, ...safeData } = updatedUser;

            res.status(200).json({ 
                message: "Cập nhật ảnh đại diện thành công", 
                avatar: avatarUrl,
                user: safeData 
            });
        } catch (error) {
            console.error("Lỗi upload avatar:", error);
            res.status(500).json({ error: "Lỗi hệ thống: " + error.message });
        }
    }
}

module.exports = UserController;