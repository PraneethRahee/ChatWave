import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';

// Create context
const SocketContext = createContext();

// Socket provider
export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated && user) {
      // Initialize socket connection
      const newSocket = io('http://localhost:5000');
      
      // Connect with user ID
      newSocket.emit('userConnected', user._id);
      
      setSocket(newSocket);
      
      // Clean up on unmount
      return () => {
        newSocket.disconnect();
      };
    } else {
      // Disconnect socket if not authenticated
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
    }
  }, [isAuthenticated, user]);

  // Listen for online users
  useEffect(() => {
    if (!socket) return;

    socket.on('getOnlineUsers', (users) => {
      setOnlineUsers(users);
    });

    return () => {
      socket.off('getOnlineUsers');
    };
  }, [socket]);

  // Join a room
  const joinRoom = (roomId) => {
    if (socket) {
      socket.emit('joinRoom', roomId);
    }
  };

  // Leave a room
  const leaveRoom = (roomId) => {
    if (socket) {
      socket.emit('leaveRoom', roomId);
    }
  };

  // Send a message
  const sendMessage = (messageData) => {
    if (socket) {
      socket.emit('chatMessage', messageData);
    }
  };

  // Send typing indicator
  const sendTyping = (roomId) => {
    if (socket) {
      socket.emit('typing', { roomId, userId: user._id });
    }
  };

  // Send stop typing indicator
  const sendStopTyping = (roomId) => {
    if (socket) {
      socket.emit('stopTyping', { roomId, userId: user._id });
    }
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        onlineUsers,
        joinRoom,
        leaveRoom,
        sendMessage,
        sendTyping,
        sendStopTyping,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

// Custom hook to use socket context
export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export default SocketContext;
