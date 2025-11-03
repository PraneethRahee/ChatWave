const express = require('express');
const { 
  sendFriendRequest, 
  acceptFriendRequest, 
  rejectFriendRequest, 
  cancelFriendRequest,
  getFriendRequests,
  getFriends,
  getAllUsers,
  searchUsers,
  checkFriendship,
  removeFriend,
  blockUser,
  unblockUser,
  getBlockedUsers
} = require('../controllers/friendController');
const auth = require('../middleware/auth');

const router = express.Router();

// Send friend request
router.post('/send', auth, sendFriendRequest);

// Accept friend request
router.post('/accept', auth, acceptFriendRequest);

// Reject friend request
router.post('/reject', auth, rejectFriendRequest);

// Cancel friend request
router.post('/cancel', auth, cancelFriendRequest);

// Get friend requests (incoming and outgoing)
router.get('/requests', auth, getFriendRequests);

// Get friends list
router.get('/list', auth, getFriends);

// Get all users
router.get('/users', auth, getAllUsers);

// Search users
router.get('/search', auth, searchUsers);

// Check if users are friends
router.get('/check/:userId', auth, checkFriendship);

// Remove friend
router.post('/remove', auth, removeFriend);

// Block user
router.post('/block', auth, blockUser);

// Unblock user
router.post('/unblock', auth, unblockUser);

// Get blocked users
router.get('/blocked', auth, getBlockedUsers);

module.exports = router;

