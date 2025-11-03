import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const ChatHistory = ({ onFriendSelect, selectedFriend }) => {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/friends/list');
        setFriends(res.data);
      } catch (error) {
        console.error('Error fetching friends:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchFriends();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (friends.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="h-20 w-20 mx-auto mb-4 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center">
          <svg className="h-10 w-10 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <p className="text-gray-500 font-medium">No friends yet</p>
        <p className="text-sm text-gray-400 mt-1">Add friends to start chatting!</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-100">
      {friends.map((friend) => (
        <div
          key={friend._id}
          className={`px-5 py-4 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 cursor-pointer transition-all duration-200 ${
            selectedFriend && selectedFriend._id === friend._id 
              ? 'bg-gradient-to-r from-indigo-100 to-purple-100 border-l-4 border-indigo-500' 
              : ''
          }`}
          onClick={() => onFriendSelect(friend)}
        >
          <div className="flex items-center">
            <div className="flex-shrink-0 relative">
              {friend.avatar ? (
                <img
                  src={friend.avatar}
                  alt={friend.username}
                  className="h-12 w-12 rounded-full object-cover border-2 border-white shadow-md"
                />
              ) : (
                <div className={`h-12 w-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md transition-transform duration-200 ${
                  selectedFriend && selectedFriend._id === friend._id 
                    ? 'bg-gradient-to-br from-indigo-600 to-purple-600 scale-110' 
                    : 'bg-gradient-to-br from-indigo-400 to-purple-500 hover:scale-105'
                }`}>
                  {friend.username.charAt(0).toUpperCase()}
                </div>
              )}
              {/* Online status indicator */}
              <span className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${
                friend.status === 'online' ? 'bg-green-500' : 'bg-gray-400'
              }`} />
            </div>
            <div className="ml-4 flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className={`text-sm font-semibold truncate ${
                  selectedFriend && selectedFriend._id === friend._id 
                    ? 'text-indigo-900' 
                    : 'text-gray-900'
                }`}>
                  {friend.username}
                </p>
                {friend.unreadCount > 0 && (
                  <span className="flex-shrink-0 ml-2 bg-indigo-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {friend.unreadCount > 99 ? '99+' : friend.unreadCount}
                  </span>
                )}
              </div>
              {friend.lastMessage ? (
                <p className="text-xs text-gray-500 mt-1 truncate">
                  {friend.lastMessage.type === 'image' ? '📷 Image' : 
                   friend.lastMessage.type === 'file' ? '📎 File' : 
                   friend.lastMessage.content}
                </p>
              ) : (
                <p className="text-xs text-gray-500 mt-1">
                  {friend.status === 'online' ? 'Online' : friend.lastSeen && !isNaN(new Date(friend.lastSeen).getTime()) 
                    ? `Last seen ${new Date(friend.lastSeen).toLocaleString()}` 
                    : 'Offline'}
                </p>
              )}
              {friend.lastMessage && (
                <p className="text-xs text-gray-400 mt-0.5">
                  {new Date(friend.lastMessage.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ChatHistory;

