const Case = require('../models/Case');
const User = require('../models/User');

/**
 * Check if a user has direct access to a case (assigned as lawyer or paralegal)
 */
const hasDirectCaseAccess = async (caseId, userId) => {
    try {
        const caseItem = await Case.findById(caseId);
        if (!caseItem) return false;

        const isAssignedLawyer = caseItem.assignedLawyers?.some(
            lawyer => lawyer.toString() === userId.toString()
        );
        const isAssignedParalegal = caseItem.assignedParalegals?.some(
            paralegal => paralegal.toString() === userId.toString()
        );

        return isAssignedLawyer || isAssignedParalegal;
    } catch (err) {
        console.error('Error checking direct case access:', err);
        return false;
    }
};

/**
 * Grant task-based access to a case for a user
 * Only grants if user doesn't already have direct access
 */
const grantTaskBasedAccess = async (caseId, userId, taskId) => {
    try {
        // Check if user already has direct access
        const hasDirectAccess = await hasDirectCaseAccess(caseId, userId);
        if (hasDirectAccess) {
            console.log(`User ${userId} already has direct access to case ${caseId}`);
            return { granted: false, reason: 'direct_access_exists' };
        }

        // Check if this specific task-based access already exists
        const caseItem = await Case.findById(caseId);
        if (!caseItem) {
            return { granted: false, reason: 'case_not_found' };
        }

        const accessExists = caseItem.taskBasedAccess?.some(
            access => access.user.toString() === userId.toString() &&
                access.task.toString() === taskId.toString()
        );

        if (accessExists) {
            console.log(`Task-based access already exists for user ${userId} on case ${caseId} via task ${taskId}`);
            return { granted: false, reason: 'access_already_exists' };
        }

        // Grant access
        await Case.findByIdAndUpdate(caseId, {
            $push: {
                taskBasedAccess: {
                    user: userId,
                    task: taskId,
                    grantedAt: new Date()
                }
            }
        });

        console.log(`Granted task-based access to user ${userId} for case ${caseId} via task ${taskId}`);
        return { granted: true };
    } catch (err) {
        console.error('Error granting task-based access:', err);
        return { granted: false, reason: 'error', error: err.message };
    }
};

/**
 * Revoke task-based access for a specific user and task
 */
const revokeTaskBasedAccess = async (caseId, userId, taskId) => {
    try {
        await Case.findByIdAndUpdate(caseId, {
            $pull: {
                taskBasedAccess: {
                    user: userId,
                    task: taskId
                }
            }
        });

        console.log(`Revoked task-based access for user ${userId} on case ${caseId} via task ${taskId}`);
        return { revoked: true };
    } catch (err) {
        console.error('Error revoking task-based access:', err);
        return { revoked: false, error: err.message };
    }
};

/**
 * Revoke all task-based access for a specific task
 * Used when task is completed, cancelled, or deleted
 */
const revokeAllTaskAccess = async (taskId) => {
    try {
        const result = await Case.updateMany(
            { 'taskBasedAccess.task': taskId },
            {
                $pull: {
                    taskBasedAccess: { task: taskId }
                }
            }
        );

        console.log(`Revoked all task-based access for task ${taskId}. Modified ${result.modifiedCount} cases.`);
        return { revoked: true, count: result.modifiedCount };
    } catch (err) {
        console.error('Error revoking all task access:', err);
        return { revoked: false, error: err.message };
    }
};

/**
 * Get all cases a user has access to via tasks
 */
const getUserTaskBasedCases = async (userId) => {
    try {
        const cases = await Case.find({
            'taskBasedAccess.user': userId
        }).populate('taskBasedAccess.task', 'name status');

        return cases.map(caseItem => ({
            ...caseItem.toObject(),
            accessType: 'task',
            taskInfo: caseItem.taskBasedAccess.find(
                access => access.user.toString() === userId.toString()
            )
        }));
    } catch (err) {
        console.error('Error getting user task-based cases:', err);
        return [];
    }
};

/**
 * Check if user has any access to a case (direct or task-based)
 */
const hasAnyCaseAccess = async (caseId, userId) => {
    try {
        const caseItem = await Case.findById(caseId);
        if (!caseItem) return false;

        // Check direct access
        const isAssignedLawyer = caseItem.assignedLawyers?.some(
            lawyer => lawyer.toString() === userId.toString()
        );
        const isAssignedParalegal = caseItem.assignedParalegals?.some(
            paralegal => paralegal.toString() === userId.toString()
        );

        // Check task-based access
        const hasTaskAccess = caseItem.taskBasedAccess?.some(
            access => access.user.toString() === userId.toString()
        );

        return isAssignedLawyer || isAssignedParalegal || hasTaskAccess;
    } catch (err) {
        console.error('Error checking case access:', err);
        return false;
    }
};

module.exports = {
    hasDirectCaseAccess,
    grantTaskBasedAccess,
    revokeTaskBasedAccess,
    revokeAllTaskAccess,
    getUserTaskBasedCases,
    hasAnyCaseAccess
};
