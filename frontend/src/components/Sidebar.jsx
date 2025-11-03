import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import ChatHistory from './ChatHistory';
import AddFriends from './AddFriends';
import RoomList from './RoomList';
import NewChatButton from './NewChatButton';
import ProfileSettings from './ProfileSettings';

const Sidebar = ({ onFriendSelect, selectedFriend, onRoomSelect, selectedRoom }) => {
  const [activeTab, setActiveTab] = useState('chats'); // 'chats', 'friends', 'rooms'
  const { user, logout } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      setShowLogoutConfirm(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-white to-gray-50 border-r border-gray-200 shadow-lg">
      {/* Header */}
      <div className="px-6 py-6 border-b border-gray-200 bg-gradient-to-r from-indigo-500 to-purple-600 relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.username}
                className="h-10 w-10 rounded-full object-cover border-2 border-white shadow-md cursor-pointer hover:scale-110 transition-transform"
                onClick={() => setShowSettings(true)}
              />
            ) : (
              <div 
                className="h-10 w-10 rounded-full bg-white/20 backdrop-blur-lg flex items-center justify-center text-white font-bold text-lg shadow-md cursor-pointer hover:bg-white/30 hover:scale-110 transition-all"
                onClick={() => setShowSettings(true)}
              >
                {user?.username?.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h3 className="text-xl font-bold text-white">{user?.username || 'User'}</h3>
              <p className="text-xs text-indigo-100">Online</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-all"
              title="Logout"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Logout Confirmation Modal */}
        {showLogoutConfirm && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4 shadow-2xl">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Logout</h3>
              <p className="text-sm text-gray-600 mb-6">Are you sure you want to logout?</p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogout}
                  className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-white overflow-x-auto">
        <button
          onClick={() => setActiveTab('chats')}
          className={`flex-1 px-3 py-3 text-xs font-semibold transition-all duration-200 min-w-[80px] ${
            activeTab === 'chats'
              ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50'
              : 'text-gray-600 hover:text-indigo-600 hover:bg-gray-50'
          }`}
        >
          <div className="flex items-center justify-center gap-1">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span className="hidden sm:inline">Chats</span>
          </div>
        </button>
        <button
          onClick={() => setActiveTab('rooms')}
          className={`flex-1 px-3 py-3 text-xs font-semibold transition-all duration-200 min-w-[80px] ${
            activeTab === 'rooms'
              ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50'
              : 'text-gray-600 hover:text-indigo-600 hover:bg-gray-50'
          }`}
        >
          <div className="flex items-center justify-center gap-1">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <span className="hidden sm:inline">Rooms</span>
          </div>
        </button>
        <button
          onClick={() => setActiveTab('friends')}
          className={`flex-1 px-3 py-3 text-xs font-semibold transition-all duration-200 min-w-[80px] ${
            activeTab === 'friends'
              ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50'
              : 'text-gray-600 hover:text-indigo-600 hover:bg-gray-50'
          }`}
        >
          <div className="flex items-center justify-center gap-1">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            <span className="hidden sm:inline">Friends</span>
          </div>
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden relative">
        {activeTab === 'chats' ? (
          <ChatHistory onFriendSelect={onFriendSelect} selectedFriend={selectedFriend} />
        ) : activeTab === 'rooms' ? (
          <RoomList onRoomSelect={onRoomSelect} selectedRoom={selectedRoom} />
        ) : (
          <AddFriends />
        )}
        
        {/* Floating New Chat Button - only show in Chats tab */}
        {activeTab === 'chats' && (
          <div className="absolute bottom-4 right-4 z-10">
            <NewChatButton onFriendSelect={onFriendSelect} />
          </div>
        )}
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowSettings(false)}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden transform transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Settings</h2>
              <button
                onClick={() => setShowSettings(false)}
                className="text-white hover:text-gray-200 p-1"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="h-[calc(90vh-60px)] overflow-hidden">
              <ProfileSettings />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;

