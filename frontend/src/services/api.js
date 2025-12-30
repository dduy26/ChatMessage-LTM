import axios from 'axios';

// Tạo một instance của Axios để dùng chung cho cả web
const api = axios.create({
    baseURL: 'http://localhost:3000/api', // Link tới Backend (nhớ check port 3000 hay khác)
    headers: {
        'Content-Type': 'application/json',
    },
});

// Cấu hình tự động gắn Token vào mỗi lần gọi API
// (Giúp bạn không phải viết đi viết lại đoạn Header Authorization)
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token'); // Lấy token từ bộ nhớ trình duyệt
        if (token) {
            config.headers.Authorization = `Bearer ${token}`; // Gắn vào Header
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;