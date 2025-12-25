const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Meeting = require('../models/Meeting');
const Notification = require('../models/Notification');
const User = require('../models/User');
const zohoService = require('../services/zohoService');

// @route   GET /api/meetings
// @desc    Get all meetings (filtered by user role/attendance)
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        const currentUser = await User.findById(req.user.id);

        if (!currentUser) {
            return res.status(404).json({ msg: 'User not found' });
        }

        let query = {};

        // If not Superadmin, only show meetings created by user or where user is an attendee
        if (currentUser.role !== 'Superadmin') {
            query = {
                $or: [
                    { createdBy: req.user.id },
                    { 'attendees.email': currentUser.email }
                ]
            };
        }

        const meetings = await Meeting.find(query)
            .populate('createdBy', 'name email')
            .sort({ date: 1, time: 1 }); // Sort by date ascending
        res.json(meetings);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/meetings
// @desc    Create a new meeting
// @access  Private
router.post('/', auth, async (req, res) => {
    try {
        const { title, date, time, description, attendees, type, location, meetingLink, platform } = req.body;

        // Format attendees to object structure
        const formattedAttendees = attendees.map(email => ({
            email,
            status: 'pending'
        }));

        const newMeeting = new Meeting({
            title,
            date,
            time,
            description,
            attendees: formattedAttendees,
            type,
            location,
            meetingLink,
            platform,
            createdBy: req.user.id
        });

        const meeting = await newMeeting.save();

        // Get creator name for notifications
        const creator = await User.findById(req.user.id).select('name');

        // Notify Creator
        await new Notification({
            recipient: req.user.id,
            type: 'meeting_created',
            message: `You scheduled a new meeting: "${title}" on ${new Date(date).toLocaleDateString()}.`,
            relatedEntity: {
                entityType: 'Meeting',
                entityId: meeting._id
            }
        }).save();

        // Notify Attendees (both staff and clients)
        if (attendees && attendees.length > 0) {
            // Find staff user IDs for the attendee emails
            const attendeeUsers = await User.find({ email: { $in: attendees } });

            const userNotifications = attendeeUsers.map(user => ({
                recipient: user._id,
                type: 'meeting_created',
                message: `${creator.name} scheduled a new meeting: "${title}" on ${new Date(date).toLocaleDateString()}.`,
                relatedEntity: {
                    entityType: 'Meeting',
                    entityId: meeting._id
                }
            }));

            if (userNotifications.length > 0) {
                await Notification.insertMany(userNotifications);
            }

            // Find client IDs for the attendee emails
            const Client = require('../models/Client');
            const attendeeClients = await Client.find({ email: { $in: attendees } });

            const clientNotifications = attendeeClients.map(client => ({
                recipient: client._id,
                type: 'client_meeting_created',
                message: `${creator.name} scheduled a new meeting: "${title}" on ${new Date(date).toLocaleDateString()}.`,
                relatedEntity: {
                    entityType: 'Meeting',
                    entityId: meeting._id
                }
            }));

            if (clientNotifications.length > 0) {
                await Notification.insertMany(clientNotifications);
            }
        }

        res.json(meeting);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT /api/meetings/:id
// @desc    Update a meeting
// @access  Private
router.put('/:id', auth, async (req, res) => {
    try {
        const { title, date, time, description, attendees, type, location, meetingLink, platform } = req.body;

        let meeting = await Meeting.findById(req.params.id);

        if (!meeting) {
            return res.status(404).json({ msg: 'Meeting not found' });
        }

        // Check user authorization (only creator can edit)
        if (meeting.createdBy.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'User not authorized' });
        }

        // Format attendees if provided
        let formattedAttendees = meeting.attendees;
        if (attendees) {
            // Preserve status for existing attendees if they are still in the list
            formattedAttendees = attendees.map(email => {
                const existing = meeting.attendees.find(a => a.email === email);
                return {
                    email,
                    status: existing ? existing.status : 'pending'
                };
            });
        }

        // Update fields
        meeting.title = title || meeting.title;
        meeting.date = date || meeting.date;
        meeting.time = time || meeting.time;
        meeting.description = description || meeting.description;
        meeting.attendees = formattedAttendees;
        meeting.type = type || meeting.type;
        meeting.location = location || meeting.location;
        meeting.meetingLink = meetingLink || meeting.meetingLink;
        meeting.platform = platform || meeting.platform;

        await meeting.save();

        // Get user name for notifications
        const user = await User.findById(req.user.id).select('name');

        // Notify Creator (staff)
        try {
            if (meeting.createdBy) {
                await new Notification({
                    recipient: meeting.createdBy,
                    type: 'meeting_updated',
                    message: `${user.name} updated meeting: "${meeting.title}". New date/time: ${new Date(meeting.date).toLocaleDateString()} at ${meeting.time}.`,
                    relatedEntity: {
                        entityType: 'Meeting',
                        entityId: meeting._id
                    }
                }).save();
            }
        } catch (notifErr) {
            console.error('Error notifying staff creator about update:', notifErr.message);
        }

        // Notify Client Creator (if meeting was created by client)
        try {
            if (meeting.clientCreator) {
                await new Notification({
                    recipient: meeting.clientCreator,
                    type: 'client_meeting_updated',
                    message: `Your meeting "${meeting.title}" has been updated. New date/time: ${new Date(meeting.date).toLocaleDateString()} at ${meeting.time}.`,
                    relatedEntity: {
                        entityType: 'Meeting',
                        entityId: meeting._id
                    }
                }).save();
            }
        } catch (notifErr) {
            console.error('Error notifying client creator about update:', notifErr.message);
        }

        // Notify Attendees about the update
        if (meeting.attendees && meeting.attendees.length > 0) {
            const attendeeEmails = meeting.attendees.map(a => a.email);
            const users = await User.find({ email: { $in: attendeeEmails } });
            const notifications = users.map(u => ({
                recipient: u._id,
                type: 'meeting_updated',
                message: `${user.name} updated meeting: "${meeting.title}". New date/time: ${new Date(meeting.date).toLocaleDateString()} at ${meeting.time}.`,
                relatedEntity: {
                    entityType: 'Meeting',
                    entityId: meeting._id
                }
            }));
            if (notifications.length > 0) {
                await Notification.insertMany(notifications);
            }
        }

        res.json(meeting);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Meeting not found' });
        }
        res.status(500).send('Server Error');
    }
});

// @route   PUT /api/meetings/:id/rsvp
// @desc    RSVP to a meeting
// @access  Private
router.put('/:id/rsvp', auth, async (req, res) => {
    try {
        const { status } = req.body; // 'accepted' or 'declined'
        const currentUser = await User.findById(req.user.id);

        if (!currentUser) {
            return res.status(404).json({ msg: 'User not found' });
        }

        const meeting = await Meeting.findById(req.params.id);
        if (!meeting) {
            return res.status(404).json({ msg: 'Meeting not found' });
        }

        // Find attendee in the list
        const attendeeIndex = meeting.attendees.findIndex(a => a.email === currentUser.email);

        if (attendeeIndex === -1) {
            return res.status(400).json({ msg: 'You are not an attendee of this meeting' });
        }

        // Update status
        meeting.attendees[attendeeIndex].status = status;
        await meeting.save();

        // Notify meeting creator about RSVP
        const notificationType = status === 'accepted' ? 'meeting_rsvp_accepted' : 'meeting_rsvp_declined';
        const clientNotificationType = status === 'accepted' ? 'client_meeting_rsvp_accepted' : 'client_meeting_rsvp_declined';
        const statusText = status === 'accepted' ? 'accepted' : 'declined';

        // Notify user creator ONLY if meeting was created by staff (not client)
        try {
            if (meeting.createdBy && !meeting.clientCreator) {
                await new Notification({
                    recipient: meeting.createdBy,
                    type: notificationType,
                    message: `${currentUser.name} ${statusText} the meeting: "${meeting.title}".`,
                    relatedEntity: {
                        entityType: 'Meeting',
                        entityId: meeting._id
                    }
                }).save();
            }
        } catch (notifErr) {
            console.error('Error notifying user creator about RSVP:', notifErr.message);
        }

        // Notify client creator (if meeting was created by client)
        try {
            if (meeting.clientCreator) {
                await new Notification({
                    recipient: meeting.clientCreator,
                    type: clientNotificationType,
                    message: `${currentUser.name} ${statusText} your meeting: "${meeting.title}"`,
                    relatedEntity: {
                        entityType: 'Meeting',
                        entityId: meeting._id
                    }
                }).save();
            }
        } catch (notifErr) {
            console.error('Error notifying client creator about RSVP:', notifErr.message);
        }

        // Notify the person who responded (confirmation)
        try {
            await new Notification({
                recipient: currentUser._id,
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
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE /api/meetings/:id
// @desc    Soft Delete a meeting (Cancel)
// @access  Private
router.delete('/:id', auth, async (req, res) => {
    try {
        let meeting = await Meeting.findById(req.params.id);

        if (!meeting) {
            return res.status(404).json({ msg: 'Meeting not found' });
        }

        // Check user authorization (only creator can cancel)
        if (meeting.createdBy.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'User not authorized' });
        }

        // Soft delete: Update status to cancelled
        meeting.status = 'cancelled';
        await meeting.save();

        // Get user name for notifications
        const user = await User.findById(req.user.id).select('name');

        // Notify Creator (staff)
        try {
            await new Notification({
                recipient: req.user.id,
                type: 'meeting_cancelled',
                message: `You cancelled meeting: "${meeting.title}".`,
                relatedEntity: {
                    entityType: 'Meeting',
                    entityId: meeting._id
                }
            }).save();
        } catch (notifErr) {
            console.error('Error notifying staff creator about cancellation:', notifErr.message);
        }

        // Notify Client Creator (if meeting was created by client)
        try {
            if (meeting.clientCreator) {
                await new Notification({
                    recipient: meeting.clientCreator,
                    type: 'client_meeting_cancelled',
                    message: `Your meeting "${meeting.title}" has been cancelled`,
                    relatedEntity: {
                        entityType: 'Meeting',
                        entityId: meeting._id
                    }
                }).save();
            }
        } catch (notifErr) {
            console.error('Error notifying client creator about cancellation:', notifErr.message);
        }

        // Notify Attendees (staff)
        if (meeting.attendees && meeting.attendees.length > 0) {
            const attendeeEmails = meeting.attendees.map(a => a.email);
            const users = await User.find({ email: { $in: attendeeEmails } });
            const notifications = users.map(u => ({
                recipient: u._id,
                type: 'meeting_cancelled',
                message: `${user.name} cancelled meeting: "${meeting.title}" scheduled for ${new Date(meeting.date).toLocaleDateString()}.`,
                relatedEntity: {
                    entityType: 'Meeting',
                    entityId: meeting._id
                }
            }));
            if (notifications.length > 0) {
                await Notification.insertMany(notifications);
            }

            // Notify client attendees
            const Client = require('../models/Client');
            const attendeeClients = await Client.find({ email: { $in: attendeeEmails } });
            const clientNotifications = attendeeClients.map(client => ({
                recipient: client._id,
                type: 'client_meeting_cancelled',
                message: `${user.name} cancelled meeting: "${meeting.title}" scheduled for ${new Date(meeting.date).toLocaleDateString()}.`,
                relatedEntity: {
                    entityType: 'Meeting',
                    entityId: meeting._id
                }
            }));
            if (clientNotifications.length > 0) {
                await Notification.insertMany(clientNotifications);
            }
        }

        res.json({ msg: 'Meeting cancelled' });
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Meeting not found' });
        }
        res.status(500).send('Server Error');
    }
});

// Generate Zoho Meeting Link
router.post('/generate-zoho-link', auth, async (req, res) => {
    try {
        const { title, date, time, description, attendees } = req.body;

        if (!title || !date || !time) {
            return res.status(400).json({ msg: 'Title, Date, and Time are required' });
        }

        const link = await zohoService.createMeeting({ title, date, time, description, attendees });
        res.json({ link });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server Error: ' + err.message });
    }
});

module.exports = router;
