import React, { useState, useEffect, useCallback } from "react";
import api from "../services/api";
import { UserPlus, Check, X, Mail } from "lucide-react";

const Friend = () => {
  const [email, setEmail] = useState("");
  const [requests, setRequests] = useState([]);
  const [foundUser, setFoundUser] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);

  // Load danh sách lời mời khi mở trang
  const loadRequests = useCallback(async () => {
    try {
      const res = await api.get("/friendships/requests");
      // Dữ liệu từ BE lúc này sẽ có dạng: [{ id, requester: { fullName, email } }]
      setRequests(res.data || []);
    } catch (err) {
      console.error("Lỗi khi fetch requests:", err);
    }
  }, []);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  // Tìm kiếm người dùng khi nhập email
  useEffect(() => {
    const searchUser = async () => {
      if (!email.trim()) {
        setFoundUser(null);
        return;
      }

      // Chỉ tìm kiếm nếu email hợp lệ
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setFoundUser(null);
        return;
      }

      setSearchLoading(true);
      try {
        const res = await api.get(`/friendships/search?email=${encodeURIComponent(email)}`);
        setFoundUser(res.data);
      } catch{
        setFoundUser(null);
      } finally {
        setSearchLoading(false);
      }
    };

    // Debounce tìm kiếm
    const timeoutId = setTimeout(searchUser, 500);
    return () => clearTimeout(timeoutId);
  }, [email]);

  const handleAddFriend = async () => {
    if (!email.trim()) return alert("Vui lòng nhập email");
    try {
      await api.post("/friendships/send-request", { email });
      socket.current.emit("send_friend_request", { toUserId: foundUser.id });
      alert("Đã gửi lời mời kết bạn!");
      setEmail("");
      setFoundUser(null);
    } catch (err) {
      alert(err.response?.data?.error || "Lỗi gửi lời mời");
    }
  };

  const handleAccept = async (requestId) => {
    try {
      await api.put(`/friendships/accept/${requestId}`);
      socket.current.emit("accept_friend_request", { toUserId: friendId });
      alert("Đã trở thành bạn bè!");
      loadRequests(); // Refresh danh sách
    } catch {
      alert("Không thể chấp nhận lời mời");
    }
  };

  const handleReject = async (requestId) => {
    try {
      await api.delete(`/friendships/${requestId}`);
      alert("Đã xóa lời mời");
      loadRequests(); // Refresh danh sách
    } catch {
      alert("Lỗi khi xóa lời mời");
    }
  };

  return (
    <div style={{ padding: 40, maxWidth: 600, margin: "auto" }}>
      <h2 style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10, color: "#333" }}>
        <UserPlus color="#7360f2" /> Quản lý bạn bè
      </h2>

      {/* Tìm kiếm */}
      <div style={{ background: "#f3f4f6", padding: 25, borderRadius: 20, marginBottom: 35, shadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}>
        <p style={{ fontSize: 14, color: "#666", marginBottom: 12, fontWeight: "500" }}>Tìm bạn qua địa chỉ Email</p>
        <div style={{ display: "flex", gap: 12 }}>
          <div style={{ flex: 1, background: "white", borderRadius: 12, display: "flex", alignItems: "center", padding: "0 15px", border: "1px solid #e5e7eb" }}>
            <Mail size={18} color="#9ca3af" />
            <input 
              style={{ border: "none", padding: "12px 10px", outline: "none", width: "100%", fontSize: 14 }} 
              placeholder="nhập email người bạn..." 
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddFriend()}
            />
          </div>
          <button 
            onClick={handleAddFriend}
            disabled={!foundUser || searchLoading}
            style={{ 
              background: foundUser ? "#7360f2" : "#9ca3af", 
              color: "white", 
              border: "none", 
              padding: "0 25px", 
              borderRadius: 12, 
              fontWeight: "600", 
              cursor: foundUser ? "pointer" : "not-allowed", 
              transition: "0.2s",
              opacity: foundUser ? 1 : 0.6
            }}
          >
            {searchLoading ? "Đang tìm..." : "Gửi"}
          </button>
        </div>
        
        {/* Hiển thị thông tin người dùng tìm được */}
        {foundUser && (
          <div style={{ 
            marginTop: 15, 
            padding: "12px 16px", 
            background: "white", 
            borderRadius: 12, 
            border: "1px solid #e5e7eb",
            display: "flex",
            alignItems: "center",
            gap: 12
          }}>
            <div style={{ 
              width: 40, 
              height: 40, 
              borderRadius: "10px", 
              background: "#7360f2", 
              color: "white", 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center", 
              fontWeight: "bold", 
              fontSize: 16 
            }}>
              {foundUser.fullName ? foundUser.fullName[0].toUpperCase() : "?"}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: "600", fontSize: 14, color: "#1f2937" }}>
                {foundUser.fullName || "Người dùng"}
              </div>
              <div style={{ fontSize: 12, color: "#6b7280" }}>{foundUser.email}</div>
            </div>
          </div>
        )}
      </div>

      {/* Danh sách */}
      <div>
        <h4 style={{ color: "#9ca3af", fontSize: 12, marginBottom: 20, letterSpacing: "0.05em" }}>LỜI MỜI ĐANG CHỜ ({requests.length})</h4>
        
        {requests.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#ccc" }}>
            <p>Không có lời mời nào hiện tại.</p>
          </div>
        ) : (
          requests.map(r => (
            <div key={r.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", background: "white", border: "1px solid #f3f4f6", borderRadius: 16, marginBottom: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
              <div style={{ display: "flex", gap: 15, alignItems: "center" }}>
                <div style={{ width: 45, height: 45, borderRadius: "14px", background: "#7360f2", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: 18 }}>
                  {r.requester?.fullName ? r.requester.fullName[0].toUpperCase() : "?"}
                </div>
                
                <div>
                  <div style={{ fontWeight: "700", fontSize: 15, color: "#1f2937" }}>{r.requester?.fullName || "Người dùng"}</div>
                  <div style={{ fontSize: 13, color: "#6b7280" }}>{r.requester?.email}</div>
                </div> 
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button 
                  onClick={() => handleAccept(r.id)}
                  title="Chấp nhận"
                  style={{ background: "#dcfce7", color: "#16a34a", border: "none", width: 38, height: 38, borderRadius: "12px", cursor: "pointer", display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Check size={20} />
                </button>
                <button 
                  onClick={() => handleReject(r.id)}
                  title="Từ chối"
                  style={{ background: "#fee2e2", color: "#dc2626", border: "none", width: 38, height: 38, borderRadius: "12px", cursor: "pointer", display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <X size={20} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Friend;