const express = require('express');
const router = express.Router();
const multer = require('multer');
const authenticateToken = require('../middleware/auth');

const upload = multer({ dest: 'uploads/' });

router.post('/detect-emotion', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    const { scanMode } = req.body;

    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    const emotions = ['Happy', 'Sad', 'Anxious', 'Calm', 'Excited', 'Stressed', 'Neutral'];
    const detectedEmotion = emotions[Math.floor(Math.random() * emotions.length)];
    const overallScore = Math.floor(Math.random() * 40) + 60;

    const result = {
      emotion: detectedEmotion,
      score: overallScore,
      scanMode: scanMode || 'multimodal',
      modalityBreakdown: {
        facial: Math.floor(Math.random() * 100),
        voice: Math.floor(Math.random() * 100),
        behavior: Math.floor(Math.random() * 100)
      },
      context: {
        timeOfDay: new Date().getHours() < 12 ? 'Morning' : 
                   new Date().getHours() < 18 ? 'Afternoon' : 'Evening'
      },
      timestamp: new Date()
    };

    res.json({ success: true, message: 'Emotion detected successfully', result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;