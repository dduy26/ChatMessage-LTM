import { useState, useEffect } from "react";
import api from "../services/api";
import { User, Mail, Phone, Camera, Save, AlertCircle, CheckCircle } from "lucide-react";

const Profile = () => {
    const [formData, setFormData] = useState({
        fullName: "",
        phoneNumber: "",
        email: "",
        avatar: ""
    });
    const [loading, setLoading] = useState(false);
    
    // Tách biệt thông báo lỗi và thông báo thành công
    const [successMsg, setSuccessMsg] = useState("");
    const [errorMsg, setErrorMsg] = useState("");

    useEffect(() => {
        const fetchProfile = async () => {
        try {
            // Gọi API lấy thông tin (đã có trong UserController.getProfile)
            const res = await api.get("/auth/profile"); 
            setFormData(res.data);
        } catch (err) {
            console.error("Lỗi fetch profile:", err);
            setErrorMsg("Không thể tải thông tin cá nhân");
        }
        };
        fetchProfile();
    }, []);

    const handleUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        setSuccessMsg("");
        setErrorMsg("");

        try {
        // Gửi yêu cầu cập nhật tới Backend
        const res = await api.put("/auth/update", formData);
        
        setSuccessMsg(res.data.message || "Cập nhật thành công!");
        
        if (res.data.user) {
            setFormData(res.data.user);
            const localUser = JSON.parse(localStorage.getItem("user") || "{}");
            localStorage.setItem("user", JSON.stringify({ ...localUser, ...res.data.user }));
        }
        } catch (err) {
        setErrorMsg(err.response?.data?.error || "Cập nhật thất bại");
        } finally {
        setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: "600px", margin: "50px auto", padding: "20px", backgroundColor: "white", borderRadius: "15px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
        <h2 style={{ textAlign: "center", color: "#7360f2" }}>Hồ sơ cá nhân</h2>
        
        {/* Hiển thị thông báo thành công */}
        {successMsg && (
            <div style={{ padding: "10px", backgroundColor: "#ecfdf5", color: "#059669", borderRadius: "8px", marginBottom: "15px", display: "flex", alignItems: "center", gap: "8px" }}>
            <CheckCircle size={18} /> {successMsg}
            </div>
        )}

        {/* Hiển thị thông báo lỗi */}
        {errorMsg && (
            <div style={{ padding: "10px", backgroundColor: "#fef2f2", color: "#dc2626", borderRadius: "8px", marginBottom: "15px", display: "flex", alignItems: "center", gap: "8px" }}>
            <AlertCircle size={18} /> {errorMsg}
            </div>
        )}

        <div style={{ display: "flex", justifyContent: "center", marginBottom: "30px", position: "relative" }}>
            <img 
            src={formData.avatar || `https://ui-avatars.com/api/?name=${formData.fullName}&background=random`} 
            alt="Avatar" 
            style={{ width: "120px", height: "120px", borderRadius: "50%", objectFit: "cover", border: "4px solid #f0f0f0" }} 
            />
            <div style={{ position: "absolute", bottom: "0", right: "240px", backgroundColor: "#7360f2", padding: "8px", borderRadius: "50%", cursor: "pointer", color: "white" }}>
            <Camera size={18} />
            </div>
        </div>

        <form onSubmit={handleUpdate} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: "600" }}>Họ và tên</label>
            <div style={{ display: "flex", alignItems: "center", border: "1px solid #ddd", borderRadius: "8px", padding: "10px" }}>
                <User size={20} color="#888" style={{ marginRight: "10px" }} />
                <input 
                type="text" 
                value={formData.fullName || ""} 
                onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                style={{ border: "none", outline: "none", width: "100%" }}
                />
            </div>
            </div>

            <div>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: "600" }}>Email</label>
            <div style={{ display: "flex", alignItems: "center", border: "1px solid #eee", borderRadius: "8px", padding: "10px", backgroundColor: "#f9f9f9" }}>
                <Mail size={20} color="#ccc" style={{ marginRight: "10px" }} />
                <input type="email" value={formData.email || ""} disabled style={{ border: "none", outline: "none", width: "100%", backgroundColor: "transparent" }} />
            </div>
            </div>

            <div>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: "600" }}>Số điện thoại</label>
            <div style={{ display: "flex", alignItems: "center", border: "1px solid #ddd", borderRadius: "8px", padding: "10px" }}>
                <Phone size={20} color="#888" style={{ marginRight: "10px" }} />
                <input 
                type="text" 
                value={formData.phoneNumber || ""} 
                onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                style={{ border: "none", outline: "none", width: "100%" }}
                />
            </div>
            </div>

            <button 
            type="submit" 
            disabled={loading}
            style={{ padding: "12px", backgroundColor: "#7360f2", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: loading ? "not-allowed" : "pointer", display: "flex", justifyContent: "center", alignItems: "center", gap: "10px", opacity: loading ? 0.7 : 1 }}
            >
            <Save size={20} /> {loading ? "ĐANG LƯU..." : "LƯU THAY ĐỔI"}
            </button>
        </form>
        </div>
    );
};

export default Profile;