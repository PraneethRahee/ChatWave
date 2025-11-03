const express = require('express');
const { getUserRooms, createRoom, getRoomById, joinRoom, leaveRoom, getOrCreateDirectRoom, addMembers, removeMember } = require('../controllers/roomController');
const auth = require('../middleware/auth');

const router = express.Router();

// Get all rooms for a user
router.get('/', auth, getUserRooms);

// Create a new room
router.post('/', auth, createRoom);

// Get room details
router.get('/:id', auth, getRoomById);

// Join a room
router.post('/join', auth, joinRoom);

// Leave a room
router.delete('/:id', auth, leaveRoom);

// Get or create direct message room with a friend (must be before /:id route)
router.get('/direct/:friendId', auth, getOrCreateDirectRoom);

// Add members to a room
router.post('/:roomId/members', auth, addMembers);

// Remove member from a room
router.delete('/:roomId/members/:userId', auth, removeMember);

module.exports = router;
