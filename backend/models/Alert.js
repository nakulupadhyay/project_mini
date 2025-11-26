const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  emotionRecordId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EmotionRecord'
  },
  alertType: {
    type: String,
    enum: ['low_wellness', 'crisis', 'pattern_detected', 'medication_reminder'],
    required: true
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  message: String,
  resolved: { type: Boolean, default: false },
  notifiedCaregiver: { type: Boolean, default: false },
  caregiverResponse: String,
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Alert', alertSchema);