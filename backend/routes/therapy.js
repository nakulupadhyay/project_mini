const express = require('express');
const router = express.Router();
const TherapySession = require('../models/TherapySession');
const authenticateToken = require('../middleware/auth');

router.post('/', authenticateToken, async (req, res) => {
  try {
    const session = new TherapySession({
      userId: req.user.userId,
      ...req.body
    });
    await session.save();
    res.status(201).json({ message: 'Session created successfully', session });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/', authenticateToken, async (req, res) => {
  try {
    const sessions = await TherapySession.find({ userId: req.user.userId })
      .populate('therapistId', 'name email')
      .sort({ scheduledDate: -1 });
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;