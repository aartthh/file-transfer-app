const express = require('express');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// Get all online users
router.get('/online', auth, async (req, res) => {
  try {
    const users = await User.find({ 
      isOnline: true,
      _id: { $ne: req.user._id } // Exclude current user
    }).select('username socketId');

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;