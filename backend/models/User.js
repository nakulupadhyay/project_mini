const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  careMode: { 
    type: String, 
    enum: ['normal', 'moderate', 'clinical'], 
    default: 'normal' 
  },
  profileData: {
    age: Number,
    gender: String,
    medicalHistory: [String],
    medications: [String],
    emergencyContact: {
      name: String,
      phone: String,
      relationship: String
    }
  },
  caregivers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  patients: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  preferences: {
    musicTherapy: { type: Boolean, default: true },
    ambientMode: { type: Boolean, default: true },
    notificationsEnabled: { type: Boolean, default: true }
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);