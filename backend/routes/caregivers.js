const express = require('express');
const router = express.Router();
const User = require('../models/User');
const EmotionRecord = require('../models/EmotionRecord');
const Alert = require('../models/Alert');
const authenticateToken = require('../middleware/auth');

router.post('/add', authenticateToken, async (req, res) => {
  try {
    const { caregiverEmail } = req.body;
    const caregiver = await User.findOne({ email: caregiverEmail });
    
    if (!caregiver) return res.status(404).json({ error: 'Caregiver not found' });

    await User.findByIdAndUpdate(req.user.userId, {
      $addToSet: { caregivers: caregiver._id }
    });

    await User.findByIdAndUpdate(caregiver._id, {
      $addToSet: { patients: req.user.userId }
    });

    res.json({ 
      message: 'Caregiver added successfully', 
      caregiver: { id: caregiver._id, name: caregiver.name, email: caregiver.email }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/patients/:patientId', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user.patients.includes(req.params.patientId)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const patient = await User.findById(req.params.patientId).select('-password');
    const emotions = await EmotionRecord.find({ userId: req.params.patientId })
      .sort({ timestamp: -1 }).limit(20);
    const alerts = await Alert.find({ userId: req.params.patientId, resolved: false })
      .sort({ timestamp: -1 });

    res.json({ patient, recentEmotions: emotions, activeAlerts: alerts });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;