import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { io } from "socket.io-client"; // Cần cài thư viện này
// Dùng bộ icon Lucide cho hiện đại (Viber style)
import { 
  MessageCircle, Phone, Settings, LogOut, Search, 
  Send, Image, Paperclip, MoreVertical, Plus 
} from "lucide-react";

const Home = () => {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const scrollRef = useRef();
  const socket = useRef(); // Sử dụng ref để giữ kết nối socket

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  // 1. Kết nối Socket và lấy danh sách chat
  useEffect(() => {
    // Khởi tạo socket
    socket.current = io("http://localhost:5000", {
      query: { token: localStorage.getItem("accessToken") }
    });

    // Lắng nghe thay đổi trạng thái từ server
    socket.current.on("user_status_change", (data) => {
      setConversations((prev) =>
        prev.map((conv) => {
          if (conv.participantId === data.userId) {
            return { ...conv, isOnline: data.isOnline };
          }
          return conv;
        })
      );
    });

    const fetchConversations = async () => {
      try {
        const res = await api.get("/conversations");
        setConversations(res.data);
      } catch (err) { console.error(err); }
    };
    fetchConversations();

    return () => socket.current.disconnect();
  }, []);

  // 2. Lấy tin nhắn
  useEffect(() => {
    if (!currentChat) return;
    const fetchMessages = async () => {
      try {
        const res = await api.get(`/messages/conversation/${currentChat.id}`);
        setMessages(res.data);
      } catch (err) { console.error(err); }
    };
    fetchMessages();
  }, [currentChat]);

  // 3. Auto scroll
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 4. Gửi tin nhắn
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !currentChat) return;
    try {
      const res = await api.post(`/messages/${currentChat.id}`, {
        content: newMessage,
        senderId: user.id
      });
      setMessages([...messages, res.data]);
      setNewMessage("");
    } catch { 
      alert("Lỗi gửi tin!"); 
    }
  };

  // 5. Đăng xuất
  const handleLogout = async () => {
    try {
        const res = await api.post("/auth/logout");
        if (res.data.success) { alert(res.data.message); }
    } catch (err) {
        console.error("Lỗi đăng xuất:", err);
    } finally {
        localStorage.clear();
        navigate("/login");
    }
  };

  const getAvatar = (name, url) => url || `https://ui-avatars.com/api/?name=${encodeURIComponent(name||"U")}&background=random`;

  return (
    <div className="app-layout">
      {/* --- CỘT 1: SIDEBAR TÍM --- */}
      <div className="sidebar">
        <div style={{padding: 10}}><MessageCircle color="white" size={28} /></div>
        
        <div style={{flex:1, display:'flex', flexDirection:'column', gap: 20, alignItems:'center', width:'100%'}}>
           <div className="sidebar-icon active"><MessageCircle size={24} /></div>
           <div className="sidebar-icon"><Phone size={24} /></div>
           <div className="sidebar-icon"><Settings size={24} /></div>
        </div>

        <div className="sidebar-icon" onClick={handleLogout} title="Đăng xuất">
            <LogOut size={24} />
        </div>
        
        {/* Avatar của Tôi có chấm xanh mặc định vì đang online */}
        <div style={{ position: 'relative', marginBottom: 20 }}>
            <img 
              src={getAvatar(user.fullName, user.avatar)} 
              className="avatar-circle" 
              style={{ cursor: "pointer" }}
              alt="Me" 
              onClick={() => navigate("/profile")} 
            />
            <div style={{ position: 'absolute', bottom: 0, right: 0, width: 12, height: 12, borderRadius: '50%', background: '#22c55e', border: '2px solid #7360f2' }}></div>
        </div>
      </div>

      {/* --- CỘT 2: DANH SÁCH CHAT --- */}
      <div className="chat-list">
        <div className="search-bar">
           <div style={{display:'flex', alignItems:'center', background:'#f3f4f6', borderRadius:20, padding:'0 15px'}}>
              <Search size={16} color="#888" />
              <input className="search-input" placeholder="Tìm kiếm..." />
           </div>
        </div>
        
        <div style={{flex:1, overflowY:'auto'}}>
          {conversations.map(conv => (
            <div 
              key={conv.id} 
              className={`conv-item ${currentChat?.id === conv.id ? 'active' : ''}`}
              onClick={() => setCurrentChat(conv)}
            >
              <div style={{ position: 'relative' }}>
                <img src={getAvatar(conv.title, conv.avatar)} style={{width:48, height:48, borderRadius:'50%'}} alt="" />
                {/* Chấm trạng thái trong danh sách hội thoại */}
                <div style={{ 
                  position: 'absolute', bottom: 2, right: 2, width: 12, height: 12, borderRadius: '50%', 
                  background: conv.isOnline ? '#22c55e' : '#94a3b8', 
                  border: '2px solid white' 
                }}></div>
              </div>
              <div className="conv-info">
                 <h4>{conv.title || "User"}</h4>
                 <p>{conv.isOnline ? "Đang hoạt động" : "Ngoại tuyến"}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* --- CỘT 3: CỬA SỔ CHAT --- */}
      <div className="chat-window">
        {currentChat ? (
          <>
            <div className="chat-header">
               <div style={{display:'flex', gap:12, alignItems:'center'}}>
                  <div style={{ position: 'relative' }}>
                    <img src={getAvatar(currentChat.title, currentChat.avatar)} style={{width:40, height:40, borderRadius:'50%'}} alt="" />
                    <div style={{ position: 'absolute', bottom: 0, right: 0, width: 10, height: 10, borderRadius: '50%', background: currentChat.isOnline ? '#22c55e' : '#94a3b8', border: '2px solid white' }}></div>
                  </div>
                  <div>
                    <h3 style={{fontSize:16, fontWeight:'bold'}}>{currentChat.title}</h3>
                    <span style={{fontSize:12, color: currentChat.isOnline ? '#22c55e' : '#888'}}>
                        ● {currentChat.isOnline ? "Online" : "Offline"}
                    </span>
                  </div>
               </div>
               <div style={{display:'flex', gap:20, color:'#7360f2'}}>
                  <Phone style={{cursor:'pointer'}} />
                  <MoreVertical style={{cursor:'pointer'}} />
               </div>
            </div>

            <div className="messages-area">
              {messages.map((msg, idx) => {
                const isMe = msg.senderId === user.id;
                return (
                  <div key={idx} className={`msg-row ${isMe ? 'me' : 'other'}`}>
                    {!isMe && (
                        <div style={{ position: 'relative', alignSelf: 'flex-end' }}>
                             <img src={getAvatar(currentChat.title, currentChat.avatar)} style={{width:30, height:30, borderRadius:'50%'}} alt="" />
                        </div>
                    )}
                    <div className="msg-bubble">
                      {msg.content}
                    </div>
                  </div>
                )
              })}
              <div ref={scrollRef} />
            </div>

            <div className="chat-input-area">
               <Plus size={24} color="#888" style={{cursor:'pointer'}} />
               <div style={{flex:1, background:'#f3f4f6', borderRadius:24, padding:'10px 15px', display:'flex', alignItems:'center'}}>
                  <input 
                    className="chat-input" 
                    placeholder="Nhập tin nhắn..." 
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                  />
                  <div style={{display:'flex', gap:10, color:'#888'}}>
                     <Image size={20} style={{cursor:'pointer'}} />
                     <Paperclip size={20} style={{cursor:'pointer'}} />
                  </div>
               </div>
               <div onClick={handleSendMessage} className="send-btn">
                  <Send size={24} />
               </div>
            </div>
          </>
        ) : (
          <div className="empty-chat" style={{flex:1, display:'flex', flexDirection: 'column', justifyContent:'center', alignItems:'center', color:'#888'}}>
              <MessageCircle size={64} style={{ marginBottom: 10, opacity: 0.2 }} />
              <p>Chọn một cuộc trò chuyện để bắt đầu</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;