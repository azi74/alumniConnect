const asyncHandler = require('express-async-handler');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const path = require('path');
const multer = require('multer');
const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const AlumniProfile = require('../models/AlumniProfile');
const Admin = require('../models/Admin');
const sendEmail = require('../utils/sendEmail');
const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many login attempts, please try again later',
  skipSuccessfulRequests: true // Don't count successful logins
});

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

// Configure file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/profile-photos/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, req.user.id + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: function (req, file, cb) {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// @desc    Register new user
// @desc    Register new user
const registerUser = asyncHandler(async (req, res) => {
  try {
    const { name, email, password, role, profileData } = req.body;

    // Validation
    const requiredFields = ['name', 'email', 'password', 'role'];
    const missingFields = requiredFields.filter(field => !req.body[field]);

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    if (await User.findOne({ email })) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists'
      });
    }

    // Create base user
    const user = await User.create({ email, password, role });

    try {
      // Create role-specific profile
      if (role === 'student') {
        if (!profileData.registrationNumber || !profileData?.year || !profileData?.program) {
          await User.findByIdAndDelete(user._id);
          return res.status(400).json({
            message: 'Registration number, year, and program are required for students'
          });
        }

        await StudentProfile.create({
          user: user._id,
          name: name,
          email: email,
          registrationNumber: profileData.registrationNumber,
          year: profileData.year,
          section: profileData.section || '',
          program: profileData.program,
          
        });
      } 
      else if (role === 'alumni') {
        if (!profileData.graduationYear || !profileData.degree) {
          await User.findByIdAndDelete(user._id);
          return res.status(400).json({
            success: false,
            message: 'Graduation year and degree are required for alumni'
          });
        }

        await AlumniProfile.create({
          user: user._id,
          name,
          email,
          graduationYear: profileData.graduationYear,
          degree: profileData.degree,
          currentPosition: profileData.currentPosition || '',
          company: profileData.company || '',
          profileComplete: false
        });
      }

      const token = generateToken(user._id);

      res.status(201).json({
        success: true,
        token,
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          isVerified: user.isVerified,
          profile: { 
            registrationNumber: profileData.registrationNumber,
            year: profileData.year,
            program: profileData.program,
            section: profileData.section
          }
        }
      });
    } catch (error) {
      // Rollback user creation if profile creation fails
      await User.findByIdAndDelete(user._id);
      throw error;
    }
  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed'
    });
  }
});

// @desc    Register new admin (admin only)
const registerAdmin = asyncHandler(async (req, res) => {
  const { name, email, password, adminRole } = req.body;
  const validAdminRoles = ['superadmin', 'moderator', 'support'];

  // Validation
  if (!name || !email || !password || !adminRole) {
    res.status(400);
    throw new Error('All fields are required: name, email, password, adminRole');
  }

  if (!validAdminRoles.includes(adminRole)) {
    res.status(400);
    throw new Error(`Invalid admin role. Valid roles: ${validAdminRoles.join(', ')}`);
  }

  if (await User.findOne({ email })) {
    res.status(400);
    throw new Error('Email already exists');
  }

  const admin = await Admin.create({
    name,
    email,
    password,
    role: 'admin',
    adminRole,
    permissions: ['all']
  });

  res.status(201).json({
    success: true,
    token: generateToken(admin._id),
    user: {
      id: admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      adminRole: admin.adminRole
    }
  });
});

// @desc    Authenticate user
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error('Please provide email and password');
  }

  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await bcrypt.compare(password, user.password))) {
    res.status(401);
    throw new Error('Invalid credentials');
  }

  // Update last login
  user.lastLogin = new Date();
  await user.save();

  const token = generateToken(user._id);
  const userData = await User.findById(user._id).select('-password -resetPasswordToken -resetPasswordExpire');

  res.status(200).json({
    success: true,
    token, // Add this wrapper
    user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role.toLowerCase(),
        ...(user.profilePhoto && { profilePhoto: user.profilePhoto }),
        // Include role-specific fields if needed
      }
    }
  );
});

// @desc    Get current user data
const getMe = asyncHandler(async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password -__v -resetPasswordToken -resetPasswordExpire')
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    let profile = {};

    if (user.role === 'alumni') {
      profile = await AlumniProfile.findOne({ user: user._id })
        .select('-__v -createdAt -updatedAt')
        .lean();
    }

    if (user.role === 'student') {
      profile = await StudentProfile.findOne({ user: user._id })
        .select('-__v -createdAt -updatedAt')
        .lean();
    } 
    

    const responseData = {
      ...user,
      ...(profile || {})
    };

    res.json({
      success: true,
      data: responseData
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Update user profile
const updateProfile = asyncHandler(async (req, res) => {
  const { role } = req.user;
  
  // For alumni, we only update basic user fields
  if (role === 'alumni') {
    const allowedFields = [
      'name', 'email', 'phone', 'bio', 'socialLinks', 'profilePhoto'
    ];
    
    const fieldsToUpdate = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        fieldsToUpdate[field] = req.body[field];
      }
    });

    const user = await User.findByIdAndUpdate(
      req.user.id, 
      fieldsToUpdate, 
      { new: true, runValidators: true }
    ).select('-password -resetPasswordToken -resetPasswordExpire');

    return res.status(200).json({
      success: true,
      user
    });
  }

  const allowedFields = [
    'name', 'email', 'phone', 'address', 'bio', 
    'interests', 'socialLinks', 'profileComplete'
  ];
  
  const fieldsToUpdate = {};
  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      fieldsToUpdate[field] = req.body[field];
    }
  });

  const user = await User.findByIdAndUpdate(
    req.user.id, 
    fieldsToUpdate, 
    { new: true, runValidators: true }
  ).select('-password -resetPasswordToken -resetPasswordExpire');

  res.status(200).json({
    success: true,
    user
  });
});

// @desc    Delete user account
const deleteAccount = asyncHandler(async (req, res) => {
  await User.findByIdAndDelete(req.user.id);
  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Forgot password
const forgotPassword = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    res.status(404);
    throw new Error('No user with that email');
  }

  const resetToken = crypto.randomBytes(20).toString('hex');
  user.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  user.resetPasswordExpire = Date.now() + 3600000; // 1 hour
  await user.save();

  const resetUrl = `${req.protocol}://${req.get('host')}/api/auth/reset-password/${resetToken}`;
  const message = `You requested a password reset. Click here: ${resetUrl}`;

  await sendEmail({
    email: user.email,
    subject: 'Password Reset Token',
    message
  });

  res.status(200).json({
    success: true,
    message: 'Password reset email sent'
  });
});

// @desc    Reset password
const resetPassword = asyncHandler(async (req, res) => {
  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(req.params.resetToken)
    .digest('hex');

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() }
  });

  if (!user) {
    res.status(400);
    throw new Error('Invalid or expired token');
  }

  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  res.status(200).json({
    success: true,
    token: generateToken(user._id),
    user: {
      id: user._id,
      name: user.name,
      email: user.email
    }
  });
});

// @desc    Upload profile photo
const uploadProfilePhoto = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error('No file uploaded');
  }

  const photoUrl = `/uploads/profile-photos/${req.file.filename}`;
  const user = await User.findByIdAndUpdate(
    req.user.id,
    { profilePhoto: photoUrl },
    { new: true }
  ).select('-password -resetPasswordToken -resetPasswordExpire');

  res.status(200).json({
    success: true,
    user,
    message: 'Profile photo updated successfully'
  });
});

module.exports = {
  registerUser,
  registerAdmin,
  loginUser,
  getMe,
  updateProfile,
  deleteAccount,
  forgotPassword,
  resetPassword,
  uploadProfilePhoto,
  upload
};