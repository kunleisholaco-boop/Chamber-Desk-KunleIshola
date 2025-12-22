const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');
const User = require('../models/User');
const { notifySuperAdmins } = require('../utils/notificationHelper');

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Check for user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }

        // Validate password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }

        // Create token
        const payload = {
            user: {
                id: user.id,
                role: user.role
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET || 'secret', // Fallback for dev
            { expiresIn: '1d' },
            (err, token) => {
                if (err) throw err;
                res.json({
                    token,
                    user: {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        role: user.role
                    }
                });
            }
        );
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/auth/users
// @desc    Get all users (Superadmin and Admin Officer)
// @access  Private (Superadmin, Admin Officer)
router.get('/users', auth, async (req, res) => {
    try {
        // Check if user making request has an allowed role
        const allowedRoles = ['Superadmin', 'Admin Officer', 'Admin'];
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ msg: 'Access denied. Insufficient role.' });
        }

        const users = await User.find().select('-password');
        res.json(users);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;

// Updated to allow Admin Officer access



// @route   POST /api/auth/create-user
// @desc    Create a new user (Superadmin only)
// @access  Private (Superadmin)
router.post('/create-user', auth, async (req, res) => {
    const { name, email, password, role } = req.body;

    try {
        // Check if user making request is Superadmin
        // Note: In a real app, you might want a separate role middleware
        if (req.user.role !== 'Superadmin') {
            return res.status(403).json({ msg: 'Access denied. Superadmin only.' });
        }

        // Check if user already exists
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ msg: 'User already exists' });
        }

        user = new User({
            name,
            email,
            password,
            role
        });

        // Encrypt password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        await user.save();

        // Notify all Superadmins about new user creation
        await notifySuperAdmins(
            'user_created',
            `New user created: ${name} (${role})`,
            {
                entityType: 'User',
                entityId: user._id
            }
        );

        res.json({ msg: 'User created successfully', user: { id: user.id, name: user.name, email: user.email, role: user.role } });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT /api/auth/users/:id
// @desc    Update user details (Superadmin only)
// @access  Private (Superadmin)
router.put('/users/:id', auth, async (req, res) => {
    const { name, email, role } = req.body;

    try {
        if (req.user.role !== 'Superadmin') {
            return res.status(403).json({ msg: 'Access denied. Superadmin only.' });
        }

        let user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // Track what changed for notifications
        const changes = [];
        const oldName = user.name;
        const oldEmail = user.email;
        const oldRole = user.role;

        // Update fields
        if (name && name !== oldName) {
            user.name = name;
            changes.push({ type: 'user_name_changed', message: `User name changed from "${oldName}" to "${name}"` });
        }
        if (email && email !== oldEmail) {
            user.email = email;
            changes.push({ type: 'user_email_changed', message: `User email changed from "${oldEmail}" to "${email}" for ${user.name}` });
        }
        if (role && role !== oldRole) {
            user.role = role;
            changes.push({ type: 'user_role_changed', message: `User role changed from "${oldRole}" to "${role}" for ${user.name}` });
        }

        await user.save();

        // Notify Superadmins about each change
        for (const change of changes) {
            await notifySuperAdmins(
                change.type,
                change.message,
                {
                    entityType: 'User',
                    entityId: user._id
                }
            );
        }

        res.json({ msg: 'User updated successfully', user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'User not found' });
        }
        res.status(500).send('Server Error');
    }
});

// @route   PUT /api/auth/users/:id/password
// @desc    Change user password (Superadmin only)
// @access  Private (Superadmin)
router.put('/users/:id/password', auth, async (req, res) => {
    const { password } = req.body;

    try {
        if (req.user.role !== 'Superadmin') {
            return res.status(403).json({ msg: 'Access denied. Superadmin only.' });
        }

        let user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // Encrypt new password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        await user.save();

        // Notify Superadmins about password change
        await notifySuperAdmins(
            'user_password_changed',
            `Password changed for user: ${user.name} (${user.email})`,
            {
                entityType: 'User',
                entityId: user._id
            }
        );

        res.json({ msg: 'Password updated successfully' });
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'User not found' });
        }
        res.status(500).send('Server Error');
    }
});

// @route   DELETE /api/auth/users/:id
// @desc    Delete user (Superadmin only)
// @access  Private (Superadmin)
router.delete('/users/:id', auth, async (req, res) => {
    try {
        if (req.user.role !== 'Superadmin') {
            return res.status(403).json({ msg: 'Access denied. Superadmin only.' });
        }

        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        const userName = user.name;
        const userEmail = user.email;
        const userRole = user.role;

        await User.findByIdAndDelete(req.params.id);

        // Notify Superadmins about user deletion
        await notifySuperAdmins(
            'user_deleted',
            `User deleted: ${userName} (${userEmail}, ${userRole})`,
            {
                entityType: 'User',
                entityId: req.params.id
            }
        );

        res.json({ msg: 'User removed' });
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'User not found' });
        }
        res.status(500).send('Server Error');
    }
});
