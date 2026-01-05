const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Client = require('../models/Client');
const User = require('../models/User');
const Notification = require('../models/Notification');
const mongoose = require('mongoose');
const { notifyAdmins } = require('../utils/notificationHelper');

// @route   POST /api/clients
// @desc    Create a new client (Admin Officer only)
// @access  Private
router.post('/', auth, async (req, res) => {
    try {
        // Check if user is Admin Officer
        if (req.user.role !== 'Admin') {
            return res.status(403).json({ msg: 'Access denied. Admin Officer only.' });
        }

        // Extract all possible fields from request body
        const clientData = {
            ...req.body,
            addedBy: req.user.id
        };

        // Create new client
        const client = new Client(clientData);
        await client.save();

        // Send notifications to all Managers and HOC
        const managersAndHOC = await User.find({
            role: { $in: ['Manager', 'HOC'] }
        });

        const { notifyUsers } = require('../utils/notificationHelper');
        await notifyUsers(
            managersAndHOC,
            'client_added',
            `New ${clientData.clientType} client "${clientData.name}" has been added by Admin Officer`,
            {
                entityType: 'Client',
                entityId: client._id
            }
        );

        // Notify admins about new client
        await notifyAdmins(
            'client_added',
            `New ${clientData.clientType} client "${clientData.name}" has been added`,
            {
                entityType: 'Client',
                entityId: client._id
            }
        );

        res.json({
            msg: 'Client created successfully',
            client
        });

    } catch (err) {
        console.error('Error creating client:', err);
        res.status(500).json({
            msg: 'Server Error',
            error: err.message
        });
    }
});

// @route   GET /api/clients
// @desc    Get all clients with auto-calculated status (role-based filtering)
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        const Case = require('../models/Case');

        // Use aggregation to calculate status based on cases
        const clients = await Client.aggregate([
            {
                $lookup: {
                    from: 'cases', // MongoDB collection name (lowercase, pluralized)
                    localField: '_id',
                    foreignField: 'client',
                    as: 'cases'
                }
            },
            {
                $addFields: {
                    status: {
                        $cond: {
                            if: {
                                $gt: [
                                    {
                                        $size: {
                                            $filter: {
                                                input: '$cases',
                                                as: 'case',
                                                cond: { $eq: ['$$case.status', 'Open'] }
                                            }
                                        }
                                    },
                                    0
                                ]
                            },
                            then: 'Active',
                            else: 'Inactive'
                        }
                    }
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'addedBy',
                    foreignField: '_id',
                    as: 'addedByUser'
                }
            },
            {
                $unwind: {
                    path: '$addedByUser',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $addFields: {
                    addedBy: {
                        _id: '$addedByUser._id',
                        name: '$addedByUser.name',
                        email: '$addedByUser.email'
                    }
                }
            },
            {
                $project: {
                    cases: 0, // Don't send all cases in the response
                    addedByUser: 0
                }
            },
            {
                $sort: { createdAt: -1 }
            }
        ]);

        res.json(clients);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/clients/:id
// @desc    Get client by ID with auto-calculated status
// @access  Private
router.get('/:id', auth, async (req, res) => {
    try {
        const Case = require('../models/Case');

        const clients = await Client.aggregate([
            {
                $match: { _id: new mongoose.Types.ObjectId(req.params.id) }
            },
            {
                $lookup: {
                    from: 'cases',
                    localField: '_id',
                    foreignField: 'client',
                    as: 'cases'
                }
            },
            {
                $addFields: {
                    status: {
                        $cond: {
                            if: {
                                $gt: [
                                    {
                                        $size: {
                                            $filter: {
                                                input: '$cases',
                                                as: 'case',
                                                cond: { $eq: ['$$case.status', 'Open'] }
                                            }
                                        }
                                    },
                                    0
                                ]
                            },
                            then: 'Active',
                            else: 'Inactive'
                        }
                    }
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'addedBy',
                    foreignField: '_id',
                    as: 'addedByUser'
                }
            },
            {
                $unwind: {
                    path: '$addedByUser',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $addFields: {
                    addedBy: {
                        _id: '$addedByUser._id',
                        name: '$addedByUser.name',
                        email: '$addedByUser.email'
                    }
                }
            },
            {
                $project: {
                    'cases.client': 0,
                    'cases.summary': 0,
                    'cases.clientObjective': 0,
                    'cases.assignedTo': 0,
                    'cases.assignedLawyers': 0,
                    'cases.courtInfo': 0,
                    'cases.opposingCounselHistory': 0,
                    addedByUser: 0
                }
            }
        ]);

        if (!clients || clients.length === 0) {
            return res.status(404).json({ msg: 'Client not found' });
        }

        res.json(clients[0]);

    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Client not found' });
        }
        res.status(500).send('Server Error');
    }
});

// @route   PUT /api/clients/:id
// @desc    Update client details (status is auto-calculated, cannot be manually updated)
// @access  Private
router.put('/:id', auth, async (req, res) => {
    try {
        let client = await Client.findById(req.params.id);

        if (!client) {
            return res.status(404).json({ msg: 'Client not found' });
        }

        // Update fields (status is NOT included - it's auto-calculated)
        const {
            name, email, phone, address,
            gender, dateOfBirth, nationality, occupation,
            companyName, rcNumber, contactPerson,
            agencyName, agencyType, ministry,
            emergencyContact, primaryContact, secondaryContact
        } = req.body;

        // Build client object based on type (or just update fields present in body)
        // For simplicity, we can update the fields that are passed
        if (name) client.name = name;
        if (email) client.email = email;
        if (phone) client.phone = phone;
        if (address) client.address = address;

        // Individual specific
        if (gender) client.gender = gender;
        if (dateOfBirth) client.dateOfBirth = dateOfBirth;
        if (nationality) client.nationality = nationality;
        if (occupation) client.occupation = occupation;
        if (emergencyContact) client.emergencyContact = emergencyContact;

        // Corporate specific
        if (companyName) client.name = companyName; // Map companyName to name
        if (rcNumber) client.rcNumber = rcNumber;
        if (contactPerson) client.contactPerson = contactPerson;

        // Government specific
        if (agencyName) client.name = agencyName; // Map agencyName to name
        if (agencyType) client.agencyType = agencyType;
        if (ministry) client.ministry = ministry;

        // Contacts
        if (primaryContact) client.primaryContact = primaryContact;
        if (secondaryContact) client.secondaryContact = secondaryContact;

        // NOTE: Status is not updated here - it's automatically calculated based on cases

        await client.save();

        res.json(client);

    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Client not found' });
        }
        res.status(500).send('Server Error');
    }
});

// @route   DELETE /api/clients/:id
// @desc    Delete a client (Admin Officer only)
// @access  Private
router.delete('/:id', auth, async (req, res) => {
    try {
        // Check if user is Admin Officer
        if (req.user.role !== 'Admin') {
            return res.status(403).json({ msg: 'Access denied. Admin Officer only.' });
        }

        const client = await Client.findById(req.params.id);

        if (!client) {
            return res.status(404).json({ msg: 'Client not found' });
        }

        await Client.findByIdAndDelete(req.params.id);

        res.json({ msg: 'Client removed' });

    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Client not found' });
        }
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/clients/:id/generate-portal-link
// @desc    Generate or regenerate client portal link
// @access  Private
router.post('/:id/generate-portal-link', auth, async (req, res) => {
    try {
        const crypto = require('crypto');

        const client = await Client.findById(req.params.id);

        if (!client) {
            return res.status(404).json({ msg: 'Client not found' });
        }

        // Generate new shareToken
        client.shareToken = crypto.randomUUID();
        await client.save();

        res.json({
            msg: 'Portal link generated successfully',
            shareToken: client.shareToken,
            portalUrl: `${process.env.CLIENT_URL || 'http://localhost:3000'}/client-portal/${client.shareToken}`
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/clients/:id/reset-pin
// @desc    Reset client portal PIN (forces client to set up PIN again)
// @access  Private
router.post('/:id/reset-pin', auth, async (req, res) => {
    try {
        const client = await Client.findById(req.params.id);

        if (!client) {
            return res.status(404).json({ msg: 'Client not found' });
        }

        // Reset PIN fields
        client.clientAccessPin = null;
        client.pinSetupCompleted = false;
        await client.save();

        res.json({ msg: 'PIN reset successfully. Client will need to set up a new PIN.' });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
