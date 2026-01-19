import { useState, useEffect, useRef } from "react";
import api from "../services/api";
import { 
    User, Mail, Phone, Camera, Save, AlertCircle, 
    CheckCircle, Loader2, BadgeCheck, ShieldCheck, Send 
} from "lucide-react";

const Profile = () => {
    const [formData, setFormData] = useState({
        fullName: "",
        phoneNumber: "",
        email: "",
        avatar: "",
        bio: "",
        status: "#94a3b8", 
        isVerified: false
    });

    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [verifying, setVerifying] = useState(false); // Trạng thái gửi mail xác minh
    const [successMsg, setSuccessMsg] = useState("");
    const [errorMsg, setErrorMsg] = useState("");
    
    const fileInputRef = useRef(null);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await api.get("/auth/profile");
                setFormData(res.data);
            } catch (err) {
                console.error("Lỗi fetch profile:", err);
                setErrorMsg("Không thể tải thông tin cá nhân");
            }
        };
        fetchProfile();
    }, []);

    // HÀM GỬI EMAIL XÁC MINH (Thêm mới)
    const handleRequestVerification = async () => {
        setVerifying(true);
        setErrorMsg("");
        setSuccessMsg("");
        try {
            // Gọi đến API gửi mail ở Backend
            const res = await api.post("/auth/request-verification");
            setSuccessMsg(res.data.message || "Link xác minh đã được gửi vào Email của bạn!");
        } catch (err) {
            setErrorMsg(err.response?.data?.error || "Không thể gửi yêu cầu xác minh");
        } finally {
            setVerifying(false);
        }
    };

    const handleAvatarChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            setErrorMsg("Vui lòng chọn tệp hình ảnh hợp lệ (jpg, png,...)");
            return;
        }

        const uploadFormData = new FormData();
        uploadFormData.append("avatar", file);
        setUploading(true);
        setErrorMsg("");
        setSuccessMsg("");

        try {
            const res = await api.post("/users/upload-avatar", uploadFormData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            const newAvatarUrl = res.data.avatar;
            setFormData((prev) => ({ ...prev, avatar: newAvatarUrl }));
            
            const localUser = JSON.parse(localStorage.getItem("user") || "{}");
            localStorage.setItem("user", JSON.stringify({ ...localUser, avatar: newAvatarUrl }));
            setSuccessMsg("Cập nhật ảnh đại diện thành công!");
        } catch (err) {
            setErrorMsg(err.response?.data?.error || "Lỗi khi tải ảnh lên server");
        } finally {
            setUploading(false);
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        setSuccessMsg("");
        setErrorMsg("");

        try {
            const updateData = {
                fullName: formData.fullName,
                phoneNumber: formData.phoneNumber,
                bio: formData.bio
            };
            
            const res = await api.put("/users/update", updateData);
            setSuccessMsg(res.data.message || "Cập nhật hồ sơ thành công!");
            
            if (res.data.user) {
                const localUser = JSON.parse(localStorage.getItem("user") || "{}");
                // Giữ nguyên avatar nếu không có trong response hoặc nếu avatar hiện tại đã có
                const updatedUser = {
                    ...localUser,
                    ...res.data.user,
                    avatar: res.data.user.avatar || localUser.avatar || formData.avatar
                };
                setFormData(prev => ({ ...prev, ...updatedUser }));
                localStorage.setItem("user", JSON.stringify(updatedUser));
            }
        } catch (err) {
            setErrorMsg(err.response?.data?.error || "Cập nhật thông tin thất bại");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: "650px", margin: "40px auto", padding: "30px", backgroundColor: "#fff", borderRadius: "24px", boxShadow: "0 20px 50px rgba(0,0,0,0.08)" }}>
            <div style={{ textAlign: "center", marginBottom: "30px" }}>
                <h2 style={{ color: "#1a1a1a", fontWeight: "800", fontSize: "28px", marginBottom: "8px" }}>Hồ sơ cá nhân</h2>
                <p style={{ color: "#666", fontSize: "14px" }}>Quản lý thông tin và trạng thái tài khoản của bạn</p>
            </div>
            
            {successMsg && (
                <div style={{ padding: "14px", backgroundColor: "#f0fdf4", color: "#16a34a", borderRadius: "12px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px", border: "1px solid #bbf7d0" }}>
                    <CheckCircle size={20} /> <span style={{ fontWeight: "500" }}>{successMsg}</span>
                </div>
            )}
            {errorMsg && (
                <div style={{ padding: "14px", backgroundColor: "#fef2f2", color: "#dc2626", borderRadius: "12px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px", border: "1px solid #fecaca" }}>
                    <AlertCircle size={20} /> <span style={{ fontWeight: "500" }}>{errorMsg}</span>
                </div>
            )}

            <div style={{ display: "flex", justifyContent: "center", marginBottom: "40px" }}>
                <div style={{ position: "relative" }}>
                    <div style={{ position: "relative", padding: "6px", background: "linear-gradient(135deg, #7360f2, #b5a9ff)", borderRadius: "50%" }}>
                        <img 
                            src={formData.avatar || `https://ui-avatars.com/api/?name=${formData.fullName || 'User'}&background=f3f4f6&color=7360f2&bold=true`} 
                            alt="Avatar" 
                            style={{ width: "150px", height: "150px", borderRadius: "50%", objectFit: "cover", border: "4px solid white", opacity: uploading ? 0.6 : 1, transition: "0.3s" }} 
                        />
                        
                        {formData.isVerified && (
                            <div title="Tài khoản đã xác minh" style={{ position: "absolute", top: "8px", right: "8px", backgroundColor: "white", borderRadius: "50%", padding: "2px", display: "flex", boxShadow: "0 4px 10px rgba(0,0,0,0.1)" }}>
                                <BadgeCheck size={34} color="#3b82f6" fill="#3b82f6" style={{ color: "white" }} />
                            </div>
                        )}

                        <div style={{ 
                            position: "absolute", 
                            bottom: "12px", 
                            right: "12px", 
                            width: "28px", 
                            height: "28px", 
                            backgroundColor: formData.status, 
                            borderRadius: "50%", 
                            border: "4px solid white",
                            boxShadow: "0 4px 8px rgba(0,0,0,0.15)"
                        }} />
                    </div>
                    
                    <button
                        type="button"
                        onClick={() => fileInputRef.current.click()}
                        disabled={uploading}
                        title="Thay đổi ảnh đại diện"
                        style={{ position: "absolute", bottom: "8px", left: "0", backgroundColor: "#1a1a1a", padding: "10px", borderRadius: "50%", cursor: "pointer", color: "white", border: "2px solid white", boxShadow: "0 4px 12px rgba(0,0,0,0.2)" }}
                    >
                        {uploading ? <Loader2 size={18} className="animate-spin" /> : <Camera size={18} />}
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleAvatarChange} accept="image/*" style={{ display: "none" }} />
                </div>
            </div>

            <form onSubmit={handleUpdate} style={{ display: "flex", flexDirection: "column", gap: "25px" }}>
                
                <div>
                    <label style={{ display: "block", marginBottom: "10px", fontWeight: "700", color: "#374151" }}>Giới thiệu bản thân (Bio)</label>
                    <textarea 
                        value={formData.bio || ""} 
                        onChange={(e) => setFormData({...formData, bio: e.target.value})}
                        placeholder="Viết vài dòng giới thiệu về bạn..."
                        style={{ width: "100%", padding: "14px", border: "1.5px solid #e5e7eb", borderRadius: "16px", minHeight: "100px", outline: "none", resize: "none", fontSize: "14px", transition: "0.2s", backgroundColor: "#fff" }}
                    />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                    <div>
                        <label style={{ display: "block", marginBottom: "10px", fontWeight: "700", color: "#374151" }}>Họ và tên</label>
                        <div style={{ display: "flex", alignItems: "center", border: "1.5px solid #e5e7eb", borderRadius: "16px", padding: "14px", background: "#fff" }}>
                            <User size={18} color="#9ca3af" style={{ marginRight: "12px" }} />
                            <input 
                                type="text" 
                                value={formData.fullName || ""} 
                                onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                                style={{ border: "none", outline: "none", width: "100%", fontWeight: "500" }}
                            />
                        </div>
                    </div>

                    <div>
                        <label style={{ display: "block", marginBottom: "10px", fontWeight: "700", color: "#374151" }}>Số điện thoại</label>
                        <div style={{ display: "flex", alignItems: "center", border: "1.5px solid #e5e7eb", borderRadius: "16px", padding: "14px", background: "#fff" }}>
                            <Phone size={18} color="#9ca3af" style={{ marginRight: "12px" }} />
                            <input 
                                type="text" 
                                value={formData.phoneNumber || ""} 
                                onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                                style={{ border: "none", outline: "none", width: "100%", fontWeight: "500" }}
                            />
                        </div>
                    </div>
                </div>

                <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                        <label style={{ fontWeight: "700", color: "#374151" }}>Email đăng ký</label>
                        {formData.isVerified ? (
                            <span style={{ color: "#16a34a", fontSize: "12px", display: "flex", alignItems: "center", gap: "4px" }}>
                                <ShieldCheck size={14} /> Đã xác minh
                            </span>
                        ) : (
                            <button 
                                type="button"
                                onClick={handleRequestVerification}
                                disabled={verifying}
                                style={{ color: "#7360f2", fontSize: "12px", fontWeight: "700", background: "none", border: "none", cursor: "pointer", textDecoration: "underline", display: "flex", alignItems: "center", gap: "4px" }}
                            >
                                {verifying ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                                {verifying ? "Đang gửi..." : "Xác thực ngay"}
                            </button>
                        )}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", border: "1.5px solid #eee", borderRadius: "16px", padding: "14px", backgroundColor: "#f9fafb" }}>
                        <Mail size={18} color="#d1d5db" style={{ marginRight: "12px" }} />
                        <input type="email" value={formData.email || ""} disabled style={{ border: "none", outline: "none", width: "100%", backgroundColor: "transparent", color: "#9ca3af", cursor: "not-allowed" }} />
                    </div>
                </div>

                <button 
                    type="submit" 
                    disabled={loading || uploading}
                    style={{ 
                        marginTop: "15px", padding: "18px", backgroundColor: "#7360f2", color: "white", border: "none", borderRadius: "16px", fontWeight: "800", 
                        cursor: (loading || uploading) ? "not-allowed" : "pointer", display: "flex", justifyContent: "center", alignItems: "center", gap: "10px", fontSize: "16px",
                        boxShadow: "0 10px 25px rgba(115, 96, 242, 0.3)", transition: "0.3s", opacity: (loading || uploading) ? 0.7 : 1 
                    }}
                >
                    {loading ? <Loader2 size={22} className="animate-spin" /> : <Save size={22} />}
                    {loading ? "ĐANG LƯU..." : "CẬP NHẬT HỒ SƠ"}
                </button>
            </form>
        </div>
    );
};

export default Profile;