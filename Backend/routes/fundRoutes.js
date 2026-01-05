const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const auth = require('../middleware/auth');
const FundRequisition = require('../models/FundRequisition');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { notifyAdmins } = require('../utils/notificationHelper');

// @route   POST /api/funds
// @desc    Create a fund requisition
// @access  Private (any authenticated user)
router.post('/', auth, async (req, res) => {
    const { amount, purpose, type, urgency } = req.body;

    try {
        const fundRequisition = new FundRequisition({
            requestedBy: req.user.id,
            amount,
            purpose,
            type,
            urgency
        });

        await fundRequisition.save();

        // Notify Admin Officers
        const adminOfficers = await User.find({ role: 'Admin' });

        const { notifyUsers } = require('../utils/notificationHelper');
        await notifyUsers(
            adminOfficers,
            'general',
            `New fund requisition of ₦${amount.toLocaleString()} submitted`,
            {
                entityType: 'FundRequisition',
                entityId: fundRequisition._id
            }
        );

        // Notify the requester (HOC/User)
        const requesterNotification = new Notification({
            recipient: req.user.id,
            type: 'fund_submitted',
            message: `Your fund requisition of ₦${amount.toLocaleString()} has been submitted successfully`,
            relatedEntity: {
                entityType: 'FundRequisition',
                entityId: fundRequisition._id
            }
        });
        await requesterNotification.save();

        res.json({
            msg: 'Fund requisition created successfully',
            fundRequisition
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/funds
// @desc    Get all fund requisitions (role-based filtering)
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        let query = {};

        // Filter based on role
        if (req.user.role === 'Admin' || req.user.role === 'Manager') {
            // Admin and Manager see all requisitions
        } else {
            // Others see only their own requisitions
            query.requestedBy = req.user.id;
        }

        const fundRequisitions = await FundRequisition.find(query)
            .populate('requestedBy', 'name email role')
            .populate('assignedTo', 'name email')
            .populate('assignedBy', 'name email')
            .populate('discussions.author', 'name email role')
            .sort({ createdAt: -1 });

        res.json(fundRequisitions);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT /api/funds/:id/assign
// @desc    Assign fund requisition to a manager (Admin Officer only)
// @access  Private
router.put('/:id/assign', auth, async (req, res) => {
    const { managerId } = req.body;

    try {
        // Check if user is Admin Officer
        if (req.user.role !== 'Admin') {
            return res.status(403).json({ msg: 'Access denied. Admin Officer only.' });
        }

        // Verify manager exists and has Manager role
        const manager = await User.findById(managerId);
        if (!manager || manager.role !== 'Manager') {
            return res.status(400).json({ msg: 'Invalid manager selected' });
        }

        const fundRequisition = await FundRequisition.findById(req.params.id);

        if (!fundRequisition) {
            return res.status(404).json({ msg: 'Fund requisition not found' });
        }

        fundRequisition.assignedTo = managerId;
        fundRequisition.assignedBy = req.user.id;
        fundRequisition.status = 'Assigned';

        await fundRequisition.save();

        // Notify the manager
        const notification = new Notification({
            recipient: managerId,
            type: 'fund_assigned',
            message: `Fund requisition of $${fundRequisition.amount} has been assigned to you`,
            relatedEntity: {
                entityType: 'FundRequisition',
                entityId: fundRequisition._id
            }
        });

        await notification.save();

        // Notify the requester
        const requesterNotification = new Notification({
            recipient: fundRequisition.requestedBy,
            type: 'fund_assigned',
            message: `Your fund requisition of ₦${fundRequisition.amount.toLocaleString()} has been assigned to ${manager.name}`,
            relatedEntity: {
                entityType: 'FundRequisition',
                entityId: fundRequisition._id
            }
        });
        await requesterNotification.save();

        res.json({
            msg: 'Fund requisition assigned successfully',
            fundRequisition
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT /api/funds/:id/approve
// @desc    Approve or reject fund requisition (Manager only)
// @access  Private
router.put('/:id/approve', auth, async (req, res) => {
    const { status, comment, pin } = req.body;

    try {
        // Check if user is Manager
        if (req.user.role !== 'Manager') {
            return res.status(403).json({ msg: 'Access denied. Manager only.' });
        }

        // Verify PIN is provided
        if (!pin) {
            return res.status(400).json({ msg: 'Approval PIN is required' });
        }

        // Get user with PIN field
        const user = await User.findById(req.user.id).select('+approvalPin');

        if (!user.approvalPin) {
            return res.status(400).json({ msg: 'No approval PIN set. Please create one first.' });
        }

        // Verify PIN
        const isPinValid = await bcrypt.compare(pin, user.approvalPin);
        if (!isPinValid) {
            return res.status(401).json({ msg: 'Invalid PIN' });
        }

        const fundRequisition = await FundRequisition.findById(req.params.id);

        if (!fundRequisition) {
            return res.status(404).json({ msg: 'Fund requisition not found' });
        }

        // Verify this requisition is assigned to this manager
        if (fundRequisition.assignedTo.toString() !== req.user.id) {
            return res.status(403).json({ msg: 'Not authorized to approve this requisition' });
        }

        fundRequisition.status = status; // 'Approved' or 'Rejected'
        fundRequisition.managerComment = comment;

        await fundRequisition.save();

        // Notify the requester
        const notification = new Notification({
            recipient: fundRequisition.requestedBy,
            type: status === 'Approved' ? 'fund_approved' : 'fund_rejected',
            message: `Your fund requisition of ₦${fundRequisition.amount.toLocaleString()} has been ${status.toLowerCase()}`,
            relatedEntity: {
                entityType: 'FundRequisition',
                entityId: fundRequisition._id
            }
        });

        await notification.save();

        // Notify admins about manager's decision
        const manager = await User.findById(req.user.id);
        await notifyAdmins(
            status === 'Approved' ? 'fund_approved' : 'fund_rejected',
            `Fund requisition of ₦${fundRequisition.amount.toLocaleString()} has been ${status.toLowerCase()} by ${manager.name}`,
            {
                entityType: 'FundRequisition',
                entityId: fundRequisition._id
            }
        );

        res.json({
            msg: `Fund requisition ${status.toLowerCase()} successfully`,
            fundRequisition
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/funds/check-overdue
// @desc    Check for overdue requisitions and notify admins (Manual trigger or scheduled)
// @access  Private (Admin only)
router.get('/check-overdue', auth, async (req, res) => {
    try {
        // Check if user is Admin
        if (req.user.role !== 'Admin' && req.user.role !== 'Superadmin') {
            return res.status(403).json({ msg: 'Access denied. Admin only.' });
        }

        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

        // Find pending requisitions older than 3 days
        const overdueRequisitions = await FundRequisition.find({
            status: 'Pending',
            createdAt: { $lt: threeDaysAgo }
        }).populate('requestedBy', 'name');

        let notificationCount = 0;

        for (const reqItem of overdueRequisitions) {
            // Check if we already notified about this in the last 24 hours
            const oneDayAgo = new Date();
            oneDayAgo.setHours(oneDayAgo.getHours() - 24);

            const existingNotification = await Notification.findOne({
                type: 'fund_overdue',
                'relatedEntity.entityId': reqItem._id,
                createdAt: { $gt: oneDayAgo }
            });

            if (!existingNotification) {
                await notifyAdmins(
                    'fund_overdue',
                    `Overdue Fund Requisition: ₦${reqItem.amount} requested by ${reqItem.requestedBy?.name || 'Unknown'} is pending for more than 3 days`,
                    {
                        entityType: 'FundRequisition',
                        entityId: reqItem._id
                    }
                );
                notificationCount++;
            }
        }

        res.json({
            msg: 'Overdue check completed',
            foundOverdue: overdueRequisitions.length,
            notificationsSent: notificationCount
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/funds/:id/query
// @desc    Change status to Querying and add admin's question
// @access  Private (Admin only)
router.post('/:id/query', auth, async (req, res) => {
    const { content } = req.body;

    try {
        if (req.user.role !== 'Admin') {
            return res.status(403).json({ msg: 'Access denied. Admin only.' });
        }

        if (!content || !content.trim()) {
            return res.status(400).json({ msg: 'Question content is required' });
        }

        const fundRequisition = await FundRequisition.findById(req.params.id);

        if (!fundRequisition) {
            return res.status(404).json({ msg: 'Fund requisition not found' });
        }

        // Add question to discussions
        fundRequisition.discussions.push({
            author: req.user.id,
            content: content.trim(),
            createdAt: new Date()
        });

        // Change status to Querying
        fundRequisition.status = 'Querying';
        await fundRequisition.save();

        // Re-fetch with populated fields for response
        const populatedRequisition = await FundRequisition.findById(fundRequisition._id)
            .populate('requestedBy', 'name email role')
            .populate('assignedTo', 'name email')
            .populate('discussions.author', 'name email role');

        // Notify the requester
        const admin = await User.findById(req.user.id);
        const notification = new Notification({
            recipient: populatedRequisition.requestedBy,
            type: 'fund_queried',
            message: `${admin.name} has a question about your fund requisition of ₦${populatedRequisition.amount.toLocaleString()}`,
            relatedEntity: {
                entityType: 'FundRequisition',
                entityId: populatedRequisition._id
            }
        });
        await notification.save();

        res.json({
            msg: 'Query posted successfully',
            fundRequisition: populatedRequisition
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/funds/:id/discuss
// @desc    Add comment to discussion thread
// @access  Private (Admin and Requester)
router.post('/:id/discuss', auth, async (req, res) => {
    const { content } = req.body;

    try {
        if (!content || !content.trim()) {
            return res.status(400).json({ msg: 'Comment content is required' });
        }

        const fundRequisition = await FundRequisition.findById(req.params.id);

        if (!fundRequisition) {
            return res.status(404).json({ msg: 'Fund requisition not found' });
        }

        // Check if user is admin, the requester, or assigned manager
        const isAdmin = req.user.role === 'Admin';
        const isRequester = fundRequisition.requestedBy.toString() === req.user.id;
        const isAssignedManager = fundRequisition.assignedTo && fundRequisition.assignedTo.toString() === req.user.id;

        if (!isAdmin && !isRequester && !isAssignedManager) {
            return res.status(403).json({ msg: 'Access denied' });
        }

        // Add comment to discussions
        fundRequisition.discussions.push({
            author: req.user.id,
            content: content.trim(),
            createdAt: new Date()
        });

        await fundRequisition.save();
        await fundRequisition.populate('discussions.author', 'name email role');

        // Notify relevant parties
        const currentUser = await User.findById(req.user.id);
        const notifications = [];

        // If admin or manager replied, notify the requester
        if (isAdmin || isAssignedManager) {
            notifications.push({
                recipient: fundRequisition.requestedBy,
                type: 'fund_discussion',
                message: `${currentUser.name} replied to the discussion on fund requisition of ₦${fundRequisition.amount.toLocaleString()}`,
                relatedEntity: {
                    entityType: 'FundRequisition',
                    entityId: fundRequisition._id
                }
            });
        }

        // If requester replied, notify admins and assigned manager (if exists)
        if (isRequester) {
            // Notify all admins
            await notifyAdmins(
                'fund_discussion',
                `${currentUser.name} replied to a fund requisition query`,
                {
                    entityType: 'FundRequisition',
                    entityId: fundRequisition._id
                }
            );

            // Notify assigned manager if exists
            if (fundRequisition.assignedTo) {
                notifications.push({
                    recipient: fundRequisition.assignedTo,
                    type: 'fund_discussion',
                    message: `${currentUser.name} replied to the discussion on fund requisition of ₦${fundRequisition.amount.toLocaleString()}`,
                    relatedEntity: {
                        entityType: 'FundRequisition',
                        entityId: fundRequisition._id
                    }
                });
            }
        }

        // If manager replied, also notify admins
        if (isAssignedManager) {
            await notifyAdmins(
                'fund_discussion',
                `Manager ${currentUser.name} replied to a fund requisition discussion`,
                {
                    entityType: 'FundRequisition',
                    entityId: fundRequisition._id
                }
            );
        }

        // Save all notifications
        if (notifications.length > 0) {
            // Fetch users for the notifications
            const recipientIds = notifications.map(n => n.recipient);
            const recipients = await User.find({ _id: { $in: recipientIds } });

            // We need to map notifications to users to send emails with the correct message
            // Since notifyUsers sends the SAME message to all, we might need to loop if messages differ.
            // In this case, messages DO differ based on who is receiving it (requester vs assigned manager).

            const { notifyUsers } = require('../utils/notificationHelper');

            // Group notifications by message
            const notificationsByMessage = {};
            notifications.forEach(n => {
                if (!notificationsByMessage[n.message]) {
                    notificationsByMessage[n.message] = [];
                }
                notificationsByMessage[n.message].push(n.recipient);
            });

            for (const [message, recipientIds] of Object.entries(notificationsByMessage)) {
                const users = recipients.filter(r => recipientIds.some(id => id.toString() === r._id.toString()));
                if (users.length > 0) {
                    await notifyUsers(
                        users,
                        'fund_discussion',
                        message,
                        {
                            entityType: 'FundRequisition',
                            entityId: fundRequisition._id
                        }
                    );
                }
            }
        }

        res.json({
            msg: 'Comment posted successfully',
            fundRequisition
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/funds/:id/close
// @desc    Close/reject requisition with reason
// @access  Private (Admin only)
router.post('/:id/close', auth, async (req, res) => {
    const { reason } = req.body;

    try {
        if (req.user.role !== 'Admin') {
            return res.status(403).json({ msg: 'Access denied. Admin only.' });
        }

        if (!reason || !reason.trim()) {
            return res.status(400).json({ msg: 'Closure reason is required' });
        }

        const fundRequisition = await FundRequisition.findById(req.params.id);

        if (!fundRequisition) {
            return res.status(404).json({ msg: 'Fund requisition not found' });
        }

        fundRequisition.status = 'Closed';
        fundRequisition.closureReason = reason.trim();
        await fundRequisition.save();

        // Notify the requester
        const admin = await User.findById(req.user.id);
        const notification = new Notification({
            recipient: fundRequisition.requestedBy,
            type: 'fund_closed',
            message: `Your fund requisition of ₦${fundRequisition.amount.toLocaleString()} has been closed by ${admin.name}`,
            relatedEntity: {
                entityType: 'FundRequisition',
                entityId: fundRequisition._id
            }
        });
        await notification.save();

        res.json({
            msg: 'Requisition closed successfully',
            fundRequisition
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/funds/:id/reopen
// @desc    Change status from Querying back to Pending
// @access  Private (Admin only)
router.post('/:id/reopen', auth, async (req, res) => {
    try {
        if (req.user.role !== 'Admin') {
            return res.status(403).json({ msg: 'Access denied. Admin only.' });
        }

        const fundRequisition = await FundRequisition.findById(req.params.id);

        if (!fundRequisition) {
            return res.status(404).json({ msg: 'Fund requisition not found' });
        }

        if (fundRequisition.status !== 'Querying') {
            return res.status(400).json({ msg: 'Can only reopen requisitions with Querying status' });
        }

        fundRequisition.status = 'Pending';
        await fundRequisition.save();

        // Notify the requester
        const admin = await User.findById(req.user.id);
        const notification = new Notification({
            recipient: fundRequisition.requestedBy,
            type: 'fund_reopened',
            message: `Your fund requisition of ₦${fundRequisition.amount.toLocaleString()} has been reopened by ${admin.name}`,
            relatedEntity: {
                entityType: 'FundRequisition',
                entityId: fundRequisition._id
            }
        });
        await notification.save();

        res.json({
            msg: 'Requisition reopened successfully',
            fundRequisition
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
