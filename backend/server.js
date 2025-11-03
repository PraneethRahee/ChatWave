// Load environment variables FIRST before any other requires
require('dotenv').config();

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const connectDB = require('./config/database');


console.log('Environment variables loaded:', {
  MONGODB_URI: process.env.MONGODB_URI ? 'Set' : 'Not set',
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME ? 'Set' : 'Not set',
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY ? 'Set' : 'Not set',
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET ? 'Set' : 'Not set'
});

// Connect to database
connectDB();

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Allowed origins for CORS (frontend URLs)
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
const ALLOWED_ORIGINS = [CLIENT_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'];

// Initialize Socket.IO with CORS configured for frontend
const io = socketIo(server, {
  cors: {
    origin: (origin, callback) => {
      // Allow no origin (e.g., mobile apps, curl) or if origin is in the list
      if (!origin || ALLOWED_ORIGINS.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
app.use(express.json());

// Import routes and controllers
const authRoutes = require('./routes/auth');
const roomRoutes = require('./routes/room');
const messageRoutes = require('./routes/message');
const friendRoutes = require('./routes/friend');
const messageController = require('./controllers/messageController');

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/friends', friendRoutes);

// Basic route
app.get('/', (req, res) => {
  res.send('Chat App API is running...');
});

// Set socket.io instance in message controller
messageController.setSocketIO(io);

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  
  // Handle joining a room
  socket.on('joinRoom', (roomId) => {
    socket.join(roomId);
    console.log(`Client ${socket.id} joined room ${roomId}`);
  });
  
  // Handle leaving a room
  socket.on('leaveRoom', (roomId) => {
    socket.leave(roomId);
    console.log(`Client ${socket.id} left room ${roomId}`);
  });
  
  // Handle chat messages
  socket.on('chatMessage', (data) => {
    io.to(data.roomId).emit('message', data);
  });
  
  // Handle message updates (edit/delete/reaction)
  socket.on('messageUpdate', (data) => {
    io.to(data.roomId).emit('messageUpdated', data);
  });
  
  // Handle typing indicators
  socket.on('typing', (data) => {
    socket.to(data.roomId).emit('userTyping', data);
  });
  
  socket.on('stopTyping', (data) => {
    socket.to(data.roomId).emit('userStopTyping', data);
  });
  
  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
