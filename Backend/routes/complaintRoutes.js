const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const ClientComplaint = require('../models/ClientComplaint');
const User = require('../models/User');
const Notification = require('../models/Notification');

// @route   GET /api/complaints/client/:clientId
// @desc    Get all complaints for a specific client
// @access  Private (Admin, Manager, HOC)
router.get('/client/:clientId', auth, async (req, res) => {
    try {
        // Check if user has permission
        if (!['Admin', 'Manager', 'HOC'].includes(req.user.role)) {
            return res.status(403).json({ msg: 'Access denied' });
        }

        const complaints = await ClientComplaint.find({ client: req.params.clientId })
            .populate('case', 'caseTitle caseType')
            .populate('client', 'name email')
            .sort({ createdAt: -1 });

        res.json(complaints);
    } catch (err) {
        console.error('Error fetching complaints:', err);
        res.status(500).json({ msg: 'Server error' });
    }
});

// @route   GET /api/complaints/:complaintId
// @desc    Get single complaint with replies
// @access  Private (Admin, Manager, HOC)
router.get('/:complaintId', auth, async (req, res) => {
    try {
        // Check if user has permission
        if (!['Admin', 'Manager', 'HOC'].includes(req.user.role)) {
            return res.status(403).json({ msg: 'Access denied' });
        }

        const complaint = await ClientComplaint.findById(req.params.complaintId)
            .populate('case', 'caseTitle caseType')
            .populate('client', 'name email phone');

        if (!complaint) {
            return res.status(404).json({ msg: 'Complaint not found' });
        }

        res.json(complaint);
    } catch (err) {
        console.error('Error fetching complaint:', err);
        res.status(500).json({ msg: 'Server error' });
    }
});

// @route   POST /api/complaints/:complaintId/reply
// @desc    Add a staff reply to a complaint
// @access  Private (Admin, Manager, HOC)
router.post('/:complaintId/reply', auth, async (req, res) => {
    try {
        // Check if user has permission
        if (!['Admin', 'Manager', 'HOC'].includes(req.user.role)) {
            return res.status(403).json({ msg: 'Access denied' });
        }

        const { content } = req.body;

        if (!content) {
            return res.status(400).json({ msg: 'Reply content is required' });
        }

        const complaint = await ClientComplaint.findById(req.params.complaintId);

        if (!complaint) {
            return res.status(404).json({ msg: 'Complaint not found' });
        }

        // Get user details
        const user = await User.findById(req.user.id).select('name role');

        complaint.replies.push({
            author: req.user.id,
            authorType: 'staff',
            authorName: user.name,
            authorRole: user.role, // Add role for display
            content,
            createdAt: new Date()
        });

        await complaint.save();

        // Notify client about the reply
        await new Notification({
            recipient: complaint.client,
            type: 'client_complaint_reply',
            message: `${user.name} (${user.role}) replied to your complaint: "${complaint.subject}"`,
            relatedEntity: {
                entityType: 'ClientComplaint',
                entityId: complaint._id
            }
        }).save();

        // Notify all staff (Admins, Managers, HOC) except the author
        const staffUsers = await User.find({
            role: { $in: ['Admin', 'Manager', 'HOC'] },
            _id: { $ne: req.user.id }
        });

        const { notifyUsers } = require('../utils/notificationHelper');
        await notifyUsers(
            staffUsers,
            'client_complaint_reply',
            `${user.name} replied to complaint: "${complaint.subject}"`,
            {
                entityType: 'Client',
                entityId: complaint.client
            }
        );

        res.json({ msg: 'Reply added successfully', complaint });
    } catch (err) {
        console.error('Error adding reply:', err);
        res.status(500).json({ msg: 'Server error' });
    }
});

// @route   PATCH /api/complaints/:complaintId/status
// @desc    Update complaint status
// @access  Private (Admin, Manager, HOC)
router.patch('/:complaintId/status', auth, async (req, res) => {
    try {
        // Check if user has permission
        if (!['Admin', 'Manager', 'HOC'].includes(req.user.role)) {
            return res.status(403).json({ msg: 'Access denied' });
        }

        const { status } = req.body;

        if (!status) {
            return res.status(400).json({ msg: 'Status is required' });
        }

        const validStatuses = ['Pending', 'In Progress', 'Resolved', 'Closed'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ msg: 'Invalid status' });
        }

        const complaint = await ClientComplaint.findById(req.params.complaintId);

        if (!complaint) {
            return res.status(404).json({ msg: 'Complaint not found' });
        }

        complaint.status = status;
        await complaint.save();

        // Notify client about status change
        await new Notification({
            recipient: complaint.client,
            type: 'client_complaint_status_changed',
            message: `Your complaint "${complaint.subject}" status changed to: ${status}`,
            relatedEntity: {
                entityType: 'ClientComplaint',
                entityId: complaint._id
            }
        }).save();

        // Notify the person who changed the status (confirmation)
        try {
            const user = await User.findById(req.user.id).select('name');
            await new Notification({
                recipient: req.user.id,
                type: 'client_complaint_status_changed',
                message: `You changed complaint "${complaint.subject}" status to: ${status}`,
                relatedEntity: {
                    entityType: 'ClientComplaint',
                    entityId: complaint._id
                }
            }).save();
        } catch (notifErr) {
            console.error('Error notifying user about status change confirmation:', notifErr.message);
        }

        // Notify all staff (Admins, Managers, HOC) except the user who changed it
        const staffUsers = await User.find({
            role: { $in: ['Admin', 'Manager', 'HOC'] },
            _id: { $ne: req.user.id }
        });

        const { notifyUsers } = require('../utils/notificationHelper');
        await notifyUsers(
            staffUsers,
            'client_complaint_status_changed',
            `Complaint "${complaint.subject}" status changed to: ${status}`,
            {
                entityType: 'Client',
                entityId: complaint.client
            }
        );

        res.json({ msg: 'Status updated successfully', complaint });
    } catch (err) {
        console.error('Error updating status:', err);
        res.status(500).json({ msg: 'Server error' });
    }
});

module.exports = router;
