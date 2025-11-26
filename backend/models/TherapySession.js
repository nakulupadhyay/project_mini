const mongoose = require('mongoose');

const therapySessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  therapistId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  sessionType: {
    type: String,
    enum: ['breathing', 'meditation', 'cbt', 'consultation', 'emergency'],
    required: true
  },
  duration: Number,
  notes: String,
  effectiveness: { type: Number, min: 1, max: 5 },
  scheduledDate: Date,
  completedDate: Date,
  status: {
    type: String,
    enum: ['scheduled', 'completed', 'cancelled', 'in_progress'],
    default: 'scheduled'
  }
});

module.exports = mongoose.model('TherapySession', therapySessionSchema);