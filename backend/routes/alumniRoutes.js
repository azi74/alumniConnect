const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getAlumniProfile,
  updateAlumniProfile,
  uploadProfilePhoto,
  getAllAlumni
} = require('../controllers/alumniController');
const upload = require('../utils/fileUpload');

// Alumni profile routes
router.route('/me')
  .get(protect, getAlumniProfile)
  .put(protect, updateAlumniProfile);

// New alumni listing routes
router.get('/', protect, getAllAlumni); // Get all alumni
router.get('/:id', protect, getAlumniProfile); // Get specific alumni profile

router.put('/me/photo', protect, upload.single('profilePhoto'), uploadProfilePhoto);

module.exports = router;