const ReportService = require("../services/report.service");

class ReportController {
    static async create(req, res) {
        try {
            const report = await ReportService.create(req.body);
            res.status(201).json({ message: "Gửi báo cáo thành công", report });
        } catch (err) {
            res.status(400).json({ error: err.message });
        }
    }

    static async getAll(req, res) {
        try {
            const reports = await ReportService.getAll();
            res.json(reports);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    static async updateStatus(req, res) {
        try {
            const { id } = req.params;
            const { status } = req.body;
            const updated = await ReportService.updateStatus(id, status);
            res.json({ message: "Đã cập nhật trạng thái báo cáo", updated });
        } catch (err) {
            res.status(400).json({ error: err.message });
        }
    }

    static async delete(req, res) {
        try {
            const { id } = req.params;
            await ReportService.delete(id);
            res.json({ message: "Đã xóa báo cáo" });
        } catch (err) {
            res.status(400).json({ error: err.message });
        }
    }
}

module.exports = ReportController;