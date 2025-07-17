const express = require('express');
const Transfer = require('../models/Transfer');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// Get user's transfers
router.get('/', auth, async (req, res) => {
  try {
    const transfers = await Transfer.find({
      $or: [
        { sender: req.user._id },
        { recipient: req.user._id }
      ]
    }).sort({ createdAt: -1 });

    // Separate outgoing and incoming transfers
    const outgoing = transfers.filter(t => t.sender.toString() === req.user._id.toString());
    const incoming = transfers.filter(t => t.recipient.toString() === req.user._id.toString());

    res.json({ outgoing, incoming });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create new transfer
router.post('/', auth, async (req, res) => {
  try {
    const { transferId, filename, fileSize, recipientUsername } = req.body;

    // Find recipient
    const recipient = await User.findOne({ username: recipientUsername });
    if (!recipient) {
      return res.status(404).json({ message: 'Recipient not found' });
    }

    // Create transfer records for both sender and recipient
    const senderTransfer = new Transfer({
      transferId,
      filename,
      fileSize,
      sender: req.user._id,
      senderUsername: req.user.username,
      recipient: recipient._id,
      recipientUsername: recipient.username,
      type: 'outgoing'
    });

    const recipientTransfer = new Transfer({
      transferId,
      filename,
      fileSize,
      sender: req.user._id,
      senderUsername: req.user.username,
      recipient: recipient._id,
      recipientUsername: recipient.username,
      type: 'incoming'
    });

    await Promise.all([senderTransfer.save(), recipientTransfer.save()]);

    res.status(201).json({ 
      message: 'Transfer created successfully',
      transfer: senderTransfer 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update transfer status
router.put('/:transferId', auth, async (req, res) => {
  try {
    const { transferId } = req.params;
    const { status, progress, fileData } = req.body;

    const updateData = {};
    if (status) updateData.status = status;
    if (progress !== undefined) updateData.progress = progress;
    if (fileData) updateData.fileData = fileData;

    // Update both sender and recipient records
    await Transfer.updateMany(
      { transferId },
      { $set: updateData }
    );

    res.json({ message: 'Transfer updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete transfer
router.delete('/:transferId', auth, async (req, res) => {
  try {
    const { transferId } = req.params;

    await Transfer.deleteMany({ transferId });

    res.json({ message: 'Transfer deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Clear all transfers for user
router.delete('/', auth, async (req, res) => {
  try {
    await Transfer.deleteMany({
      $or: [
        { sender: req.user._id },
        { recipient: req.user._id }
      ]
    });

    res.json({ message: 'All transfers cleared successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;