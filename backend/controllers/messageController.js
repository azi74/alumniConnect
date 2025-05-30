const mongoose = require('mongoose');
const Message = require('../models/Message');
const asyncHandler = require('express-async-handler');
const AlumniProfile = require('../models/AlumniProfile'); // Adjust path as needed


// @desc    Send message
// @route   POST /api/messages
// @access  Private
exports.sendMessage = asyncHandler(async (req, res) => {
  const { receiver, content } = req.body;
  if (!receiver || !content) {
      return res.status(400).json({
        success: false,
        error: 'Receiver ID and content are required'
      });
    }

  const message = await Message.create({
    sender: req.user.id,
    receiver,
    content,
    read: false
  });

  res.status(201).json({
    success: true,
    data: message
  });
});

// @desc    Get conversation between two users
// @route   GET /api/messages/:alumniId
// @access  Private
exports.getConversation = asyncHandler(async (req, res) => {
  const { alumniId } = req.params;
  const userId = req.user.id;

  // Validate IDs
  if (!mongoose.Types.ObjectId.isValid(alumniId) || !mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ success: false, error: 'Invalid ID format' });
  }

  try {
    // Get the alumni's user ID from their profile
    const alumniProfile = await AlumniProfile.findById(alumniId).select('user');
    if (!alumniProfile) {
      return res.status(404).json({ success: false, error: 'Alumni profile not found' });
    }

    const alumniUserId = alumniProfile.user;

    const messages = await Message.find({
      $or: [
        { sender: userId, receiver: alumniUserId },
        { sender: alumniUserId, receiver: userId }
      ]
    })
    .sort({ createdAt: 1 })
    .lean();

    res.json({
      success: true,
      data: messages
    });
  } catch (error) {
    console.error('Error fetching conversation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch messages',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    Get my conversations list
// @route   GET /api/messages
// @access  Private
exports.getMyConversations = asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id;

    // Validate user ID
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid user ID format' 
      });
    }

    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [
            { sender: new mongoose.Types.ObjectId(userId) },
            { receiver: new mongoose.Types.ObjectId(userId) }
          ]
        }
      },
      {
        $project: {
          otherUser: {
            $cond: [
              { $eq: ["$sender", new mongoose.Types.ObjectId(userId)] },
              "$receiver",
              "$sender"
            ]
          },
          lastMessage: "$$ROOT"
        }
      },
      {
        $group: {
          _id: "$otherUser",
          lastMessage: { $last: "$lastMessage" },
          unreadCount: {
            $sum: {
              $cond: [
                { 
                  $and: [
                    { $eq: ["$lastMessage.receiver", new mongoose.Types.ObjectId(userId)] },
                    { $eq: ["$lastMessage.read", false] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user"
        }
      },
      {
        $unwind: "$user"
      },
      {
        $sort: { "lastMessage.createdAt": -1 }
      }
    ]);

    res.json({
      success: true,
      data: conversations
    });
  } catch (error) {
    console.error('Error in getMyConversations:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});