const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const Client = require('../models/Client');
const Case = require('../models/Case');
const Document = require('../models/Document');
const Meeting = require('../models/Meeting');
const ClientComplaint = require('../models/ClientComplaint');
const User = require('../models/User');
const Notification = require('../models/Notification');
const zohoService = require('../services/zohoService');

// @route   GET /api/client-portal/:shareToken/details
// @desc    Get client info and check authentication status
// @access  Public
router.get('/:shareToken/details', async (req, res) => {
    try {
        const client = await Client.findOne({ shareToken: req.params.shareToken });

        if (!client) {
            return res.status(404).json({ msg: 'Invalid client portal link' });
        }

        res.json({
            clientName: client.name,
            pinSetupCompleted: client.pinSetupCompleted
        });
    } catch (err) {
        console.error('Error fetching client details:', err);
        res.status(500).json({ msg: 'Server error' });
    }
});

// @route   POST /api/client-portal/:shareToken/setup-pin
// @desc    Set up initial PIN for client
// @access  Public
router.post('/:shareToken/setup-pin', async (req, res) => {
    try {
        const { clientName, pin } = req.body;

        const client = await Client.findOne({ shareToken: req.params.shareToken });

        if (!client) {
            return res.status(404).json({ msg: 'Invalid client portal link' });
        }

        // Verify client name matches (case-insensitive)
        if (client.name.toLowerCase() !== clientName.toLowerCase()) {
            return res.status(400).json({ msg: 'Client name does not match' });
        }

        // Check if PIN is already set up
        if (client.pinSetupCompleted) {
            return res.status(400).json({ msg: 'PIN already set up' });
        }

        // Hash the PIN
        const salt = await bcrypt.genSalt(10);
        const hashedPin = await bcrypt.hash(pin, salt);

        // Update client
        client.clientAccessPin = hashedPin;
        client.pinSetupCompleted = true;
        await client.save();

        res.json({ msg: 'PIN set up successfully' });
    } catch (err) {
        console.error('Error setting up PIN:', err);
        res.status(500).json({ msg: 'Server error' });
    }
});

// @route   POST /api/client-portal/:shareToken/verify-pin
// @desc    Verify PIN for client login
// @access  Public
router.post('/:shareToken/verify-pin', async (req, res) => {
    try {
        const { pin } = req.body;

        const client = await Client.findOne({ shareToken: req.params.shareToken });

        if (!client) {
            return res.status(404).json({ msg: 'Invalid client portal link' });
        }

        if (!client.pinSetupCompleted) {
            return res.status(400).json({ msg: 'PIN not set up yet' });
        }

        // Verify PIN
        const isMatch = await bcrypt.compare(pin, client.clientAccessPin);

        if (!isMatch) {
            return res.status(401).json({ msg: 'Invalid PIN' });
        }

        res.json({
            msg: 'PIN verified successfully',
            clientId: client._id,
            clientName: client.name,
            clientEmail: client.email
        });
    } catch (err) {
        console.error('Error verifying PIN:', err);
        res.status(500).json({ msg: 'Server error' });
    }
});

// @route   GET /api/client-portal/:shareToken/cases
// @desc    Get all cases for the client
// @access  Public (with PIN verification via session)
router.get('/:shareToken/cases', async (req, res) => {
    try {
        const client = await Client.findOne({ shareToken: req.params.shareToken });

        if (!client) {
            return res.status(404).json({ msg: 'Invalid client portal link' });
        }

        // Get all cases for this client
        const cases = await Case.find({ client: client._id })
            .select('caseTitle caseType status summary dateIssueStarted inCourt createdAt')
            .sort({ createdAt: -1 });

        res.json(cases);
    } catch (err) {
        console.error('Error fetching client cases:', err);
        res.status(500).json({ msg: 'Server error' });
    }
});

// @route   GET /api/client-portal/:shareToken/case/:caseId
// @desc    Get specific case details for the client
// @access  Public (with PIN verification via session)
router.get('/:shareToken/case/:caseId', async (req, res) => {
    try {
        const client = await Client.findOne({ shareToken: req.params.shareToken });

        if (!client) {
            return res.status(404).json({ msg: 'Invalid client portal link' });
        }

        // Get the case and verify it belongs to this client
        const caseData = await Case.findOne({
            _id: req.params.caseId,
            client: client._id
        }).populate('client', 'name email phone address clientType');

        if (!caseData) {
            return res.status(404).json({ msg: 'Case not found or access denied' });
        }

        // Get documents for this case
        const documents = await Document.find({ case: caseData._id })
            .select('name fileUrl uploadedAt fileType fileSize')
            .sort({ uploadedAt: -1 });

        res.json({
            ...caseData.toObject(),
            documents
        });
    } catch (err) {
        console.error('Error fetching case details:', err);
        res.status(500).json({ msg: 'Server error' });
    }
});

// @route   POST /api/client-portal/:shareToken/case/:caseId/report/:reportId/reply
// @desc    Post a reply to a case report
// @access  Public (with PIN verification)
router.post('/:shareToken/case/:caseId/report/:reportId/reply', async (req, res) => {
    try {
        const { content, pin } = req.body;

        const client = await Client.findOne({ shareToken: req.params.shareToken });

        if (!client) {
            return res.status(404).json({ msg: 'Invalid client portal link' });
        }

        // Verify PIN
        const isMatch = await bcrypt.compare(pin, client.clientAccessPin);
        if (!isMatch) {
            return res.status(401).json({ msg: 'Invalid PIN' });
        }

        // Get the case and verify it belongs to this client
        const caseData = await Case.findOne({
            _id: req.params.caseId,
            client: client._id
        });

        if (!caseData) {
            return res.status(404).json({ msg: 'Case not found or access denied' });
        }

        // Find the report
        const report = caseData.clientReports.id(req.params.reportId);
        if (!report) {
            return res.status(404).json({ msg: 'Report not found' });
        }

        // Add reply
        report.replies.push({
            authorType: 'client',
            authorName: client.name,
            content,
            createdAt: new Date()
        });

        await caseData.save();

        // Notify HOC about client's reply
        try {
            if (caseData.assignedTo) {
                const Notification = require('../models/Notification');
                await new Notification({
                    recipient: caseData.assignedTo,
                    type: 'case_report_added',
                    message: `${client.name} replied to a case report for "${caseData.caseTitle}"`,
                    relatedEntity: {
                        entityType: 'Case',
                        entityId: caseData._id
                    }
                }).save();
            }
        } catch (notifErr) {
            console.error('Error notifying HOC about client reply:', notifErr.message);
        }

        // Notify client (confirmation) that their reply was sent
        try {
            const Notification = require('../models/Notification');
            await new Notification({
                recipient: client._id,
                type: 'client_report_added',
                message: `Your reply to the case report for "${caseData.caseTitle}" has been sent`,
                relatedEntity: {
                    entityType: 'Case',
                    entityId: caseData._id
                }
            }).save();
        } catch (notifErr) {
            console.error('Error notifying client about reply confirmation:', notifErr.message);
        }

        res.json({ msg: 'Reply posted successfully', report });
    } catch (err) {
        console.error('Error posting reply:', err);
        res.status(500).json({ msg: 'Server error' });
    }
});

// @route   GET /api/client-portal/:shareToken/meetings
// @desc    Get all meetings for the client
// @access  Public (with PIN verification via session)
// @route   GET /api/client-portal/:shareToken/meetings
// @desc    Get all meetings for the client
// @access  Public (with PIN verification via session)
router.get('/:shareToken/meetings', async (req, res) => {
    try {
        const client = await Client.findOne({ shareToken: req.params.shareToken });

        if (!client) {
            return res.status(404).json({ msg: 'Invalid client portal link' });
        }

        if (!client.email) {
            return res.json([]); // No email, so no meetings can be matched
        }

        // Find meetings where client is an attendee
        const meetings = await Meeting.find({
            'attendees.email': client.email
        }).sort({ date: 1, time: 1 });

        // Add ownership flag
        const meetingsWithOwnership = meetings.map(meeting => ({
            ...meeting.toObject(),
            isOwner: meeting.clientCreator && meeting.clientCreator.toString() === client._id.toString()
        }));

        res.json(meetingsWithOwnership);
    } catch (err) {
        console.error('Error fetching client meetings:', err);
        res.status(500).json({ msg: 'Server error' });
    }
});

// @route   POST /api/client-portal/:shareToken/meetings
// @desc    Schedule a new meeting
// @access  Public (with PIN verification)
router.post('/:shareToken/meetings', async (req, res) => {
    try {
        const { title, date, time, description, attendees, type, location, meetingLink } = req.body;

        const client = await Client.findOne({ shareToken: req.params.shareToken });

        if (!client) {
            return res.status(404).json({ msg: 'Invalid client portal link' });
        }

        // Find a system user to assign as createdBy (required by schema)
        // Ideally, we'd have a specific system user, but for now we can try to find the HOC or just use the first admin found
        // OR we can make createdBy optional in the schema, but that might break other things.
        // Let's try to find a user with role 'HOC'
        const systemUser = await User.findOne({ role: 'HOC' });
        const createdBy = systemUser ? systemUser._id : null;

        const newMeeting = new Meeting({
            title,
            date,
            time,
            description: `(Scheduled by Client: ${client.name})\n${description || ''}`,
            attendees: [
                ...(attendees || []).map(email => ({ email, status: 'pending' })), // Format as objects
                { email: client.email, status: 'accepted' }
            ],
            type,
            location,
            meetingLink,
            clientCreator: client._id,
            createdBy: createdBy || client._id,
            status: 'scheduled'
        });

        const savedMeeting = await newMeeting.save();

        // Notify all attendees about the new meeting
        const attendeeEmails = savedMeeting.attendees.map(a => a.email);
        const attendeeUsers = await User.find({ email: { $in: attendeeEmails } });

        const { notifyUsers } = require('../utils/notificationHelper');
        await notifyUsers(
            attendeeUsers,
            'client_meeting_created',
            `New meeting scheduled: "${title}" on ${new Date(date).toLocaleDateString()} at ${time}`,
            {
                entityType: 'Meeting',
                entityId: savedMeeting._id
            }
        );

        res.json(savedMeeting);
    } catch (err) {
        console.error('Error scheduling meeting:', err);
        res.status(500).json({ msg: 'Server error: ' + err.message });
    }
});

// @route   PUT /api/client-portal/:shareToken/meetings/:id
// @desc    Update a meeting
// @access  Public
router.put('/:shareToken/meetings/:id', async (req, res) => {
    try {
        const { title, date, time, description, attendees, type, location, meetingLink } = req.body;

        const client = await Client.findOne({ shareToken: req.params.shareToken });

        if (!client) {
            return res.status(404).json({ msg: 'Invalid client portal link' });
        }

        let meeting = await Meeting.findById(req.params.id);

        if (!meeting) {
            return res.status(404).json({ msg: 'Meeting not found' });
        }

        // Check if client created this meeting
        if (meeting.clientCreator && meeting.clientCreator.toString() !== client._id.toString()) {
            return res.status(401).json({ msg: 'Not authorized to edit this meeting' });
        }

        // Format attendees
        const formattedAttendees = attendees.map(email => ({
            email,
            status: meeting.attendees.find(a => a.email === email)?.status || 'pending'
        }));

        // Update fields
        meeting.title = title || meeting.title;
        meeting.date = date || meeting.date;
        meeting.time = time || meeting.time;
        meeting.description = description !== undefined ? `(Scheduled by Client: ${client.name})\n${description}` : meeting.description;
        meeting.attendees = formattedAttendees;
        meeting.type = type || meeting.type;
        meeting.location = location || meeting.location;
        meeting.meetingLink = meetingLink || meeting.meetingLink;

        await meeting.save();

        // Notify all attendees about the meeting update
        const attendeeEmails = meeting.attendees.map(a => a.email);
        const attendeeUsers = await User.find({ email: { $in: attendeeEmails } });

        const { notifyUsers } = require('../utils/notificationHelper');
        await notifyUsers(
            attendeeUsers,
            'client_meeting_updated',
            `Meeting updated: "${meeting.title}" - New date/time: ${new Date(meeting.date).toLocaleDateString()} at ${meeting.time}`,
            {
                entityType: 'Meeting',
                entityId: meeting._id
            }
        );

        res.json(meeting);
    } catch (err) {
        console.error('Error updating meeting:', err);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Meeting not found' });
        }
        res.status(500).json({ msg: 'Server error' });
    }
});

// @route   DELETE /api/client-portal/:shareToken/meetings/:id
// @desc    Cancel a meeting
// @access  Public
router.delete('/:shareToken/meetings/:id', async (req, res) => {
    try {
        const client = await Client.findOne({ shareToken: req.params.shareToken });

        if (!client) {
            return res.status(404).json({ msg: 'Invalid client portal link' });
        }

        let meeting = await Meeting.findById(req.params.id);

        if (!meeting) {
            return res.status(404).json({ msg: 'Meeting not found' });
        }

        // Check if client created this meeting
        if (meeting.clientCreator && meeting.clientCreator.toString() !== client._id.toString()) {
            return res.status(401).json({ msg: 'Not authorized to cancel this meeting' });
        }

        // Soft delete: Update status to cancelled
        meeting.status = 'cancelled';
        await meeting.save();

        // Notify all attendees about the cancellation
        const attendeeEmails = meeting.attendees.map(a => a.email);
        const attendeeUsers = await User.find({ email: { $in: attendeeEmails } });

        const { notifyUsers } = require('../utils/notificationHelper');
        await notifyUsers(
            attendeeUsers,
            'client_meeting_cancelled',
            `Meeting cancelled: "${meeting.title}" scheduled for ${new Date(meeting.date).toLocaleDateString()}`,
            {
                entityType: 'Meeting',
                entityId: meeting._id
            }
        );

        res.json({ msg: 'Meeting cancelled' });
    } catch (err) {
        console.error('Error cancelling meeting:', err);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Meeting not found' });
        }
        res.status(500).json({ msg: 'Server error' });
    }
});

// @route   PUT /api/client-portal/:shareToken/meetings/:id/rsvp
// @desc    RSVP to a meeting (accept/decline)
// @access  Public
router.put('/:shareToken/meetings/:id/rsvp', async (req, res) => {
    try {
        const { status } = req.body; // 'accepted' or 'declined'

        const client = await Client.findOne({ shareToken: req.params.shareToken });

        if (!client) {
            return res.status(404).json({ msg: 'Invalid client portal link' });
        }

        const meeting = await Meeting.findById(req.params.id);
        if (!meeting) {
            return res.status(404).json({ msg: 'Meeting not found' });
        }

        // Find attendee in the list
        const attendeeIndex = meeting.attendees.findIndex(a => a.email === client.email);

        if (attendeeIndex === -1) {
            return res.status(400).json({ msg: 'You are not an attendee of this meeting' });
        }

        // Update status
        meeting.attendees[attendeeIndex].status = status;
        await meeting.save();

        // Notify meeting creator about RSVP
        const notificationType = status === 'accepted' ? 'client_meeting_rsvp_accepted' : 'client_meeting_rsvp_declined';
        const statusText = status === 'accepted' ? 'accepted' : 'declined';

        // Notify staff creator if meeting was created by staff
        try {
            if (meeting.createdBy && !meeting.clientCreator) {
                const Notification = require('../models/Notification');
                await new Notification({
                    recipient: meeting.createdBy,
                    type: notificationType,
                    message: `${client.name} ${statusText} the meeting: "${meeting.title}".`,
                    relatedEntity: {
                        entityType: 'Meeting',
                        entityId: meeting._id
                    }
                }).save();
            }
        } catch (notifErr) {
            console.error('Error notifying creator about RSVP:', notifErr.message);
        }

        // Notify client creator if meeting was created by another client
        try {
            if (meeting.clientCreator && meeting.clientCreator.toString() !== client._id.toString()) {
                const Notification = require('../models/Notification');
                await new Notification({
                    recipient: meeting.clientCreator,
                    type: notificationType,
                    message: `${client.name} ${statusText} your meeting: "${meeting.title}"`,
                    relatedEntity: {
                        entityType: 'Meeting',
                        entityId: meeting._id
                    }
                }).save();
            }
        } catch (notifErr) {
            console.error('Error notifying client creator about RSVP:', notifErr.message);
        }

        // Notify the client who responded (confirmation)
        try {
            const Notification = require('../models/Notification');
            await new Notification({
                recipient: client._id,
                type: notificationType,
                message: `You ${statusText} the meeting: "${meeting.title}"`,
                relatedEntity: {
                    entityType: 'Meeting',
                    entityId: meeting._id
                }
            }).save();
        } catch (notifErr) {
            console.error('Error sending RSVP confirmation notification:', notifErr.message);
        }

        res.json(meeting);
    } catch (err) {
        console.error('Error updating RSVP:', err);
        res.status(500).send('Server Error');
    }
});


// @route   GET /api/client-portal/:shareToken/complaints
// @desc    Get all complaints for the client
// @access  Public (with PIN verification via session)
router.get('/:shareToken/complaints', async (req, res) => {
    try {
        const client = await Client.findOne({ shareToken: req.params.shareToken });

        if (!client) {
            return res.status(404).json({ msg: 'Invalid client portal link' });
        }

        const complaints = await ClientComplaint.find({ client: client._id })
            .populate('case', 'caseTitle caseType')
            .sort({ createdAt: -1 });

        res.json(complaints);
    } catch (err) {
        console.error('Error fetching complaints:', err);
        res.status(500).json({ msg: 'Server error' });
    }
});

// @route   GET /api/client-portal/:shareToken/complaints/:complaintId
// @desc    Get single complaint with replies
// @access  Public (with PIN verification via session)
router.get('/:shareToken/complaints/:complaintId', async (req, res) => {
    try {
        const client = await Client.findOne({ shareToken: req.params.shareToken });

        if (!client) {
            return res.status(404).json({ msg: 'Invalid client portal link' });
        }

        const complaint = await ClientComplaint.findOne({
            _id: req.params.complaintId,
            client: client._id
        }).populate('case', 'caseTitle caseType');

        if (!complaint) {
            return res.status(404).json({ msg: 'Complaint not found' });
        }

        res.json(complaint);
    } catch (err) {
        console.error('Error fetching complaint:', err);
        res.status(500).json({ msg: 'Server error' });
    }
});

// @route   POST /api/client-portal/:shareToken/complaints/:complaintId/reply
// @desc    Add a reply to a complaint
// @access  Public (with PIN verification)
router.post('/:shareToken/complaints/:complaintId/reply', async (req, res) => {
    try {
        const { content } = req.body;

        const client = await Client.findOne({ shareToken: req.params.shareToken });

        if (!client) {
            return res.status(404).json({ msg: 'Invalid client portal link' });
        }

        const complaint = await ClientComplaint.findOne({
            _id: req.params.complaintId,
            client: client._id
        });

        if (!complaint) {
            return res.status(404).json({ msg: 'Complaint not found' });
        }

        complaint.replies.push({
            authorType: 'client',
            authorName: client.name,
            content,
            createdAt: new Date()
        });

        await complaint.save();

        // Notify client (confirmation) that their reply was sent
        try {
            const Notification = require('../models/Notification');
            await new Notification({
                recipient: client._id,
                type: 'client_complaint_reply',
                message: `Your reply to complaint "${complaint.subject}" has been sent`,
                relatedEntity: {
                    entityType: 'ClientComplaint',
                    entityId: complaint._id
                }
            }).save();
        } catch (notifErr) {
            console.error('Error notifying client about reply confirmation:', notifErr.message);
        }

        // Notify all staff (Admins, Managers, HOC) about client's reply
        try {
            const User = require('../models/User');
            const { notifyUsers } = require('../utils/notificationHelper');

            const staffUsers = await User.find({
                role: { $in: ['Admin', 'Manager', 'HOC'] }
            });

            await notifyUsers(
                staffUsers,
                'client_complaint_reply',
                `${client.name} replied to complaint: "${complaint.subject}"`,
                {
                    entityType: 'Client',
                    entityId: client._id
                }
            );
        } catch (notifErr) {
            console.error('Error notifying staff about client reply:', notifErr.message);
        }

        res.json({ msg: 'Reply added successfully', complaint });
    } catch (err) {
        console.error('Error adding reply:', err);
        res.status(500).json({ msg: 'Server error' });
    }
});

// @route   POST /api/client-portal/:shareToken/complaints
// @desc    Create a new complaint
// @access  Public (with PIN verification)
router.post('/:shareToken/complaints', async (req, res) => {
    try {
        const { subject, description, caseId } = req.body;

        const client = await Client.findOne({ shareToken: req.params.shareToken });

        if (!client) {
            return res.status(404).json({ msg: 'Invalid client portal link' });
        }

        const complaintData = {
            client: client._id,
            subject,
            description
        };

        // Add case reference if provided
        if (caseId) {
            complaintData.case = caseId;
        }

        const newComplaint = new ClientComplaint(complaintData);

        const savedComplaint = await newComplaint.save();

        // Notify the client
        await new Notification({
            recipient: client._id,
            type: 'client_complaint_created',
            message: `Your complaint "${subject}" has been submitted and is being reviewed`,
            relatedEntity: {
                entityType: 'ClientComplaint',
                entityId: savedComplaint._id
            }
        }).save();

        // Notify all staff (Admins, Managers, HOC)
        const staffUsers = await User.find({
            role: { $in: ['Admin', 'Manager', 'HOC'] }
        });

        const { notifyUsers } = require('../utils/notificationHelper');
        await notifyUsers(
            staffUsers,
            'client_complaint_created',
            `New complaint from ${client.name}: "${subject}"`,
            {
                entityType: 'Client',
                entityId: client._id
            }
        );

        res.json(savedComplaint);
    } catch (err) {
        console.error('Error creating complaint:', err);
        res.status(500).json({ msg: 'Server error' });
    }
});

// @route   POST /api/client-portal/:shareToken/meetings/generate-zoho-link
// @desc    Generate Zoho Meeting Link
// @access  Public (with PIN verification)
router.post('/:shareToken/meetings/generate-zoho-link', async (req, res) => {
    try {
        const { title, date, time, description, attendees } = req.body;

        const client = await Client.findOne({ shareToken: req.params.shareToken });

        if (!client) {
            return res.status(404).json({ msg: 'Invalid client portal link' });
        }

        if (!title || !date || !time) {
            return res.status(400).json({ msg: 'Title, Date, and Time are required' });
        }

        // Add client to attendees for the link generation context if needed
        const meetingAttendees = [...new Set([...(attendees || []), client.email])];

        const link = await zohoService.createMeeting({
            title,
            date,
            time,
            description: `(Scheduled by Client: ${client.name})\n${description || ''}`,
            attendees: meetingAttendees
        });

        res.json({ link });
    } catch (err) {
        console.error('Error generating Zoho link:', err);
        res.status(500).json({ msg: 'Server Error: ' + err.message });
    }
});

// @route   GET /api/client-portal/:shareToken/attendees
// @desc    Get eligible attendees for meetings (HOC, Managers, Lawyers)
// @access  Public (with PIN verification via session - implicitly allowed if they have the link)
router.get('/:shareToken/attendees', async (req, res) => {
    try {
        const client = await Client.findOne({ shareToken: req.params.shareToken });

        if (!client) {
            return res.status(404).json({ msg: 'Invalid client portal link' });
        }

        // Fetch eligible attendees: HOC, Managers, Lawyers, and Admins
        const attendees = await User.find({
            role: { $in: ['HOC', 'Manager', 'Lawyer', 'Admin'] }
        }).select('name email role');

        res.json(attendees);
    } catch (err) {
        console.error('Error fetching attendees:', err);
        res.status(500).json({ msg: 'Server error' });
    }
});

// @route   GET /api/client-portal/:shareToken/notifications
// @desc    Get all notifications for the client
// @access  Public
router.get('/:shareToken/notifications', async (req, res) => {
    try {
        const { date } = req.query;
        const client = await Client.findOne({ shareToken: req.params.shareToken });

        if (!client) {
            return res.status(404).json({ msg: 'Invalid client portal link' });
        }

        let query = { recipient: client._id };

        if (date) {
            const startDate = new Date(date);
            startDate.setHours(0, 0, 0, 0);
            const endDate = new Date(date);
            endDate.setHours(23, 59, 59, 999);
            query.createdAt = { $gte: startDate, $lte: endDate };
        }

        const notifications = await Notification.find(query)
            .sort({ createdAt: -1 })
            .limit(100);

        res.json(notifications);
    } catch (err) {
        console.error('Error fetching notifications:', err);
        res.status(500).json({ msg: 'Server error' });
    }
});

// @route   GET /api/client-portal/:shareToken/notifications/unread-dates
// @desc    Get list of dates with unread notifications for the client
// @access  Public
router.get('/:shareToken/notifications/unread-dates', async (req, res) => {
    try {
        const client = await Client.findOne({ shareToken: req.params.shareToken });

        if (!client) {
            return res.status(404).json({ msg: 'Invalid client portal link' });
        }

        const unreadNotifications = await Notification.find({
            recipient: client._id,
            read: false
        }).select('createdAt').sort({ createdAt: -1 });

        // Extract unique dates (YYYY-MM-DD format)
        const dates = [...new Set(
            unreadNotifications.map(notif => {
                const date = new Date(notif.createdAt);
                return date.toISOString().split('T')[0];
            })
        )];

        res.json({ dates });
    } catch (err) {
        console.error('Error fetching unread dates:', err);
        res.status(500).json({ msg: 'Server error' });
    }
});

// @route   GET /api/client-portal/:shareToken/notifications/unread-count
// @desc    Get unread notification count for the client
// @access  Public
router.get('/:shareToken/notifications/unread-count', async (req, res) => {
    try {
        const client = await Client.findOne({ shareToken: req.params.shareToken });

        if (!client) {
            return res.status(404).json({ msg: 'Invalid client portal link' });
        }

        const count = await Notification.countDocuments({
            recipient: client._id,
            read: false
        });

        res.json({ count });
    } catch (err) {
        console.error('Error fetching unread count:', err);
        res.status(500).json({ msg: 'Server error' });
    }
});

// @route   PUT /api/client-portal/:shareToken/notifications/:id/read
// @desc    Mark notification as read
// @access  Public
router.put('/:shareToken/notifications/:id/read', async (req, res) => {
    try {
        const client = await Client.findOne({ shareToken: req.params.shareToken });

        if (!client) {
            return res.status(404).json({ msg: 'Invalid client portal link' });
        }

        const notification = await Notification.findById(req.params.id);

        if (!notification) {
            return res.status(404).json({ msg: 'Notification not found' });
        }

        // Verify notification belongs to this client
        if (notification.recipient.toString() !== client._id.toString()) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        notification.read = true;
        await notification.save();

        res.json(notification);
    } catch (err) {
        console.error('Error marking notification as read:', err);
        res.status(500).json({ msg: 'Server error' });
    }
});

// @route   PUT /api/client-portal/:shareToken/notifications/read-all
// @desc    Mark all notifications as read for the client
// @access  Public
router.put('/:shareToken/notifications/read-all', async (req, res) => {
    try {
        const client = await Client.findOne({ shareToken: req.params.shareToken });

        if (!client) {
            return res.status(404).json({ msg: 'Invalid client portal link' });
        }

        await Notification.updateMany(
            { recipient: client._id, read: false },
            { $set: { read: true } }
        );

        res.json({ msg: 'All notifications marked as read' });
    } catch (err) {
        console.error('Error marking all as read:', err);
        res.status(500).json({ msg: 'Server error' });
    }
});

module.exports = router;
