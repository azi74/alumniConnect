const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  sendMessage,
  getConversation,
  getMyConversations
} = require('../controllers/messageController');

router.post('/', protect, sendMessage);
router.get('/conversations', protect, getMyConversations);
// router.get('/:userId', protect, getConversation);

router.get('/:alumniId', protect, getConversation);


module.exports = router;