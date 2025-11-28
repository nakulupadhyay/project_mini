const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();

// Middleware
const corsOptions = {
  origin: function(origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5000',
      'https://health-care-mu-six.vercel.app',
      'https://project-mini-te3w.onrender.com',
      process.env.CORS_ORIGIN
    ].filter(Boolean);
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// File upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
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

// Root route (MUST come BEFORE 404 handler)
app.get('/', (req, res) => {
  res.json({ 
    message: 'Welcome to MindCare AI Backend',
    service: 'Emotion Health Monitor',
    version: '1.0.0',
    status: 'active',
    apiBaseUrl: '/api',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      user: '/api/user',
      emotions: '/api/emotions',
      alerts: '/api/alerts',
      therapy: '/api/therapy-sessions',
      caregivers: '/api/caregivers',
      ai: '/api/ai'
    },
    timestamp: new Date().toISOString()
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'MindCare AI Backend',
    timestamp: new Date().toISOString()
  });
});

// 404 handler (MUST come LAST)
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    message: `The endpoint ${req.method} ${req.path} does not exist`,
    availableEndpoints: {
      root: '/',
      health: '/health',
      auth: '/api/auth',
      user: '/api/user',
      emotions: '/api/emotions',
      alerts: '/api/alerts',
      therapy: '/api/therapy-sessions',
      caregivers: '/api/caregivers',
      ai: '/api/ai'
    }
  });
});

// Database connection
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mindcare-ai';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 45000,
  family: 4
})
.then(() => {
  console.log('✅ Connected to MongoDB');
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 MindCare AI Backend running on port ${PORT}`);
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📍 MongoDB: Connected`);
  });
})
.catch(err => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

module.exports = app;