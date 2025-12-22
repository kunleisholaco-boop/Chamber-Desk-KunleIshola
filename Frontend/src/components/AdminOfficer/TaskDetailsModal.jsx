import React, { useState } from 'react';
import { X, Calendar, User, Users, Briefcase, AlertCircle, CheckSquare, Plus, Trash2, Edit, Check } from 'lucide-react';
import API_BASE_URL from '../../../config/api';

const TaskDetailsModal = ({ task, onClose, onUpdate, onDelete, currentUserId }) => {
    const [newSubtask, setNewSubtask] = useState('');
    const [isAddingSubtask, setIsAddingSubtask] = useState(false);
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editFormData, setEditFormData] = useState({});

    if (!task) return null;

    const isOwner = task.createdBy?._id === currentUserId;
    const isAssignee = task.assignedTo?._id === currentUserId;
    const isCollaborator = task.collaborators?.some(c => c._id === currentUserId);

    // Owner, Assignee, and Collaborators can manage subtasks
    const canManageSubtasks = isOwner || isAssignee || isCollaborator;
    const canEditDelete = isOwner;

    const completedSubtasks = task.subtasks?.filter(st => st.isCompleted).length || 0;
    const totalSubtasks = task.subtasks?.length || 0;
    const progress = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;

    const handleAddSubtask = async () => {
        if (!newSubtask.trim()) return;

        setIsAddingSubtask(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/api/tasks/${task._id}/subtasks`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token
                },
                body: JSON.stringify({ title: newSubtask })
            });

            if (response.ok) {
                const updatedTask = await response.json();
                onUpdate(updatedTask);
                setNewSubtask('');
            }
        } catch (err) {
            console.error('Error adding subtask:', err);
        } finally {
            setIsAddingSubtask(false);
        }
    };

    const handleToggleSubtask = async (subtaskId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/api/tasks/${task._id}/subtasks/${subtaskId}`, {
                method: 'PATCH',
                headers: { 'x-auth-token': token }
            });

            if (response.ok) {
                const updatedTask = await response.json();
                onUpdate(updatedTask);
            }
        } catch (err) {
            console.error('Error toggling subtask:', err);
        }
    };

    const handleStatusChange = async (newStatus) => {
        setIsUpdatingStatus(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/api/tasks/${task._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (response.ok) {
                const updatedTask = await response.json();
                onUpdate(updatedTask);
            }
        } catch (err) {
            console.error('Error updating status:', err);
        } finally {
            setIsUpdatingStatus(false);
        }
    };

    const handleEditClick = () => {
        setEditFormData({
            name: task.name,
            description: task.description || '',
            status: task.status,
            priority: task.priority,
            startDate: task.startDate ? new Date(task.startDate).toISOString().split('T')[0] : '',
            endDate: task.endDate ? new Date(task.endDate).toISOString().split('T')[0] : ''
        });
        setShowEditModal(true);
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/api/tasks/${task._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token
                },
                body: JSON.stringify(editFormData)
            });

            if (response.ok) {
                const updatedTask = await response.json();
                onUpdate(updatedTask);
                setShowEditModal(false);
            }
        } catch (err) {
            console.error('Error updating task:', err);
        }
    };

    const handleDeleteConfirm = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/api/tasks/${task._id}`, {
                method: 'DELETE',
                headers: { 'x-auth-token': token }
            });

            if (response.ok) {
                onDelete(task._id);
                setShowDeleteModal(false);
                onClose();
            }
        } catch (err) {
            console.error('Error deleting task:', err);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Completed': return 'bg-green-100 text-green-700';
            case 'Ongoing': return 'bg-blue-100 text-blue-700';
            case 'Cancelled': return 'bg-gray-100 text-gray-700';
            case 'Overdue': return 'bg-red-100 text-red-700';
            default: return 'bg-orange-100 text-orange-700';
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'High': return 'text-red-600';
            case 'Medium': return 'text-orange-600';
            case 'Low': return 'text-green-600';
            default: return 'text-gray-600';
        }
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 z-50 transition-opacity duration-300"
                onClick={onClose}
            />

            {/* Slide-in Panel */}
            <div className="fixed right-0 top-0 h-full w-full md:w-[600px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-white">
                    <div className="flex justify-between items-start mb-4">
                        <h2 className="text-2xl font-bold text-gray-900 flex-1 pr-4">{task.name}</h2>
                        <button
                            onClick={onClose}
                            className="text-gray-500 hover:text-gray-700 p-1 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="flex items-center gap-3 mb-4">
                        <span className={`text-xs px-3 py-1 rounded-full font-medium ${getStatusColor(task.status)}`}>
                            {task.status}
                        </span>
                        <span className={`text-xs font-medium flex items-center gap-1 ${getPriorityColor(task.priority)}`}>
                            <AlertCircle className="w-4 h-4" />
                            {task.priority} Priority
                        </span>
                    </div>

                    {/* Action Buttons */}
                    {canEditDelete && (
                        <div className="flex gap-2">
                            <button
                                onClick={handleEditClick}
                                className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm"
                            >
                                <Edit className="w-4 h-4" />
                                Edit Task
                            </button>
                            <button
                                onClick={() => setShowDeleteModal(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                            >
                                <Trash2 className="w-4 h-4" />
                                Delete
                            </button>
                        </div>
                    )}
                </div>

                {/* Body - Scrollable */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Status Dropdown */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                        <select
                            value={task.status}
                            onChange={(e) => handleStatusChange(e.target.value)}
                            disabled={isUpdatingStatus}
                            className="w-full px-3 py-2 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 disabled:bg-gray-100"
                        >
                            {['To-Do', 'Ongoing', 'Completed', 'Cancelled', 'Overdue'].map(s => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                    </div>

                    {/* Description */}
                    {task.description && (
                        <div>
                            <h3 className="text-sm font-semibold text-gray-700 mb-2">Description</h3>
                            <p className="text-gray-600 whitespace-pre-wrap bg-gray-50 p-3 rounded-lg">{task.description}</p>
                        </div>
                    )}

                    {/* Task Info Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        {task.case && (
                            <div className="flex items-start gap-2 bg-gray-50 p-3 rounded-lg">
                                <Briefcase className="w-4 h-4 text-gray-400 mt-0.5" />
                                <div>
                                    <p className="text-xs text-gray-500">Related Case</p>
                                    <p className="text-sm font-medium text-gray-900">{task.case.caseTitle}</p>
                                </div>
                            </div>
                        )}
                        {task.assignedTo && (
                            <div className="flex items-start gap-2 bg-gray-50 p-3 rounded-lg">
                                <User className="w-4 h-4 text-gray-400 mt-0.5" />
                                <div>
                                    <p className="text-xs text-gray-500">Assigned To</p>
                                    <p className="text-sm font-medium text-gray-900">{task.assignedTo.name}</p>
                                </div>
                            </div>
                        )}
                        {task.startDate && (
                            <div className="flex items-start gap-2 bg-gray-50 p-3 rounded-lg">
                                <Calendar className="w-4 h-4 text-gray-400 mt-0.5" />
                                <div>
                                    <p className="text-xs text-gray-500">Start Date</p>
                                    <p className="text-sm font-medium text-gray-900">
                                        {new Date(task.startDate).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        )}
                        {task.endDate && (
                            <div className="flex items-start gap-2 bg-gray-50 p-3 rounded-lg">
                                <Calendar className="w-4 h-4 text-gray-400 mt-0.5" />
                                <div>
                                    <p className="text-xs text-gray-500">Due Date</p>
                                    <p className="text-sm font-medium text-gray-900">
                                        {new Date(task.endDate).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Collaborators */}
                    {task.collaborators && task.collaborators.length > 0 && (
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <Users className="w-4 h-4 text-gray-400" />
                                <h3 className="text-sm font-semibold text-gray-700">Collaborators</h3>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {task.collaborators.map(collab => (
                                    <span key={collab._id} className="px-3 py-1 bg-blue-50 text-blue-700 text-xs rounded-full font-medium">
                                        {collab.name}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Subtasks Section */}
                    <div className="border-t border-gray-200 pt-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <CheckSquare className="w-5 h-5 text-orange-600" />
                                <h3 className="text-lg font-semibold text-gray-900">Subtasks</h3>
                                <span className="text-sm text-gray-500">
                                    {completedSubtasks}/{totalSubtasks}
                                </span>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        {totalSubtasks > 0 && (
                            <div className="mb-4">
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className="bg-orange-600 h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                                <p className="text-xs text-gray-500 mt-1">{Math.round(progress)}% complete</p>
                            </div>
                        )}

                        {/* Add Subtask Input - Visible to owner, assignee, and collaborators */}
                        {canManageSubtasks && (
                            <div className="mb-4">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newSubtask}
                                        onChange={(e) => setNewSubtask(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleAddSubtask()}
                                        placeholder="Add a new subtask..."
                                        className="flex-1 px-3 py-2 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-sm"
                                    />
                                    <button
                                        onClick={handleAddSubtask}
                                        disabled={isAddingSubtask || !newSubtask.trim()}
                                        className="p-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-orange-400 transition-colors"
                                        title="Add Subtask"
                                    >
                                        <Plus className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Subtask List */}
                        <div className="space-y-2">
                            {task.subtasks && task.subtasks.length > 0 ? (
                                task.subtasks.map(subtask => (
                                    <div
                                        key={subtask._id}
                                        className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg border border-gray-100 transition-colors"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={subtask.isCompleted}
                                            onChange={() => canManageSubtasks && handleToggleSubtask(subtask._id)}
                                            disabled={!canManageSubtasks}
                                            className="w-5 h-5 rounded text-orange-600 focus:ring-orange-500 cursor-pointer disabled:cursor-not-allowed"
                                        />
                                        <span className={`flex-1 text-sm ${subtask.isCompleted ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                                            {subtask.title}
                                        </span>
                                        {subtask.isCompleted && (
                                            <Check className="w-4 h-4 text-green-600" />
                                        )}
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-gray-500 italic text-center py-4">No subtasks yet</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Edit Modal */}
            {showEditModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white z-10">
                            <h3 className="text-xl font-bold text-gray-900">Edit Task</h3>
                            <button onClick={() => setShowEditModal(false)} className="text-gray-500 hover:text-gray-700">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Task Name *</label>
                                <input
                                    type="text"
                                    required
                                    value={editFormData.name}
                                    onChange={e => setEditFormData({ ...editFormData, name: e.target.value })}
                                    className="w-full px-3 py-2 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                    rows="3"
                                    value={editFormData.description}
                                    onChange={e => setEditFormData({ ...editFormData, description: e.target.value })}
                                    className="w-full px-3 py-2 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                    <select
                                        value={editFormData.status}
                                        onChange={e => setEditFormData({ ...editFormData, status: e.target.value })}
                                        className="w-full px-3 py-2 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                                    >
                                        {['To-Do', 'Ongoing', 'Completed', 'Cancelled', 'Overdue'].map(s => (
                                            <option key={s} value={s}>{s}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                                    <select
                                        value={editFormData.priority}
                                        onChange={e => setEditFormData({ ...editFormData, priority: e.target.value })}
                                        className="w-full px-3 py-2 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                                    >
                                        {['Low', 'Medium', 'High'].map(p => (
                                            <option key={p} value={p}>{p}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                                    <input
                                        type="date"
                                        value={editFormData.startDate}
                                        onChange={e => setEditFormData({ ...editFormData, startDate: e.target.value })}
                                        className="w-full px-3 py-2 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                                    <input
                                        type="date"
                                        value={editFormData.endDate}
                                        onChange={e => setEditFormData({ ...editFormData, endDate: e.target.value })}
                                        className="w-full px-3 py-2 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-gray-200">
                                <button
                                    type="button"
                                    onClick={() => setShowEditModal(false)}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
                        <div className="p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                                    <Trash2 className="w-6 h-6 text-red-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">Delete Task</h3>
                                    <p className="text-sm text-gray-500">This action cannot be undone</p>
                                </div>
                            </div>
                            <p className="text-gray-600 mb-6">
                                Are you sure you want to delete "<strong>{task.name}</strong>"? All subtasks and related data will be permanently removed.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowDeleteModal(false)}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDeleteConfirm}
                                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                                >
                                    Delete Task
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default TaskDetailsModal;
