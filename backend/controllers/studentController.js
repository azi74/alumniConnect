// studentController.js
const StudentProfile = require('../models/StudentProfile');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Student = require('../models/StudentProfile');

// @desc    Get student profile
exports.getMyProfile = asyncHandler(async (req, res) => {
  try {
    const [user, profile] = await Promise.all([
      User.findById(req.user.id)
        .select('-password -__v -resetPasswordToken -resetPasswordExpire')
        .lean(),
      StudentProfile.findOne({ user: req.user.id })
        .select('-__v -createdAt -updatedAt')
        .lean()
    ]);

    if (!user || !profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }

    // Merge data
    const responseData = {
      ...user,
      ...profile
    };

    res.json({
      success: true,
      data: responseData
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Update student profile
exports.updateProfile = asyncHandler(async (req, res) => {
  const {
    name,
    email,
    phone,
    address,
    year,
    section,
    program,
    bio,
    interests,
    gpa,
    achievements,
    socialLinks,
    profileComplete
  } = req.body;

  // Update StudentProfile
  const updatedProfile = await StudentProfile.findOneAndUpdate(
    { user: req.user.id },
    {
      name,
      email,
      phone,
      address,
      year,
      section,
      program,
      bio,
      interests,
      gpa,
      achievements,
      socialLinks,
      profileComplete
    },
    { new: true, runValidators: true }
  );

  if (!updatedProfile) {
    return res.status(404).json({
      success: false,
      message: 'Profile not found'
    });
  }

  // Also update basic info in User model
  await User.findByIdAndUpdate(req.user.id, {
    name,
    email,
    phone
  });

  res.json({
    success: true,
    data: updatedProfile
  });
});

// @desc    Upload profile photo
exports.uploadProfilePhoto = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error('Please upload a file');
  }

  const photoUrl = `/uploads/profile-photos/${req.file.filename}`;
  
  // Update both User and Student records
  const [user, student] = await Promise.all([
    User.findByIdAndUpdate(
      req.user.id,
      { profilePhoto: photoUrl },
      { new: true }
    ).select('-password'),
    
    StudentProfile.findOneAndUpdate(
      { user: req.user.id },
      { profilePhoto: photoUrl },
      { new: true }
    )
  ]);

  res.json({
    success: true,
    data: {
      user,
      student
    }
  });
});


exports.getStudentProfile = asyncHandler(async (req, res) => {
  try {
    const student = await Student.findOne({ user: req.params.id })
      .populate('user', 'name email profilePhoto')
      .lean();

    if (!student) {
      return res.status(404).json({
        success: false,
        error: 'Student not found'
      });
    }

    res.json({
      success: true,
      data: {
        ...student,
        id: student.user._id,
        name: student.user.name,
        email: student.user.email,
        image: student.user.profilePhoto
      }
    });
  } catch (error) {
    console.error('Error fetching student profile:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
      message: error.message
    });
  }
});