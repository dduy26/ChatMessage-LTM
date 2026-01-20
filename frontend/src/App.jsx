import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "./services/api"; // Đảm bảo import đúng file api.js
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import ForgotPassword from "./pages/Forgotpassword";
import Profile from "./pages/Profile";
import Friends from "./pages/Friends";

// 1. Sửa ProtectedRoute: Kiểm tra user thay vì token
const ProtectedRoute = ({ children }) => {
  const user = localStorage.getItem("user"); 
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

function App() {
  const [loading, setLoading] = useState(true);

  // 2. Logic nạp lại Token vào RAM khi khởi chạy
  useEffect(() => {
    const initAuth = async () => {
      try {
        // BE sẽ đọc HttpOnly Cookie và trả về accessToken mới cho api.js
        await api.post("/auth/refresh-token");
      } catch {
        console.log("Phiên đăng nhập hết hạn hoặc chưa đăng nhập.");
      } finally {
        setLoading(false);
      }
    };
    initAuth();
  }, []);

  // Đợi kiểm tra xong session mới hiển thị giao diện
  if (loading) return <div>Đang tải ứng dụng...</div>;

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        
        {/* Các Route cần bảo vệ */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/friend"
          element={
            <ProtectedRoute>
              <Friends />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;