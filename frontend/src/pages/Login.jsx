import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";
import logo from "../assets/react.svg"; 

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post("/auth/login", { username, password });
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Đăng nhập thất bại");
    }
  };

  return (
    // Đã đổi Background sang Gradient Tím
    <div style={{ height: "100vh", display: "flex", justifyContent: "center", alignItems: "center", background: "linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)" }}>
      <div style={{ backgroundColor: "rgba(255,255,255,0.9)", padding: "40px", borderRadius: "24px", width: "400px", boxShadow: "0 10px 25px rgba(0,0,0,0.1)", textAlign: "center", backdropFilter: "blur(10px)" }}>
        
        <img src={logo} alt="App Logo" style={{ width: "80px", marginBottom: "20px" }} />
        {/* Đổi màu chữ */}
        <h2 style={{ color: "#7360f2", marginBottom: "30px", fontSize: "24px", fontWeight:"bold" }}>Đăng nhập Chat AppNe</h2>

        {error && <div style={{ color: "red", marginBottom: "15px", fontSize: "14px" }}>{error}</div>}

        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          <input
            type="text" placeholder="Tên đăng nhập" value={username} onChange={(e) => setUsername(e.target.value)}
            style={{ padding: "14px", borderRadius: "12px", border: "1px solid #e2e8f0", outline: "none", background:"#f8fafc" }}
          />
          <input
            type="password" placeholder="Mật khẩu" value={password} onChange={(e) => setPassword(e.target.value)}
            style={{ padding: "14px", borderRadius: "12px", border: "1px solid #e2e8f0", outline: "none", background:"#f8fafc" }}
          />
          <button type="submit" style={{ padding: "14px", backgroundColor: "#7360f2", color: "white", border: "none", borderRadius: "12px", fontWeight: "bold", cursor: "pointer", fontSize:"16px", transition:"0.3s" }}>
            ĐĂNG NHẬP
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