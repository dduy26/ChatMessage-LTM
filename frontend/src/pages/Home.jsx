import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { BsChatDotsFill, BsPersonLinesFill, BsGearFill, BsSearch, BsImage, BsEmojiSmile } from "react-icons/bs";
import { IoSend } from "react-icons/io5";
import api from "../services/api";

const Home = () => {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const scrollRef = useRef();

  // 1. Tải danh sách chat
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

  // 2. Tải tin nhắn khi chọn chat
  useEffect(() => {
    if (!currentChat) return;
    const fetchMessages = async () => {
      try {
        // API: GET /messages/conversation/:id
        const res = await api.get(`/messages/conversation/${currentChat.id}`);
        setMessages(res.data);
      } catch (err) {
        console.error("Lỗi tải tin nhắn:", err);
      }
    };
    fetchMessages();
  }, [currentChat]);

  // 3. Cuộn xuống cuối khi có tin mới
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 4. Gửi tin nhắn
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !currentChat) return;
    try {
      // API: POST /messages/:conversationId
      const res = await api.post(`/messages/${currentChat.id}`, {
        content: newMessage,
        senderId: user.id
      });
      setMessages([...messages, res.data]);
      setNewMessage("");
    } catch (err) {
      alert("Gửi tin nhắn thất bại");
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", backgroundColor: "#f4f5f7" }}>
      
      {/* --- CỘT 1: SIDEBAR (Thanh công cụ) --- */}
      <div style={{ width: "64px", backgroundColor: "#0068ff", display: "flex", flexDirection: "column", alignItems: "center", padding: "20px 0", justifyContent: "space-between" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "25px" }}>
          <img 
            src={user.avatar || "https://via.placeholder.com/40"} 
            alt="User" 
            style={{ width: "48px", height: "48px", borderRadius: "50%", border: "2px solid white", cursor: "pointer" }}
            title={user.fullName}
          />
          <div title="Tin nhắn" style={{ color: "white", fontSize: "24px", cursor: "pointer", padding: "10px", backgroundColor: "rgba(0,0,0,0.1)", borderRadius: "8px" }}><BsChatDotsFill /></div>
          <div title="Danh bạ" style={{ color: "#b3d3ff", fontSize: "24px", cursor: "pointer" }}><BsPersonLinesFill /></div>
        </div>
        <div title="Cài đặt" onClick={handleLogout} style={{ color: "white", fontSize: "24px", cursor: "pointer", marginBottom: "20px" }}><BsGearFill /></div>
      </div>

      {/* --- CỘT 2: DANH SÁCH CHAT --- */}
      <div style={{ width: "340px", backgroundColor: "white", borderRight: "1px solid #e0e0e0", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "16px", display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ flex: 1, backgroundColor: "#eaedf0", padding: "8px 12px", borderRadius: "6px", display: "flex", alignItems: "center", gap: "8px" }}>
            <BsSearch color="#666" />
            <input type="text" placeholder="Tìm kiếm" style={{ border: "none", background: "transparent", outline: "none", width: "100%", fontSize: "14px" }} />
          </div>
        </div>
        
        <div style={{ flex: 1, overflowY: "auto" }}>
          {conversations.map((conv) => (
            <div 
              key={conv.id} 
              onClick={() => setCurrentChat(conv)}
              style={{ 
                display: "flex", padding: "12px 16px", gap: "12px", cursor: "pointer",
                backgroundColor: currentChat?.id === conv.id ? "#e5efff" : "white",
                transition: "0.2s"
              }}
              onMouseEnter={(e) => { if(currentChat?.id !== conv.id) e.currentTarget.style.backgroundColor = "#f1f1f1" }}
              onMouseLeave={(e) => { if(currentChat?.id !== conv.id) e.currentTarget.style.backgroundColor = "white" }}
            >
              <img src={conv.avatar || "https://via.placeholder.com/50"} style={{ width: "48px", height: "48px", borderRadius: "50%", objectFit: "cover" }} />
              <div style={{ flex: 1, overflow: "hidden" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                  <span style={{ fontWeight: "600", color: "#333" }}>{conv.title || "Người dùng ẩn danh"}</span>
                  <span style={{ fontSize: "12px", color: "#888" }}>Vừa xong</span>
                </div>
                <div style={{ fontSize: "13px", color: "#666", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  Nhấn để xem tin nhắn mới nhất...
                </div>
              </div>
            </div>
          ))}
          {conversations.length === 0 && <div style={{ textAlign: "center", marginTop: "20px", color: "#888" }}>Chưa có tin nhắn nào</div>}
        </div>
      </div>

      {/* --- CỘT 3: KHUNG CHAT --- */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", backgroundColor: "#eef4fc" }}>
        {currentChat ? (
          <>
            {/* Header Chat */}
            <div style={{ height: "68px", backgroundColor: "white", padding: "0 20px", display: "flex", alignItems: "center", borderBottom: "1px solid #e0e0e0", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                <img src={currentChat.avatar || "https://via.placeholder.com/50"} style={{ width: "48px", height: "48px", borderRadius: "50%", objectFit: "cover" }} />
                <div>
                  <div style={{ fontWeight: "bold", fontSize: "16px" }}>{currentChat.title || "Chat"}</div>
                  <div style={{ fontSize: "12px", color: "#0068ff" }}>Vừa mới truy cập</div>
                </div>
              </div>
            </div>

            {/* Vùng Tin Nhắn */}
            <div style={{ flex: 1, padding: "20px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "10px" }}>
              {messages.map((msg, index) => {
                const isMe = msg.senderId === user.id;
                return (
                  <div key={index} style={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start", marginBottom: "5px" }}>
                    <div style={{ 
                      backgroundColor: isMe ? "#e5efff" : "white", 
                      padding: "10px 14px", 
                      borderRadius: "8px", 
                      maxWidth: "65%",
                      boxShadow: "0 1px 1px rgba(0,0,0,0.1)",
                      fontSize: "15px",
                      lineHeight: "1.5",
                      color: "#333",
                      border: isMe ? "1px solid #cce0ff" : "none"
                    }}>
                      {msg.content}
                    </div>
                  </div>
                )
              })}
              <div ref={scrollRef} />
            </div>

            {/* Vùng Nhập Tin */}
            <div style={{ height: "80px", backgroundColor: "white", borderTop: "1px solid #e0e0e0", display: "flex", alignItems: "center", padding: "0 20px", gap: "15px" }}>
              <BsImage size={22} color="#666" style={{ cursor: "pointer" }} />
              <div style={{ flex: 1, position: "relative" }}>
                <input 
                  type="text" 
                  placeholder="Nhập @, tin nhắn tới..." 
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                  style={{ width: "100%", padding: "12px", borderRadius: "4px", border: "none", outline: "none", fontSize: "15px" }} 
                />
                <BsEmojiSmile style={{ position: "absolute", right: "10px", top: "12px", color: "#666", cursor: "pointer" }} size={20} />
              </div>
              <IoSend size={26} color="#0068ff" onClick={handleSendMessage} style={{ cursor: "pointer" }} />
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", color: "#666" }}>
            <h3 style={{ marginBottom: "10px" }}>Chào mừng đến với Chat LTM!</h3>
            <p>Khám phá những tiện ích hỗ trợ làm việc và trò chuyện cùng người thân.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;