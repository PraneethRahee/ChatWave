import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import ToastContainer from './ToastContainer';

const RoomChat = ({ room, onRoomUpdate }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [showMembers, setShowMembers] = useState(false);
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [friends, setFriends] = useState([]);
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [currentRoom, setCurrentRoom] = useState(room);
  
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  
  const { socket, sendMessage, sendTyping, sendStopTyping } = useSocket();
  const { user } = useAuth();

  // Update currentRoom when room prop changes
  useEffect(() => {
    setCurrentRoom(room);
  }, [room]);

  const showToast = (message, type = 'error') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type, duration: 5000 }]);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  // Fetch friends for adding to room
  useEffect(() => {
    const fetchFriends = async () => {
      if (showAddMembers) {
        try {
          const res = await api.get('/api/friends/list');
          // Show all friends - we'll mark which ones are already members
          if (res.data && Array.isArray(res.data)) {
            setFriends(res.data);
          } else {
            setFriends([]);
          }
        } catch (error) {
          console.error('Error fetching friends:', error);
          showToast('Failed to load friends list', 'error');
          setFriends([]);
        }
      }
    };

    fetchFriends();
  }, [showAddMembers, currentRoom]);

  // Fetch initial messages
  useEffect(() => {
    const fetchMessages = async () => {
      if (!currentRoom) return;

      try {
        const res = await api.get(`/api/messages/room/${currentRoom._id}`);
        setMessages(res.data);
      } catch (error) {
        console.error('Error fetching messages:', error);
      }
    };

    fetchMessages();
  }, [currentRoom]);

  // Join room when component mounts
  useEffect(() => {
    if (socket && currentRoom) {
      socket.emit('joinRoom', currentRoom._id);
      
      return () => {
        socket.emit('leaveRoom', currentRoom._id);
      };
    }
  }, [socket, currentRoom]);

  // Listen for new messages
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (messageData) => {
      if (currentRoom && messageData.roomId === currentRoom._id) {
        setMessages(prev => [...prev, messageData]);
      }
    };

    socket.on('message', handleNewMessage);

    return () => {
      socket.off('message', handleNewMessage);
    };
  }, [socket, currentRoom]);

  // Listen for typing indicators
  useEffect(() => {
    if (!socket || !currentRoom) return;

    const handleUserTyping = (data) => {
      if (data.roomId === currentRoom._id && data.userId !== user._id) {
        setTypingUsers(prev => {
          if (!prev.includes(data.userId)) {
            return [...prev, data.userId];
          }
          return prev;
        });
      }
    };

    const handleUserStopTyping = (data) => {
      if (data.roomId === currentRoom._id) {
        setTypingUsers(prev => prev.filter(id => id !== data.userId));
      }
    };

    socket.on('userTyping', handleUserTyping);
    socket.on('userStopTyping', handleUserStopTyping);

    return () => {
      socket.off('userTyping', handleUserTyping);
      socket.off('userStopTyping', handleUserStopTyping);
    };
  }, [socket, currentRoom, user]);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle file selection
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewUrl(reader.result);
        };
        reader.readAsDataURL(file);
      } else {
        setPreviewUrl('');
      }
    }
  };

  // Clear file selection
  const clearFileSelection = () => {
    setSelectedFile(null);
    setPreviewUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle sending a message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() && !selectedFile) return;
    
    try {
      let res;
      
      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('roomId', currentRoom._id);
        formData.append('content', newMessage);
        
        res = await api.post('/api/messages/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        
        clearFileSelection();
      } else {
        res = await api.post('/api/messages', {
          roomId: currentRoom._id,
          content: newMessage,
          type: 'text'
        });
      }
      
      sendMessage({
        roomId: currentRoom._id,
        ...res.data
      });
      
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      showToast('Failed to send message', 'error');
    }
  };

  // Handle typing indicator
  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
    
    if (!isTyping) {
      setIsTyping(true);
      sendTyping(currentRoom._id);
    }
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      sendStopTyping(currentRoom._id);
    }, 1000);
  };

  // Handle adding members
  const handleAddMembers = async () => {
    if (selectedFriends.length === 0) {
      showToast('Please select at least one friend to add', 'error');
      return;
    }

    try {
      const res = await api.post(`/api/rooms/${currentRoom._id}/members`, {
        memberIds: selectedFriends
      });
      
      setCurrentRoom(res.data.room);
      if (onRoomUpdate) {
        onRoomUpdate(res.data.room);
      }
      setSelectedFriends([]);
      setShowAddMembers(false);
      showToast(res.data.message, 'success');
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to add members', 'error');
    }
  };

  // Handle removing member
  const handleRemoveMember = async (memberId) => {
    if (!window.confirm('Are you sure you want to remove this member?')) {
      return;
    }

    try {
      const res = await api.delete(`/api/rooms/${currentRoom._id}/members/${memberId}`);
      
      setCurrentRoom(res.data.room);
      if (onRoomUpdate) {
        onRoomUpdate(res.data.room);
      }
      showToast(res.data.message, 'success');
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to remove member', 'error');
    }
  };

  // Toggle friend selection
  const toggleFriendSelection = (friendId) => {
    setSelectedFriends(prev => 
      prev.includes(friendId)
        ? prev.filter(id => id !== friendId)
        : [...prev, friendId]
    );
  };

  const isAdmin = currentRoom?.admin?._id === user._id || currentRoom?.admin === user._id;

  if (!currentRoom) {
    return null;
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Chat Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center flex-1">
            <div className="flex-shrink-0">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
                {currentRoom.name.charAt(0).toUpperCase()}
              </div>
            </div>
            <div className="ml-4 flex-1">
              <h3 className="text-lg font-semibold text-gray-900">{currentRoom.name}</h3>
              <p className="text-sm text-gray-500 flex items-center">
                <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                </svg>
                {currentRoom.members.length} members
                {typingUsers.length > 0 && (
                  <span className="ml-2 text-indigo-600 flex items-center">
                    <svg className="h-4 w-4 mr-1 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                    {typingUsers.length} typing...
                  </span>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowMembers(!showMembers)}
            className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
            title="Manage members"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Members Panel */}
      {showMembers && (
        <div className="bg-white border-b border-gray-200 px-6 py-4 max-h-96 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-md font-semibold text-gray-900">Room Members</h4>
            {isAdmin && (
              <button
                onClick={() => {
                  setShowAddMembers(true);
                  setShowMembers(false);
                }}
                className="px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors"
              >
                + Add Members
              </button>
            )}
          </div>
          <div className="space-y-2">
            {currentRoom.members?.map((member) => {
              const memberUser = member.user;
              const memberId = memberUser._id || memberUser;
              const memberUsername = memberUser.username || 'User';
              const memberAvatar = memberUser.avatar;
              const isMemberAdmin = currentRoom.admin?._id === memberId || currentRoom.admin === memberId;
              const canRemove = isAdmin || memberId === user._id;
              
              return (
                <div
                  key={memberId}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center flex-1">
                    {memberAvatar ? (
                      <img src={memberAvatar} alt={memberUsername} className="h-10 w-10 rounded-full object-cover mr-3" />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-sm font-semibold mr-3">
                        {memberUsername.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {memberUsername}
                        {isMemberAdmin && (
                          <span className="ml-2 px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded">Admin</span>
                        )}
                      </p>
                      <p className="text-xs text-gray-500 flex items-center">
                        <span className={`inline-block w-2 h-2 rounded-full mr-1 ${
                          memberUser.status === 'online' ? 'bg-green-500' : 'bg-gray-400'
                        }`}></span>
                        {memberUser.status === 'online' ? 'Online' : 'Offline'}
                      </p>
                    </div>
                  </div>
                  {canRemove && !isMemberAdmin && (
                    <button
                      onClick={() => handleRemoveMember(memberId)}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Remove member"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                  {memberId === user._id && !isMemberAdmin && (
                    <button
                      onClick={() => handleRemoveMember(memberId)}
                      className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      Leave
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add Members Modal */}
      {showAddMembers && (
        <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-5 rounded-t-2xl sticky top-0">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">Add Members</h3>
                  <p className="text-sm text-indigo-100 mt-1">Select friends to add to room</p>
                </div>
                <button
                  onClick={() => {
                    setShowAddMembers(false);
                    setSelectedFriends([]);
                  }}
                  className="text-white hover:text-gray-200"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="max-h-96 overflow-y-auto border-2 border-gray-200 rounded-lg p-3 space-y-2 mb-4">
                {friends.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">No available friends to add</p>
                ) : (
                  <>
                    <p className="text-xs text-gray-500 mb-2 px-2">
                      Select one or more friends to add to the room
                    </p>
                    {friends.map((friend) => {
                      const existingMemberIds = currentRoom?.members?.map(m => m.user._id || m.user) || [];
                      const isAlreadyMember = existingMemberIds.includes(friend._id);
                      
                      return (
                        <div
                          key={friend._id}
                          onClick={() => !isAlreadyMember && toggleFriendSelection(friend._id)}
                          className={`flex items-center p-2 rounded-lg transition-all ${
                            isAlreadyMember
                              ? 'bg-gray-100 border-2 border-gray-300 opacity-60 cursor-not-allowed'
                              : selectedFriends.includes(friend._id)
                              ? 'bg-indigo-100 border-2 border-indigo-500 cursor-pointer'
                              : 'hover:bg-gray-50 border-2 border-transparent cursor-pointer'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedFriends.includes(friend._id)}
                            disabled={isAlreadyMember}
                            onChange={() => !isAlreadyMember && toggleFriendSelection(friend._id)}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                          />
                          <div className="ml-3 flex items-center flex-1">
                            {friend.avatar ? (
                              <img src={friend.avatar} alt={friend.username} className="h-8 w-8 rounded-full object-cover" />
                            ) : (
                              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-semibold">
                                {friend.username.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div className="ml-3 flex-1">
                              <div className="flex items-center">
                                <p className="text-sm font-medium text-gray-900">{friend.username}</p>
                                {isAlreadyMember && (
                                  <span className="ml-2 px-2 py-0.5 bg-gray-200 text-gray-600 text-xs rounded">Already in room</span>
                                )}
                              </div>
                              <p className="text-xs text-gray-500 flex items-center">
                                <span className={`inline-block w-2 h-2 rounded-full mr-1 ${
                                  friend.status === 'online' ? 'bg-green-500' : 'bg-gray-400'
                                }`}></span>
                                {friend.status === 'online' ? 'Online' : 'Offline'}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
              {selectedFriends.length > 0 && (
                <div className="mb-4 p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                  <p className="text-sm font-semibold text-indigo-900 mb-2">
                    {selectedFriends.length} friend{selectedFriends.length !== 1 ? 's' : ''} selected
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedFriends.map(friendId => {
                      const friend = friends.find(f => f._id === friendId);
                      if (!friend) return null;
                      return (
                        <div
                          key={friendId}
                          className="flex items-center px-2 py-1 bg-indigo-100 rounded-full text-sm text-indigo-700"
                        >
                          {friend.username}
                          <button
                            onClick={() => toggleFriendSelection(friendId)}
                            className="ml-1 text-indigo-500 hover:text-indigo-700"
                          >
                            ×
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowAddMembers(false);
                    setSelectedFriends([]);
                  }}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddMembers}
                  disabled={selectedFriends.length === 0}
                  className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 font-medium shadow-lg transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  Add Members
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-transparent to-gray-50">
        {messages.length === 0 && (
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
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center text-white text-xs font-semibold mr-2 shadow-md">
                {message.sender.username.charAt(0).toUpperCase()}
              </div>
            )}
            <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl shadow-md transition-all duration-200 ${
              message.sender._id === user._id
                ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-tr-sm'
                : 'bg-white text-gray-800 rounded-tl-sm border border-gray-200'
            }`}>
              {message.sender._id !== user._id && (
                <p className="text-xs font-semibold mb-1.5 text-indigo-600">
                  {message.sender.username}
                </p>
              )}
              
              {message.content && (
                <p className={`${message.sender._id === user._id ? 'text-white' : 'text-gray-800'} break-words`}>
                  {message.content}
                </p>
              )}
              
              {message.type === 'image' && (
                <div className="mt-2 rounded-lg overflow-hidden">
                  <img 
                    src={message.fileUrl} 
                    alt={message.fileName}
                    className="max-w-full h-auto rounded-lg shadow-md"
                  />
                </div>
              )}
              
              {message.type === 'file' && (
                <div className="mt-2 p-3 bg-white bg-opacity-20 rounded-lg backdrop-blur-sm">
                  <a 
                    href={message.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center hover:underline"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2zm7-10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span className="truncate">{message.fileName}</span>
                  </a>
                </div>
              )}
              
              <p className={`text-xs mt-2 ${
                message.sender._id === user._id ? 'text-indigo-100' : 'text-gray-500'
              }`}>
                {new Date(message.createdAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
            {message.sender._id === user._id && (
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-semibold ml-2 shadow-md">
                {user.username.charAt(0).toUpperCase()}
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
          {typingUsers.length === 1 ? 'Someone is typing...' : `${typingUsers.length} people are typing...`}
        </div>
      )}

      {/* Message Input */}
      <div className="bg-white border-t border-gray-200 px-6 py-4 shadow-lg">
        {previewUrl && (
          <div className="mb-3 p-3 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl relative inline-block">
            <img 
              src={previewUrl} 
              alt="Preview" 
              className="h-24 w-24 object-cover rounded-lg shadow-md"
            />
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
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
            id="file-upload"
          />
          
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-3 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-all duration-200 transform hover:scale-110"
            title="Attach file"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </button>
          
          <input
            type="text"
            value={newMessage}
            onChange={handleInputChange}
            placeholder="Type a message..."
            className="flex-1 border-2 border-gray-200 rounded-full px-5 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 shadow-sm"
          />
          
          <button
            type="submit"
            className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-full px-6 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transform hover:scale-105 transition-all duration-200 shadow-lg font-medium"
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

export default RoomChat;
