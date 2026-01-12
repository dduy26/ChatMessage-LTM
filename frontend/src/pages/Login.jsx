import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";
import logo from "../assets/react.svg"; 
import { Eye, EyeOff } from "lucide-react"; 

const Login = () => {
  const [email, setEmail] = useState(""); // Đổi từ username sang email
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false); 
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // 1. Gửi request đăng nhập bằng email
      const res = await api.post("/auth/login", { email, password });
      
      // 2. Lấy dữ liệu từ response
      const {  user } = res.data;

      // 3. Lưu trữ vào LocalStorage cho hệ thống Token và Profile
      
      localStorage.setItem("user", JSON.stringify(user));

      console.log("Đăng nhập thành công!");
      navigate("/"); // Chuyển về trang chủ
    } catch (err) {
      // Hiển thị lỗi từ Backend (Ví dụ: "Email không tồn tại" hoặc "Sai mật khẩu")
      setError(err.response?.data?.message || "Đăng nhập thất bại. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ height: "100vh", display: "flex", justifyContent: "center", alignItems: "center", background: "linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)" }}>
      <div style={{ backgroundColor: "rgba(255,255,255,0.9)", padding: "40px", borderRadius: "24px", width: "400px", boxShadow: "0 10px 25px rgba(0,0,0,0.1)", textAlign: "center", backdropFilter: "blur(10px)" }}>
        
        <img src={logo} alt="App Logo" style={{ width: "80px", marginBottom: "20px" }} />
        <h2 style={{ color: "#7360f2", marginBottom: "30px", fontSize: "24px", fontWeight:"bold" }}>Đăng nhập Chat App</h2>

        {error && (
          <div style={{ color: "#721c24", backgroundColor: "#f8d7da", border: "1px solid #f5c6cb", padding: "10px", borderRadius: "8px", marginBottom: "15px", fontSize: "14px" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          {/* Ô nhập Email */}
          <input
            type="email" 
            placeholder="Email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ padding: "14px", borderRadius: "12px", border: "1px solid #e2e8f0", outline: "none", background:"#f8fafc" }}
          />
          
          {/* Ô nhập Mật khẩu có con mắt */}
          <div style={{ position: "relative", width: "100%" }}>
            <input
              type={showPassword ? "text" : "password"} 
              placeholder="Mật khẩu" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ 
                padding: "14px", 
                paddingRight: "45px", 
                borderRadius: "12px", 
                border: "1px solid #e2e8f0", 
                outline: "none", 
                background:"#f8fafc",
                width: "100%",
                boxSizing: "border-box" 
              }}
            />
            <div 
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: "absolute",
                right: "15px",
                top: "50%",
                transform: "translateY(-50%)",
                cursor: "pointer",
                color: "#7360f2",
                display: "flex",
                alignItems: "center"
              }}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            style={{ 
              padding: "14px", 
              backgroundColor: "#7360f2", 
              color: "white", 
              border: "none", 
              borderRadius: "12px", 
              fontWeight: "bold", 
              cursor: loading ? "not-allowed" : "pointer", 
              fontSize:"16px", 
              transition:"0.3s",
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? "ĐANG XỬ LÝ..." : "ĐĂNG NHẬP"}
          </button>
        </form>

        <div style={{ textAlign: "right", marginTop: "15px" }}>
          <Link to="/forgot-password" style={{ fontSize: "13px", color: "#7360f2", textDecoration: "none" }}>Quên mật khẩu?</Link>
        </div>
        <div style={{ marginTop: "20px", fontSize: "14px", color: "#666" }}>
          Chưa có tài khoản? <Link to="/register" style={{ color: "#7360f2", fontWeight: "bold", textDecoration: "none" }}>Đăng ký ngay</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;