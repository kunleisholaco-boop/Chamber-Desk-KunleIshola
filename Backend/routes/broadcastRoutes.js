const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Broadcast = require('../models/Broadcast');
const User = require('../models/User');

// @route   GET /api/broadcasts
// @desc    Get all broadcasts
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        const broadcasts = await Broadcast.find()
            .populate('sender', 'name email')
            .sort({ createdAt: -1 });

        res.json(broadcasts);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server Error', error: err.message });
    }
});

// @route   POST /api/broadcasts
// @desc    Create a new broadcast (Manager only)
// @access  Private (Manager only)
router.post('/', auth, async (req, res) => {
    try {
        const { title, message } = req.body;

        // Get current user
        const currentUser = await User.findById(req.user.id);

        if (!currentUser) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // Check if user is a Manager, Admin, or HOC
        if (!['Manager', 'Admin', 'HOC'].includes(currentUser.role)) {
            return res.status(403).json({ msg: 'Only Managers, Admins, and HOC can create broadcasts' });
        }

        // Validate input
        if (!title || !message) {
            return res.status(400).json({ msg: 'Title and message are required' });
        }

        // Create new broadcast
        const newBroadcast = new Broadcast({
            title,
            message,
            sender: req.user.id,
            recipients: 'All'
        });

        const broadcast = await newBroadcast.save();

        // Populate sender info before returning
        await broadcast.populate('sender', 'name email');

        // Create notifications for all users
        const Notification = require('../models/Notification');
        const allUsers = await User.find(); // All users including the sender

        const { notifyUsers } = require('../utils/notificationHelper');
        await notifyUsers(
            allUsers,
            'broadcast_created',
            `New broadcast from ${currentUser.name}: "${title}"`,
            {
                entityType: 'Broadcast',
                entityId: broadcast._id
            }
        );

        res.json(broadcast);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server Error', error: err.message });
    }
});

module.exports = router;
