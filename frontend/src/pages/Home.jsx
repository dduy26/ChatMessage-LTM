import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
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

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  // 1. Lấy danh sách chat
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const res = await api.get("/conversations");
        setConversations(res.data);
      } catch (err) { console.error(err); }
    };
    fetchConversations();
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
    } catch (err) { alert("Lỗi gửi tin!"); }
  };

  // 5. Đăng xuất
  const handleLogout = async () => {
    try { await api.post("/auth/logout"); } catch (e) {}
    localStorage.clear();
    navigate("/login");
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
        <img src={getAvatar(user.fullName, user.avatar)} className="avatar-circle" style={{marginBottom: 20}} alt="Me" />
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
              <img src={getAvatar(conv.title, conv.avatar)} style={{width:48, height:48, borderRadius:'50%'}} alt="" />
              <div className="conv-info">
                 <h4>{conv.title || "User"}</h4>
                 <p>Tin nhắn mới nhất...</p>
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
                  <img src={getAvatar(currentChat.title, currentChat.avatar)} style={{width:40, height:40, borderRadius:'50%'}} alt="" />
                  <div>
                    <h3 style={{fontSize:16, fontWeight:'bold'}}>{currentChat.title}</h3>
                    <span style={{fontSize:12, color:'#22c55e'}}>● Online</span>
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
                    {!isMe && <img src={getAvatar(currentChat.title, currentChat.avatar)} style={{width:30, height:30, borderRadius:'50%'}} alt="" />}
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
          <div style={{flex:1, display:'flex', justifyContent:'center', alignItems:'center', color:'#888'}}>
             <p>Chọn một cuộc trò chuyện để bắt đầu</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;