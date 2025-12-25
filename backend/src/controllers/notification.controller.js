const NotificationService = require("../services/notification.service");

class NotificationController {
    static async create(req, res) {
        try {
        const noti = await NotificationService.create(req.body);
        res.status(201).json(noti);
        } catch (err) {
        res.status(400).json({ error: "Dữ liệu không hợp lệ" });
        }
    }

    static async getMyNotifications(req, res) {
        try {
        const { userId } = req.params;
        const notifications = await NotificationService.getByUserId(userId);
        res.json(notifications);
        } catch (err) {
        res.status(500).json({ error: err.message });
        }
    }

    static async read(req, res) {
        try {
        const noti = await NotificationService.markAsRead(req.params.id);
        res.json(noti);
        } catch (err) {
        res.status(404).json({ error: "Thông báo không tồn tại" });
        }
    }

    static async remove(req, res) {
        try {
        await NotificationService.delete(req.params.id);
        res.json({ message: "Đã xóa thông báo" });
        } catch (err) {
        res.status(400).json({ error: "Xóa thất bại" });
        }
    }
}

module.exports = NotificationController;