import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const NewChatButton = ({ onFriendSelect }) => {
  const [showFriendsList, setShowFriendsList] = useState(false);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useAuth();

  // Fetch friends when modal opens
  useEffect(() => {
    const fetchFriends = async () => {
      if (showFriendsList) {
        setLoading(true);
        try {
          const res = await api.get('/api/friends/list');
          if (res.data && Array.isArray(res.data)) {
            setFriends(res.data);
          } else {
            setFriends([]);
          }
        } catch (error) {
          console.error('Error fetching friends:', error);
          setFriends([]);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchFriends();
  }, [showFriendsList]);

  // Filter friends based on search query
  const filteredFriends = friends.filter(friend =>
    friend.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    friend.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleFriendClick = (friend) => {
    onFriendSelect(friend);
    setShowFriendsList(false);
    setSearchQuery('');
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setShowFriendsList(true)}
        className="h-14 w-14 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-full shadow-2xl flex items-center justify-center transform hover:scale-110 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-indigo-300"
        title="New Chat"
      >
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>

      {/* Friends List Modal */}
      {showFriendsList && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={() => {
            setShowFriendsList(false);
            setSearchQuery('');
          }}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden transform transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-5 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">New Chat</h2>
                <button
                  onClick={() => {
                    setShowFriendsList(false);
                    setSearchQuery('');
                  }}
                  className="text-white hover:text-gray-200 p-1"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* Search Bar */}
              <div className="mt-4 relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search friends..."
                  className="w-full px-4 py-3 pl-12 rounded-lg bg-white bg-opacity-20 text-white placeholder-white placeholder-opacity-70 focus:outline-none focus:ring-2 focus:ring-white focus:bg-opacity-30"
                />
                <svg 
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white opacity-70" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* Friends List */}
            <div className="overflow-y-auto max-h-[calc(90vh-180px)]">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
              ) : filteredFriends.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="h-16 w-16 mx-auto mb-4 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center">
                    <svg className="h-8 w-8 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <p className="text-gray-500 font-medium">
                    {searchQuery ? 'No friends found' : 'No friends yet'}
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    {searchQuery ? 'Try a different search term' : 'Add friends to start chatting!'}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {filteredFriends.map((friend) => (
                    <div
                      key={friend._id}
                      onClick={() => handleFriendClick(friend)}
                      className="px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors flex items-center"
                    >
                      <div className="flex-shrink-0 relative">
                        {friend.avatar ? (
                          <img
                            src={friend.avatar}
                            alt={friend.username}
                            className="h-12 w-12 rounded-full object-cover border-2 border-indigo-100"
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                            {friend.username?.charAt(0).toUpperCase()}
                          </div>
                        )}
                        {friend.status === 'online' && (
                          <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full ring-2 ring-white bg-green-500"></span>
                        )}
                      </div>
                      <div className="ml-4 flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {friend.username}
                        </p>
                        <p className="text-xs text-gray-500 flex items-center mt-0.5">
                          <span className={`inline-block w-2 h-2 rounded-full mr-1 ${
                            friend.status === 'online' ? 'bg-green-500' : 'bg-gray-400'
                          }`}></span>
                          {friend.status === 'online' ? 'Online' : 'Offline'}
                        </p>
                        {friend.lastMessage && (
                          <p className="text-xs text-gray-400 mt-1 truncate">
                            {friend.lastMessage.type === 'image' ? '📷 Image' : 
                             friend.lastMessage.type === 'file' ? '📎 File' : 
                             friend.lastMessage.content}
                          </p>
                        )}
                      </div>
                      {friend.unreadCount > 0 && (
                        <div className="flex-shrink-0 ml-2">
                          <span className="bg-indigo-600 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
                            {friend.unreadCount > 99 ? '99+' : friend.unreadCount}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default NewChatButton;

