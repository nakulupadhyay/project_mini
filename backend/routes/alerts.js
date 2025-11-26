const express = require('express');
const router = express.Router();
const Alert = require('../models/Alert');
const authenticateToken = require('../middleware/auth');

router.get('/', authenticateToken, async (req, res) => {
  try {
    const { resolved } = req.query;
    let query = { userId: req.user.userId };
    if (resolved !== undefined) query.resolved = resolved === 'true';

    const alerts = await Alert.find(query)
      .populate('emotionRecordId')
      .sort({ timestamp: -1 })
      .limit(50);

    res.json(alerts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:alertId/resolve', authenticateToken, async (req, res) => {
  try {
    const { caregiverResponse } = req.body;
    const alert = await Alert.findOneAndUpdate(
      { _id: req.params.alertId, userId: req.user.userId },
      { resolved: true, caregiverResponse, notifiedCaregiver: true },
      { new: true }
    );

    if (!alert) return res.status(404).json({ error: 'Alert not found' });
    res.json({ message: 'Alert resolved successfully', alert });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;