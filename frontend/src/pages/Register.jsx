import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import logo from "../assets/react.svg"; 

const Register = () => {
  const navigate = useNavigate();
  
  // State chứa dữ liệu form
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    email: "",
    fullName: "",
    phoneNumber: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Xử lý khi nhập liệu
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Xử lý Đăng ký
  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // 1. Lưu kết quả trả về vào biến response
      const response = await api.post("/auth/register", formData);
      
      // 2. Log ra để kiểm tra nếu cần 
      console.log("Dữ liệu từ Server:", response.data);

      // 3. Sử dụng thông báo từ Server nếu Backend có trả về field 'message'
      const successMsg = response.data?.message || "Đăng ký tài khoản thành công!";
      alert(successMsg);

      // 4. Chuyển hướng
      navigate("/login"); 
    } catch (err) {
      // Xử lý lỗi từ Server 
      setError(err.response?.data?.message || "Đăng ký thất bại");
    } finally {
      setLoading(false);
    }
  };

  // Style chung cho Input để đỡ lặp lại code
  const inputStyle = {
    padding: "14px",
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
    outline: "none",
    background: "#f8fafc",
    fontSize: "14px"
  };

  return (
    // 1. Nền Gradient Tím giống Login
    <div style={{ minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", background: "linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)", padding: "20px" }}>
      
      {/* 2. Card hiệu ứng kính mờ */}
      <div style={{ backgroundColor: "rgba(255,255,255,0.9)", padding: "40px", borderRadius: "24px", width: "400px", boxShadow: "0 10px 25px rgba(0,0,0,0.1)", textAlign: "center", backdropFilter: "blur(10px)" }}>
        
        <img src={logo} alt="Logo" style={{ width: "60px", marginBottom: "10px" }} />
        <h2 style={{ color: "#7360f2", marginBottom: "20px", fontWeight: "bold" }}>Tạo tài khoản mới</h2>

        {error && <div style={{ color: "red", marginBottom: "15px", fontSize: "14px", background:"#fee2e2", padding:"10px", borderRadius:"8px" }}>{error}</div>}

        <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          <input
            name="fullName" type="text" placeholder="Họ và tên" required
            onChange={handleChange} style={inputStyle}
          />
          <input
            name="email" type="email" placeholder="Email" required
            onChange={handleChange} style={inputStyle}
          />
          <input
            name="phoneNumber" type="text" placeholder="Số điện thoại" required
            onChange={handleChange} style={inputStyle}
          />
          <input
            name="username" type="text" placeholder="Tên đăng nhập" required
            onChange={handleChange} style={inputStyle}
          />
          <input
            name="password" type="password" placeholder="Mật khẩu" required
            onChange={handleChange} style={inputStyle}
          />
          
          <button 
            type="submit" 
            disabled={loading}
            style={{ 
                padding: "14px", 
                backgroundColor: "#7360f2", // Màu Tím Viber
                color: "white", 
                border: "none", 
                borderRadius: "12px", 
                fontWeight: "bold", 
                cursor: "pointer", 
                opacity: loading ? 0.7 : 1,
                fontSize: "16px",
                transition: "0.3s"
            }}
          >
            {loading ? "Đang xử lý..." : "ĐĂNG KÝ"}
          </button>
        </form>

        <div style={{ marginTop: "20px", fontSize: "14px", color: "#666" }}>
          Bạn đã có tài khoản? <Link to="/login" style={{ color: "#7360f2", textDecoration: "none", fontWeight: "bold" }}>Đăng nhập ngay</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;