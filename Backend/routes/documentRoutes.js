const express = require('express');
const router = express.Router();
const multer = require('multer');
const auth = require('../middleware/auth');
const Document = require('../models/Document');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { uploadFile, deleteFile } = require('../utils/supabase');

// Configure multer for memory storage (we'll upload to Supabase directly)
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|ppt|pptx|xls|xlsx|zip|mp3|mp4/;
        const extname = allowedTypes.test(file.originalname.toLowerCase().split('.').pop());

        if (extname) {
            return cb(null, true);
        } else {
            cb(new Error('Error: File type not supported! Allowed: pdf, docs, images, audio, video'));
        }
    }
});

// @route   POST /api/documents/upload
// @desc    Upload a new document to Supabase Storage
// @access  Private
router.post('/upload', auth, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ msg: 'No file uploaded' });
        }

        const { name, caseId, folder } = req.body;

        // Upload to Supabase Storage
        const { url, path } = await uploadFile(
            req.file.buffer,
            req.file.originalname,
            req.file.mimetype
        );

        // Determine file type from extension
        const fileExtension = req.file.originalname.split('.').pop().toLowerCase();

        // Save document metadata to MongoDB
        const newDocument = new Document({
            name: name || req.file.originalname,
            url: url,
            publicId: path, // Store Supabase path in publicId field
            type: fileExtension, // Use extension for type
            size: req.file.size,
            uploadedBy: req.user.id,
            case: caseId || null,
            folder: folder || 'root'
        });

        const savedDocument = await newDocument.save();

        // Create notification for uploader
        const newNotification = new Notification({
            recipient: req.user.id,
            message: `You just uploaded a ${fileExtension.toUpperCase()} file - ${savedDocument.name}`,
            type: 'document_upload',
            relatedEntity: {
                entityType: 'Document',
                entityId: savedDocument._id
            }
        });
        await newNotification.save();

        res.json(savedDocument);

    } catch (err) {
        console.error('Upload error:', err.message);
        res.status(500).json({ msg: 'Upload failed', error: err.message });
    }
});

// @route   GET /api/documents/:id/download
// @desc    Download a document (redirect to Supabase URL)
// @access  Private
router.get('/:id/download', auth, async (req, res) => {
    try {
        const document = await Document.findById(req.params.id);

        if (!document) {
            return res.status(404).json({ msg: 'Document not found' });
        }

        // Check authorization
        const isOwner = document.uploadedBy.toString() === req.user.id;
        const isShared = document.sharedWith.includes(req.user.id);

        if (!isOwner && !isShared) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        // Redirect to Supabase public URL
        return res.redirect(document.url);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/documents
// @desc    Get all documents accessible to user
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        const documents = await Document.find({
            $or: [
                { uploadedBy: req.user.id },
                { sharedWith: req.user.id }
            ]
        })
            .populate('uploadedBy', 'name email')
            .populate('sharedWith', 'name email')
            .populate('case', 'caseTitle')
            .sort({ createdAt: -1 });

        res.json(documents);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT /api/documents/:id/share
// @desc    Share document with users
// @access  Private
router.put('/:id/share', auth, async (req, res) => {
    try {
        const { userIds } = req.body;
        let document = await Document.findById(req.params.id);

        if (!document) {
            return res.status(404).json({ msg: 'Document not found' });
        }

        if (document.uploadedBy.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        const sender = await User.findById(req.user.id).select('name');
        const newShares = [];

        userIds.forEach(userId => {
            if (!document.sharedWith.includes(userId)) {
                document.sharedWith.push(userId);
                newShares.push(userId);
            }
        });

        await document.save();

        // Create notifications
        // 1. For the sender
        if (newShares.length > 0) {
            const recipients = await User.find({ _id: { $in: newShares } }).select('name');
            const recipientNames = recipients.map(u => u.name).join(', ');

            await new Notification({
                recipient: req.user.id,
                message: `You just shared a ${document.type.toUpperCase()} - ${document.name} with ${recipientNames}`,
                type: 'document_share',
                relatedEntity: {
                    entityType: 'Document',
                    entityId: document._id
                }
            }).save();

            // 2. For the recipients
            const recipientUsers = await User.find({ _id: { $in: newShares } });
            const { notifyUsers } = require('../utils/notificationHelper');

            await notifyUsers(
                recipientUsers,
                'document_share',
                `${sender.name} just shared a ${document.type.toUpperCase()} - ${document.name} with you`,
                {
                    entityType: 'Document',
                    entityId: document._id
                }
            );
        }

        document = await Document.findById(req.params.id)
            .populate('uploadedBy', 'name email')
            .populate('sharedWith', 'name email');

        res.json(document);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT /api/documents/:id/unshare
// @desc    Unshare document with a user
// @access  Private
router.put('/:id/unshare', auth, async (req, res) => {
    try {
        const { userId } = req.body;
        let document = await Document.findById(req.params.id);

        if (!document) {
            return res.status(404).json({ msg: 'Document not found' });
        }

        if (document.uploadedBy.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        // Remove user from sharedWith array
        document.sharedWith = document.sharedWith.filter(id => id.toString() !== userId);
        await document.save();

        // Create notification for the unshared user
        const sender = await User.findById(req.user.id).select('name');
        const unsharedUser = await User.findById(userId).select('name');

        await new Notification({
            recipient: userId,
            message: `${sender.name} has stopped sharing the ${document.type.toUpperCase()} - ${document.name} with you`,
            type: 'document_unshare',
            relatedEntity: {
                entityType: 'Document',
                entityId: document._id
            }
        }).save();

        // Create notification for the sender (unsharer)
        await new Notification({
            recipient: req.user.id,
            message: `You just unshared a ${document.type.toUpperCase()} - ${document.name} with ${unsharedUser.name}`,
            type: 'document_unshare',
            relatedEntity: {
                entityType: 'Document',
                entityId: document._id
            }
        }).save();

        document = await Document.findById(req.params.id)
            .populate('uploadedBy', 'name email')
            .populate('sharedWith', 'name email');

        res.json(document);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE /api/documents/:id
// @desc    Delete document from Supabase and database
// @access  Private
router.delete('/:id', auth, async (req, res) => {
    try {
        const document = await Document.findById(req.params.id);

        if (!document) {
            return res.status(404).json({ msg: 'Document not found' });
        }

        if (document.uploadedBy.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        // Delete from Supabase Storage
        await deleteFile(document.publicId);

        // Delete from database
        await Document.findByIdAndDelete(req.params.id);

        res.json({ msg: 'Document deleted' });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT /api/documents/:id/link-to-case
// @desc    Link a document to a case
// @access  Private
router.put('/:id/link-to-case', auth, async (req, res) => {
    try {
        const { caseId } = req.body;
        const document = await Document.findById(req.params.id);

        if (!document) {
            return res.status(404).json({ msg: 'Document not found' });
        }

        // Check if user owns the document or it's shared with them
        const isOwner = document.uploadedBy.toString() === req.user.id;
        const isShared = document.sharedWith.includes(req.user.id);

        if (!isOwner && !isShared) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        // Update the case field
        document.case = caseId;
        await document.save();

        // Notify all case stakeholders about document addition
        const Case = require('../models/Case');
        const User = require('../models/User');
        const { notifyCaseStakeholders } = require('../utils/notificationHelper');

        const caseDoc = await Case.findById(caseId);
        const user = await User.findById(req.user.id);
        const userName = user?.name || 'Someone';

        if (caseDoc) {
            await notifyCaseStakeholders(
                caseId,
                'document_added_to_case',
                `${userName} added document "${document.name}" to case "${caseDoc.caseTitle}" library`
            );
        }

        const updatedDoc = await Document.findById(req.params.id)
            .populate('uploadedBy', 'name email')
            .populate('sharedWith', 'name email')
            .populate('case', 'caseTitle');

        res.json(updatedDoc);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT /api/documents/:id/unlink-from-case
// @desc    Remove a document from a case
// @access  Private
router.put('/:id/unlink-from-case', auth, async (req, res) => {
    try {
        const document = await Document.findById(req.params.id).populate('case');

        if (!document) {
            return res.status(404).json({ msg: 'Document not found' });
        }

        // Check if user owns the document
        if (document.uploadedBy.toString() !== req.user.id) {
            return res.status(403).json({ msg: 'Not authorized to unlink this document' });
        }

        const caseTitle = document.case?.caseTitle || 'a case';

        document.case = null;
        await document.save();

        // Create notification for document removal from case
        const notification = new Notification({
            recipient: req.user.id,
            type: 'general',
            message: `Document "${document.name}" was removed from ${caseTitle} library`,
            relatedEntity: {
                entityType: 'Document',
                entityId: document._id
            }
        });
        await notification.save();

        const updatedDoc = await Document.findById(req.params.id)
            .populate('uploadedBy', 'name email')
            .populate('sharedWith', 'name email');

        res.json(updatedDoc);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   GET /api/documents/case/:caseId
// @desc    Get all documents for a specific case
// @access  Private
router.get('/case/:caseId', auth, async (req, res) => {
    try {
        const documents = await Document.find({ case: req.params.caseId })
            .populate('uploadedBy', 'name email')
            .populate('sharedWith', 'name email')
            .sort({ createdAt: -1 });

        res.json(documents);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
