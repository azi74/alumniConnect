const Alumni = require('../models/AlumniProfile');
const User = require('../models/User');
const asyncHandler = require('express-async-handler');
const ErrorResponse = require('../utils/errorResponse');
const AlumniProfile = require('../models/AlumniProfile');
const mongoose = require('mongoose');

// @desc    Get alumni profile
// @route   GET /api/alumni/me
// @access  Private
exports.getAlumniProfile = asyncHandler(async (req, res, next) => {
  try {
    const alumni = await Alumni.findOne({ user: req.user.id })
      .populate('user', 'email role profilePhoto');
    
    if (!alumni) {
      return res.status(404).json({
        success: false,
        message: 'Alumni profile not found'
      });
    }

    // Combine user and alumni data
    const responseData = {
      ...alumni.toObject(),
      id: alumni.user._id,
      email: alumni.user.email,
      role: alumni.user.role,
      profilePhoto: alumni.user.profilePhoto
    };

    res.status(200).json({
      success: true,
      data: responseData
    });
  } catch (error) {
    next(new ErrorResponse('Server error', 500));
  }
});

exports.getAlumniProfile = asyncHandler(async (req, res, next) => {
  try {
    const alumni = await AlumniProfile.findOne({ user: req.user.id })
      .populate('user', 'email role profilePhoto');
    
    if (!alumni) {
      return res.status(404).json({
        success: false,
        message: 'Alumni profile not found'
      });
    }

    // Combine user and alumni data
    const responseData = {
      ...alumni.toObject(),
      id: alumni.user._id,
      email: alumni.user.email,
      role: alumni.user.role,
      profilePhoto: alumni.user.profilePhoto
    };

    res.status(200).json({
      success: true,
      data: responseData
    });
  } catch (error) {
    next(new ErrorResponse('Server error', 500));
  }
});

// @desc    Update alumni profile
// @route   PUT /api/alumni/me
// @access  Private
exports.updateAlumniProfile = asyncHandler(async (req, res, next) => {
  const {
    graduationYear,
    degree,
    currentRole,
    currentCompany,
    location,
    phone,
    bio,
    skills,
    education,
    workExperience,
    socialLinks,
    profileComplete
  } = req.body;

  // Calculate profile completion based on required fields
  const requiredFields = ['graduationYear', 'degree', 'currentRole'];
  const completedFields = requiredFields.filter(field => req.body[field]);
  const calculatedCompletion = (completedFields.length / requiredFields.length) * 100;

  const updateData = {
    graduationYear,
    degree,
    currentRole,
    currentCompany,
    location,
    phone,
    bio,
    skills: Array.isArray(skills) ? skills : [],
    education: Array.isArray(education) ? education : [],
    workExperience: Array.isArray(workExperience) ? workExperience : [],
    socialLinks: socialLinks || {},
    profileComplete: calculatedCompletion === 100
  };

  // Update both User and AlumniProfile
  const [user, alumni] = await Promise.all([
    User.findByIdAndUpdate(
      req.user.id,
      {
        name: req.body.name,
        email: req.body.email,
        phone: req.body.phone,
        bio: req.body.bio,
        socialLinks: req.body.socialLinks,
        profileComplete: calculatedCompletion === 100
      },
      { new: true }
    ),
    
    AlumniProfile.findOneAndUpdate(
      { user: req.user.id },
      updateData,
      { new: true, upsert: true }
    )
  ]);

  if (!alumni || !user) {
    return next(new ErrorResponse('Profile update failed', 400));
  }

  res.status(200).json({
    success: true,
    data: {
      ...alumni.toObject(),
      id: user._id,
      name: user.name,
      email: user.email,
      profilePhoto: user.profilePhoto,
      role: user.role
    }
  });
});

// @desc    Upload profile photo
// @route   PUT /api/alumni/me/photo
// @access  Private
exports.uploadProfilePhoto = asyncHandler(async (req, res, next) => {
  if (!req.file) {
    return next(new ErrorResponse('Please upload a file', 400));
  }

  const photoUrl = `/uploads/profile-photos/${req.file.filename}`;
  
  // Update both User and Alumni records
  const [user, alumni] = await Promise.all([
    User.findByIdAndUpdate(
      req.user.id,
      { profilePhoto: photoUrl },
      { new: true }
    ).select('-password'),
    
    Alumni.findOneAndUpdate(
      { user: req.user.id },
      { $set: { 'user.profilePhoto': photoUrl } },
      { new: true }
    ).populate('user', 'name email profilePhoto role')
  ]);

  res.status(200).json({
    success: true,
    data: {
      user,
      alumni
    }
  });
});


exports.getAllAlumni = asyncHandler(async (req, res) => {
  try {
    const alumni = await AlumniProfile.find()
      .select('-__v -createdAt -updatedAt')
      .populate('user', 'name email profilePhoto');
    
    res.status(200).json({
      success: true,
      data: alumni
    });
  } catch (error) {
    console.error('Error fetching alumni:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

exports.getAlumniProfile = asyncHandler(async (req, res) => {
  try {
    const alumni = await AlumniProfile.findById(req.params.id)
      .populate('user', 'name email profilePhoto');
    
    if (!alumni) {
      return res.status(404).json({
        success: false,
        message: 'Alumni not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: alumni
    });
  } catch (error) {
    console.error('Error fetching alumni profile:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});