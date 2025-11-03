const express = require('express');
const { 
  register, 
  login, 
  getProfile, 
  logout, 
  uploadAvatar,
  updateProfile,
  updateAvatar,
  changePassword,
  updateSettings,
  getSessions,
  revokeSession
} = require('../controllers/authController');
const auth = require('../middleware/auth');
const upload = require('../utils/fileUpload');

const router = express.Router();

// Upload avatar (before registration)
router.post('/upload-avatar', upload.single('avatar'), uploadAvatar);

// Register a new user
router.post('/register', register);

// Login user
router.post('/login', login);

// Get user profile
router.get('/profile', auth, getProfile);

// Update user profile
router.patch('/profile', auth, updateProfile);

// Update user avatar
router.post('/profile/avatar', auth, upload.single('avatar'), updateAvatar);

// Change password
router.post('/change-password', auth, changePassword);

// Update user settings
router.patch('/settings', auth, updateSettings);

// Get active sessions
router.get('/sessions', auth, getSessions);

// Revoke session
router.post('/sessions/revoke', auth, revokeSession);

// Logout user
router.post('/logout', auth, logout);

module.exports = router;
