const express = require('express');
const { 
  getRoomMessages, 
  sendMessage, 
  uploadFile, 
  markAsRead,
  deleteMessage,
  editMessage,
  addReaction,
  searchMessages
} = require('../controllers/messageController');
const auth = require('../middleware/auth');
const upload = require('../utils/fileUpload');

const router = express.Router();

// Get messages for a room
router.get('/room/:roomId', auth, getRoomMessages);

// Send a message
router.post('/', auth, sendMessage);

// Upload file and send message
router.post('/upload', auth, upload.single('file'), uploadFile);

// Mark message as read
router.post('/:messageId/read', auth, markAsRead);

// Delete message
router.delete('/:messageId', auth, deleteMessage);

// Edit message
router.patch('/:messageId', auth, editMessage);

// Add reaction to message
router.post('/:messageId/reaction', auth, addReaction);

// Search messages in a room
router.get('/room/:roomId/search', auth, searchMessages);

module.exports = router;
