const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// File upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }
});

// Import models
const User = require('./models/User');
const EmotionRecord = require('./models/EmotionRecord');
const Alert = require('./models/Alert');
const TherapySession = require('./models/TherapySession');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const emotionRoutes = require('./routes/emotions');
const alertRoutes = require('./routes/alerts');
const therapyRoutes = require('./routes/therapy');
const caregiverRoutes = require('./routes/caregivers');
const aiRoutes = require('./routes/ai');

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/emotions', emotionRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/therapy-sessions', therapyRoutes);
app.use('/api/caregivers', caregiverRoutes);
app.use('/api/ai', aiRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'MindCare AI Backend',
    timestamp: new Date().toISOString()
  });
});

// Database connection
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mindcare-ai';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('✅ Connected to MongoDB');
  app.listen(PORT, () => {
    console.log(`🚀 MindCare AI Backend running on port ${PORT}`);
    console.log(`📍 API Base URL: http://localhost:${PORT}/api`);
  });
})
.catch(err => {
  console.error('❌ MongoDB connection error:', err);
});

module.exports = app;