const express = require('express');
const router = express.Router();
const User = require('../models/User');
const authenticateToken = require('../middleware/auth');

// Get profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
      .select('-password')
      .populate('caregivers', 'name email')
      .populate('patients', 'name email careMode');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const updates = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { $set: updates },
      { new: true, select: '-password' }
    );

    res.json({ message: 'Profile updated successfully', user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update care mode
router.put('/care-mode', authenticateToken, async (req, res) => {
  try {
    const { careMode } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { careMode },
      { new: true, select: '-password' }
    );

    res.json({ message: 'Care mode updated successfully', careMode: user.careMode });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;