const mongoose = require('mongoose');

const emotionRecordSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  emotion: { 
    type: String, 
    required: true,
    enum: ['Happy', 'Sad', 'Anxious', 'Calm', 'Excited', 'Stressed', 'Neutral', 'Depressed', 'Angry']
  },
  score: { type: Number, required: true, min: 0, max: 100 },
  scanMode: { 
    type: String, 
    enum: ['multimodal', 'face', 'voice', 'behavior'],
    default: 'multimodal'
  },
  modalityBreakdown: {
    facial: { type: Number, min: 0, max: 100 },
    voice: { type: Number, min: 0, max: 100 },
    behavior: { type: Number, min: 0, max: 100 }
  },
  context: {
    location: String,
    activity: String,
    timeOfDay: String,
    weather: String
  },
  note: String,
  interventionTriggered: { type: Boolean, default: false },
  interventionType: String,
  musicTherapy: {
    genre: String,
    track: String,
    played: { type: Boolean, default: false }
  },
  ambientSettings: {
    lights: String,
    music: String
  },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('EmotionRecord', emotionRecordSchema);