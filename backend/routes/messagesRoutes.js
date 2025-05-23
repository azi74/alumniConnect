const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  sendMessage,
  getConversation,
  getMyConversations
} = require('../controllers/messageController');

router.route('/')
  .get(protect, getMyConversations)
  .post(protect, sendMessage);

router.get('/:alumniId', protect, getConversation);

module.exports = router;