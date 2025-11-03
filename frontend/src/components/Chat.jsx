import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import ToastContainer from './ToastContainer';
import EmojiPicker from './EmojiPicker';
import { requestNotificationPermission, showNotification, playNotificationSound } from '../utils/notifications';

const Chat = ({ friend }) => {
  const [room, setRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [isFriend, setIsFriend] = useState(true);
  const [toasts, setToasts] = useState([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [editingMessage, setEditingMessage] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showMessageMenu, setShowMessageMenu] = useState(null);
  const [userSettings, setUserSettings] = useState({ notifications: true, soundEnabled: true });
  
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const emojiPickerRef = useRef(null);
  
  const { socket, sendMessage, sendTyping, sendStopTyping } = useSocket();
  const { user } = useAuth();

  // Request notification permission on mount
  useEffect(() => {
    requestNotificationPermission();
    fetchUserSettings();
  }, []);

  const fetchUserSettings = async () => {
    try {
      const res = await api.get('/api/auth/profile');
      setUserSettings(res.data.settings || { notifications: true, soundEnabled: true });
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const showToast = (message, type = 'error') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type, duration: 5000 }]);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  // Get or create direct message room
  useEffect(() => {
    const fetchRoom = async () => {
      if (!friend) return;
      try {
        const res = await api.get(`/api/rooms/direct/${friend._id}`);
        if (res.data.isFriend === false) {
          setIsFriend(false);
          showToast('You can only message users who have accepted your friend request', 'error');
          return;
        }
        setRoom(res.data.room);
        setIsFriend(true);
      } catch (error) {
        console.error('Error fetching room:', error);
        if (error.response?.data?.message) {
          setIsFriend(false);
          showToast(error.response.data.message, 'error');
        }
      }
    };
    fetchRoom();
  }, [friend]);

  // Fetch messages
  useEffect(() => {
    const fetchMessages = async () => {
      if (!room) return;
      try {
        const res = await api.get(`/api/messages/room/${room._id}`);
        setMessages(res.data);
      } catch (error) {
        console.error('Error fetching messages:', error);
      }
    };
    fetchMessages();
  }, [room]);

  // Join room
  useEffect(() => {
    if (socket && room) {
      socket.emit('joinRoom', room._id);
      return () => {
        socket.emit('leaveRoom', room._id);
      };
    }
  }, [socket, room]);

  // Listen for new messages
  useEffect(() => {
    if (!socket) return;
    const handleNewMessage = (messageData) => {
      if (room && messageData.roomId === room._id) {
        setMessages(prev => [...prev, messageData]);
        
        // Show notification if not from current user and tab is not focused
        if (messageData.sender._id !== user._id && !document.hasFocus()) {
          if (userSettings.notifications) {
            showNotification(`${messageData.sender.username}: ${messageData.content || 'Sent a file'}`, {
              body: messageData.content || 'Sent a file',
              tag: room._id
            });
          }
          if (userSettings.soundEnabled) {
            playNotificationSound();
          }
        }
      }
    };
    socket.on('message', handleNewMessage);
    return () => {
      socket.off('message', handleNewMessage);
    };
  }, [socket, room, user, userSettings]);

  // Listen for message updates (edit/delete/reaction)
  useEffect(() => {
    if (!socket) return;
    const handleMessageUpdate = (updatedMessage) => {
      setMessages(prev => prev.map(msg => 
        msg._id === updatedMessage._id ? updatedMessage : msg
      ));
    };
    socket.on('messageUpdated', handleMessageUpdate);
    return () => {
      socket.off('messageUpdated', handleMessageUpdate);
    };
  }, [socket]);

  // Typing indicators
  useEffect(() => {
    if (!socket || !room) return;
    const handleUserTyping = (data) => {
      if (data.roomId === room._id && data.userId !== user._id) {
        setTypingUsers(prev => {
          if (!prev.includes(data.userId)) {
            return [...prev, data.userId];
          }
          return prev;
        });
      }
    };
    const handleUserStopTyping = (data) => {
      if (data.roomId === room._id) {
        setTypingUsers(prev => prev.filter(id => id !== data.userId));
      }
    };
    socket.on('userTyping', handleUserTyping);
    socket.on('userStopTyping', handleUserStopTyping);
    return () => {
      socket.off('userTyping', handleUserTyping);
      socket.off('userStopTyping', handleUserStopTyping);
    };
  }, [socket, room, user]);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Close emoji picker on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => setPreviewUrl(reader.result);
        reader.readAsDataURL(file);
      } else {
        setPreviewUrl('');
      }
    }
  };

  const clearFileSelection = () => {
    setSelectedFile(null);
    setPreviewUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!isFriend || !room || (!newMessage.trim() && !selectedFile)) return;
    
    try {
      const friendshipCheck = await api.get(`/api/friends/check/${friend._id}`);
      if (!friendshipCheck.data.isFriend) {
        setIsFriend(false);
        showToast('User has not accepted your friend request', 'error');
        return;
      }

      let res;
      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('roomId', room._id);
        formData.append('content', newMessage);
        if (replyingTo) formData.append('replyTo', replyingTo._id);
        
        res = await api.post('/api/messages/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        clearFileSelection();
      } else {
        res = await api.post('/api/messages', {
          roomId: room._id,
          content: newMessage,
          type: 'text',
          replyTo: replyingTo?._id
        });
      }
      
      sendMessage({ roomId: room._id, ...res.data });
      setNewMessage('');
      setReplyingTo(null);
    } catch (error) {
      console.error('Error sending message:', error);
      showToast(error.response?.data?.message || 'Failed to send message', 'error');
    }
  };

  const handleInputChange = (e) => {
    if (!isFriend || !room) return;
    setNewMessage(e.target.value);
    
    if (!isTyping) {
      setIsTyping(true);
      sendTyping(room._id);
    }
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      sendStopTyping(room._id);
    }, 1000);
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      await api.delete(`/api/messages/${messageId}`);
      setMessages(prev => prev.filter(msg => msg._id !== messageId));
      showToast('Message deleted', 'success');
      setShowMessageMenu(null);
    } catch (error) {
      showToast('Failed to delete message', 'error');
    }
  };

  const handleEditMessage = async (message) => {
    if (!editContent.trim()) {
      setEditingMessage(null);
      setEditContent('');
      return;
    }
    try {
      const res = await api.patch(`/api/messages/${message._id}`, {
        content: editContent
      });
      setMessages(prev => prev.map(msg => 
        msg._id === message._id ? res.data : msg
      ));
      setEditingMessage(null);
      setEditContent('');
      showToast('Message edited', 'success');
    } catch (error) {
      showToast('Failed to edit message', 'error');
    }
  };

  const handleAddReaction = async (messageId, emoji) => {
    try {
      const res = await api.post(`/api/messages/${messageId}/reaction`, {
        emoji
      });
      setMessages(prev => prev.map(msg => 
        msg._id === messageId ? res.data : msg
      ));
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  };

  const handleSearchMessages = async () => {
    if (!room || !searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    try {
      const res = await api.get(`/api/messages/room/${room._id}/search`, {
        params: { query: searchQuery }
      });
      setSearchResults(res.data);
    } catch (error) {
      console.error('Error searching messages:', error);
    }
  };

  const handleRemoveFriend = async () => {
    if (!window.confirm(`Are you sure you want to remove ${friend.username} as a friend?`)) {
      return;
    }
    try {
      await api.post('/api/friends/remove', {
        userId: friend._id
      });
      showToast('Friend removed', 'success');
      // Optionally refresh or redirect
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to remove friend', 'error');
    }
  };

  const handleEmojiSelect = (emoji) => {
    setNewMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const getReadReceipt = (message) => {
    if (message.sender._id !== user._id) return null;
    const readByOthers = message.readBy?.filter(r => r.user._id !== user._id);
    if (readByOthers && readByOthers.length > 0) {
      return '✓✓'; // Read
    }
    return '✓'; // Sent
  };

  if (!friend) return null;

  const otherFriend = room?.members.find(member => member.user._id !== user._id)?.user || friend;

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Chat Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center flex-1">
            <div className="flex-shrink-0 relative">
              {otherFriend.avatar ? (
                <img src={otherFriend.avatar} alt={otherFriend.username} className="h-12 w-12 rounded-full object-cover border-2 border-indigo-400" />
              ) : (
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
                  {otherFriend.username.charAt(0).toUpperCase()}
                </div>
              )}
              {otherFriend.status === 'online' && (
                <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full ring-2 ring-white bg-green-500"></span>
              )}
            </div>
            <div className="ml-4 flex-1">
              <h3 className="text-lg font-semibold text-gray-900">{otherFriend.username}</h3>
              <p className="text-sm text-gray-500 flex items-center">
                {otherFriend.status === 'online' 
                  ? 'Online' 
                  : otherFriend.lastSeen && !isNaN(new Date(otherFriend.lastSeen).getTime())
                    ? `Last seen ${new Date(otherFriend.lastSeen).toLocaleTimeString()}`
                    : 'Offline'}
                {typingUsers.length > 0 && (
                  <span className="ml-2 text-indigo-600 flex items-center">
                    <svg className="h-4 w-4 mr-1 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                    Typing...
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
              title="Search"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
            <div className="relative">
              <button
                onClick={() => setShowMessageMenu(showMessageMenu === 'header' ? null : 'header')}
                className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                title="More options"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </button>
              {showMessageMenu === 'header' && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                  <button
                    onClick={handleRemoveFriend}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    Remove Friend
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Search Bar */}
        {showSearch && (
          <div className="mt-4 flex space-x-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearchMessages()}
              placeholder="Search messages..."
              className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              onClick={handleSearchMessages}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Search
            </button>
            <button
              onClick={() => {
                setShowSearch(false);
                setSearchQuery('');
                setSearchResults([]);
              }}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-transparent to-gray-50">
        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm font-semibold text-yellow-800 mb-2">Search Results ({searchResults.length})</p>
            <div className="space-y-2">
              {searchResults.map((msg) => (
                <div key={msg._id} className="text-sm p-2 bg-white rounded border border-yellow-200">
                  <p className="font-semibold">{msg.sender.username}: {msg.content}</p>
                  <p className="text-xs text-gray-500">{new Date(msg.createdAt).toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {messages.length === 0 && !searchResults.length && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="h-16 w-16 mx-auto mb-4 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center">
                <svg className="h-8 w-8 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-gray-500">No messages yet. Start the conversation!</p>
            </div>
          </div>
        )}
        
        {messages.map((message) => (
          <div
            key={message._id}
            className={`flex items-end ${message.sender._id === user._id ? 'justify-end' : 'justify-start'} group`}
          >
            {message.sender._id !== user._id && (
              <div className="flex-shrink-0">
                {message.sender.avatar ? (
                  <img src={message.sender.avatar} alt={message.sender.username} className="h-8 w-8 rounded-full object-cover mr-2 shadow-md" />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center text-white text-xs font-semibold mr-2 shadow-md">
                    {message.sender.username.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            )}
            
            <div className={`relative max-w-xs lg:max-w-md ${message.sender._id === user._id ? 'order-2' : ''}`}>
              {editingMessage?._id === message._id ? (
                <div className="px-4 py-3 bg-white border-2 border-indigo-500 rounded-2xl">
                  <input
                    type="text"
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    autoFocus
                  />
                  <div className="flex space-x-2 mt-2">
                    <button
                      onClick={() => handleEditMessage(message)}
                      className="px-3 py-1 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setEditingMessage(null);
                        setEditContent('');
                      }}
                      className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  className={`relative px-4 py-3 rounded-2xl shadow-md transition-all duration-200 ${
                    message.sender._id === user._id
                      ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-tr-sm'
                      : 'bg-white text-gray-800 rounded-tl-sm border border-gray-200'
                  }`}
                  onMouseEnter={() => setShowMessageMenu(message._id)}
                  onMouseLeave={() => setTimeout(() => setShowMessageMenu(null), 2000)}
                >
                  {message.replyTo && (
                    <div className={`mb-2 p-2 rounded-lg border-l-4 ${
                      message.sender._id === user._id ? 'bg-indigo-400/30 border-indigo-200' : 'bg-gray-100 border-gray-300'
                    }`}>
                      <p className="text-xs font-semibold">
                        {message.replyTo.sender?.username || 'User'}: {message.replyTo.content || 'Message'}
                      </p>
                    </div>
                  )}

                  {message.sender._id !== user._id && (
                    <p className="text-xs font-semibold mb-1.5 text-indigo-600">{message.sender.username}</p>
                  )}

                  {message.content && (
                    <p className={`${message.sender._id === user._id ? 'text-white' : 'text-gray-800'} break-words`}>
                      {message.content}
                    </p>
                  )}

                  {message.type === 'image' && (
                    <div className="mt-2 rounded-lg overflow-hidden">
                      <img src={message.fileUrl} alt={message.fileName} className="max-w-full h-auto rounded-lg shadow-md" />
                    </div>
                  )}

                  {message.type === 'file' && (
                    <div className="mt-2 p-3 bg-white bg-opacity-20 rounded-lg backdrop-blur-sm">
                      <a href={message.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center hover:underline">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2zm7-10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <span className="truncate">{message.fileName}</span>
                      </a>
                    </div>
                  )}

                  {/* Reactions */}
                  {message.reactions && message.reactions.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {Object.entries(
                        message.reactions.reduce((acc, r) => {
                          acc[r.emoji] = (acc[r.emoji] || 0) + 1;
                          return acc;
                        }, {})
                      ).map(([emoji, count]) => (
                        <button
                          key={emoji}
                          onClick={() => handleAddReaction(message._id, emoji)}
                          className={`px-2 py-1 rounded-full text-xs border ${
                            message.reactions.some(r => r.user._id === user._id && r.emoji === emoji)
                              ? 'bg-indigo-100 border-indigo-300'
                              : 'bg-gray-100 border-gray-300'
                          }`}
                        >
                          {emoji} {count}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-2">
                    <p className={`text-xs ${message.sender._id === user._id ? 'text-indigo-100' : 'text-gray-500'}`}>
                      {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {message.isEdited && <span className="ml-1">(edited)</span>}
                    </p>
                    {message.sender._id === user._id && (
                      <span className="text-xs ml-2">{getReadReceipt(message)}</span>
                    )}
                  </div>

                  {/* Message Menu */}
                  {showMessageMenu === message._id && (
                    <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-xl border border-gray-200 z-50 whitespace-nowrap">
                      {message.sender._id === user._id ? (
                        <>
                          <button
                            onClick={() => {
                              setEditingMessage(message);
                              setEditContent(message.content);
                              setShowMessageMenu(null);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-t-lg"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteMessage(message._id)}
                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-b-lg"
                          >
                            Delete
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => {
                            setReplyingTo(message);
                            setShowMessageMenu(null);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
                        >
                          Reply
                        </button>
                      )}
                      <button
                        onClick={() => {
                          const emojis = ['👍', '❤️', '😂', '😮', '😢', '🙏'];
                          setShowMessageMenu(null);
                          // Quick reaction
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 border-t border-gray-200"
                      >
                        Add Reaction
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {message.sender._id === user._id && (
              <div className="flex-shrink-0 order-3">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.username} className="h-8 w-8 rounded-full object-cover ml-2 shadow-md" />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-semibold ml-2 shadow-md">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Typing Indicator */}
      {typingUsers.length > 0 && (
        <div className="px-6 py-2 text-sm text-indigo-600 italic animate-pulse flex items-center">
          <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
          {otherFriend.username} is typing...
        </div>
      )}

      {/* Reply Preview */}
      {replyingTo && (
        <div className="mx-6 mt-2 p-3 bg-indigo-50 border-l-4 border-indigo-500 rounded-lg flex items-center justify-between">
          <div className="flex-1">
            <p className="text-xs font-semibold text-indigo-600">Replying to {replyingTo.sender?.username}</p>
            <p className="text-sm text-gray-700 truncate">{replyingTo.content || 'Message'}</p>
          </div>
          <button
            onClick={() => setReplyingTo(null)}
            className="ml-2 text-gray-500 hover:text-gray-700"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Message Input */}
      <div className="bg-white border-t border-gray-200 px-6 py-4 shadow-lg relative">
        {!isFriend && (
          <div className="mb-3 p-3 bg-yellow-50 border-l-4 border-yellow-500 rounded-lg">
            <p className="text-sm text-yellow-800">⚠️ You can only message users who have accepted your friend request</p>
          </div>
        )}
        
        {previewUrl && (
          <div className="mb-3 p-3 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl relative inline-block">
            <img src={previewUrl} alt="Preview" className="h-24 w-24 object-cover rounded-lg shadow-md" />
            <button
              onClick={clearFileSelection}
              className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 shadow-lg transform hover:scale-110 transition-transform"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        
        <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
          <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" id="file-upload" disabled={!isFriend} />
          
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={!isFriend}
            className="p-3 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-all duration-200 transform hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Attach file"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </button>

          <div className="flex-1 relative" ref={emojiPickerRef}>
            <input
              type="text"
              value={newMessage}
              onChange={handleInputChange}
              placeholder={isFriend ? "Type a message..." : "Friend request not accepted"}
              disabled={!isFriend}
              className="w-full border-2 border-gray-200 rounded-full px-5 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-indigo-600"
            >
              😊
            </button>
            {showEmojiPicker && (
              <EmojiPicker onEmojiSelect={handleEmojiSelect} onClose={() => setShowEmojiPicker(false)} />
            )}
          </div>
          
          <button
            type="submit"
            disabled={!isFriend || (!newMessage.trim() && !selectedFile)}
            className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-full px-6 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transform hover:scale-105 transition-all duration-200 shadow-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            <span className="flex items-center">
              Send
              <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </span>
          </button>
        </form>
      </div>

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
};

export default Chat;
