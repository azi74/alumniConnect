const Message = require('../models/Message');
const asyncHandler = require('express-async-handler');

// @desc    Send message
// @route   POST /api/messages
// @access  Private
exports.sendMessage = asyncHandler(async (req, res) => {
  const { receiver, content } = req.body;

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

  const messages = await Message.find({
    $or: [
      { sender: userId, receiver: alumniId },
      { sender: alumniId, receiver: userId }
    ]
  })
  .sort('createdAt')
  .populate('sender receiver', 'name email profilePhoto');

  res.json({
    success: true,
    data: messages
  });
});

// @desc    Get my conversations list
// @route   GET /api/messages
// @access  Private
exports.getMyConversations = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  // Get distinct conversations
  const conversations = await Message.aggregate([
    {
      $match: {
        $or: [
          { sender: mongoose.Types.ObjectId(userId) },
          { receiver: mongoose.Types.ObjectId(userId) }
        ]
      }
    },
    {
      $project: {
        otherUser: {
          $cond: [
            { $eq: ["$sender", mongoose.Types.ObjectId(userId)] },
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
              { $and: [
                { $eq: ["$lastMessage.receiver", mongoose.Types.ObjectId(userId)] },
                { $eq: ["$lastMessage.read", false] }
              ]},
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
});