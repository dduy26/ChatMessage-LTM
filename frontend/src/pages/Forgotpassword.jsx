import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import logo from "../assets/react.svg";

const ForgotPassword = () => {
  const navigate = useNavigate();
  
  // Các biến State
  const [step, setStep] = useState(1); // 1: Nhập Email, 2: Nhập OTP & Pass
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // HÀM 1: Gửi yêu cầu lấy OTP
  const handleSendOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      // Gọi API gửi OTP
      await api.post("/auth/forgot-password/send-otp", { email });
      
      setMessage("Mã OTP đã được gửi! Hãy kiểm tra email.");
      setStep(2); // Chuyển sang bước 2
    } catch (err) {
      setError(err.response?.data?.message || "Gửi OTP thất bại");
    } finally {
      setLoading(false);
    }
  };

  // HÀM 2: Xác nhận OTP và Đổi pass
  const handleReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Gọi API reset
      await api.post("/auth/forgot-password/reset", {
        email,
        otp,
        newPassword
      });

      alert("Thành công! Mật khẩu đã được thay đổi.");
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.message || "Xác thực thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ height: "100vh", display: "flex", justifyContent: "center", alignItems: "center", backgroundColor: "#e8f2fc" }}>
      <div style={{ backgroundColor: "white", padding: "40px", borderRadius: "10px", width: "400px", boxShadow: "0 5px 15px rgba(0,0,0,0.1)", textAlign: "center" }}>
        
        <img src={logo} alt="Logo" style={{ width: "60px", marginBottom: "10px" }} />
        <h2 style={{ color: "#0068ff", marginBottom: "20px" }}>
            {step === 1 ? "Quên mật khẩu" : "Xác thực OTP"}
        </h2>

        {error && <div style={{ color: "red", marginBottom: "15px", padding: "10px", backgroundColor: "#ffe6e6", borderRadius: "5px" }}>{error}</div>}
        {message && <div style={{ color: "green", marginBottom: "15px", padding: "10px", backgroundColor: "#e6ffe6", borderRadius: "5px" }}>{message}</div>}

        {/* --- FORM BƯỚC 1: NHẬP EMAIL --- */}
        {step === 1 && (
            <form onSubmit={handleSendOTP} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                <p style={{ fontSize: "14px", color: "#666" }}>Nhập email để nhận mã xác thực.</p>
                <input
                    type="email"
                    placeholder="Email của bạn"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{ padding: "12px", borderRadius: "5px", border: "1px solid #ccc", outline: "none" }}
                />
                <button 
                    type="submit" 
                    disabled={loading}
                    style={{ padding: "12px", backgroundColor: "#0068ff", color: "white", border: "none", borderRadius: "5px", fontWeight: "bold", cursor: "pointer", opacity: loading ? 0.7 : 1 }}
                >
                    {loading ? "ĐANG GỬI..." : "GỬI MÃ OTP"}
                </button>
            </form>
        )}

        {/* --- FORM BƯỚC 2: NHẬP OTP & PASS MỚI --- */}
        {step === 2 && (
            <form onSubmit={handleReset} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                <div style={{textAlign: "left", fontSize: "13px", color: "#666"}}>Email: <b>{email}</b></div>
                
                <input
                    type="text"
                    placeholder="Nhập mã OTP (6 số)"
                    required
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    style={{ padding: "12px", borderRadius: "5px", border: "1px solid #ccc", outline: "none", letterSpacing: "2px", fontWeight: "bold", textAlign: "center" }}
                />
                
                <input
                    type="password"
                    placeholder="Mật khẩu mới"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    style={{ padding: "12px", borderRadius: "5px", border: "1px solid #ccc", outline: "none" }}
                />

                <button 
                    type="submit" 
                    disabled={loading}
                    style={{ padding: "12px", backgroundColor: "#0068ff", color: "white", border: "none", borderRadius: "5px", fontWeight: "bold", cursor: "pointer", opacity: loading ? 0.7 : 1 }}
                >
                    {loading ? "ĐANG XỬ LÝ..." : "ĐỔI MẬT KHẨU"}
                </button>

                <div style={{ fontSize: "13px", cursor: "pointer", color: "#666" }} onClick={() => setStep(1)}>
                    Gửi lại mã?
                </div>
            </form>
        )}

        <div style={{ marginTop: "20px", fontSize: "14px" }}>
          <Link to="/login" style={{ color: "#666", textDecoration: "none" }}> Quay lại đăng nhập</Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;