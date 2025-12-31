import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import logo from "../assets/react.svg"; // Nhớ thay bằng logo của bạn

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
      // Gọi API Backend: POST /auth/register
      await api.post("/auth/register", formData);
      
      alert("Đăng ký thành công! Hãy đăng nhập ngay.");
      navigate("/login"); // Chuyển sang trang đăng nhập
    } catch (err) {
      setError(err.response?.data?.message || "Đăng ký thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ height: "100vh", display: "flex", justifyContent: "center", alignItems: "center", backgroundColor: "#e8f2fc" }}>
      <div style={{ backgroundColor: "white", padding: "40px", borderRadius: "10px", width: "400px", boxShadow: "0 5px 15px rgba(0,0,0,0.1)", textAlign: "center" }}>
        
        <img src={logo} alt="Logo" style={{ width: "60px", marginBottom: "10px" }} />
        <h2 style={{ color: "#0068ff", marginBottom: "20px" }}>Đăng ký tài khoản</h2>

        {error && <div style={{ color: "red", marginBottom: "10px", fontSize: "14px" }}>{error}</div>}

        <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <input
            name="fullName"
            type="text"
            placeholder="Họ và tên"
            required
            onChange={handleChange}
            style={{ padding: "12px", borderRadius: "5px", border: "1px solid #ccc", outline: "none" }}
          />
          <input
            name="email"
            type="email"
            placeholder="Email"
            required
            onChange={handleChange}
            style={{ padding: "12px", borderRadius: "5px", border: "1px solid #ccc", outline: "none" }}
          />
          <input
            name="phoneNumber"
            type="text"
            placeholder="Số điện thoại"
            required
            onChange={handleChange}
            style={{ padding: "12px", borderRadius: "5px", border: "1px solid #ccc", outline: "none" }}
          />
          <input
            name="username"
            type="text"
            placeholder="Tên đăng nhập"
            required
            onChange={handleChange}
            style={{ padding: "12px", borderRadius: "5px", border: "1px solid #ccc", outline: "none" }}
          />
          <input
            name="password"
            type="password"
            placeholder="Mật khẩu"
            required
            onChange={handleChange}
            style={{ padding: "12px", borderRadius: "5px", border: "1px solid #ccc", outline: "none" }}
          />
          
          <button 
            type="submit" 
            disabled={loading}
            style={{ padding: "12px", backgroundColor: "#0068ff", color: "white", border: "none", borderRadius: "5px", fontWeight: "bold", cursor: "pointer", opacity: loading ? 0.7 : 1 }}
          >
            {loading ? "Đang xử lý..." : "ĐĂNG KÝ"}
          </button>
        </form>

        <div style={{ marginTop: "15px", fontSize: "14px" }}>
          Bạn đã có tài khoản? <Link to="/login" style={{ color: "#0068ff", textDecoration: "none", fontWeight: "bold" }}>Đăng nhập ngay</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;