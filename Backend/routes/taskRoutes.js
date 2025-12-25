const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Task = require('../models/Task');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { grantTaskBasedAccess, revokeTaskBasedAccess, revokeAllTaskAccess } = require('../utils/caseAccessHelper');

// Helper function to notify all task force members
const notifyTaskForce = async (task, currentUserId, notificationType, message) => {
    try {
        // Collect all task force member IDs
        const taskForceIds = new Set();

        // Add creator
        if (task.createdBy) {
            const creatorId = task.createdBy._id || task.createdBy;
            taskForceIds.add(creatorId.toString());
        }

        // Add assignees
        if (task.assignedTo) {
            const assignees = Array.isArray(task.assignedTo) ? task.assignedTo : [task.assignedTo];
            assignees.forEach(assignee => {
                const assigneeId = assignee._id || assignee;
                taskForceIds.add(assigneeId.toString());
            });
        }

        // Add collaborators
        if (task.collaborators && task.collaborators.length > 0) {
            task.collaborators.forEach(collab => {
                const collabId = collab._id || collab;
                taskForceIds.add(collabId.toString());
            });
        }

        // Create notifications for all task force members (including the action creator)
        const notifications = Array.from(taskForceIds).map(userId => ({
            recipient: userId,
            type: notificationType,
            message: message,
            relatedEntity: {
                entityType: 'Task',
                entityId: task._id
            }
        }));

        if (notifications.length > 0) {
            await Notification.insertMany(notifications);
        }
    } catch (err) {
        console.error('Error sending task notifications:', err);
    }
};

// Helper function to check and update overdue tasks
const checkAndUpdateOverdueTasks = async (tasks) => {
    const now = new Date();
    const updates = [];

    for (const task of tasks) {
        // Only update if task has an end date, is not already overdue, and is not completed/cancelled
        if (task.endDate &&
            task.status !== 'Overdue' &&
            task.status !== 'Completed' &&
            task.status !== 'Cancelled') {

            const endDate = new Date(task.endDate);
            // Check if end date has passed (comparing dates only, not time)
            endDate.setHours(23, 59, 59, 999); // Set to end of day

            if (now > endDate) {
                task.status = 'Overdue';
                updates.push(task.save());
            }
        }
    }

    // Save all updates
    if (updates.length > 0) {
        await Promise.all(updates);
    }

    return tasks;
};


// @route   POST /api/tasks
// @desc    Create a new task
// @access  Private
router.post('/', auth, async (req, res) => {
    try {
        const { name, description, caseId, status, priority, startDate, endDate, assignedTo, collaborators } = req.body;

        const newTask = new Task({
            name,
            description,
            case: caseId || null,
            status,
            priority,
            startDate,
            endDate,
            assignedTo: assignedTo || null,
            collaborators: collaborators || [],
            createdBy: req.user.id
        });

        const task = await newTask.save();

        // Grant task-based case access if task is linked to a case
        if (task.case) {
            const allMembers = [
                ...(Array.isArray(task.assignedTo) ? task.assignedTo : task.assignedTo ? [task.assignedTo] : []),
                ...(task.collaborators || [])
            ];

            for (const memberId of allMembers) {
                await grantTaskBasedAccess(task.case, memberId, task._id);
            }
        }

        // Get user name for notification
        const user = await User.findById(req.user.id).select('name');
        await notifyTaskForce(task, req.user.id, 'task_created', `${user.name} created a new task: ${task.name}`);

        res.json(task);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/tasks
// @desc    Get tasks (filtered by type)
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        const { type } = req.query;
        let query = {};

        // Filter based on tab selection
        switch (type) {
            case 'my_tasks':
                query = { createdBy: req.user.id };
                break;
            case 'assigned':
                query = { assignedTo: req.user.id };
                break;
            case 'joint':
                query = { collaborators: req.user.id };
                break;
            default:
                // If no type specified, maybe return all relevant tasks for the user?
                // For now, let's default to tasks created by the user if nothing specified
                query = { createdBy: req.user.id };
                break;
        }

        const tasks = await Task.find(query)
            .populate('assignedTo', 'name email')
            .populate('collaborators', 'name email')
            .populate('case', 'caseTitle caseId summary clientObjective caseType subCategory')
            .populate('createdBy', 'name')
            .sort({ createdAt: -1 });

        // Check and update overdue tasks
        await checkAndUpdateOverdueTasks(tasks);

        res.json(tasks);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/tasks/my-tasks
// @desc    Get tasks assigned to or created by the user (for dashboard)
// @access  Private
router.get('/my-tasks', auth, async (req, res) => {
    try {
        // Find tasks where user is the owner (createdBy), assignedTo, or a collaborator
        const tasks = await Task.find({
            $or: [
                { createdBy: req.user.id },
                { assignedTo: req.user.id },
                { collaborators: req.user.id }
            ]
        })
            .populate('assignedTo', 'name email')
            .populate('collaborators', 'name email')
            .populate('case', 'caseTitle caseId summary clientObjective caseType subCategory')
            .populate('createdBy', 'name')
            .sort({ endDate: 1 }); // Sort by due date ascending

        // Check and update overdue tasks
        await checkAndUpdateOverdueTasks(tasks);

        res.json(tasks);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


// @route   GET /api/tasks/:id
// @desc    Get a single task by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
    try {
        const task = await Task.findById(req.params.id)
            .populate('assignedTo', 'name email')
            .populate('collaborators', 'name email')
            .populate('case', 'caseTitle caseId summary clientObjective caseType subCategory')
            .populate('createdBy', 'name')
            .populate('subtasks.addedBy', 'name')
            .populate('comments.user', 'name email')
            .populate('comments.replies.user', 'name email');

        if (!task) {
            return res.status(404).json({ msg: 'Task not found' });
        }

        // Check and update if overdue
        await checkAndUpdateOverdueTasks([task]);

        res.json(task);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Task not found' });
        }
        res.status(500).send('Server Error');
    }
});

// @route   PUT /api/tasks/:id
// @desc    Update a task
// @access  Private
router.put('/:id', auth, async (req, res) => {
    try {
        const { name, description, caseId, status, priority, startDate, endDate, assignedTo, collaborators } = req.body;

        let task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({ msg: 'Task not found' });
        }

        // Track old members to detect new additions
        const oldAssignees = task.assignedTo ? (Array.isArray(task.assignedTo) ? task.assignedTo.map(a => a.toString()) : [task.assignedTo.toString()]) : [];
        const oldCollaborators = task.collaborators ? task.collaborators.map(c => c.toString()) : [];

        // Track old status BEFORE updating
        const oldStatus = task.status;

        task.name = name || task.name;
        task.description = description || task.description;
        if (caseId) task.case = caseId;
        task.status = status || task.status;
        task.priority = priority || task.priority;
        task.startDate = startDate || task.startDate;
        task.endDate = endDate || task.endDate;
        if (assignedTo) task.assignedTo = assignedTo;
        if (collaborators) task.collaborators = collaborators;

        await task.save();

        // Get user name for notification
        const user = await User.findById(req.user.id).select('name');

        // Detect newly added members
        const newAssignees = assignedTo ? (Array.isArray(assignedTo) ? assignedTo : [assignedTo]).filter(a => !oldAssignees.includes(a.toString())) : [];
        const newCollaborators = collaborators ? collaborators.filter(c => !oldCollaborators.includes(c.toString())) : [];
        const newMembers = [...newAssignees, ...newCollaborators];

        // Grant task-based access to new members if task has a case
        if (task.case && newMembers.length > 0) {
            for (const memberId of newMembers) {
                await grantTaskBasedAccess(task.case, memberId, task._id);
            }
        }

        // Detect removed members
        const currentAssignees = assignedTo ? (Array.isArray(assignedTo) ? assignedTo.map(a => a.toString()) : [assignedTo.toString()]) : [];
        const currentCollaborators = collaborators ? collaborators.map(c => c.toString()) : [];
        const removedAssignees = oldAssignees.filter(a => !currentAssignees.includes(a));
        const removedCollaborators = oldCollaborators.filter(c => !currentCollaborators.includes(c));
        const removedMembers = [...removedAssignees, ...removedCollaborators];

        // Revoke task-based access for removed members
        if (task.case && removedMembers.length > 0) {
            for (const memberId of removedMembers) {
                await revokeTaskBasedAccess(task.case, memberId, task._id);
            }
        }

        // Handle task-based access based on status changes
        const closedStatuses = ['Completed', 'Cancelled', 'Closed'];
        const activeStatuses = ['To-Do', 'Ongoing', 'Overdue'];
        
        if (status && status !== oldStatus && task.case) {
            const wasClosedBefore = closedStatuses.includes(oldStatus);
            const isClosedNow = closedStatuses.includes(status);
            const isActiveNow = activeStatuses.includes(status);
            
            // If changing TO a closed status, revoke all access
            if (isClosedNow && !wasClosedBefore) {
                console.log(`Task ${task._id} status changed to ${status} - revoking all task-based access`);
                await revokeAllTaskAccess(task._id);
            }
            // If changing FROM a closed status back to active, re-grant access to all members
            else if (isActiveNow && wasClosedBefore) {
                console.log(`Task ${task._id} status changed from ${oldStatus} to ${status} - re-granting task-based access`);
                const allMembers = [
                    ...(Array.isArray(task.assignedTo) ? task.assignedTo : task.assignedTo ? [task.assignedTo] : []),
                    ...(task.collaborators || [])
                ];
                
                for (const memberId of allMembers) {
                    await grantTaskBasedAccess(task.case, memberId, task._id);
                }
            }
        }

        // Notify newly added members
        if (newMembers.length > 0) {
            const memberNotifications = newMembers.map(memberId => ({
                recipient: memberId,
                type: 'task_member_added',
                message: `${user.name} added you to task: ${task.name}`,
                relatedEntity: {
                    entityType: 'Task',
                    entityId: task._id
                }
            }));
            await Notification.insertMany(memberNotifications);
        }

        // Notify existing task force about update
        await notifyTaskForce(task, req.user.id, 'task_updated', `${user.name} updated task: ${task.name}`);

        res.json(task);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/tasks/:id/subtasks
// @desc    Add a subtask to a task
// @access  Private
router.post('/:id/subtasks', auth, async (req, res) => {
    try {
        const { title } = req.body;

        if (!title) {
            return res.status(400).json({ msg: 'Subtask title is required' });
        }

        const task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({ msg: 'Task not found' });
        }

        // Add the new subtask
        task.subtasks.push({
            title,
            isCompleted: false,
            addedBy: req.user.id
        });

        await task.save();

        // Populate and return the updated task
        const updatedTask = await Task.findById(task._id)
            .populate('assignedTo', 'name email')
            .populate('collaborators', 'name email')
            .populate('case', 'caseTitle caseId summary clientObjective caseType subCategory')
            .populate('createdBy', 'name')
            .populate('subtasks.addedBy', 'name');

        // Get user name and notify task force
        const user = await User.findById(req.user.id).select('name');
        await notifyTaskForce(updatedTask, req.user.id, 'task_subtask_added', `${user.name} added a subtask to ${updatedTask.name}`);

        res.json(updatedTask);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PATCH /api/tasks/:id/subtasks/:subtaskId
// @desc    Toggle subtask completion status
// @access  Private
router.patch('/:id/subtasks/:subtaskId', auth, async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({ msg: 'Task not found' });
        }

        const subtask = task.subtasks.id(req.params.subtaskId);

        if (!subtask) {
            return res.status(404).json({ msg: 'Subtask not found' });
        }

        // Toggle the completion status
        subtask.isCompleted = !subtask.isCompleted;

        await task.save();

        // Populate and return the updated task
        const updatedTask = await Task.findById(task._id)
            .populate('assignedTo', 'name email')
            .populate('collaborators', 'name email')
            .populate('case', 'caseTitle caseId summary clientObjective caseType subCategory')
            .populate('createdBy', 'name')
            .populate('subtasks.addedBy', 'name');

        res.json(updatedTask);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT /api/tasks/:id/subtasks/:subtaskId
// @desc    Update a subtask
// @access  Private
router.put('/:id/subtasks/:subtaskId', auth, async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({ msg: 'Task not found' });
        }

        const subtask = task.subtasks.id(req.params.subtaskId);
        if (!subtask) {
            return res.status(404).json({ msg: 'Subtask not found' });
        }

        // Update subtask title
        if (req.body.title) {
            subtask.title = req.body.title;
        }

        await task.save();

        const updatedTask = await Task.findById(req.params.id)
            .populate('assignedTo', 'name email')
            .populate('collaborators', 'name email')
            .populate('case', 'caseTitle caseId summary clientObjective caseType subCategory')
            .populate('createdBy', 'name')
            .populate('subtasks.addedBy', 'name');

        res.json(updatedTask);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE /api/tasks/:id/subtasks/:subtaskId
// @desc    Delete a subtask
// @access  Private
router.delete('/:id/subtasks/:subtaskId', auth, async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({ msg: 'Task not found' });
        }

        // Remove the subtask
        task.subtasks = task.subtasks.filter(
            st => st._id.toString() !== req.params.subtaskId
        );

        await task.save();

        const updatedTask = await Task.findById(req.params.id)
            .populate('assignedTo', 'name email')
            .populate('collaborators', 'name email')
            .populate('case', 'caseTitle caseId summary clientObjective caseType subCategory')
            .populate('createdBy', 'name')
            .populate('subtasks.addedBy', 'name');

        // Get user name and notify task force
        const user = await User.findById(req.user.id).select('name');
        await notifyTaskForce(updatedTask, req.user.id, 'task_subtask_deleted', `${user.name} deleted a subtask from ${updatedTask.name}`);

        res.json(updatedTask);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE /api/tasks/:id
// @desc    Delete a task
// @access  Private
router.delete('/:id', auth, async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({ msg: 'Task not found' });
        }

        // Only the creator can delete the task
        if (task.createdBy.toString() !== req.user.id) {
            return res.status(403).json({ msg: 'Not authorized to delete this task' });
        }

        // Revoke all task-based access before deletion
        await revokeAllTaskAccess(task._id);

        // Get user name and notify task force before deletion
        const user = await User.findById(req.user.id).select('name');
        await notifyTaskForce(task, req.user.id, 'task_deleted', `${user.name} deleted task: ${task.name}`);

        await Task.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Task deleted successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/tasks/:id/comments
// @desc    Add a comment to a task
// @access  Private
router.post('/:id/comments', auth, async (req, res) => {
    try {
        const { text } = req.body;

        if (!text || !text.trim()) {
            return res.status(400).json({ msg: 'Comment text is required' });
        }

        const task = await Task.findById(req.params.id);
        if (!task) {
            return res.status(404).json({ msg: 'Task not found' });
        }

        const newComment = {
            user: req.user.id,
            text: text.trim(),
            createdAt: new Date()
        };

        task.comments.push(newComment);
        await task.save();

        // Populate and return the updated task with comments
        const updatedTask = await Task.findById(task._id)
            .populate('assignedTo', 'name email')
            .populate('collaborators', 'name email')
            .populate('createdBy', 'name')
            .populate('comments.user', 'name email')
            .populate('comments.replies.user', 'name email');

        // Get user name and notify task force
        const user = await User.findById(req.user.id).select('name');
        await notifyTaskForce(updatedTask, req.user.id, 'task_comment_added', `${user.name} commented on ${task.name}`);

        res.json(updatedTask.comments);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/tasks/:id/comments/:commentId/replies
// @desc    Add a reply to a comment
// @access  Private
router.post('/:id/comments/:commentId/replies', auth, async (req, res) => {
    try {
        const { text } = req.body;

        if (!text || !text.trim()) {
            return res.status(400).json({ msg: 'Reply text is required' });
        }

        const task = await Task.findById(req.params.id);
        if (!task) {
            return res.status(404).json({ msg: 'Task not found' });
        }

        const comment = task.comments.id(req.params.commentId);
        if (!comment) {
            return res.status(404).json({ msg: 'Comment not found' });
        }

        const newReply = {
            user: req.user.id,
            text: text.trim(),
            createdAt: new Date()
        };

        comment.replies.push(newReply);
        await task.save();

        // Populate and return the updated task with comments
        const updatedTask = await Task.findById(task._id)
            .populate('assignedTo', 'name email')
            .populate('collaborators', 'name email')
            .populate('createdBy', 'name')
            .populate('comments.user', 'name email')
            .populate('comments.replies.user', 'name email');

        // Get user name and notify task force
        const user = await User.findById(req.user.id).select('name');
        await notifyTaskForce(updatedTask, req.user.id, 'task_reply_added', `${user.name} replied to a comment on ${task.name}`);

        res.json(updatedTask.comments);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE /api/tasks/:id/comments/:commentId
// @desc    Delete a comment
// @access  Private
router.delete('/:id/comments/:commentId', auth, async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);
        if (!task) {
            return res.status(404).json({ msg: 'Task not found' });
        }

        const comment = task.comments.id(req.params.commentId);
        if (!comment) {
            return res.status(404).json({ msg: 'Comment not found' });
        }

        // Only the comment author can delete it
        if (comment.user.toString() !== req.user.id) {
            return res.status(403).json({ msg: 'Not authorized to delete this comment' });
        }

        // Remove the comment using pull
        task.comments.pull(req.params.commentId);
        await task.save();

        // Populate and return the updated task with comments
        const updatedTask = await Task.findById(task._id)
            .populate('comments.user', 'name email')
            .populate('comments.replies.user', 'name email');

        res.json(updatedTask.comments);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE /api/tasks/:id/comments/:commentId/replies/:replyId
// @desc    Delete a reply
// @access  Private
router.delete('/:id/comments/:commentId/replies/:replyId', auth, async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);
        if (!task) {
            return res.status(404).json({ msg: 'Task not found' });
        }

        const comment = task.comments.id(req.params.commentId);
        if (!comment) {
            return res.status(404).json({ msg: 'Comment not found' });
        }

        const reply = comment.replies.id(req.params.replyId);
        if (!reply) {
            return res.status(404).json({ msg: 'Reply not found' });
        }

        // Only the reply author can delete it
        if (reply.user.toString() !== req.user.id) {
            return res.status(403).json({ msg: 'Not authorized to delete this reply' });
        }

        // Remove the reply using pull
        comment.replies.pull(req.params.replyId);
        await task.save();

        // Populate and return the updated task with comments
        const updatedTask = await Task.findById(task._id)
            .populate('comments.user', 'name email')
            .populate('comments.replies.user', 'name email');

        res.json(updatedTask.comments);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
