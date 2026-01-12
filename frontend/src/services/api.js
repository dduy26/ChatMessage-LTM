import axios from 'axios';

let memoryToken = null;

const api = axios.create({
    baseURL: 'http://localhost:5000/api', 
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(
    (config) => {
        if (memoryToken) {
            config.headers.Authorization = `Bearer ${memoryToken}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (response) => {
        if (response.config.url.includes('/auth/login') && response.data.accessToken) {
            memoryToken = response.data.accessToken;
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

            
                originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                return api(originalRequest);
            } catch (refreshError) {
                console.error("RefreshToken cũng hết hạn, yêu cầu đăng nhập lại.");
                memoryToken = null;
            
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
);

export default api;