const express = require('express');
const router = express.Router();
const EmotionRecord = require('../models/EmotionRecord');
const Alert = require('../models/Alert');
const User = require('../models/User');
const authenticateToken = require('../middleware/auth');

// Helper functions
function getMusicTherapy(emotion) {
  const therapy = {
    'Happy': { genre: 'Upbeat Pop', track: 'Happy Vibes' },
    'Sad': { genre: 'Soothing Classical', track: 'Moonlight Sonata' },
    'Anxious': { genre: 'Ambient Calm', track: 'Deep Breathing' },
    'Calm': { genre: 'Nature Sounds', track: 'Ocean Waves' },
    'Excited': { genre: 'Energetic Dance', track: 'Electric Feel' },
    'Stressed': { genre: 'Relaxation Therapy', track: 'Stress Relief' },
    'Neutral': { genre: 'Lo-fi Beats', track: 'Study Music' },
    'Depressed': { genre: 'Therapeutic Sounds', track: 'Hope & Light' },
    'Angry': { genre: 'Calming Piano', track: 'Inner Peace' }
  };
  return therapy[emotion] || therapy['Neutral'];
}

function getAmbientSettings(emotion) {
  const settings = {
    'Happy': { lights: 'bright yellow', music: 'upbeat' },
    'Sad': { lights: 'soft blue', music: 'soothing' },
    'Anxious': { lights: 'warm orange', music: 'calming' },
    'Calm': { lights: 'cool blue', music: 'nature sounds' },
    'Stressed': { lights: 'dim warm', music: 'relaxation' },
    'Depressed': { lights: 'gentle warm', music: 'therapeutic' }
  };
  return settings[emotion] || { lights: 'neutral', music: 'ambient' };
}

// Create emotion record
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      emotion,
      score,
      scanMode,
      modalityBreakdown,
      context,
      note
    } = req.body;

    const user = await User.findById(req.user.userId);

    const emotionRecord = new EmotionRecord({
      userId: req.user.userId,
      emotion,
      score,
      scanMode,
      modalityBreakdown,
      context,
      note
    });

    let interventionTriggered = false;
    let interventionType = null;

    if (user.careMode === 'normal' && score < 60) {
      interventionTriggered = true;
      interventionType = 'music_therapy';
      emotionRecord.musicTherapy = getMusicTherapy(emotion);
      emotionRecord.ambientSettings = getAmbientSettings(emotion);
    } else if (user.careMode === 'moderate' && score < 55) {
      interventionTriggered = true;
      interventionType = 'guided_exercise';
    } else if (user.careMode === 'clinical' && score < 50) {
      interventionTriggered = true;
      interventionType = 'crisis_alert';
      
      await Alert.create({
        userId: req.user.userId,
        emotionRecordId: emotionRecord._id,
        alertType: 'low_wellness',
        severity: score < 40 ? 'critical' : 'high',
        message: `Low wellness score detected: ${score}%. Emotion: ${emotion}`
      });
    }

    emotionRecord.interventionTriggered = interventionTriggered;
    emotionRecord.interventionType = interventionType;

    await emotionRecord.save();

    res.status(201).json({
      message: 'Emotion recorded successfully',
      emotionRecord,
      intervention: interventionTriggered ? {
        type: interventionType,
        musicTherapy: emotionRecord.musicTherapy,
        ambientSettings: emotionRecord.ambientSettings
      } : null
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get emotion history
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate, limit = 50 } = req.query;

    let query = { userId: req.user.userId };

    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const emotions = await EmotionRecord.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));

    res.json(emotions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get analytics
router.get('/analytics', authenticateToken, async (req, res) => {
  try {
    const { period = '7' } = req.query;
    
    const days = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const emotions = await EmotionRecord.find({
      userId: req.user.userId,
      timestamp: { $gte: startDate }
    });

    const avgScore = emotions.length > 0
      ? emotions.reduce((sum, e) => sum + e.score, 0) / emotions.length
      : 0;

    const emotionCounts = emotions.reduce((acc, e) => {
      acc[e.emotion] = (acc[e.emotion] || 0) + 1;
      return acc;
    }, {});

    const mostFrequentEmotion = Object.keys(emotionCounts).length > 0
      ? Object.keys(emotionCounts).reduce((a, b) => 
          emotionCounts[a] > emotionCounts[b] ? a : b
        )
      : 'Neutral';

    const trajectory = emotions.map(e => ({
      date: e.timestamp,
      score: e.score,
      emotion: e.emotion
    }));

    res.json({
      period,
      totalRecords: emotions.length,
      averageScore: Math.round(avgScore),
      mostFrequentEmotion,
      emotionDistribution: emotionCounts,
      trajectory,
      interventionsTriggered: emotions.filter(e => e.interventionTriggered).length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;