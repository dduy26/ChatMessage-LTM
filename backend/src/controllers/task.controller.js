const TaskService = require("../services/task.service");

class TaskController {
    static async create(req, res) {
        try {
            const task = await TaskService.create(req.body);
            res.status(201).json(task);
        } catch (err) {
            console.error("Lỗi tạo Task:", err);
            res.status(400).json({ error: "Không thể tạo Task", detail: err.message });
        }
    }

    static async getByConversation(req, res) {
        try {
            const tasks = await TaskService.getByConversation(req.params.conversationId);
            res.json(tasks);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    static async update(req, res) {
        try {
            const task = await TaskService.update(req.params.id, req.body);
            res.json(task);
        } catch (err) {
            console.error(err);
            res.status(400).json({ 
            error: "Cập nhật thất bại", 
            detail: err.message // Thêm dòng này để xem lỗi thật trong Postman
        });
        }
    }

    static async remove(req, res) {
        try {
            await TaskService.delete(req.params.id);
            res.json({ message: "Đã xóa Task thành công" });
        } catch (err) {
            res.status(404).json({ error: "Task không tồn tại" });
        }
    }
}

module.exports = TaskController;