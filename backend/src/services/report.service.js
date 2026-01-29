const prisma = require("../config/prisma");
const { decryptText } = require("../utils/encryption");

class ReportService {
    // Tạo báo cáo mới
    static async create(data) {
        return await prisma.report.create({
            data: {
                reporterId: Number(data.reporterId),
                reportedUserId: data.reportedUserId ? Number(data.reportedUserId) : null,
                conversationId: data.conversationId ? Number(data.conversationId) : null,
                messageId: data.messageId ? Number(data.messageId) : null,
                reason: data.reason,
            },
            include: {
                reporter: { select: { username: true, fullName: true } },
                reportedUser: { select: { username: true } }
            }
        });
    }

    // Lấy tất cả báo cáo (Cho Admin)
    static async getAll() {
        const reports = await prisma.report.findMany({
            include: {
                reporter: { select: { id: true, username: true, fullName: true } },
                reportedUser: { select: { id: true, username: true } },
                conversation: { select: { id: true } },
                message: { select: { id: true, content: true } }
            },
            orderBy: { createdAt: "desc" }
        });

        return (reports || []).map((r) => ({
            ...r,
            message: r.message
                ? { ...r.message, content: decryptText(r.message.content) }
                : r.message,
        }));
    }

    // Lấy chi tiết một báo cáo
    static async getById(id) {
        const report = await prisma.report.findUnique({
            where: { id: Number(id) },
            include: {
                reporter: true,
                reportedUser: true,
                conversation: true,
                message: true
            }
        });

        if (!report) return report;
        if (report.message && report.message.content != null) {
            report.message = { ...report.message, content: decryptText(report.message.content) };
        }
        return report;
    }

    // Cập nhật trạng thái báo cáo (Ví dụ: Đã xử lý)
    static async updateStatus(id, status) {
        const reportId = Number(id);
        
        // Kiểm tra xem nó có tồn tại không trước khi update
        const exists = await prisma.report.findUnique({ where: { id: reportId } });
        if (!exists) throw new Error(`Không tìm thấy báo cáo với ID: ${id}`);

        return await prisma.report.update({
            where: { id: reportId },
            data: { status }
        });
    }

    // Xóa báo cáo
    static async delete(id) {
        const reportId = Number(id);

        const exists = await prisma.report.findUnique({ where: { id: reportId } });
        if (!exists) throw new Error(`Không thể xóa vì báo cáo ID ${id} không tồn tại`);

        return await prisma.report.delete({
            where: { id: reportId }
        });
    }
}

module.exports = ReportService;