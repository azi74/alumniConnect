const mongoose = require('mongoose');

// AlumniProfile.js
const alumniSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: [true, 'Name is required']
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  graduationYear: {
    type: Number,
    required: true,
    min: 2000,
    max: new Date().getFullYear()
  },
  degree: {
    type: String,
    required: true
  },
  currentPosition: String,
  currentCompany: String,
  location: String,
  phone: String,
  bio: String,
  skills: [String],
  education: [{
    institution: String,
    degree: String,
    year: String,
    description: String
  }],
  workExperience: [{
    company: String,
    role: String,
    duration: String,
    description: String
  }],
  socialLinks: {
    linkedin: String,
    website: String
  },
  profileComplete: {
    type: Boolean,
    default: false
  },
  profilePhoto: String,
  availableForMentorship: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });


const AlumniProfile = mongoose.model('AlumniProfile', alumniSchema);

module.exports = AlumniProfile; 