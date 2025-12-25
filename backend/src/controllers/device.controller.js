const DeviceService = require("../services/device.service");

class DeviceController {
    //Đăng ký hoặc cập nhật thiết bị
    static async register(req, res) {
        try {
        const { userId, deviceToken, deviceType, deviceName } = req.body;

        if (!userId || !deviceToken) {
            return res.status(400).json({ error: "userId và deviceToken là bắt buộc!" });
        }

        const device = await DeviceService.registerDevice({
            userId,
            deviceToken,
            deviceType,
            deviceName
        });

        res.status(201).json(device);
        } catch (err) {
        res.status(500).json({ error: "Lỗi hệ thống: " + err.message });
        }
    }

    // Lấy danh sách thiết bị của một User cụ thể
    static async getMyDevices(req, res) {
        try {
        const { userId } = req.params;
        const devices = await DeviceService.getByUserId(userId);
        res.json(devices);
        } catch (err) {
        res.status(500).json({ error: err.message });
        }
    }

    // Cập nhật thông tin thiết bị (ví dụ: đổi tên thiết bị)
    static async update(req, res) {
        try {
            const id = Number(req.params.id);
            const updatedDevice = await DeviceService.update(id, req.body);
            
            if (!updatedDevice) {
                return res.status(404).json({ error: "Không tìm thấy thiết bị để cập nhật!" });
            }
            
            res.json(updatedDevice);
        } catch (err) {
            res.status(400).json({ error: "Lỗi khi cập nhật: " + err.message });
        }
    }

    // Xóa thiết bị (Delete/Logout)
    static async logoutDevice(req, res) {
        try {
        await DeviceService.delete(req.params.id);
        res.json({ message: "Đã gỡ bỏ thiết bộ thành công!" });
        } catch (err) {
        res.status(400).json({ error: "Không tìm thấy thiết bị để xóa" });
        }
    }
}

module.exports = DeviceController;