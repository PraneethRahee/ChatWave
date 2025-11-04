import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import AuthPage from './components/AuthPage';
import Sidebar from './components/Sidebar';
import Chat from './components/Chat';
import RoomChat from './components/RoomChat';
function AppContent() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  useEffect(() => {
    if (user?.settings?.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [user?.settings?.darkMode]);
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="h-16 w-16 mx-auto mb-4 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg animate-pulse">
            <svg xmlns="http://www.w3.org/2000/svg"
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <p className="text-xl font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Loading...</p>
        </div>
      </div>
    );
  }
  if (!isAuthenticated) {
    return <AuthPage />;
  }
  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="w-80 flex-shrink-0">
        <Sidebar 
          onFriendSelect={(friend) => {
            setSelectedFriend(friend);
            setSelectedRoom(null); 
          }}
          selectedFriend={selectedFriend}
          onRoomSelect={(room) => {
            setSelectedRoom(room);
            setSelectedFriend(null); 
          }}
          selectedRoom={selectedRoom}
        />
      </div>
      <div className="flex-1 flex flex-col">
        {selectedFriend ? (
          <Chat friend={selectedFriend} />
        ) : selectedRoom ? (
          <RoomChat 
            room={selectedRoom} 
            onRoomUpdate={(updatedRoom) => {
              setSelectedRoom(updatedRoom);
            }}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
            <div className="text-center max-w-md px-6">
              <div className="h-32 w-32 mx-auto mb-6 bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 rounded-3xl flex items-center justify-center text-white shadow-2xl transform hover:scale-105 transition-transform">
                <svg xmlns="http://www.w3.org/2000/svg"
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-3">
                Welcome to Chat App
              </h3>
              <p className="text-gray-600 text-lg mb-4">Select a friend or room from the sidebar to start chatting</p>
              <div className="flex items-center justify-center space-x-2 text-gray-500">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm">Select a friend or room to get started</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <AppContent />
      </SocketProvider>
    </AuthProvider>
  );
}
export default App;
