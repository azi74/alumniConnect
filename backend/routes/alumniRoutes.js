const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getMyProfile,  // Make sure this is imported
  updateAlumniProfile,
  uploadProfilePhoto,
  getAllAlumni,
  getAlumniProfile
} = require('../controllers/alumniController');
const upload = require('../utils/fileUpload');

// Alumni profile routes
router.get('/me', protect, getMyProfile);  // This is the correct route
router.put('/me', protect, updateAlumniProfile);
router.put('/me/photo', protect, upload.single('profilePhoto'), uploadProfilePhoto);

// Alumni listing routes
router.get('/', protect, getAllAlumni);
router.get('/:id', protect, getAlumniProfile);

module.exports = router;