const prisma = require("../config/prisma");

class DeviceService {
    // Đăng ký hoặc cập nhật thiết bị (Upsert)
    static async registerDevice(data) {
        return prisma.device.upsert({
        where: { deviceToken: data.deviceToken },
        update: {
            userId: data.userId,
            lastActive: new Date(),
            deviceName: data.deviceName,
            deviceType: data.deviceType
        },
        create: data,
        });
    }

    // Lấy danh sách thiết bị của một User
    static async getByUserId(userId) {
        return prisma.device.findMany({
        where: { userId: Number(userId) },
        orderBy: { lastActive: "desc" },
        });
    }

    // Cập nhật thông tin thiết bị theo ID (Dùng cho lệnh PUT)
    static async update(id, data) {
        return prisma.device.update({
            where: { id: Number(id) },
            data: {
                ...data,
                lastActive: new Date() // Tự động cập nhật thời gian hoạt động
            },
        });
    }

    // Lấy chi tiết 1 thiết bị (Để kiểm tra trước khi thao tác)
    static async getById(id) {
        return prisma.device.findUnique({
            where: { id: Number(id) },
        });
    }
    
    // (Tùy chọn) Lấy tất cả thiết bị - Dùng cho Admin
    static async getAll() {
        return prisma.device.findMany({
            include: { user: true } // Lấy kèm thông tin User để biết thiết bị của ai
        });
    }

    // Xóa thiết bị (Đăng xuất khỏi thiết bị này)
    static async delete(id) {
        return prisma.device.delete({
        where: { id: Number(id) },
        });
    }
}
module.exports = DeviceService;