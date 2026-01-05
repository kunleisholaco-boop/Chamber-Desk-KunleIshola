const Notification = require('../models/Notification');
const User = require('../models/User');
const { sendNotificationEmail } = require('../services/emailService');

/**
 * Send notification to all admin users
 * @param {string} type - Notification type (e.g., 'case_created', 'client_registered')
 * @param {string} message - Notification message
 * @param {Object} relatedEntity - Related entity information
 * @param {string} relatedEntity.entityType - Type of entity (e.g., 'Case', 'Client', 'FundRequisition')
 * @param {string} relatedEntity.entityId - ID of the related entity
 */
async function notifyAdmins(type, message, relatedEntity) {
    try {
        const admins = await User.find({ role: 'Admin' });

        if (admins.length === 0) {
            return;
        }

        const notifications = admins.map(admin => ({
            recipient: admin._id,
            type,
            message,
            relatedEntity
        }));

        await Notification.insertMany(notifications);

        // Send Emails
        admins.forEach(admin => {
            if (admin.email) {
                sendNotificationEmail(
                    admin.email,
                    `New Notification: ${type.replace(/_/g, ' ')}`,
                    message
                );
            }
        });

    } catch (error) {
        console.error('Error notifying admins:', error);
        // Don't throw error to prevent disrupting the main operation
    }
}

/**
 * Send notification to all superadmin users
 * @param {string} type - Notification type
 * @param {string} message - Notification message
 * @param {Object} relatedEntity - Related entity information
 */
async function notifySuperAdmins(type, message, relatedEntity) {
    try {
        const superAdmins = await User.find({ role: 'Superadmin' });

        if (superAdmins.length === 0) {
            return;
        }

        const notifications = superAdmins.map(admin => ({
            recipient: admin._id,
            type,
            message,
            relatedEntity
        }));

        await Notification.insertMany(notifications);

        // Send Emails
        superAdmins.forEach(admin => {
            if (admin.email) {
                sendNotificationEmail(
                    admin.email,
                    `New Notification: ${type.replace(/_/g, ' ')}`,
                    message
                );
            }
        });

    } catch (error) {
        console.error('Error notifying superadmins:', error);
    }
}

/**
 * Send notification to all stakeholders of a case (HOC, lawyers, paralegals, admins)
 * Everyone on the case receives notifications, including the person who made the change
 * @param {string} caseId - ID of the case
 * @param {string} type - Notification type
 * @param {string} message - Notification message
 */
async function notifyCaseStakeholders(caseId, type, message) {
    try {
        const Case = require('../models/Case');

        // Fetch the case with populated fields
        const caseItem = await Case.findById(caseId)
            .populate('assignedTo')
            .populate('assignedLawyers')
            .populate('assignedParalegals');

        if (!caseItem) {
            return;
        }

        const recipients = new Set(); // Use Set to avoid duplicates
        const recipientEmails = new Set();

        // Helper to add recipient
        const addRecipient = (user) => {
            if (user) {
                recipients.add(user._id.toString());
                if (user.email) recipientEmails.add(user.email);
            }
        };

        // Add HOC if assigned
        addRecipient(caseItem.assignedTo);

        // Add all assigned lawyers
        if (caseItem.assignedLawyers && caseItem.assignedLawyers.length > 0) {
            caseItem.assignedLawyers.forEach(lawyer => addRecipient(lawyer));
        }

        // Add all assigned paralegals
        if (caseItem.assignedParalegals && caseItem.assignedParalegals.length > 0) {
            caseItem.assignedParalegals.forEach(paralegal => addRecipient(paralegal));
        }

        // Add all admins
        const admins = await User.find({ role: { $in: ['Admin', 'Superadmin'] } });
        admins.forEach(admin => addRecipient(admin));

        // Create notifications for all recipients
        if (recipients.size > 0) {
            const notifications = Array.from(recipients).map(recipientId => ({
                recipient: recipientId,
                type,
                message,
                relatedEntity: {
                    entityType: 'Case',
                    entityId: caseId
                }
            }));

            await Notification.insertMany(notifications);

            // Send Emails
            recipientEmails.forEach(email => {
                sendNotificationEmail(
                    email,
                    `Case Update: ${caseItem.caseTitle}`,
                    message
                );
            });
        }
    } catch (error) {
        console.error('Error notifying case stakeholders:', error);
        // Don't throw error to prevent disrupting the main operation
    }
}

/**
 * Send notification to specific users (and send emails)
 * @param {Array} users - Array of User objects (must contain _id and email)
 * @param {string} type - Notification type
 * @param {string} message - Notification message
 * @param {Object} relatedEntity - Related entity information
 */
async function notifyUsers(users, type, message, relatedEntity) {
    try {
        if (!users || users.length === 0) {
            return;
        }

        const notifications = users.map(user => ({
            recipient: user._id,
            type,
            message,
            relatedEntity
        }));

        await Notification.insertMany(notifications);

        // Send Emails
        users.forEach(user => {
            if (user.email) {
                sendNotificationEmail(
                    user.email,
                    `New Notification: ${type.replace(/_/g, ' ')}`,
                    message
                );
            }
        });

    } catch (error) {
        console.error('Error notifying users:', error);
    }
}

module.exports = { notifyAdmins, notifySuperAdmins, notifyCaseStakeholders, notifyUsers };
