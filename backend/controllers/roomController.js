const Room = require('../models/Room');
const Message = require('../models/Message');
const User = require('../models/User');

// Get all rooms for a user (exclude direct message rooms - only group rooms)
const getUserRooms = async (req, res) => {
  try {
    // Only get group rooms (not direct messages)
    // Direct messages are: isPrivate: true AND exactly 2 members
    // Group rooms are: isPrivate: false OR (isPrivate: true AND more than 2 members)
    const rooms = await Room.find({
      'members.user': req.user._id,
      $or: [
        { isPrivate: false }, // Public rooms
        { 
          isPrivate: true,
          $expr: { $gt: [{ $size: '$members' }, 2] } // Private group rooms with more than 2 members
        }
      ]
    })
    .populate('admin', 'username avatar')
    .populate('members.user', 'username avatar status')
    .populate('lastMessage')
    .sort({ updatedAt: -1 });
    
    res.json(rooms);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create a new room
const createRoom = async (req, res) => {
  try {
    const { name, description, isPrivate, memberIds } = req.body;
    const currentUser = await User.findById(req.user._id);
    
    // Start with the creator as a member
    const members = [{ user: req.user._id }];
    
    // Add selected friends if provided
    if (memberIds && Array.isArray(memberIds) && memberIds.length > 0) {
      // Verify all selected users are actually friends
      for (const friendId of memberIds) {
        if (currentUser.friends.includes(friendId)) {
          // Check if not blocked
          if (!currentUser.blockedUsers.includes(friendId)) {
            const friendUser = await User.findById(friendId);
            if (friendUser && !friendUser.blockedUsers.includes(req.user._id)) {
              members.push({ user: friendId });
            }
          }
        }
      }
    }
    
    // Ensure room is not a direct message (direct messages should have exactly 2 members)
    // Force group room if only 2 members (direct messages are created via getOrCreateDirectRoom)
    const finalIsPrivate = isPrivate && members.length > 2 ? true : false;
    
    const room = await Room.create({
      name,
      description,
      isPrivate: finalIsPrivate,
      admin: req.user._id,
      members
    });
    
    // Initialize unread counts for all members
    room.unreadCounts = members.map(member => ({
      user: member.user,
      count: 0
    }));
    await room.save();
    
    const populatedRoom = await Room.findById(room._id)
      .populate('admin', 'username avatar')
      .populate('members.user', 'username avatar status');
    
    res.status(201).json(populatedRoom);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get room details
const getRoomById = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id)
      .populate('admin', 'username avatar')
      .populate('members.user', 'username avatar status');
    
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }
    
    // Check if user is a member
    const isMember = room.members.some(
      member => member.user._id.toString() === req.user._id.toString()
    );
    
    if (!isMember) {
      return res.status(403).json({ message: 'Not authorized to access this room' });
    }
    
    res.json(room);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Join a room
const joinRoom = async (req, res) => {
  try {
    const { roomId } = req.body;
    
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }
    
    // Check if user is already a member
    const isMember = room.members.some(
      member => member.user.toString() === req.user._id.toString()
    );
    
    if (isMember) {
      return res.status(400).json({ message: 'Already a member of this room' });
    }
    
    // Add user to room
    room.members.push({ user: req.user._id });
    await room.save();
    
    const populatedRoom = await Room.findById(room._id)
      .populate('admin', 'username avatar')
      .populate('members.user', 'username avatar status');
    
    res.json(populatedRoom);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Leave a room
const leaveRoom = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }
    
    // Check if user is a member
    const memberIndex = room.members.findIndex(
      member => member.user.toString() === req.user._id.toString()
    );
    
    if (memberIndex === -1) {
      return res.status(400).json({ message: 'Not a member of this room' });
    }
    
    // Remove user from room
    room.members.splice(memberIndex, 1);
    await room.save();
    
    res.json({ message: 'Left room successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get or create direct message room between two friends
const getOrCreateDirectRoom = async (req, res) => {
  try {
    const { friendId } = req.params;
    const currentUserId = req.user._id;

    // Check if users are friends
    const currentUser = await User.findById(currentUserId);
    const isFriend = currentUser.friends.includes(friendId);
    
    // Check if user is blocked
    const isBlocked = currentUser.blockedUsers.includes(friendId);
    const friendUser = await User.findById(friendId);
    const hasBlockedMe = friendUser?.blockedUsers?.includes(currentUserId);

    if (!isFriend) {
      return res.status(403).json({ 
        message: 'You can only message users who have accepted your friend request',
        isFriend: false
      });
    }
    
    if (isBlocked || hasBlockedMe) {
      return res.status(403).json({ 
        message: 'Cannot message this user',
        isBlocked: true
      });
    }

    // Try to find existing direct message room between the two users
    let room = await Room.findOne({
      isPrivate: true,
      'members.user': { $all: [currentUserId, friendId] },
      $expr: { $eq: [{ $size: '$members' }, 2] } // Only 2 members
    })
    .populate('members.user', 'username avatar status')
    .populate('lastMessage');

    // If room doesn't exist, create it
    if (!room) {
      room = await Room.create({
        name: `Direct Message`, // Will be updated to show friend's name
        description: '',
        isPrivate: true,
        admin: currentUserId,
        members: [
          { user: currentUserId },
          { user: friendId }
        ],
        unreadCounts: [
          { user: currentUserId, count: 0 },
          { user: friendId, count: 0 }
        ]
      });

      // Populate the created room
      room = await Room.findById(room._id)
        .populate('members.user', 'username avatar status')
        .populate('lastMessage');
    }

    res.json({ room, isFriend: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Add members to a room
const addMembers = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { memberIds } = req.body;
    
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }
    
    // Check if user is admin
    if (room.admin.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only admin can add members' });
    }
    
    if (!memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
      return res.status(400).json({ message: 'Please provide member IDs' });
    }
    
    const currentUser = await User.findById(req.user._id);
    const addedMembers = [];
    
    // Verify and add members
    for (const memberId of memberIds) {
      // Check if already a member
      const isMember = room.members.some(
        m => m.user.toString() === memberId
      );
      
      if (isMember) continue;
      
      // Check if user is a friend and not blocked
      if (currentUser.friends.includes(memberId)) {
        if (!currentUser.blockedUsers.includes(memberId)) {
          const friendUser = await User.findById(memberId);
          if (friendUser && !friendUser.blockedUsers.includes(req.user._id)) {
            room.members.push({ user: memberId });
            
            // Initialize unread count for new member
            room.unreadCounts.push({
              user: memberId,
              count: 0
            });
            
            addedMembers.push(memberId);
          }
        }
      }
    }
    
    await room.save();
    
    const populatedRoom = await Room.findById(room._id)
      .populate('admin', 'username avatar')
      .populate('members.user', 'username avatar status');
    
    res.json({ 
      message: `${addedMembers.length} member(s) added successfully`,
      room: populatedRoom
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Remove member from a room
const removeMember = async (req, res) => {
  try {
    const { roomId, userId } = req.params;
    
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }
    
    // Check if user is admin or removing themselves
    const isAdmin = room.admin.toString() === req.user._id.toString();
    const isRemovingSelf = userId === req.user._id.toString();
    
    if (!isAdmin && !isRemovingSelf) {
      return res.status(403).json({ message: 'Not authorized to remove this member' });
    }
    
    // Prevent admin from removing themselves
    if (isAdmin && isRemovingSelf && room.members.length > 1) {
      return res.status(400).json({ message: 'Admin cannot remove themselves. Transfer admin first or leave room.' });
    }
    
    // Find and remove member
    const memberIndex = room.members.findIndex(
      m => m.user.toString() === userId
    );
    
    if (memberIndex === -1) {
      return res.status(404).json({ message: 'Member not found in room' });
    }
    
    room.members.splice(memberIndex, 1);
    
    // Remove unread count for removed member
    const unreadIndex = room.unreadCounts.findIndex(
      uc => uc.user.toString() === userId
    );
    if (unreadIndex !== -1) {
      room.unreadCounts.splice(unreadIndex, 1);
    }
    
    await room.save();
    
    const populatedRoom = await Room.findById(room._id)
      .populate('admin', 'username avatar')
      .populate('members.user', 'username avatar status');
    
    res.json({ 
      message: 'Member removed successfully',
      room: populatedRoom
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getUserRooms,
  createRoom,
  getRoomById,
  joinRoom,
  leaveRoom,
  getOrCreateDirectRoom,
  addMembers,
  removeMember
};
