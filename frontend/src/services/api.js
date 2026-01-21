import axios from 'axios';

let memoryToken = null;

// Khôi phục token từ localStorage khi khởi động
const savedToken = localStorage.getItem('accessToken');
if (savedToken) {
    memoryToken = savedToken;
}

const api = axios.create({
    baseURL: 'http://localhost:5000/api', 
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(
    (config) => {
        // Ưu tiên dùng memoryToken, nếu không có thì lấy từ localStorage
        const token = memoryToken || localStorage.getItem('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (response) => {
        // Lưu token từ cả login và register vào cả memory và localStorage
        if ((response.config.url.includes('/auth/login') || response.config.url.includes('/auth/register')) && response.data.accessToken) {
            memoryToken = response.data.accessToken;
            localStorage.setItem('accessToken', response.data.accessToken);
        }
        // Lưu token từ refresh-token
        if (response.config.url.includes('/auth/refresh-token') && response.data.accessToken) {
            memoryToken = response.data.accessToken;
            localStorage.setItem('accessToken', response.data.accessToken);
        }
        return response;
    }, 
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            console.log("AccessToken hết hạn, đang tự động làm mới...");

            try {
                const res = await axios.post(
                    'http://localhost:5000/api/auth/refresh-token', 
                    {}, 
                    { withCredentials: true }
                );

                const { accessToken } = res.data;
                memoryToken = accessToken;
                localStorage.setItem('accessToken', accessToken);

                originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                return api(originalRequest);
            } catch (refreshError) {
                console.error("Phiên đăng nhập hết hạn hoàn toàn.");
                
                // Hiển thị thông báo cho người dùng
                if (!window.location.pathname.includes('/login')) {
                    alert("Phiên đăng nhập của bạn đã hết hạn. Vui lòng đăng nhập lại!");
                    
                    memoryToken = null;
                    localStorage.removeItem("accessToken");
                    localStorage.removeItem("user");
                    window.location.href = "/login";
                }
                
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
);
export const sendMessage = async (chatId, content, files) => {
    const formData = new FormData();
    formData.append("content", content); // Gửi nội dung chữ
    
    if (files && files.length > 0) {
        files.forEach(file => {
            formData.append("files", file); // Phải dùng key 'files' để khớp với Multer ở BE
        });
    }

    // Lưu ý: api ở đây là instance của axios bạn đã tạo sẵn
    return await api.post(`/messages/${chatId}`, formData, {
        headers: {
            "Content-Type": "multipart/form-data", // Ép kiểu để gửi file
        },
    });
};
export default api;