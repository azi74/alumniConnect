const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getMyProfile,
  updateProfile,
  uploadProfilePhoto
} = require('../controllers/studentController');
const upload = require('../utils/fileUpload');

// Student profile routes
router.route('/me')
  .get(protect, getMyProfile)
  .put(protect, updateProfile);

router.put('/me/photo', protect, upload.single('profilePhoto'), uploadProfilePhoto);

module.exports = router;