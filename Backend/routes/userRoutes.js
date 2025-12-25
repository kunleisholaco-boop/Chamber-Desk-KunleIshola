const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');

// @route   GET /api/users
// @desc    Get all users
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        const users = await User.find()
            .select('name email role')
            .sort({ name: 1 });

        res.json(users);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/users/hoc
// @desc    Get all HOC (Head of Chambers) users
// @access  Private
router.get('/hoc', auth, async (req, res) => {
    try {
        const hocUsers = await User.find({ role: 'HOC' })
            .select('name email role')
            .sort({ name: 1 });

        res.json(hocUsers);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/users/managers
// @desc    Get all Manager users
// @access  Private
router.get('/managers', auth, async (req, res) => {
    try {
        const managers = await User.find({ role: 'Manager' })
            .select('name email role')
            .sort({ name: 1 });

        res.json(managers);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/users/admins
// @desc    Get all Admin users
// @access  Private
router.get('/admins', auth, async (req, res) => {
    try {
        const admins = await User.find({ role: 'Admin' })
            .select('name email role')
            .sort({ name: 1 });

        res.json(admins);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/users/lawyers
// @desc    Get all Lawyer users
// @access  Private
router.get('/lawyers', auth, async (req, res) => {
    try {
        const lawyers = await User.find({ role: 'Lawyer' })
            .select('name email role')
            .sort({ name: 1 });

        res.json(lawyers);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/users/paralegals
// @desc    Get all Paralegal users
// @access  Private
router.get('/paralegals', auth, async (req, res) => {
    try {
        const paralegals = await User.find({ role: 'Paralegal' })
            .select('name email role')
            .sort({ name: 1 });

        res.json(paralegals);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/users/selectable
// @desc    Get all users except Superadmin
// @access  Private
router.get('/selectable', auth, async (req, res) => {
    try {
        const users = await User.find({ role: { $ne: 'Superadmin' } })
            .select('name email role')
            .sort({ name: 1 });

        res.json(users);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
