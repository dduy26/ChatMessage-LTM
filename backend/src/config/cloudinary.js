    const cloudinary = require('cloudinary').v2;
    const { CloudinaryStorage } = require('multer-storage-cloudinary');

    // Cấu hình thông tin tài khoản từ file .env
    cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_KEY,
    api_secret: process.env.CLOUDINARY_SECRET
    });

    // Thiết lập nơi lưu trữ cho Multer
    const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'chat-app-attachments', // Thư mục sẽ hiện trên giao diện Cloudinary
        resource_type: 'auto',         // Tự động nhận diện (ảnh, video, raw file)
        allowed_formats: ['jpg', 'png', 'jpeg', 'gif', 'pdf', 'docx', 'xlsx', 'zip'],
    },
    });

    module.exports = { cloudinary, storage };