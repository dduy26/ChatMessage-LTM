import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api"; // File config axios đã tạo

// Import bộ icon xịn xò
import { 
  BsChatDotsFill, BsPersonLinesFill, BsGearFill, BsSearch, 
  BsImage, BsEmojiSmile, BsTelephoneFill, BsCameraVideoFill, 
  BsLayoutSidebarReverse, BsPaperclip, BsThreeDots, BsCheck2All 
} from "react-icons/bs";
import { IoSend, IoPersonAddOutline } from "react-icons/io5";
import { AiOutlineCloud } from "react-icons/ai";

const Home = () => {
  const navigate = useNavigate();
  
  // --- STATE QUẢN LÝ DỮ LIỆU ---
  const [conversations, setConversations] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const scrollRef = useRef();

  // Lấy thông tin user hiện tại
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  // --- 1. CALL API LẤY DANH SÁCH CHAT ---
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const res = await api.get("/conversations");
        setConversations(res.data);
      } catch (err) {
        console.error("Lỗi tải hội thoại:", err);
      }
    };
    fetchConversations();
  }, []);

  // --- 2. CALL API LẤY TIN NHẮN KHI CHỌN CHAT ---
  useEffect(() => {
    if (!currentChat) return;
    const fetchMessages = async () => {
      try {
        const res = await api.get(`/messages/conversation/${currentChat.id}`);
        setMessages(res.data);
      } catch (err) {
        console.error("Lỗi tải tin nhắn:", err);
      }
    };
    fetchMessages();
  }, [currentChat]);

  // --- 3. TỰ ĐỘNG CUỘN XUỐNG CUỐI KHI CÓ TIN MỚI ---
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // --- 4. XỬ LÝ GỬI TIN NHẮN ---
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !currentChat) return;
    try {
      // Gửi lên Server
      const res = await api.post(`/messages/${currentChat.id}`, {
        content: newMessage,
        senderId: user.id
      });
      // Cập nhật giao diện ngay lập tức
      setMessages([...messages, res.data]);
      setNewMessage("");
    } catch (err) {
      alert("Gửi tin thất bại, vui lòng thử lại!");
    }
  };

  // --- 5. XỬ LÝ ĐĂNG XUẤT (BẢO MẬT) ---
  const handleLogout = async () => {
    try {
        // Báo cho Server biết để chặn Token này (Blacklist)
        await api.post("/auth/logout");
    } catch (error) {
        console.error("Lỗi logout server:", error);
    } finally {
        // Luôn xóa Token ở Client dù Server có lỗi hay không
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
    }
  };

  // Helper: Tạo avatar tự động nếu không có ảnh
  const getAvatar = (name, avatarUrl) => {
    if (avatarUrl) return avatarUrl;
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || "U")}&background=random&color=fff`;
  };

  // --- GIAO DIỆN CHÍNH ---
  return (
    <div style={{ display: "flex", height: "100vh", backgroundColor: "#fff", overflow: "hidden", fontFamily: "'Segoe UI', sans-serif" }}>
      
      {/* ================= CỘT 1: SIDEBAR (Thanh công cụ trái) ================= */}
      <div style={{ 
        width: "64px", 
        backgroundColor: "#0091ff", // Màu xanh Zalo chuẩn
        display: "flex", 
        flexDirection: "column", 
        alignItems: "center", 
        padding: "24px 0", 
        justifyContent: "space-between",
        boxShadow: "2px 0 5px rgba(0,0,0,0.05)",
        zIndex: 10
      }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "28px" }}>
          {/* Avatar User Chính */}
          <img 
            src={getAvatar(user.fullName, user.avatar)} 
            alt="Me" 
            style={{ width: "44px", height: "44px", borderRadius: "50%", border: "2px solid #fff", cursor: "pointer", objectFit: "cover" }}
            title={`Chào ${user.fullName}`}
          />
          
          {/* Menu Icons */}
          <div style={{ color: "#fff", fontSize: "26px", cursor: "pointer", position: 'relative' }}>
            <BsChatDotsFill title="Tin nhắn" />
            {/* Chấm đỏ thông báo */}
            <span style={{ position: "absolute", top: "-5px", right: "-5px", backgroundColor: "red", width: "10px", height: "10px", borderRadius: "50%", border: "2px solid #0091ff" }}></span>
          </div>
          <div style={{ color: "#baddff", fontSize: "26px", cursor: "pointer" }}><BsPersonLinesFill title="Danh bạ" /></div>
          <div style={{ color: "#baddff", fontSize: "26px", cursor: "pointer" }}><AiOutlineCloud title="Cloud của tôi" /></div>
        </div>

        {/* Nút Cài đặt / Đăng xuất */}
        <div onClick={handleLogout} style={{ color: "#baddff", fontSize: "26px", cursor: "pointer", marginBottom: "10px" }} title="Đăng xuất">
          <BsGearFill />
        </div>
      </div>

      {/* ================= CỘT 2: DANH SÁCH HỘI THOẠI ================= */}
      <div style={{ width: "340px", backgroundColor: "#fff", borderRight: "1px solid #e0e3eb", display: "flex", flexDirection: "column" }}>
        {/* Header Tìm kiếm */}
        <div style={{ padding: "16px", display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ flex: 1, backgroundColor: "#eaedf0", padding: "8px 12px", borderRadius: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
            <BsSearch color="#666" />
            <input type="text" placeholder="Tìm kiếm" style={{ border: "none", background: "transparent", outline: "none", width: "100%", fontSize: "14px", color: "#333" }} />
          </div>
          <IoPersonAddOutline size={20} color="#333" style={{ cursor: "pointer" }} title="Thêm bạn" />
        </div>

        {/* Tabs Phân loại */}
        <div style={{ display: "flex", padding: "0 16px 10px", gap: "15px", borderBottom: "1px solid #f0f0f0", fontSize: "14px", fontWeight: "600", color: "#666" }}>
            <span style={{ color: "#0091ff", borderBottom: "2px solid #0091ff", paddingBottom: "4px", cursor: "pointer" }}>Tất cả</span>
            <span style={{ cursor: "pointer" }}>Chưa đọc</span>
        </div>
        
        {/* List Danh sách chat */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {conversations.map((conv) => (
            <div 
              key={conv.id} 
              onClick={() => setCurrentChat(conv)}
              style={{ 
                display: "flex", padding: "14px 16px", gap: "12px", cursor: "pointer",
                backgroundColor: currentChat?.id === conv.id ? "#e5efff" : "transparent",
                alignItems: "center",
                borderLeft: currentChat?.id === conv.id ? "3px solid #0091ff" : "3px solid transparent"
              }}
            >
              <div style={{ position: "relative" }}>
                 <img src={getAvatar(conv.title, conv.avatar)} style={{ width: "52px", height: "52px", borderRadius: "50%", objectFit: "cover" }} />
                 {/* Chấm xanh Online */}
                 <span style={{ position: "absolute", bottom: "2px", right: "2px", width: "10px", height: "10px", backgroundColor: "#31a24c", borderRadius: "50%", border: "2px solid #fff" }}></span>
              </div>
              
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px", alignItems: "center" }}>
                  <span style={{ fontWeight: "600", color: "#333", fontSize: "15px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {conv.title || "Người dùng ẩn danh"}
                  </span>
                  <span style={{ fontSize: "11px", color: "#888" }}>10 phút</span>
                </div>
                <div style={{ fontSize: "13px", color: "#666", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  Bạn: Tin nhắn mới nhất...
                </div>
              </div>
            </div>
          ))}
          {conversations.length === 0 && <div style={{ textAlign: "center", marginTop: "40px", color: "#888", fontSize: "14px" }}>Chưa có cuộc trò chuyện nào</div>}
        </div>
      </div>

      {/* ================= CỘT 3: KHUNG CHAT CHÍNH ================= */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", backgroundColor: "#eef4fc" }}>
        {currentChat ? (
          <>
            {/* --- HEADER --- */}
            <div style={{ 
              height: "68px", backgroundColor: "#fff", padding: "0 20px", display: "flex", alignItems: "center", 
              justifyContent: "space-between", borderBottom: "1px solid #e0e3eb",
              boxShadow: "0 1px 2px rgba(0,0,0,0.02)"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                <img src={getAvatar(currentChat.title, currentChat.avatar)} style={{ width: "48px", height: "48px", borderRadius: "50%", objectFit: "cover" }} />
                <div>
                  <div style={{ fontWeight: "700", fontSize: "17px", color: "#333" }}>{currentChat.title || "Chat"}</div>
                  <div style={{ fontSize: "12px", color: "#7589a3", display: "flex", alignItems: "center", gap: "5px" }}>
                    <span style={{ width: "8px", height: "8px", backgroundColor: "#31a24c", borderRadius: "50%" }}></span> 
                    Vừa mới truy cập
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: "20px", color: "#666" }}>
                <BsTelephoneFill size={20} style={{ cursor: "pointer" }} title="Gọi thoại" />
                <BsCameraVideoFill size={22} style={{ cursor: "pointer" }} title="Video Call" />
                <BsLayoutSidebarReverse size={22} style={{ cursor: "pointer" }} title="Thông tin hội thoại" />
              </div>
            </div>

            {/* --- BODY TIN NHẮN --- */}
            <div style={{ flex: 1, padding: "20px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "6px" }}>
              <div style={{ textAlign: "center", margin: "20px 0", color: "#888", fontSize: "13px" }}>
                 <span style={{ backgroundColor: "#e1e4ea", padding: "4px 12px", borderRadius: "12px" }}>Bắt đầu cuộc trò chuyện</span>
              </div>

              {messages.map((msg, index) => {
                const isMe = msg.senderId === user.id;
                return (
                  <div key={index} style={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start", marginBottom: "8px" }}>
                    {!isMe && (
                        <img 
                            src={getAvatar(currentChat.title, currentChat.avatar)} 
                            style={{ width: "28px", height: "28px", borderRadius: "50%", marginRight: "10px", marginTop: "10px" }} 
                        />
                    )}
                    
                    <div style={{ maxWidth: "65%" }}>
                        <div style={{ 
                            backgroundColor: isMe ? "#e5efff" : "#fff", 
                            padding: "12px 16px", 
                            borderRadius: "8px",
                            boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                            fontSize: "15px",
                            lineHeight: "1.5",
                            color: "#333",
                            border: isMe ? "1px solid #cce0ff" : "1px solid #fff",
                        }}>
                            {msg.content}
                            <div style={{ fontSize: "10px", color: "#999", marginTop: "4px", textAlign: isMe ? "right" : "left" }}>
                                10:30 {isMe && <BsCheck2All size={14} color="#0091ff" style={{ marginLeft: "4px", verticalAlign: "middle" }} />}
                            </div>
                        </div>
                    </div>
                  </div>
                )
              })}
              <div ref={scrollRef} />
            </div>

            {/* --- FOOTER NHẬP LIỆU --- */}
            <div style={{ backgroundColor: "#fff", borderTop: "1px solid #e0e3eb", padding: "10px 16px" }}>
                <div style={{ display: "flex", gap: "15px", marginBottom: "8px", color: "#666" }}>
                    <BsImage size={20} style={{ cursor: "pointer" }} title="Gửi ảnh" />
                    <BsPaperclip size={20} style={{ cursor: "pointer" }} title="Đính kèm file" />
                    <BsThreeDots size={20} style={{ cursor: "pointer" }} />
                </div>
                
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{ flex: 1, position: "relative", display: "flex", alignItems: "center" }}>
                        <input 
                            type="text" 
                            placeholder="Nhập tin nhắn..." 
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                            style={{ 
                                width: "100%", padding: "12px 40px 12px 15px", 
                                borderRadius: "6px", border: "1px solid #ddd", 
                                outline: "none", fontSize: "15px",
                                transition: "border 0.2s"
                            }}
                            onFocus={(e) => e.target.style.borderColor = "#0091ff"}
                            onBlur={(e) => e.target.style.borderColor = "#ddd"}
                        />
                        <BsEmojiSmile style={{ position: "absolute", right: "12px", color: "#666", cursor: "pointer" }} size={20} />
                    </div>
                    <div onClick={newMessage.trim() ? handleSendMessage : null} style={{ color: "#0091ff", cursor: "pointer", padding: "10px" }}>
                        {newMessage.trim() ? <IoSend size={28} /> : <span style={{ fontSize: "24px" }}>👍</span>}
                    </div>
                </div>
            </div>
          </>
        ) : (
          // Màn hình Chờ
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", color: "#666", backgroundColor: "#fff" }}>
            <h2 style={{ marginBottom: "10px", color: "#0068ff", fontWeight: "600" }}>Chào mừng đến với Chat LTM!</h2>
            <p style={{ maxWidth: "400px", textAlign: "center", lineHeight: "1.6" }}>
                Khám phá những tiện ích hỗ trợ làm việc và trò chuyện cùng người thân, bạn bè.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;