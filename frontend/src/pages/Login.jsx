import { useState } from "react";
import { useNavigate, Link } from "react-router-dom"; // Import thêm Link
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
      // API Login
      const res = await api.post("/auth/login", { username, password });
      
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Đăng nhập thất bại");
    }
  };

  return (
    <div style={{ height: "100vh", display: "flex", justifyContent: "center", alignItems: "center", backgroundColor: "#e8f2fc" }}>
      <div style={{ backgroundColor: "white", padding: "40px", borderRadius: "10px", width: "400px", boxShadow: "0 5px 15px rgba(0,0,0,0.1)", textAlign: "center" }}>
        
        <img src={logo} alt="App Logo" style={{ width: "80px", marginBottom: "20px" }} />
        <h2 style={{ color: "#0068ff", marginBottom: "30px", fontSize: "24px" }}>Đăng nhập Chat LTM</h2>

        {error && <div style={{ color: "red", marginBottom: "15px", fontSize: "14px" }}>{error}</div>}

        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          <input
            type="text"
            placeholder="Tên đăng nhập"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{ padding: "12px", borderRadius: "5px", border: "1px solid #ccc", outline: "none" }}
          />
          <input
            type="password"
            placeholder="Mật khẩu"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ padding: "12px", borderRadius: "5px", border: "1px solid #ccc", outline: "none" }}
          />
          <button type="submit" style={{ padding: "12px", backgroundColor: "#0068ff", color: "white", border: "none", borderRadius: "5px", fontWeight: "bold", cursor: "pointer" }}>
            ĐĂNG NHẬP
          </button>
        </form>
        {/* --- NÚT QUÊN MẬT KHẨU --- */}
              <div style={{ textAlign: "right", marginBottom: "10px" }}>
          <Link to="/forgot-password" style={{ fontSize: "13px", color: "#0068ff", textDecoration: "none" }}>
              Quên mật khẩu?
          </Link>
      </div>
        {/* --- NÚT CHUYỂN SANG ĐĂNG KÝ --- */}
        <div style={{ marginTop: "20px", fontSize: "14px", color: "#666" }}>
          Chưa có tài khoản? <Link to="/register" style={{ color: "#0068ff", fontWeight: "bold", textDecoration: "none" }}>Đăng ký ngay</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;