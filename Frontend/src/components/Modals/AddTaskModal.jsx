import React, { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';

const AddTaskModal = ({ isOpen, onClose, onSuccess, initialStatus = 'To-Do' }) => {
    const [taskUsers, setTaskUsers] = useState([]);
    const [taskCases, setTaskCases] = useState([]);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        hasCase: 'no',
        caseId: '',
        status: 'To-Do',
        priority: 'Medium',
        startDate: '',
        endDate: '',
        assignedTo: [],
        collaborators: []
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // Fetch users and cases when modal opens
    useEffect(() => {
        if (isOpen) {
            fetchTaskData();
            // Set initial status from prop
            setFormData(prev => ({ ...prev, status: initialStatus }));
        }
    }, [isOpen, initialStatus]);

    const fetchTaskData = async () => {
        try {
            const token = localStorage.getItem('token');
            const [casesRes, usersRes] = await Promise.all([
                fetch(`${API_BASE_URL}/api/cases', { headers: { 'x-auth-token': token } }),
                fetch(`${API_BASE_URL}/api/users/selectable', { headers: { 'x-auth-token': token } })
            ]);

            if (casesRes.ok) {
                const casesData = await casesRes.json();
                setTaskCases(casesData);
            }
            if (usersRes.ok) {
                const usersData = await usersRes.json();
                setTaskUsers(usersData);
            }
        } catch (err) {
            console.error('Error fetching task data:', err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setMessage({ type: '', text: '' });

        try {
            const token = localStorage.getItem('token');
            const payload = {
                ...formData,
                caseId: formData.hasCase === 'yes' ? formData.caseId : null
            };

            const response = await fetch(`${API_BASE_URL}/api/tasks', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                setMessage({ type: 'success', text: 'Task created successfully!' });
                setTimeout(() => {
                    resetForm();
                    onClose();
                    if (onSuccess) onSuccess();
                }, 1500);
            } else {
                setMessage({ type: 'error', text: 'Failed to create task' });
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'Error creating task' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            hasCase: 'no',
            caseId: '',
            status: 'To-Do',
            priority: 'Medium',
            startDate: '',
            endDate: '',
            assignedTo: [],
            collaborators: []
        });
        setMessage({ type: '', text: '' });
    };

    const toggleTaskAssignee = (userId) => {
        setFormData(prev => {
            const current = prev.assignedTo;
            if (current.includes(userId)) {
                return { ...prev, assignedTo: current.filter(id => id !== userId) };
            } else {
                return { ...prev, assignedTo: [...current, userId] };
            }
        });
    };

    const toggleTaskCollaborator = (userId) => {
        setFormData(prev => {
            const current = prev.collaborators;
            if (current.includes(userId)) {
                return { ...prev, collaborators: current.filter(id => id !== userId) };
            } else {
                return { ...prev, collaborators: [...current, userId] };
            }
        });
    };

    const getCurrentUserId = () => {
        const user = JSON.parse(localStorage.getItem('user'));
        return user?._id || user?.id;
    };

    const currentUserId = getCurrentUserId();
    const availableTaskUsers = taskUsers.filter(user => user._id !== currentUserId);
    const availableForAssignment = availableTaskUsers.filter(user =>
        !formData.collaborators.includes(user._id)
    );
    const availableForCollaboration = availableTaskUsers.filter(user =>
        !formData.assignedTo.includes(user._id)
    );

    // Get today's date in YYYY-MM-DD format for date validation
    const today = new Date().toISOString().split('T')[0];

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white z-10">
                    <h3 className="text-xl font-bold text-gray-900">Create New Task</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {message.text && (
                        <div className={`p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                            {message.text}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Task Name *</label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-3 py-2 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                                placeholder="e.g., Review Case Files"
                            />
                        </div>

                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <textarea
                                rows="3"
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                className="w-full px-3 py-2 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                                placeholder="Detailed description of the task..."
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Related to a Case?</label>
                            <div className="flex gap-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="hasCase"
                                        value="yes"
                                        checked={formData.hasCase === 'yes'}
                                        onChange={e => setFormData({ ...formData, hasCase: e.target.value })}
                                        className="text-orange-600 text-black focus:ring-orange-500"
                                    />
                                    <span className="text-sm text-gray-700">Yes</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="hasCase"
                                        value="no"
                                        checked={formData.hasCase === 'no'}
                                        onChange={e => setFormData({ ...formData, hasCase: e.target.value })}
                                        className="text-orange-600 text-black focus:ring-orange-500"
                                    />
                                    <span className="text-sm text-gray-700">No</span>
                                </label>
                            </div>
                        </div>

                        {formData.hasCase === 'yes' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Select Case</label>
                                <select
                                    value={formData.caseId}
                                    onChange={e => setFormData({ ...formData, caseId: e.target.value })}
                                    onFocus={fetchTaskData}
                                    className="w-full px-3 py-2 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                                >
                                    <option value="">Select a case...</option>
                                    {taskCases.map(c => (
                                        <option key={c._id} value={c._id}>{c.caseTitle}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                            <select
                                value={formData.status}
                                onChange={e => setFormData({ ...formData, status: e.target.value })}
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
                                value={formData.priority}
                                onChange={e => setFormData({ ...formData, priority: e.target.value })}
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
                                value={formData.startDate}
                                min={today}
                                onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                                onClick={(e) => e.target.showPicker?.()}
                                className="w-full px-3 py-2 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 cursor-pointer"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                            <input
                                type="date"
                                value={formData.endDate}
                                min={formData.startDate || today}
                                onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                                onClick={(e) => e.target.showPicker?.()}
                                className="w-full px-3 py-2 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 cursor-pointer"
                            />
                        </div>

                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Assign To</label>
                            <div className="border border-gray-300 rounded-lg max-h-40 overflow-y-auto p-2" onFocus={fetchTaskData}>
                                {availableForAssignment.length === 0 ? (
                                    <p className="text-sm text-gray-500 p-2 text-center">No users available</p>
                                ) : (
                                    availableForAssignment.map(user => (
                                        <label key={user._id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={formData.assignedTo.includes(user._id)}
                                                onChange={() => toggleTaskAssignee(user._id)}
                                                className="rounded text-orange-600 focus:ring-orange-500"
                                            />
                                            <span className="text-sm text-gray-700">{user.name}</span>
                                        </label>
                                    ))
                                )}
                            </div>
                        </div>

                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Collaborators</label>
                            <div className="border border-gray-300 rounded-lg max-h-40 overflow-y-auto p-2">
                                {availableForCollaboration.length === 0 ? (
                                    <p className="text-sm text-gray-500 p-2 text-center">No users available</p>
                                ) : (
                                    availableForCollaboration.map(user => (
                                        <label key={user._id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={formData.collaborators.includes(user._id)}
                                                onChange={() => toggleTaskCollaborator(user._id)}
                                                className="rounded text-orange-600 focus:ring-orange-500"
                                            />
                                            <span className="text-sm text-gray-700">{user.name}</span>
                                        </label>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-orange-400"
                        >
                            {isSubmitting ? 'Creating...' : 'Create Task'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddTaskModal;
