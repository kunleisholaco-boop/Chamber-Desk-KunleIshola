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
        // Seed logic: Check if any broadcasts exist
        const count = await Broadcast.countDocuments();
        if (count === 0) {
            // Find a user to be the sender (e.g., the current user or any admin)
            // For seeding, we'll just use the requesting user if possible, or find one
            let senderId = req.user.id;

            const seedData = [
                {
                    title: 'Welcome to the New Dashboard',
                    message: 'We are excited to introduce the new Chamber Desk dashboard. Please explore the new features and let us know your feedback.',
                    sender: senderId,
                    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2) // 2 days ago
                },
                {
                    title: 'System Maintenance Scheduled',
                    message: 'Please be advised that system maintenance is scheduled for this Saturday from 10:00 PM to 2:00 AM. The system will be unavailable during this time.',
                    sender: senderId,
                    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5) // 5 hours ago
                },
                {
                    title: 'Q4 Town Hall Meeting',
                    message: 'Join us for the Q4 Town Hall meeting next Friday. We will be discussing the quarterly results and upcoming goals for the next year. Attendance is mandatory for all department heads.',
                    sender: senderId,
                    createdAt: new Date() // Just now
                }
            ];

            await Broadcast.insertMany(seedData);
            }

        const broadcasts = await Broadcast.find()
            .populate('sender', 'name email')
            .sort({ createdAt: -1 });

        res.json(broadcasts);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
