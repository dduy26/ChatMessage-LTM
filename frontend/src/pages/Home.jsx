import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { io } from "socket.io-client";
import { 
  MessageCircle, Phone, Settings, LogOut, Search, 
  Send, Image, Paperclip, MoreVertical, Plus, Users, X, UserPlus, Check
} from "lucide-react";
import Friends from "./Friends";

const Home = () => {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const scrollRef = useRef();
  const socket = useRef();

  // --- STATE MỚI CHO PHẦN BẠN BÈ ---
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' hoặc 'friends'
  const [emailSearch, setEmailSearch] = useState("");
  const [pendingRequests, setPendingRequests] = useState([]);
  const [foundUser, setFoundUser] = useState(null);
  const [friends, setFriends] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  // Group chat state
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [selectedMembers, setSelectedMembers] = useState(new Set());
  const [creatingGroup, setCreatingGroup] = useState(false);
  
  // State cho tìm kiếm bạn bè trong conversation
  const [conversationSearch, setConversationSearch] = useState("");

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  // 1. Kết nối Socket và lấy danh sách chat (Giữ nguyên của bạn)
  useEffect(() => {
    socket.current = io("http://localhost:5000", {
      query: { token: localStorage.getItem("accessToken") }
    });

    socket.current.on("user_status_change", (data) => {
      console.log("User status changed:", data);
      
      // Cập nhật trạng thái trong conversations
      setConversations((prev) =>
        prev.map((conv) => {
          if (conv.participantId === data.userId) {
            return { ...conv, isOnline: data.isOnline };
          }
          return conv;
        })
      );

      // Cập nhật trạng thái trong currentChat
      setCurrentChat((prev) => {
        if (prev && prev.participantId === data.userId) {
          return { ...prev, isOnline: data.isOnline };
        }
        return prev;
      });

      // Cập nhật trạng thái trong messages (cập nhật sender.isOnline)
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.senderId === data.userId && msg.sender) {
            return {
              ...msg,
              sender: {
                ...msg.sender,
                isOnline: data.isOnline
              }
            };
          }
          return msg;
        })
      );

      // Cập nhật trạng thái trong friends list
      setFriends((prev) =>
        prev.map((friend) => {
          if (friend.id === data.userId) {
            return { ...friend, isOnline: data.isOnline };
          }
          return friend;
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

    // Lấy lời mời kết bạn khi vào trang
    fetchPendingRequests();
    // Lấy danh sách bạn bè khi vào trang
    fetchFriends();

    return () => socket.current.disconnect();
  }, []);

  // Logic lấy lời mời kết bạn (Pending)
  const fetchPendingRequests = async () => {
    try {
      const res = await api.get("/friendships/requests"); // Đảm bảo route này trả về danh sách PENDING
      setPendingRequests(res.data);
    } catch (err) { console.error("Lỗi lấy lời mời:", err); }
  };

  // Logic lấy danh sách bạn bè
  const fetchFriends = async () => {
    try {
      const res = await api.get("/friendships/friends");
      setFriends(res.data || []);
    } catch (err) { console.error("Lỗi lấy danh sách bạn bè:", err); }
  };

  // 2. Lấy tin nhắn và cập nhật trạng thái
  useEffect(() => {
    if (!currentChat) return;
    const fetchMessages = async () => {
      try {
        const res = await api.get(`/messages/conversation/${currentChat.id}`);
        setMessages(res.data);
        
        // Cập nhật trạng thái online từ messages nếu có
        if (res.data.length > 0) {
          const otherUserMessages = res.data.filter(msg => msg.senderId !== user.id);
          if (otherUserMessages.length > 0) {
            const otherUser = otherUserMessages[0].sender;
            if (otherUser && currentChat.participantId === otherUser.id) {
              setCurrentChat(prev => ({
                ...prev,
                isOnline: otherUser.isOnline || false
              }));
            }
          }
        }
      } catch (err) { console.error(err); }
    };
    fetchMessages();
  }, [currentChat, user.id]);

  // 3. Auto scroll (Giữ nguyên)
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 4. Gửi tin nhắn (Giữ nguyên)
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !currentChat) return;
    try {
      const res = await api.post(`/messages/${currentChat.id}`, {
        content: newMessage,
        senderId: user.id
      });
      setMessages([...messages, res.data]);
      setNewMessage("");
    } catch { alert("Lỗi gửi tin!"); }
  };

  // 5. Đăng xuất (Giữ nguyên)
  const handleLogout = async () => {
    try {
        // 1. Ngắt socket ngay lập tức
        if (socket.current) socket.current.disconnect();

        // 2. Gọi API (Dùng try-catch để nếu token hết hạn vẫn chạy tiếp xuống finally)
        await api.post("/auth/logout");
    } catch {
        console.warn("API logout failed, clearing local data anyway...");
    } finally {
        // 3. Xóa token và user data (avatar sẽ được load lại từ backend khi login)
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");
        navigate("/login");
    }
};

  // --- LOGIC XỬ LÝ BẠN BÈ ---
  const handleSearchUser = async () => {
    if (!emailSearch.trim()) {
      setFoundUser(null);
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailSearch.trim())) {
      setFoundUser(null);
      return;
    }

    setSearchLoading(true);
    try {
      const res = await api.get(`/friendships/search?email=${encodeURIComponent(emailSearch.trim())}`);
      setFoundUser(res.data);
    } catch (err) {
      setFoundUser(null);
      console.error("Không tìm thấy user:", err);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleAddFriend = async () => {
    if (!emailSearch.trim()) {
      alert("Vui lòng nhập email");
      return;
    }

    if (!foundUser) {
      // Nếu chưa tìm thấy user, tìm kiếm trước
      await handleSearchUser();
      if (!foundUser) {
        alert("Không tìm thấy người dùng với email này");
        return;
      }
    }

    try {
      await api.post('/friendships/send-request', { email: emailSearch.trim() });
      alert("Đã gửi lời mời kết bạn!");
      setEmailSearch("");
      setFoundUser(null);
      fetchPendingRequests(); // Refresh danh sách lời mời
    } catch (err) {
      alert(err.response?.data?.error || "Không thể gửi lời mời kết bạn");
    }
  };

  // Tự động tìm kiếm khi nhập email (debounce)
  useEffect(() => {
    if (activeTab === 'friends' && emailSearch.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailSearch.trim())) {
        setFoundUser(null);
        return;
      }

      const timeoutId = setTimeout(async () => {
        setSearchLoading(true);
        try {
          const res = await api.get(`/friendships/search?email=${encodeURIComponent(emailSearch.trim())}`);
          setFoundUser(res.data);
        } catch {
          setFoundUser(null);
        } finally {
          setSearchLoading(false);
        }
      }, 500);
      return () => clearTimeout(timeoutId);
    } else if (activeTab === 'friends' && !emailSearch.trim()) {
      setFoundUser(null);
    }
  }, [emailSearch, activeTab]);

  const handleAcceptFriend = async (requestId) => {
    try {
      await api.put(`/friendships/accept/${requestId}`);
      alert("Đã đồng ý kết bạn!");
      fetchPendingRequests(); // Load lại danh sách lời mời
      fetchFriends(); // Load lại danh sách bạn bè
    } catch { alert("Lỗi xác nhận"); }
  };

  const handleRejectFriend = async (requestId) => {
    try {
      await api.delete(`/friendships/${requestId}`);
      alert("Đã từ chối lời mời");
      fetchPendingRequests(); // Load lại danh sách lời mời
    } catch { alert("Lỗi khi từ chối"); }
  };

  // Group chat helpers
  const toggleGroupModal = () => {
    setShowGroupModal(!showGroupModal);
  };

  const handleToggleMember = (id) => {
    setSelectedMembers((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      alert("Vui lòng nhập tên nhóm");
      return;
    }
    if (selectedMembers.size === 0) {
      alert("Vui lòng chọn ít nhất một thành viên");
      return;
    }

    setCreatingGroup(true);
    try {
      const memberIds = Array.from(selectedMembers);
      const res = await api.post("/conversations/group", {
        title: groupName.trim(),
        memberIds
      });

      const newConv = {
        id: res.data.id,
        type: res.data.type,
        title: res.data.title || "Nhóm",
        avatar: null,
        participantId: null,
        isOnline: false,
        participants: res.data.participants?.map(p => ({
          id: p.user.id,
          username: p.user.username,
          fullName: p.user.fullName,
          avatar: p.user.avatar,
          isOnline: p.user.isOnline
        })) || []
      };

      setConversations(prev => [newConv, ...prev]);
      setCurrentChat(newConv);
      setShowGroupModal(false);
      setGroupName("");
      setSelectedMembers(new Set());
    } catch (err) {
      alert(err.response?.data?.error || "Không thể tạo nhóm");
    } finally {
      setCreatingGroup(false);
    }
  };

  // Tìm hoặc tạo conversation với bạn bè
  const handleStartConversation = async (friend) => {
    try {
      // Tìm conversation đã tồn tại với bạn này
      // Kiểm tra theo participantId hoặc title
      const existingConv = conversations.find(conv => {
        if (conv.participantId === friend.id) return true;
        if (conv.title === friend.username || conv.title === friend.fullName) return true;
        return false;
      });

      if (existingConv) {
        setCurrentChat(existingConv);
        setConversationSearch(""); // Clear search
        return;
      }

      // Tạo conversation mới
      const convRes = await api.post("/conversations", {
        type: "DIRECT"
      });

      // Thêm cả 2 người vào conversation
      await api.post("/participants", {
        userId: user.id,
        conversationId: convRes.data.id,
        role: "MEMBER"
      });

      await api.post("/participants", {
        userId: friend.id,
        conversationId: convRes.data.id,
        role: "MEMBER"
      });

      // Tạo conversation object để hiển thị
      const conversationToDisplay = {
        ...convRes.data,
        title: friend.fullName || friend.username || "Người dùng",
        avatar: friend.avatar,
        participantId: friend.id,
        isOnline: false
      };

      // Refresh danh sách conversations và set current chat
      const fetchConversations = async () => {
        try {
          const res = await api.get("/conversations");
          setConversations(res.data);
          // Tìm conversation vừa tạo hoặc sử dụng conversation object đã tạo
          const createdConv = res.data.find(c => c.id === convRes.data.id);
          if (createdConv) {
            setCurrentChat({
              ...createdConv,
              title: friend.fullName || friend.username || "Người dùng",
              avatar: friend.avatar,
              participantId: friend.id
            });
          } else {
            // Nếu không tìm thấy trong danh sách, dùng conversation object đã tạo
            setCurrentChat(conversationToDisplay);
            setConversations([conversationToDisplay, ...res.data]);
          }
        } catch (err) { 
          console.error(err);
          // Nếu fetch lỗi, vẫn set conversation đã tạo
          setCurrentChat(conversationToDisplay);
          setConversations([conversationToDisplay, ...conversations]);
        }
      };
      await fetchConversations();
      
      setConversationSearch(""); // Clear search
    } catch (err) {
      console.error("Lỗi tạo conversation:", err);
      alert(err.response?.data?.error || "Không thể tạo cuộc trò chuyện");
    }
  };

  // Filter bạn bè dựa trên search query
  const filteredFriends = friends.filter(friend => {
    if (!conversationSearch.trim()) return false;
    const searchLower = conversationSearch.toLowerCase();
    const name = (friend.fullName || friend.username || "").toLowerCase();
    const email = (friend.email || "").toLowerCase();
    return name.includes(searchLower) || email.includes(searchLower);
  });

  const getAvatar = (name, url) => url || `https://ui-avatars.com/api/?name=${encodeURIComponent(name||"U")}&background=random`;

  return (
    <div className="app-layout">
      {/* --- CỘT 1: SIDEBAR TÍM --- */}
      <div className="sidebar">
        <div style={{padding: 10}}><MessageCircle color="white" size={28} /></div>
        
        <div style={{flex:1, display:'flex', flexDirection:'column', gap: 20, alignItems:'center', width:'100%'}}>
            {/* Tab Tin nhắn */}
            <div 
              className={`sidebar-icon ${activeTab === 'chat' ? 'active' : ''}`}
              onClick={() => setActiveTab('chat')}
            >
              <MessageCircle size={24} />
            </div>

            

            {/* Tab Bạn bè (Mới thêm) */}
            <div 
              className={`sidebar-icon ${activeTab === 'friends' ? 'active' : ''}`}
              onClick={() => setActiveTab('friends')}
            >
              <Users size={24} />
            </div>

            <div className="sidebar-icon"><Settings size={24} /></div>
        </div>

        <div className="sidebar-icon" onClick={handleLogout} title="Đăng xuất">
            <LogOut size={24} />
        </div>
        
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

      {/* Modal tạo nhóm */}
      {showGroupModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50
        }}
          onClick={(e) => { if (e.target === e.currentTarget) toggleGroupModal(); }}
        >
          <div style={{
            background: '#fff',
            borderRadius: 16,
            width: 420,
            maxHeight: '80vh',
            overflow: 'hidden',
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Tạo nhóm mới</h3>
              <button onClick={toggleGroupModal} style={{ border:'none', background:'transparent', cursor:'pointer', fontSize:18 }}>×</button>
            </div>
            <div style={{ padding: '16px 20px', display:'flex', flexDirection:'column', gap:12, overflowY:'auto' }}>
              <div>
                <label style={{ fontWeight: 600, fontSize: 14 }}>Tên nhóm</label>
                <input
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Nhập tên nhóm..."
                  style={{
                    width:'100%',
                    marginTop:6,
                    padding:'10px 12px',
                    border:'1px solid #e5e7eb',
                    borderRadius:10
                  }}
                />
              </div>
              <div>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                  <label style={{ fontWeight: 600, fontSize: 14 }}>Chọn thành viên</label>
                  {selectedMembers.size > 0 && (
                    <span style={{ fontSize: 13, color: '#7360f2', fontWeight: 600 }}>
                      Đã chọn: {selectedMembers.size} thành viên
                    </span>
                  )}
                </div>
                <div style={{ marginTop:8, maxHeight: 260, overflowY:'auto', border:'1px solid #e5e7eb', borderRadius:10, padding:10 }}>
                  {friends.length === 0 ? (
                    <p style={{ color:'#9ca3af', fontSize:13 }}>Bạn chưa có bạn bè để thêm.</p>
                  ) : friends.map(f => (
                    <label key={f.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 6px', cursor:'pointer' }}>
                      <input
                        type="checkbox"
                        checked={selectedMembers.has(f.id)}
                        onChange={() => handleToggleMember(f.id)}
                      />
                      <img
                        src={getAvatar(f.fullName || f.username, f.avatar)}
                        alt={f.fullName || f.username}
                        style={{ width:32, height:32, borderRadius:'50%', objectFit:'cover' }}
                      />
                      <div style={{ flex:1 }}>
                        <div style={{ fontWeight:600, fontSize:14 }}>{f.fullName || f.username || "Người dùng"}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ padding:'12px 20px', borderTop:'1px solid #e5e7eb', display:'flex', justifyContent:'flex-end', gap:10 }}>
              <button onClick={toggleGroupModal} style={{ padding:'10px 14px', border:'1px solid #e5e7eb', borderRadius:10, background:'#fff', cursor:'pointer' }}>
                Hủy
              </button>
              <button
                onClick={handleCreateGroup}
                disabled={creatingGroup}
                style={{
                  padding:'10px 14px',
                  border:'none',
                  borderRadius:10,
                  background:'#7360f2',
                  color:'#fff',
                  cursor: creatingGroup ? 'not-allowed' : 'pointer',
                  opacity: creatingGroup ? 0.7 : 1
                }}
              >
                {creatingGroup ? "Đang tạo..." : "Tạo nhóm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- CỘT 2: DANH SÁCH CHAT / BẠN BÈ --- */}
      <div className="chat-list">
        {activeTab === 'chat' ? (
          <>
            <div className="search-bar" style={{ display:'flex', alignItems:'center', gap:8 }}>
                <div style={{display:'flex', alignItems:'center', background:'#f3f4f6', borderRadius:20, padding:'0 15px', flex:1}}>
                  <Search size={16} color="#888" />
                  <input 
                    className="search-input" 
                    placeholder="Tìm kiếm cuộc trò chuyện hoặc bạn bè..." 
                    value={conversationSearch}
                    onChange={(e) => setConversationSearch(e.target.value)}
                  />
                </div>
                <button 
                  onClick={toggleGroupModal}
                  title="Tạo nhóm"
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    border: 'none',
                    background: '#7360f2',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                >
                  <Users size={18} />
                </button>
            </div>
            
            <div style={{flex:1, overflowY:'auto'}}>
              {/* Hiển thị kết quả tìm kiếm bạn bè */}
              {conversationSearch.trim() && filteredFriends.length > 0 && (
                <div style={{ padding: '10px 15px', borderBottom: '1px solid #e5e7eb' }}>
                  <h4 style={{ fontSize: 12, color: '#9ca3af', marginBottom: 8, fontWeight: '600' }}>BẠN BÈ</h4>
                  {filteredFriends.map(friend => (
                    <div 
                      key={friend.id}
                      className="conv-item"
                      onClick={() => handleStartConversation(friend)}
                      style={{ 
                        cursor: 'pointer',
                        borderRadius: 12,
                        marginBottom: 8,
                        padding: '10px',
                        background: '#f9fafb',
                        transition: '0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
                      onMouseLeave={(e) => e.currentTarget.style.background = '#f9fafb'}
                    >
                      <div style={{ position: 'relative' }}>
                        <img 
                          src={getAvatar(friend.fullName || friend.username, friend.avatar)} 
                          style={{width:48, height:48, borderRadius:'50%'}} 
                          alt="" 
                        />
                        <div style={{ 
                          position: 'absolute', bottom: 2, right: 2, width: 12, height: 12, borderRadius: '50%', 
                          background: '#22c55e', 
                          border: '2px solid white' 
                        }}></div>
                      </div>
                      <div className="conv-info">
                        <h4>{friend.fullName || friend.username || "Người dùng"}</h4>
                        <p style={{ fontSize: 12, color: '#6b7280' }}>Bạn bè</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Hiển thị danh sách conversations (filtered) */}
              {conversations
                .filter(conv => {
                  if (!conversationSearch.trim()) return true;
                  const searchLower = conversationSearch.toLowerCase();
                  const title = (conv.title || "").toLowerCase();
                  return title.includes(searchLower);
                })
                .map(conv => (
                <div 
                  key={conv.id} 
                  className={`conv-item ${currentChat?.id === conv.id ? 'active' : ''}`}
                  onClick={() => setCurrentChat(conv)}
                >
                  <div style={{ position: 'relative' }}>
                    <img src={getAvatar(conv.title, conv.avatar)} style={{width:48, height:48, borderRadius:'50%'}} alt="" />
                    {/* Chỉ hiển thị trạng thái online/offline cho DIRECT chat, không hiển thị cho GROUP */}
                    {conv.type === "DIRECT" && (
                      <div style={{ 
                        position: 'absolute', bottom: 2, right: 2, width: 12, height: 12, borderRadius: '50%', 
                        background: conv.isOnline ? '#22c55e' : '#94a3b8', 
                        border: '2px solid white' 
                      }}></div>
                    )}
                    {/* Hiển thị số lượng thành viên cho GROUP */}
                    {conv.type === "GROUP" && conv.participants && (
                      <div style={{ 
                        position: 'absolute', bottom: 2, right: 2, width: 20, height: 20, borderRadius: '50%', 
                        background: '#7360f2', 
                        border: '2px solid white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '10px',
                        fontWeight: 'bold',
                        color: 'white'
                      }}>
                        {conv.participants.length}
                      </div>
                    )}
                  </div>
                  <div className="conv-info">
                      <h4>{conv.title || "User"}</h4>
                      {conv.type === "GROUP" ? (
                        <p style={{ fontSize: 12, color: '#6b7280' }}>
                          {conv.participants?.length || 0} thành viên
                        </p>
                      ) : (
                        <p>{conv.isOnline ? "Đang hoạt động" : "Ngoại tuyến"}</p>
                      )}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          /* GIAO DIỆN QUẢN LÝ BẠN BÈ TẠI CỘT 2 */
          <div className="friends-manager" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div className="p-4 border-b border-gray-100">
              <h3 style={{ fontWeight: 'bold', margin: '10px 15px' }}>Kết bạn mới</h3>
              <div style={{ display: 'flex', gap: 8, padding: '0 15px' }}>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', background: '#f3f4f6', borderRadius: 20, padding: '0 15px' }}>
                  <Search size={14} color="#888" />
                  <input 
                    className="search-input" 
                    placeholder="Nhập email..." 
                    value={emailSearch}
                    onChange={(e) => setEmailSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddFriend()}
                  />
                </div>
                <button 
                  onClick={handleAddFriend} 
                  disabled={searchLoading || !foundUser}
                  style={{ 
                    background: (foundUser && !searchLoading) ? '#7360f2' : '#9ca3af', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '50%', 
                    width: 32, 
                    height: 32, 
                    cursor: (foundUser && !searchLoading) ? 'pointer' : 'not-allowed',
                    opacity: (foundUser && !searchLoading) ? 1 : 0.6
                  }}
                >
                  <UserPlus size={18} />
                </button>
              </div>
              
              {/* Hiển thị kết quả tìm kiếm */}
              {foundUser && (
                <div style={{ 
                  margin: '10px 15px', 
                  padding: '12px', 
                  background: 'white', 
                  borderRadius: 12, 
                  border: '1px solid #e5e7eb',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12
                }}>
                  <img 
                    src={getAvatar(foundUser.fullName, foundUser.avatar)} 
                    style={{ width: 40, height: 40, borderRadius: '50%' }} 
                    alt="" 
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '600', fontSize: 14, color: '#1f2937' }}>
                      {foundUser.fullName || "Người dùng"}
                    </div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>{foundUser.email}</div>
                  </div>
                </div>
              )}
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '15px' }}>
              {/* Danh sách bạn bè */}
              <h4 style={{ fontSize: 12, color: '#aaa', marginBottom: 10, marginTop: 10 }}>DANH SÁCH BẠN BÈ ({friends.length})</h4>
              {friends.length > 0 ? (
                friends.map(friend => (
                  <div key={friend.id} className="conv-item" style={{ borderRadius: 12, marginBottom: 8, background: '#f9f9f9' }}>
                    <img 
                      src={getAvatar(friend.username || friend.fullName, friend.avatar)} 
                      style={{ width: 40, height: 40, borderRadius: '50%', marginRight: 12 }} 
                      alt="" 
                    />
                    <div className="conv-info" style={{ flex: 1 }}>
                      <h4 style={{ fontSize: 14 }}>{friend.username || friend.fullName || "Người dùng"}</h4>
                      <p style={{ fontSize: 11, color: '#6b7280' }}>Đã là bạn bè</p>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '20px', color: '#9ca3af', fontSize: 12 }}>
                  Chưa có bạn bè nào
                </div>
              )}

              <h4 style={{ fontSize: 12, color: '#aaa', marginBottom: 10, marginTop: 20 }}>LỜI MỜI KẾT BẠN ({pendingRequests.length})</h4>
              {pendingRequests.map(req => (
                <div key={req.id} className="conv-item" style={{ borderRadius: 12, marginBottom: 8, background: '#f9f9f9' }}>
                   <div className="conv-info">
                      <h4 style={{ fontSize: 14 }}>{req.requester?.fullName || "Người dùng"}</h4>
                      <p style={{ fontSize: 11 }}>{req.requester?.email}</p>
                   </div>
                   <div style={{ display: 'flex', gap: 5 }}>
                      <button onClick={() => handleAcceptFriend(req.id)} style={{ background: '#22c55e', color: 'white', border: 'none', borderRadius: 6, padding: '4px 8px', cursor: 'pointer' }}>
                        <Check size={16} />
                      </button>
                      <button onClick={() => handleRejectFriend(req.id)} style={{ background: '#ef4444', color: 'white', border: 'none', borderRadius: 6, padding: '4px 8px', cursor: 'pointer' }}>
                        <X size={16} />
                      </button>
                   </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* --- CỘT 3: CỬA SỔ CHAT (Giữ nguyên) --- */}
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
                const senderName = msg.sender?.fullName || msg.sender?.username || "Người dùng";
                const senderAvatar = msg.sender?.avatar;
                const senderIsOnline = msg.sender?.isOnline || false;
                
                return (
                  <div key={msg.id || idx} className={`msg-row ${isMe ? 'me' : 'other'}`} style={{ marginBottom: '12px' }}>
                    {!isMe && (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <div style={{ position: 'relative' }}>
                            <img 
                              src={getAvatar(senderName, senderAvatar)} 
                              style={{width:32, height:32, borderRadius:'50%', objectFit: 'cover'}} 
                              alt={senderName}
                            />
                            <div style={{ 
                              position: 'absolute', 
                              bottom: 0, 
                              right: 0, 
                              width: 10, 
                              height: 10, 
                              borderRadius: '50%', 
                              background: senderIsOnline ? '#22c55e' : '#94a3b8', 
                              border: '2px solid white' 
                            }}></div>
                          </div>
                          <span style={{ fontSize: '13px', fontWeight: '600', color: '#374151' }}>
                            {senderName}
                          </span>
                          <span style={{ fontSize: '11px', color: senderIsOnline ? '#22c55e' : '#9ca3af' }}>
                            {senderIsOnline ? '● Online' : '● Offline'}
                          </span>
                        </div>
                        <div className="msg-bubble" style={{ marginLeft: '40px' }}>
                          {msg.content}
                        </div>
                      </div>
                    )}
                    {isMe && (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <span style={{ fontSize: '11px', color: '#9ca3af' }}>
                            {user.isOnline ? '● Online' : '● Offline'}
                          </span>
                          <span style={{ fontSize: '13px', fontWeight: '600', color: '#374151' }}>
                            {user.fullName || user.username || "Bạn"}
                          </span>
                          <div style={{ position: 'relative' }}>
                            <img 
                              src={getAvatar(user.fullName || user.username, user.avatar)} 
                              style={{width:32, height:32, borderRadius:'50%', objectFit: 'cover'}} 
                              alt="Bạn"
                            />
                            <div style={{ 
                              position: 'absolute', 
                              bottom: 0, 
                              right: 0, 
                              width: 10, 
                              height: 10, 
                              borderRadius: '50%', 
                              background: user.isOnline ? '#22c55e' : '#94a3b8', 
                              border: '2px solid white' 
                            }}></div>
                          </div>
                        </div>
                        <div className="msg-bubble" style={{ marginRight: '40px' }}>
                          {msg.content}
                        </div>
                      </div>
                    )}
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
               <div onClick={handleSendMessage} className="send-btn"><Send size={24} /></div>
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