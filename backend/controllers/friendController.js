const User = require('../models/User');

// Send friend request
exports.sendFriendRequest = async (req, res) => {
  try {
    const { userId } = req.body;
    const senderId = req.user.id;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    if (userId === senderId) {
      return res.status(400).json({ message: 'Cannot send friend request to yourself' });
    }

    const sender = await User.findById(senderId);
    const receiver = await User.findById(userId);

    if (!receiver) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if already friends
    if (sender.friends.includes(userId)) {
      return res.status(400).json({ message: 'Already friends' });
    }

    // Check if request already exists
    const existingRequest = sender.friendRequests.find(
      req => req.to.toString() === userId && req.status === 'pending'
    );

    if (existingRequest) {
      return res.status(400).json({ message: 'Friend request already sent' });
    }

    // Check if receiver has sent a request to sender
    const reverseRequest = receiver.friendRequests.find(
      req => req.to.toString() === senderId && req.status === 'pending'
    );

    if (reverseRequest) {
      // Auto-accept if reverse request exists (mutual)
      sender.friends.push(userId);
      receiver.friends.push(senderId);
      
      // Update reverse request status
      reverseRequest.status = 'accepted';
      
      // Remove pending requests
      sender.friendRequests = sender.friendRequests.filter(
        req => !(req.to.toString() === userId && req.status === 'pending')
      );
      receiver.friendRequests = receiver.friendRequests.filter(
        req => !(req.to.toString() === senderId && req.status === 'pending')
      );

      await sender.save();
      await receiver.save();

      return res.json({ 
        message: 'Friend request accepted automatically',
        isFriend: true
      });
    }

    // Send new request
    sender.friendRequests.push({
      from: senderId,
      to: userId,
      status: 'pending'
    });

    receiver.friendRequests.push({
      from: senderId,
      to: userId,
      status: 'pending'
    });

    await sender.save();
    await receiver.save();

    res.json({ message: 'Friend request sent successfully' });
  } catch (error) {
    console.error('Send friend request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Accept friend request
exports.acceptFriendRequest = async (req, res) => {
  try {
    const { requestId } = req.body;
    const userId = req.user.id;

    const user = await User.findById(userId);
    const request = user.friendRequests.id(requestId);

    if (!request) {
      return res.status(404).json({ message: 'Friend request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Request already processed' });
    }

    const friendId = request.from;

    // Add to friends list
    if (!user.friends.includes(friendId)) {
      user.friends.push(friendId);
    }

    // Update request status
    request.status = 'accepted';

    // Update sender's friend list and request status
    const sender = await User.findById(friendId);
    if (!sender.friends.includes(userId)) {
      sender.friends.push(userId);
    }

    // Update sender's request status
    const senderRequest = sender.friendRequests.find(
      req => req.from.toString() === friendId && 
             req.to.toString() === userId && 
             req.status === 'pending'
    );
    if (senderRequest) {
      senderRequest.status = 'accepted';
    }

    await user.save();
    await sender.save();

    res.json({ message: 'Friend request accepted' });
  } catch (error) {
    console.error('Accept friend request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Reject friend request
exports.rejectFriendRequest = async (req, res) => {
  try {
    const { requestId } = req.body;
    const userId = req.user.id;

    const user = await User.findById(userId);
    const request = user.friendRequests.id(requestId);

    if (!request) {
      return res.status(404).json({ message: 'Friend request not found' });
    }

    const friendId = request.from;

    // Update request status
    request.status = 'rejected';

    // Remove from sender's requests
    const sender = await User.findById(friendId);
    const senderRequest = sender.friendRequests.find(
      req => req.from.toString() === friendId && 
             req.to.toString() === userId && 
             req.status === 'pending'
    );
    if (senderRequest) {
      senderRequest.status = 'rejected';
    }

    await user.save();
    await sender.save();

    res.json({ message: 'Friend request rejected' });
  } catch (error) {
    console.error('Reject friend request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Cancel friend request
exports.cancelFriendRequest = async (req, res) => {
  try {
    const { userId } = req.body;
    const senderId = req.user.id;

    const sender = await User.findById(senderId);
    const receiver = await User.findById(userId);

    if (!receiver) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Remove from sender's requests
    sender.friendRequests = sender.friendRequests.filter(
      req => !(req.to.toString() === userId && req.status === 'pending')
    );

    // Remove from receiver's requests
    receiver.friendRequests = receiver.friendRequests.filter(
      req => !(req.from.toString() === senderId && req.status === 'pending')
    );

    await sender.save();
    await receiver.save();

    res.json({ message: 'Friend request cancelled' });
  } catch (error) {
    console.error('Cancel friend request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get friend requests (incoming and outgoing)
exports.getFriendRequests = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).populate('friendRequests.from', 'username email avatar').populate('friendRequests.to', 'username email avatar');

    const incoming = user.friendRequests
      .filter(req => req.to.toString() === userId && req.status === 'pending')
      .map(req => ({
        _id: req._id,
        from: req.from,
        status: req.status,
        createdAt: req.createdAt
      }));

    const outgoing = user.friendRequests
      .filter(req => req.from.toString() === userId && req.status === 'pending')
      .map(req => ({
        _id: req._id,
        to: req.to,
        status: req.status,
        createdAt: req.createdAt
      }));

    res.json({ incoming, outgoing });
  } catch (error) {
    console.error('Get friend requests error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get friends list with last message and unread count
exports.getFriends = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);
    const Room = require('../models/Room');
    const Message = require('../models/Message');
    
    const friends = await User.find({ _id: { $in: user.friends } })
      .select('username email avatar status lastSeen');

    // Get last messages and unread counts for each friend
    const friendsWithData = await Promise.all(friends.map(async (friend) => {
      // Find direct message room with this friend
      const room = await Room.findOne({
        isPrivate: true,
        'members.user': { $all: [userId, friend._id] },
        $expr: { $eq: [{ $size: '$members' }, 2] }
      })
      .populate('lastMessage')
      .select('lastMessage unreadCounts');

      let lastMessage = null;
      let unreadCount = 0;

      if (room) {
        if (room.lastMessage) {
          const message = await Message.findById(room.lastMessage)
            .populate('sender', 'username avatar')
            .select('content type createdAt sender');
          lastMessage = message;
        }

        const unreadData = room.unreadCounts.find(
          uc => uc.user.toString() === userId
        );
        unreadCount = unreadData ? unreadData.count : 0;
      }

      return {
        ...friend.toObject(),
        lastMessage,
        unreadCount
      };
    }));

    // Sort by last message time or unread count
    friendsWithData.sort((a, b) => {
      if (b.unreadCount !== a.unreadCount) {
        return b.unreadCount - a.unreadCount;
      }
      if (a.lastMessage && b.lastMessage) {
        return new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt);
      }
      if (a.lastMessage) return -1;
      if (b.lastMessage) return 1;
      return 0;
    });

    res.json(friendsWithData);
  } catch (error) {
    console.error('Get friends error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all users (for adding friends)
exports.getAllUsers = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 50 } = req.query;

    const users = await User.find({
      _id: { $ne: userId }
    })
    .select('username email avatar status lastSeen')
    .sort({ username: 1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

    const user = await User.findById(userId);
    
    // Add friend status to each user
    const usersWithStatus = users.map(u => {
      const isFriend = user.friends.includes(u._id);
      const hasPendingRequest = user.friendRequests.some(
        req => (req.to.toString() === u._id.toString() || req.from.toString() === u._id.toString()) && req.status === 'pending'
      );
      
      return {
        ...u.toObject(),
        isFriend,
        hasPendingRequest
      };
    });

    res.json(usersWithStatus);
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Search users (for adding friends)
exports.searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    const userId = req.user.id;

    if (!query || query.trim().length < 1) {
      return res.json([]);
    }

    const currentUser = await User.findById(userId);

    const users = await User.find({
      $or: [
        { username: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } }
      ],
      _id: { $ne: userId, $nin: currentUser.blockedUsers }
    })
    .select('username email avatar status lastSeen')
    .limit(20);
    
    // Add friend status to each user
    const usersWithStatus = users.map(u => {
      const isFriend = currentUser.friends.includes(u._id);
      const hasPendingRequest = currentUser.friendRequests.some(
        req => (req.to.toString() === u._id.toString() || req.from.toString() === u._id.toString()) && req.status === 'pending'
      );
      const isBlocked = currentUser.blockedUsers.includes(u._id);
      
      return {
        ...u.toObject(),
        isFriend,
        hasPendingRequest,
        isBlocked
      };
    });

    res.json(usersWithStatus);
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Check if two users are friends
exports.checkFriendship = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;

    const user = await User.findById(currentUserId);
    const isFriend = user.friends.includes(userId);

    res.json({ isFriend });
  } catch (error) {
    console.error('Check friendship error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Remove friend (unfriend)
exports.removeFriend = async (req, res) => {
  try {
    const { userId } = req.body;
    const currentUserId = req.user.id;

    if (userId === currentUserId) {
      return res.status(400).json({ message: 'Cannot remove yourself' });
    }

    const currentUser = await User.findById(currentUserId);
    const friendUser = await User.findById(userId);

    if (!friendUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Remove from both friends lists
    currentUser.friends = currentUser.friends.filter(
      id => id.toString() !== userId
    );
    friendUser.friends = friendUser.friends.filter(
      id => id.toString() !== currentUserId
    );

    await currentUser.save();
    await friendUser.save();

    res.json({ message: 'Friend removed successfully' });
  } catch (error) {
    console.error('Remove friend error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Block user
exports.blockUser = async (req, res) => {
  try {
    const { userId } = req.body;
    const currentUserId = req.user.id;

    if (userId === currentUserId) {
      return res.status(400).json({ message: 'Cannot block yourself' });
    }

    const currentUser = await User.findById(currentUserId);
    const targetUser = await User.findById(userId);

    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if already blocked
    if (currentUser.blockedUsers.includes(userId)) {
      return res.status(400).json({ message: 'User already blocked' });
    }

    // Remove from friends if they are friends
    currentUser.friends = currentUser.friends.filter(
      id => id.toString() !== userId
    );
    targetUser.friends = targetUser.friends.filter(
      id => id.toString() !== currentUserId
    );

    // Remove pending friend requests
    currentUser.friendRequests = currentUser.friendRequests.filter(
      req => req.from.toString() !== userId && req.to.toString() !== userId
    );
    targetUser.friendRequests = targetUser.friendRequests.filter(
      req => req.from.toString() !== currentUserId && req.to.toString() !== currentUserId
    );

    // Add to blocked list
    currentUser.blockedUsers.push(userId);

    await currentUser.save();
    await targetUser.save();

    res.json({ message: 'User blocked successfully' });
  } catch (error) {
    console.error('Block user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Unblock user
exports.unblockUser = async (req, res) => {
  try {
    const { userId } = req.body;
    const currentUserId = req.user.id;

    const currentUser = await User.findById(currentUserId);

    if (!currentUser.blockedUsers.includes(userId)) {
      return res.status(400).json({ message: 'User is not blocked' });
    }

    currentUser.blockedUsers = currentUser.blockedUsers.filter(
      id => id.toString() !== userId
    );

    await currentUser.save();

    res.json({ message: 'User unblocked successfully' });
  } catch (error) {
    console.error('Unblock user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get blocked users
exports.getBlockedUsers = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).populate('blockedUsers', 'username email avatar');

    res.json(user.blockedUsers || []);
  } catch (error) {
    console.error('Get blocked users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

