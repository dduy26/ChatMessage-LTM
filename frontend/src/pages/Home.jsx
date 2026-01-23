import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api, { sendMessage } from "../services/api";
import { io } from "socket.io-client";
import { 
  MessageCircle, Phone, Settings, LogOut, Search, 
  Send, Image, Paperclip, MoreVertical, Plus, Users, X, UserPlus, Check,
  Info, Trash2, LogOut as LeaveIcon, FileText, Download, Smile
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
  const currentChatRef = useRef(null);

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
  
  // State cho panel thông tin hội thoại
  const [showInfoPanel, setShowInfoPanel] = useState(false);
  const [conversationImages, setConversationImages] = useState([]);
  const [conversationFiles, setConversationFiles] = useState([]);
  const [loadingAttachments, setLoadingAttachments] = useState(false);
  
  // State cho menu Plus và Emoji picker
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  // file
  const [selectedFiles, setSelectedFiles] = useState([]); // Lưu trữ file đã chọn
  const [filePreviews, setFilePreviews] = useState([]); // Lưu trữ preview URLs cho hiển thị
  const fileInputRef = useRef(); // Ref để kích hoạt input file ẩn
  useEffect(() => {currentChatRef.current = currentChat;}, [currentChat]);
    useEffect(() => {
    // Khởi tạo kết nối
    socket.current = io("http://localhost:5000", {
      // Dùng auth thay vì query để khớp với middleware xác thực ở Backend
      auth: { token: localStorage.getItem("accessToken") } 
    });

    socket.current.on("new message", (msg) => {
      // chặn tin của chính mình
      if (msg.senderId === user.id) return;

      const activeChat = currentChatRef.current;
      if (!activeChat || activeChat.id !== msg.conversationId) return;

      setMessages(prev => [...prev, msg]);
    });

    // Lắng nghe tin nhắn mới
    socket.current.on("user_status_change", (data) => {
        // 1. Update sidebar
        setConversations(prev =>
          prev.map(conv =>
            conv.participantId === data.userId? { ...conv, isOnline: data.isOnline }: conv
          )
        );

        // 2. Update messages 
        setMessages(prev =>
          prev.map(msg =>
            msg.senderId === data.userId
              ? { ...msg, sender: { ...msg.sender, isOnline: data.isOnline } }
              : msg
          )
        );

        // 3. Update friends 
        setFriends(prev =>
          prev.map(friend =>
            friend.id === data.userId
              ? { ...friend, isOnline: data.isOnline }
              : friend
          )
        );
      });
    // Fetch dữ liệu ban đầu
    const initData = async () => {
      try {
        const res = await api.get("/conversations");
        setConversations(res.data);
        fetchPendingRequests();
        fetchFriends();
      } catch (err) { console.error(err); }
    };
    initData();

    return () => socket.current.disconnect();
  }, []);

  // Cleanup preview URLs khi component unmount
  useEffect(() => {
    return () => {
      filePreviews.forEach(preview => {
        if (preview.url && preview.type === 'image') {
          URL.revokeObjectURL(preview.url);
        }
      });
    };
  }, [filePreviews]);

  useEffect(() => { if (!currentChat || !socket.current) return;
    
    // Tham gia vào phòng chat cụ thể (Nhóm hoặc Cá nhân)
    socket.current.emit("join_conversation", currentChat.id);

    // Fetch tin nhắn cũ của cuộc trò chuyện đó
  (async () => {
    try {
      const res = await api.get(`/messages/conversation/${currentChat.id}`);
      setMessages(res.data);
    } catch (err) {
      console.error(err);
    }
  })();
    // rời room cũ khi đổi chat
  return () => {
    socket.current.emit("leave_conversation", currentChat.id);
  };
}, [currentChat?.id]);

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


  //  Auto scroll
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  //  Gửi tin nhắn (text + file)
  const handleSendMessage = async () => {
    if ((!newMessage.trim() && selectedFiles.length === 0) || !currentChat) return;

    try {
      const res = await sendMessage(
        currentChat.id,
        newMessage.trim() || "",
        selectedFiles
      );

      if (!res.data || !res.data.id) {
        console.error("Response không hợp lệ:", res.data);
        alert("Lỗi: Phản hồi từ server không hợp lệ");
        return;
      }

      // Phát socket để người khác nhận được file ngay lập tức
      socket.current.emit("send_message", res.data);

      setMessages((prev) => [...prev, res.data]);
      setNewMessage("");
      setSelectedFiles([]);
      // Xóa preview URLs để giải phóng memory
      filePreviews.forEach((preview) => {
        if (preview.url && preview.type === "image") {
          URL.revokeObjectURL(preview.url);
        }
      });
      setFilePreviews([]);
    } catch (err) {
      console.error("Lỗi khi gửi tin nhắn:", err);
      alert("Lỗi khi gửi tin nhắn: " + (err.response?.data?.error || err.message));
    }
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
        // 1. Gọi API "Tìm hoặc Tạo" duy nhất
        const res = await api.post("/conversations/direct", { 
            receiverId: friend.id 
        });

        const convData = res.data;

        // 2. Format dữ liệu để hiển thị đồng nhất với danh sách sidebar
        const formattedConv = {
            id: convData.id,
            type: convData.type,
            title: friend.fullName || friend.username || "Người dùng",
            avatar: friend.avatar,
            participantId: friend.id,
            isOnline: friend.isOnline || false,
            participants: convData.participants
        };

        // 3. Cập nhật state conversations (đưa lên đầu danh sách nếu chưa có)
        setConversations(prev => {
            const exists = prev.find(c => c.id === formattedConv.id);
            if (exists) return prev;
            return [formattedConv, ...prev];
        });

        // 4. Mở cửa sổ chat
        setCurrentChat(formattedConv);
        setConversationSearch(""); 
        
    } catch (err) {
        console.error("Lỗi khi bắt đầu trò chuyện:", err);
        alert(err.response?.data?.error || "Không thể kết nối với người dùng này");
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

  // Load attachments khi mở info panel
  useEffect(() => {
    if (showInfoPanel && currentChat) {
      loadAttachments();
    }
  }, [showInfoPanel, currentChat?.id]);

  const loadAttachments = async () => {
    if (!currentChat) return;
    
    setLoadingAttachments(true);
    try {
      const [imagesRes, filesRes] = await Promise.all([
        api.get(`/attachments/conversation/${currentChat.id}/images`),
        api.get(`/attachments/conversation/${currentChat.id}/files`)
      ]);
      setConversationImages(imagesRes.data || []);
      setConversationFiles(filesRes.data || []);
    } catch (err) {
      console.error("Lỗi load attachments:", err);
      setConversationImages([]);
      setConversationFiles([]);
    } finally {
      setLoadingAttachments(false);
    }
  };

  // Xóa lịch sử trò chuyện (cho bạn bè)
  const handleDeleteConversationHistory = async () => {
    if (!currentChat) return;
    
    if (!window.confirm("Bạn có chắc chắn muốn xóa toàn bộ lịch sử trò chuyện? Hành động này không thể hoàn tác.")) {
      return;
    }

    try {
      await api.delete(`/messages/conversation/${currentChat.id}/history`);
      alert("Đã xóa lịch sử trò chuyện thành công!");
      // Reload messages (sẽ trống)
      const res = await api.get(`/messages/conversation/${currentChat.id}`);
      setMessages(res.data || []);
      // Reload attachments
      loadAttachments();
    } catch (err) {
      alert(err.response?.data?.error || "Không thể xóa lịch sử trò chuyện");
    }
  };

  // Rời nhóm (cho GROUP)
  const handleLeaveGroup = async (deleteHistory = false) => {
    if (!currentChat || currentChat.type !== "GROUP") return;
    
    const message = deleteHistory 
      ? "Bạn có chắc chắn muốn rời nhóm và xóa toàn bộ lịch sử trò chuyện? Hành động này không thể hoàn tác."
      : "Bạn có chắc chắn muốn rời nhóm?";
    
    if (!window.confirm(message)) {
      return;
    }

    try {
      await api.post(`/participants/conversation/${currentChat.id}/leave`, {
        deleteHistory
      });
      alert(deleteHistory ? "Đã rời nhóm và xóa lịch sử trò chuyện!" : "Đã rời nhóm thành công!");
      
      // Xóa conversation khỏi danh sách
      setConversations(prev => prev.filter(c => c.id !== currentChat.id));
      setCurrentChat(null);
      setShowInfoPanel(false);
      setMessages([]);
    } catch (err) {
      alert(err.response?.data?.error || "Không thể rời nhóm");
    }
  };

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
                  <Info 
                    style={{cursor:'pointer'}} 
                    onClick={() => setShowInfoPanel(!showInfoPanel)}
                    title="Thông tin hội thoại"
                  />
                  <MoreVertical style={{cursor:'pointer'}} />
               </div>
            </div>

        <div className="messages-area">
          {messages.map((msg, idx) => {
            const isMe = msg.senderId === user.id;
            const senderName = msg.sender?.fullName || msg.sender?.username || "Người dùng";
            const senderAvatar = msg.sender?.avatar;
            const senderIsOnline = msg.sender?.isOnline || false;

            // Hàm render nội dung tin nhắn chung cho cả 2 bên để tránh lặp code
            const renderMessageContent = () => {
              // Kiểm tra xem có nội dung text hoặc file không
              const hasContent = msg.content && msg.content.trim().length > 0;
              const hasAttachments = msg.attachments && msg.attachments.length > 0;
              
              // Nếu không có cả text và file, không hiển thị bubble
              if (!hasContent && !hasAttachments) {
                return null;
              }

              return (
                <div className="msg-bubble" style={{ marginRight: isMe ? '40px' : 0 }}>
                  {/* Hiển thị text nếu có nội dung */}
                  {hasContent && <p style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{msg.content}</p>}
                  
                  {/* Hiển thị file đính kèm (ảnh/file) */}
                  {hasAttachments && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginTop: hasContent ? '8px' : '0' }}>
                      {msg.attachments.map((file) => (
                        <div key={file.id || file.fileUrl}>
                          {file.fileType?.includes("image") ? (
                            <img 
                              src={file.fileUrl} 
                              style={{ maxWidth: '200px', borderRadius: 8, display: 'block' }} 
                              alt="attachment" 
                            />
                          ) : (
                            <a href={file.fileUrl} target="_blank" rel="noreferrer" style={{ color: 'inherit', textDecoration: 'underline' }}>
                              📄 {file.fileName || "Tệp tin"}
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            };

            return (
              <div key={msg.id || idx} className={`msg-row ${isMe ? 'me' : 'other'}`} style={{ marginBottom: '12px' }}>
                {!isMe && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <div style={{ position: 'relative' }}>
                        <img src={getAvatar(senderName, senderAvatar)} style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} alt={senderName} />
                        <div style={{ position: 'absolute', bottom: 0, right: 0, width: 10, height: 10, borderRadius: '50%', background: senderIsOnline ? '#22c55e' : '#94a3b8', border: '2px solid white' }}></div>
                      </div>
                      <span style={{ fontSize: '13px', fontWeight: '600', color: '#374151' }}>{senderName}</span>
                    </div>
                    {/* GỌI HÀM RENDER */}
                    {renderMessageContent()}
                  </div>
                )}

                {isMe && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '13px', fontWeight: '600', color: '#374151' }}>Bạn</span>
                      <img 
                        src={getAvatar(user.fullName || user.username, user.avatar)} 
                        style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', cursor: 'pointer' }} 
                        alt="Bạn" 
                        onClick={() => navigate("/profile")}
                        title="Xem hồ sơ của bạn"
                      />
                    </div>
                    {/* GỌI HÀM RENDER - Đã sửa lỗi hiển thị tại đây */}
                    {renderMessageContent()}
                  </div>
                )}
              </div>
            );
          })}
          <div ref={scrollRef} />
        </div>
            <div className="chat-input-area">
              {/* Preview area cho files đã chọn */}
              {filePreviews.length > 0 && (
                <div style={{
                  display: 'flex',
                  gap: '8px',
                  padding: '10px 15px',
                  background: '#f9fafb',
                  borderBottom: '1px solid #e5e7eb',
                  overflowX: 'auto',
                  alignItems: 'center'
                }}>
                  {/* Nút thêm file */}
                  <div
                    onClick={() => fileInputRef.current.click()}
                    style={{
                      minWidth: '60px',
                      height: '60px',
                      borderRadius: '8px',
                      border: '2px dashed #d1d5db',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      background: '#fff',
                      flexShrink: 0
                    }}
                  >
                    <Plus size={24} color="#9ca3af" />
                  </div>
                  
                  {/* Preview các file đã chọn */}
                  {filePreviews.map((preview) => (
                    <div
                      key={preview.id}
                      style={{
                        position: 'relative',
                        minWidth: '60px',
                        height: '60px',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        flexShrink: 0,
                        background: preview.type === 'image' ? 'transparent' : '#f3f4f6'
                      }}
                    >
                      {preview.type === 'image' ? (
                        <img
                          src={preview.url}
                          alt={preview.name}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                          }}
                        />
                      ) : (
                        <div style={{
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '4px'
                        }}>
                          <Paperclip size={20} color="#6b7280" />
                          <span style={{
                            fontSize: '10px',
                            color: '#6b7280',
                            textAlign: 'center',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            width: '100%'
                          }}>
                            {preview.name.length > 8 ? preview.name.substring(0, 8) + '...' : preview.name}
                          </span>
                        </div>
                      )}
                      
                      {/* Nút X để xóa file */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          // Tìm index của preview trong mảng
                          const previewIndex = filePreviews.findIndex(p => p.id === preview.id);
                          
                          // Xóa file khỏi danh sách selectedFiles
                          const newFiles = selectedFiles.filter((_, index) => index !== previewIndex);
                          setSelectedFiles(newFiles);
                          
                          // Xóa preview và revoke URL
                          if (preview.url && preview.type === 'image') {
                            URL.revokeObjectURL(preview.url);
                          }
                          setFilePreviews(prev => prev.filter(p => p.id !== preview.id));
                        }}
                        style={{
                          position: 'absolute',
                          top: '4px',
                          right: '4px',
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          background: 'rgba(0, 0, 0, 0.6)',
                          border: 'none',
                          color: 'white',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '12px',
                          padding: 0
                        }}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              {/*input file ẩn*/}
              <input 
                type="file" 
                multiple 
                hidden 
                ref={fileInputRef}
                accept="*/*" 
                onChange={(e) => {
                  const files = Array.from(e.target.files);
                  setSelectedFiles(files);
                  
                  // Tạo preview URLs cho các file
                  const previews = files.map((file, index) => {
                    if (file.type.startsWith('image/')) {
                      return {
                        id: `preview-${Date.now()}-${index}`,
                        type: 'image',
                        url: URL.createObjectURL(file),
                        name: file.name,
                        file: file
                      };
                    } else {
                      return {
                        id: `preview-${Date.now()}-${index}`,
                        type: 'file',
                        url: null,
                        name: file.name,
                        file: file,
                        size: file.size
                      };
                    }
                  });
                  setFilePreviews(previews);
                }}
              />
              
              <div style={{display:'flex', alignItems:'center', gap:'10px', padding:'10px 15px', position:'relative'}}>
                {/* Plus button với menu dropdown */}
                <div style={{ position: 'relative' }}>
                  <Plus 
                    size={24} 
                    color="#888" 
                    style={{cursor:'pointer'}} 
                    onClick={() => setShowPlusMenu(!showPlusMenu)}
                  />
                  
                  {/* Menu dropdown */}
                  {showPlusMenu && (
                    <div style={{
                      position: 'absolute',
                      bottom: '100%',
                      left: 0,
                      marginBottom: '10px',
                      background: 'white',
                      borderRadius: '12px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                      padding: '8px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                      zIndex: 1000,
                      minWidth: '150px'
                    }}>
                      <button
                        onClick={() => {
                          fileInputRef.current.setAttribute('accept', 'image/*');
                          fileInputRef.current.click();
                          setShowPlusMenu(false);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '10px 12px',
                          background: 'transparent',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          color: '#374151',
                          transition: '0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <Image size={20} color="#7360f2" />
                        <span>Chọn ảnh</span>
                      </button>
                      
                      <button
                        onClick={() => {
                          fileInputRef.current.removeAttribute('accept');
                          fileInputRef.current.click();
                          setShowPlusMenu(false);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '10px 12px',
                          background: 'transparent',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          color: '#374151',
                          transition: '0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <Paperclip size={20} color="#7360f2" />
                        <span>Chọn file</span>
                      </button>
                      
                      <div style={{ height: '1px', background: '#e5e7eb', margin: '4px 0' }}></div>
                      
                      <button
                        onClick={() => {
                          setShowEmojiPicker(true);
                          setShowPlusMenu(false);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '10px 12px',
                          background: 'transparent',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          color: '#374151',
                          transition: '0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <Smile size={20} color="#7360f2" />
                        <span>Icon/Emoji</span>
                      </button>
                    </div>
                  )}
                </div>
                
                <div style={{flex:1, background:'#f3f4f6', borderRadius:24, padding:'10px 15px', display:'flex', alignItems:'center', position:'relative'}}>
                    <input 
                      className="chat-input " 
                      placeholder="Nhập tin nhắn..." 
                      value={newMessage}
                      onChange={e => setNewMessage(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                    />
                </div>
                
                {/* Emoji picker button */}
                <div style={{ position: 'relative' }}>
                  <Smile 
                    size={24} 
                    color="#888" 
                    style={{cursor:'pointer'}} 
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  />
                  
                  {/* Emoji Picker */}
                  {showEmojiPicker && (
                    <div style={{
                      position: 'absolute',
                      bottom: '100%',
                      right: 0,
                      marginBottom: '10px',
                      background: 'white',
                      borderRadius: '12px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                      padding: '12px',
                      zIndex: 1001,
                      width: '300px',
                      maxHeight: '300px',
                      overflowY: 'auto'
                    }}>
                      <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(8, 1fr)', 
                        gap: '8px' 
                      }}>
                        {['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '😈', '👿', '👹', '👺', '🤡', '💩', '👻', '💀', '☠️', '👽', '👾', '🤖', '🎃', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾'].map((emoji) => (
                          <button
                            key={emoji}
                            onClick={() => {
                              setNewMessage(prev => prev + emoji);
                              setShowEmojiPicker(false);
                            }}
                            style={{
                              fontSize: '24px',
                              background: 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                              padding: '4px',
                              borderRadius: '4px',
                              transition: '0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                <div onClick={handleSendMessage} className="send-btn"><Send size={24} /></div>
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

      {/* --- PANEL THÔNG TIN HỘI THOẠI (Bên phải) --- */}
      {showInfoPanel && currentChat && (
        <div style={{
          width: '350px',
          background: 'white',
          borderLeft: '1px solid #e5e7eb',
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          overflow: 'hidden'
        }}>
          {/* Header */}
          <div style={{
            padding: '20px',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>Thông tin hội thoại</h3>
            <X 
              size={20} 
              style={{ cursor: 'pointer', color: '#6b7280' }} 
              onClick={() => setShowInfoPanel(false)}
            />
          </div>

          {/* Content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
            {/* Ảnh/Video Section */}
            <div style={{ marginBottom: '30px' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '15px'
              }}>
                <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>Ảnh/Video</h4>
                {conversationImages.length > 0 && (
                  <span style={{ fontSize: '12px', color: '#6b7280' }}>
                    {conversationImages.length} ảnh
                  </span>
                )}
              </div>
              
              {loadingAttachments ? (
                <div style={{ textAlign: 'center', padding: '20px', color: '#9ca3af' }}>
                  Đang tải...
                </div>
              ) : conversationImages.length > 0 ? (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '8px'
                }}>
                  {conversationImages.map((img) => (
                    <div
                      key={img.id}
                      style={{
                        aspectRatio: '1',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        cursor: 'pointer',
                        position: 'relative'
                      }}
                      onClick={() => window.open(img.fileUrl, '_blank')}
                    >
                      <img
                        src={img.fileUrl}
                        alt={img.fileName}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '20px', color: '#9ca3af', fontSize: '14px' }}>
                  Chưa có ảnh nào
                </div>
              )}
            </div>

            {/* File Section */}
            <div style={{ marginBottom: '30px' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '15px'
              }}>
                <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>File</h4>
                {conversationFiles.length > 0 && (
                  <span style={{ fontSize: '12px', color: '#6b7280' }}>
                    {conversationFiles.length} file
                  </span>
                )}
              </div>
              
              {loadingAttachments ? (
                <div style={{ textAlign: 'center', padding: '20px', color: '#9ca3af' }}>
                  Đang tải...
                </div>
              ) : conversationFiles.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {conversationFiles.map((file) => (
                    <div
                      key={file.id}
                      style={{
                        padding: '12px',
                        background: '#f9fafb',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        cursor: 'pointer',
                        transition: '0.2s'
                      }}
                      onClick={() => window.open(file.fileUrl, '_blank')}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
                      onMouseLeave={(e) => e.currentTarget.style.background = '#f9fafb'}
                    >
                      <FileText size={24} color="#7360f2" />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ 
                          fontSize: '14px', 
                          fontWeight: '500',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {file.fileName}
                        </div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>
                          {file.fileSize ? `${(file.fileSize / 1024).toFixed(1)} KB` : 'Unknown size'}
                        </div>
                      </div>
                      <Download size={18} color="#6b7280" />
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '20px', color: '#9ca3af', fontSize: '14px' }}>
                  Chưa có file nào
                </div>
              )}
            </div>

            {/* Actions Section */}
            <div style={{ 
              borderTop: '1px solid #e5e7eb', 
              paddingTop: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              {currentChat.type === "DIRECT" ? (
                // Actions cho bạn bè
                <button
                  onClick={handleDeleteConversationHistory}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: '#fee2e2',
                    color: '#dc2626',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    fontWeight: '500',
                    transition: '0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#fecaca'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#fee2e2'}
                >
                  <Trash2 size={18} />
                  Xóa lịch sử trò chuyện
                </button>
              ) : (
                // Actions cho nhóm
                <>
                  <button
                    onClick={() => handleLeaveGroup(false)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: '#fef3c7',
                      color: '#d97706',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      fontWeight: '500',
                      transition: '0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#fde68a'}
                    onMouseLeave={(e) => e.currentTarget.style.background = '#fef3c7'}
                  >
                    <LeaveIcon size={18} />
                    Rời nhóm
                  </button>
                  <button
                    onClick={() => handleLeaveGroup(true)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: '#fee2e2',
                      color: '#dc2626',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      fontWeight: '500',
                      transition: '0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#fecaca'}
                    onMouseLeave={(e) => e.currentTarget.style.background = '#fee2e2'}
                  >
                    <Trash2 size={18} />
                    Rời nhóm và xóa lịch sử
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Click outside để đóng menu */}
      {(showPlusMenu || showEmojiPicker) && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 999
          }}
          onClick={() => {
            setShowPlusMenu(false);
            setShowEmojiPicker(false);
          }}
        />
      )}
    </div>
  );
};

export default Home;