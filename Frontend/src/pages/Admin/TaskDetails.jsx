import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, User, Users, Briefcase, AlertCircle, CheckSquare, Plus, Trash2, Edit, Check, X, FolderOpen, Download, Image as ImageIcon, File, Video, Music, FileText, MessageCircle, Send } from 'lucide-react';
import axios from 'axios';
import LoadingSpinner from '../../components/AdminOfficer/LoadingSpinner';
import DocumentSelectorDrawer from '../../components/DocumentSelectorDrawer';
import EditTaskModal from '../../components/Modals/EditTaskModal';
import DeleteTaskModal from '../../components/Modals/DeleteTaskModal';
import RemoveDocumentModal from '../../components/Modals/RemoveDocumentModal';
import AttachCaseModal from '../../components/Modals/AttachCaseModal';
import API_BASE_URL from '../../config/api';

const TaskDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    // Get user role from localStorage
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userRole = user.role || 'Admin';
    const rolePrefix = userRole === 'HOC' ? '/hoc' : '/admin';
    const primaryColor = userRole === 'HOC' ? 'purple' : 'orange';

    const [task, setTask] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [newSubtask, setNewSubtask] = useState('');
    const [isAddingSubtask, setIsAddingSubtask] = useState(false);
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editFormData, setEditFormData] = useState({});
    const [users, setUsers] = useState([]);
    const [cases, setCases] = useState([]);
    const [editingSubtaskId, setEditingSubtaskId] = useState(null);
    const [editingSubtaskText, setEditingSubtaskText] = useState('');
    const [caseDocuments, setCaseDocuments] = useState([]);
    const [loadingDocuments, setLoadingDocuments] = useState(false);
    const [showDocumentDrawer, setShowDocumentDrawer] = useState(false);
    const [showRemoveModal, setShowRemoveModal] = useState(false);
    const [documentToRemove, setDocumentToRemove] = useState(null);
    const [newComment, setNewComment] = useState('');
    const [replyingTo, setReplyingTo] = useState(null);
    const [replyText, setReplyText] = useState('');
    const [showAttachCaseModal, setShowAttachCaseModal] = useState(false);
    const [showDeleteSubtaskModal, setShowDeleteSubtaskModal] = useState(false);
    const [subtaskToDelete, setSubtaskToDelete] = useState(null);
    const [showMentionDropdown, setShowMentionDropdown] = useState(false);
    const [mentionSearch, setMentionSearch] = useState('');
    const [mentionStartPos, setMentionStartPos] = useState(0);
    const [commentTextareaRef] = useState(React.createRef());
    const [isLoadingEdit, setIsLoadingEdit] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isPostingComment, setIsPostingComment] = useState(false);

    useEffect(() => {
        fetchTask();
        fetchDropdownData(); // Fetch dropdown data once on mount
    }, [id]);

    const fetchTask = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/api/tasks/${id}`, {
                headers: { 'x-auth-token': token }
            });
            if (response.ok) {
                const data = await response.json();
                setTask(data);
                // Fetch case documents if task is linked to a case
                if (data.case?._id) {
                    fetchCaseDocuments(data.case._id);
                }
            }
        } catch (err) {
            console.error('Error fetching task:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchDropdownData = async () => {
        try {
            const token = localStorage.getItem('token');
            const [casesRes, usersRes] = await Promise.all([
                fetch(`${API_BASE_URL}/api/cases`, { headers: { 'x-auth-token': token } }),
                fetch(`${API_BASE_URL}/api/users/selectable`, { headers: { 'x-auth-token': token } })
            ]);

            if (casesRes.ok) {
                const casesData = await casesRes.json();
                setCases(casesData);
            }
            if (usersRes.ok) {
                const usersData = await usersRes.json();
                setUsers(usersData);
            }
        } catch (err) {
            console.error('Error fetching dropdown data:', err);
        }
    };

    const getCurrentUserId = () => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        return user?._id || user?.id;
    };

    const handleStatusChange = async (newStatus) => {
        setIsUpdatingStatus(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/api/tasks/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (response.ok) {
                const updatedTask = await response.json();
                setTask(updatedTask);
                // Refresh task data
                fetchTask();
            }
        } catch (err) {
            console.error('Error updating status:', err);
        } finally {
            setIsUpdatingStatus(false);
        }
    };

    const handleAddSubtask = async () => {
        if (!newSubtask.trim()) return;

        setIsAddingSubtask(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/api/tasks/${id}/subtasks`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token
                },
                body: JSON.stringify({ title: newSubtask })
            });

            if (response.ok) {
                const updatedTask = await response.json();
                setTask(updatedTask);
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
            const response = await fetch(`${API_BASE_URL}/api/tasks/${id}/subtasks/${subtaskId}`, {
                method: 'PATCH',
                headers: { 'x-auth-token': token }
            });

            if (response.ok) {
                const updatedTask = await response.json();
                setTask(updatedTask);
            }
        } catch (err) {
            console.error('Error toggling subtask:', err);
        }
    };

    const handleDeleteSubtask = async (subtaskId) => {
        setSubtaskToDelete(subtaskId);
        setShowDeleteSubtaskModal(true);
    };

    const confirmDeleteSubtask = async () => {
        if (!subtaskToDelete) return;

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/api/tasks/${id}/subtasks/${subtaskToDelete}`, {
                method: 'DELETE',
                headers: { 'x-auth-token': token }
            });

            if (response.ok) {
                const updatedTask = await response.json();
                setTask(updatedTask);
            }
        } catch (err) {
            console.error('Error deleting subtask:', err);
        } finally {
            setShowDeleteSubtaskModal(false);
            setSubtaskToDelete(null);
        }
    };

    const handleEditSubtask = (subtask) => {
        setEditingSubtaskId(subtask._id);
        setEditingSubtaskText(subtask.title);
    };

    const handleSaveSubtaskEdit = async () => {
        if (!editingSubtaskText.trim()) return;

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/api/tasks/${id}/subtasks/${editingSubtaskId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token
                },
                body: JSON.stringify({ title: editingSubtaskText })
            });

            if (response.ok) {
                const updatedTask = await response.json();
                setTask(updatedTask);
                setEditingSubtaskId(null);
                setEditingSubtaskText('');
            }
        } catch (err) {
            console.error('Error updating subtask:', err);
        }
    };

    const handleCancelSubtaskEdit = () => {
        setEditingSubtaskId(null);
        setEditingSubtaskText('');
    };

    const handleEditClick = async () => {
        // Show modal immediately - dropdown data already loaded on mount
        setEditFormData({
            name: task.name,
            description: task.description || '',
            priority: task.priority,
            status: task.status,
            assignedTo: task.assignedTo?.map(a => a._id) || [],
            collaborators: task.collaborators?.map(c => c._id) || [],
            caseId: task.case?._id || '',
            startDate: task.startDate ? new Date(task.startDate).toISOString().split('T')[0] : '',
            endDate: task.endDate ? new Date(task.endDate).toISOString().split('T')[0] : ''
        });
        setShowEditModal(true);
    };

    const toggleAssignee = (userId) => {
        setEditFormData(prev => {
            const current = prev.assignedTo || [];
            if (current.includes(userId)) {
                return { ...prev, assignedTo: current.filter(id => id !== userId) };
            } else {
                return { ...prev, assignedTo: [...current, userId] };
            }
        });
    };

    const toggleCollaborator = (userId) => {
        setEditFormData(prev => {
            const current = prev.collaborators || [];
            if (current.includes(userId)) {
                return { ...prev, collaborators: current.filter(id => id !== userId) };
            } else {
                return { ...prev, collaborators: [...current, userId] };
            }
        });
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/api/tasks/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token
                },
                body: JSON.stringify(editFormData)
            });

            if (response.ok) {
                const updatedTask = await response.json();
                setTask(updatedTask);
                setShowEditModal(false);
                // Refresh task data
                fetchTask();
            }
        } catch (err) {
            console.error('Error updating task:', err);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteConfirm = async () => {
        setIsDeleting(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/api/tasks/${id}`, {
                method: 'DELETE',
                headers: { 'x-auth-token': token }
            });

            if (response.ok) {
                navigate(`${rolePrefix}/tasks`);
            }
        } catch (err) {
            console.error('Error deleting task:', err);
        } finally {
            setIsDeleting(false);
        }
    };

    // Case Document Functions
    const fetchCaseDocuments = async (caseId) => {
        setLoadingDocuments(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_BASE_URL}/api/documents/case/${caseId}`, {
                headers: { 'x-auth-token': token }
            });
            setCaseDocuments(res.data);
        } catch (err) {
            console.error('Error fetching case documents:', err);
        }
        setLoadingDocuments(false);
    };

    const handleAddDocumentsToCase = async (selectedDocs) => {
        if (!task.case?._id) return;

        try {
            const token = localStorage.getItem('token');
            for (const doc of selectedDocs) {
                await axios.put(`${API_BASE_URL}/api/documents/${doc._id}/link-to-case`,
                    { caseId: task.case._id },
                    { headers: { 'x-auth-token': token } }
                );
            }
            fetchCaseDocuments(task.case._id);
        } catch (err) {
            console.error('Error adding documents to case:', err);
        }
    };

    const handleRemoveDocument = (doc) => {
        setDocumentToRemove(doc);
        setShowRemoveModal(true);
    };

    const confirmRemoveDocument = async () => {
        if (!documentToRemove || !task.case?._id) return;

        try {
            const token = localStorage.getItem('token');
            await axios.put(`${API_BASE_URL}/api/documents/${documentToRemove._id}/unlink-from-case`, {}, {
                headers: { 'x-auth-token': token }
            });
            fetchCaseDocuments(task.case._id);
            setShowRemoveModal(false);
            setDocumentToRemove(null);
        } catch (err) {
            console.error('Error removing document:', err);
            setShowRemoveModal(false);
            setDocumentToRemove(null);
        }
    };

    const getFileIcon = (type) => {
        const t = type.toLowerCase();
        if (['jpg', 'jpeg', 'png', 'gif'].includes(t)) return <ImageIcon className="w-6 h-6 text-purple-500" />;
        if (['pdf'].includes(t)) return <FileText className="w-6 h-6 text-red-500" />;
        if (['doc', 'docx'].includes(t)) return <FileText className="w-6 h-6 text-blue-500" />;
        if (['ppt', 'pptx'].includes(t)) return <FileText className="w-6 h-6 text-orange-500" />;
        if (['xls', 'xlsx'].includes(t)) return <FileText className="w-6 h-6 text-green-500" />;
        if (['mp4', 'mov', 'avi'].includes(t)) return <Video className="w-6 h-6 text-pink-500" />;
        if (['mp3', 'wav'].includes(t)) return <Music className="w-6 h-6 text-yellow-500" />;
        return <File className="w-6 h-6 text-gray-500" />;
    };

    const formatSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // Comment Functions
    const handleCommentChange = (e) => {
        const value = e.target.value;
        const cursorPos = e.target.selectionStart;
        setNewComment(value);

        // Check for @ mention
        const textBeforeCursor = value.substring(0, cursorPos);
        const lastAtIndex = textBeforeCursor.lastIndexOf('@');

        if (lastAtIndex !== -1) {
            const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
            // Check if there's no space after @
            if (!textAfterAt.includes(' ') && !textAfterAt.includes('\n')) {
                setMentionSearch(textAfterAt.toLowerCase());
                setMentionStartPos(lastAtIndex);
                setShowMentionDropdown(true);
            } else {
                setShowMentionDropdown(false);
            }
        } else {
            setShowMentionDropdown(false);
        }
    };

    const handleMentionSelect = (user) => {
        const beforeMention = newComment.substring(0, mentionStartPos);
        const afterMention = newComment.substring(commentTextareaRef.current.selectionStart);
        const newText = `${beforeMention}@${user.name} ${afterMention}`;
        const cursorPosition = beforeMention.length + user.name.length + 2; // +2 for @ and space

        setNewComment(newText);
        setShowMentionDropdown(false);
        setMentionSearch('');

        // Focus and set cursor position after the mention
        setTimeout(() => {
            if (commentTextareaRef.current) {
                commentTextareaRef.current.focus();
                commentTextareaRef.current.setSelectionRange(cursorPosition, cursorPosition);
            }
        }, 0);
    };

    const getTaskForceMembers = () => {
        if (!task) return [];
        const members = [];

        // Add task creator
        if (task.createdBy) {
            members.push(task.createdBy);
        }

        // Add assignees
        if (task.assignedTo) {
            task.assignedTo.forEach(user => {
                if (!members.find(m => m._id === user._id)) {
                    members.push(user);
                }
            });
        }

        // Add collaborators
        if (task.collaborators) {
            task.collaborators.forEach(user => {
                if (!members.find(m => m._id === user._id)) {
                    members.push(user);
                }
            });
        }

        return members;
    };

    const getFilteredMentionUsers = () => {
        const members = getTaskForceMembers();
        if (!mentionSearch) return members;
        return members.filter(user =>
            user.name.toLowerCase().includes(mentionSearch)
        );
    };

    const handleAddComment = async () => {
        if (!newComment.trim() || isPostingComment) return;

        setIsPostingComment(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(
                `${API_BASE_URL}/api/tasks/${id}/comments`,
                { text: newComment },
                { headers: { 'x-auth-token': token } }
            );

            // Update task with new comments
            setTask(prev => ({ ...prev, comments: response.data }));
            setNewComment('');
            setShowMentionDropdown(false);
        } catch (err) {
            console.error('Error adding comment:', err);
        } finally {
            setIsPostingComment(false);
        }
    };

    const handleAddReply = async (commentId) => {
        if (!replyText.trim()) return;

        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(
                `${API_BASE_URL}/api/tasks/${id}/comments/${commentId}/replies`,
                { text: replyText },
                { headers: { 'x-auth-token': token } }
            );

            // Update task with new comments
            setTask(prev => ({ ...prev, comments: response.data }));
            setReplyText('');
            setReplyingTo(null);
        } catch (err) {
            console.error('Error adding reply:', err);
        }
    };

    const handleDeleteComment = async (commentId) => {
        if (!window.confirm('Delete this comment?')) return;

        try {
            const token = localStorage.getItem('token');
            const response = await axios.delete(
                `${API_BASE_URL}/api/tasks/${id}/comments/${commentId}`,
                { headers: { 'x-auth-token': token } }
            );

            // Update task with updated comments
            setTask(prev => ({ ...prev, comments: response.data }));
        } catch (err) {
            console.error('Error deleting comment:', err);
        }
    };

    const handleDeleteReply = async (commentId, replyId) => {
        if (!window.confirm('Delete this reply?')) return;

        try {
            const token = localStorage.getItem('token');
            const response = await axios.delete(
                `${API_BASE_URL}/api/tasks/${id}/comments/${commentId}/replies/${replyId}`,
                { headers: { 'x-auth-token': token } }
            );

            // Update task with updated comments
            setTask(prev => ({ ...prev, comments: response.data }));
        } catch (err) {
            console.error('Error deleting reply:', err);
        }
    };

    const getInitials = (name) => {
        if (!name) return '?';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    const getAvatarColor = (index) => {
        const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500', 'bg-yellow-500', 'bg-red-500'];
        return colors[index % colors.length];
    };

    const formatCommentTime = (date) => {
        const now = new Date();
        const commentDate = new Date(date);
        const diffMs = now - commentDate;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return commentDate.toLocaleDateString();
    };

    if (isLoading) {
        return <LoadingSpinner message="Loading task details..." />;
    }

    if (!task) {
        return (
            <div className="p-6 max-w-7xl mx-auto">
                <div className="bg-white rounded-xl shadow-sm p-8 text-center border border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">Task Not Found</h3>
                    <p className="text-gray-500 mt-2">The task you're looking for doesn't exist.</p>
                    <button
                        onClick={() => navigate(`${rolePrefix}/tasks`)}
                        className="mt-4 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                    >
                        Back to Tasks
                    </button>
                </div>
            </div>
        );
    }

    const currentUserId = getCurrentUserId();
    const isOwner = task.createdBy?._id === currentUserId;
    const isAssignee = task.assignedTo?.some(a => a._id === currentUserId);
    const isCollaborator = task.collaborators?.some(c => c._id === currentUserId);

    const canManageSubtasks = isOwner || isAssignee || isCollaborator;
    const canEditDelete = isOwner;

    const completedSubtasks = task.subtasks?.filter(st => st.isCompleted).length || 0;
    const totalSubtasks = task.subtasks?.length || 0;
    const progress = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;

    const getStatusColor = (status) => {
        const colors = {
            'To-Do': 'bg-gray-100 text-gray-700',
            'Ongoing': 'bg-blue-100 text-blue-700',
            'Completed': 'bg-green-100 text-green-700',
            'Cancelled': 'bg-red-100 text-red-700',
            'Overdue': 'bg-orange-100 text-orange-700'
        };
        return colors[status] || 'bg-gray-100 text-gray-700';
    };

    const getPriorityColor = (priority) => {
        const colors = {
            'Low': 'text-green-600',
            'Medium': 'text-yellow-600',
            'High': 'text-red-600'
        };
        return colors[priority] || 'text-gray-600';
    };

    // Filter out current user from lists
    const availableUsers = users.filter(user => user._id !== currentUserId);

    // Filter out assigned users from collaborators list and vice versa
    const availableForAssignment = availableUsers.filter(user =>
        !editFormData.collaborators?.includes(user._id)
    );
    const availableForCollaboration = availableUsers.filter(user =>
        !editFormData.assignedTo?.includes(user._id)
    );

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="mb-6">
                <button
                    onClick={() => navigate(`${rolePrefix}/tasks`)}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                    Back to Tasks
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
                <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">{task.name}</h1>
                            <div className="flex items-center gap-3">
                                <span className={`text-sm px-3 py-1 rounded-full font-medium ${getStatusColor(task.status)}`}>
                                    {task.status}
                                </span>
                                <span className={`text-sm font-medium flex items-center gap-1 ${getPriorityColor(task.priority)}`}>
                                    <AlertCircle className="w-4 h-4" />
                                    {task.priority} Priority
                                </span>
                            </div>
                        </div>

                        {/* Status Dropdown and Action Buttons */}
                        <div className="flex gap-2 items-center">
                            <select
                                value={task.status}
                                onChange={(e) => handleStatusChange(e.target.value)}
                                disabled={isUpdatingStatus}
                                className="px-3 py-2 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 disabled:bg-gray-100"
                            >
                                {['To-Do', 'Ongoing', 'Completed', 'Cancelled', 'Overdue'].map(s => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                            {canEditDelete && (
                                <>
                                    <button
                                        onClick={handleEditClick}
                                        className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                                    >
                                        <Edit className="w-4 h-4" />
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => setShowDeleteModal(true)}
                                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        Delete
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Description under title */}
                    {task.description && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                            <p className="text-gray-600 whitespace-pre-wrap">{task.description}</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Case Details and Case Library */}
                <div className="lg:col-span-2 space-y-6 relative">
                    {/* Case Details Section - Always show, with overlay if no case attached */}
                    <div className={`bg-${primaryColor}-500 rounded-3xl p-8 text-white ${!task.case ? 'blur-sm' : ''}`}>
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                                <Briefcase className="w-6 h-6 text-white" />
                            </div>
                            <h2 className="text-2xl font-black">CASE DETAILS</h2>
                        </div>
                        <div className="space-y-4">
                            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
                                <p className="text-sm font-semibold text-white mb-1">Case Title</p>
                                <p className="text-sm text-white">{task.case?.caseTitle || 'No case attached'}</p>
                            </div>
                            {task.case?.summary && (
                                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
                                    <p className="text-sm font-semibold text-white mb-1">Summary of Issue</p>
                                    <p className="text-sm text-white whitespace-pre-wrap">{task.case.summary}</p>
                                </div>
                            )}
                            {task.case?.clientObjective && (
                                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
                                    <p className="text-sm font-semibold text-white mb-1">Client Objective</p>
                                    <p className="text-sm text-white">{task.case.clientObjective}</p>
                                </div>
                            )}
                            <div className="grid grid-cols-2 gap-4">
                                {task.case?.caseType && (
                                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
                                        <p className="text-sm font-semibold text-white mb-1">Case Type</p>
                                        <span className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
                                            {task.case.caseType}
                                        </span>
                                    </div>
                                )}
                                {task.case?.subCategory && (
                                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
                                        <p className="text-sm font-semibold text-white mb-1">Sub-category</p>
                                        <p className="text-sm text-white">{task.case.subCategory}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Case Library Section - Always show, with overlay if no case attached */}
                    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 ${!task.case ? 'blur-sm' : ''}`}>
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <FolderOpen className={`w-5 h-5 text-${primaryColor}-600`} />
                                <h3 className="text-lg font-semibold text-gray-900">Case Library</h3>
                                <span className={`px-2 py-1 text-xs bg-${primaryColor}-100 text-${primaryColor}-700 rounded-full`}>
                                    {caseDocuments.length} {caseDocuments.length === 1 ? 'Document' : 'Documents'}
                                </span>
                            </div>
                            <button
                                onClick={() => task.case && setShowDocumentDrawer(true)}
                                disabled={!task.case}
                                className={`flex items-center gap-2 px-4 py-2 bg-${primaryColor}-600 text-white font-semibold rounded-lg hover:bg-${primaryColor}-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed`}
                            >
                                <Plus size={20} />
                                Add Files
                            </button>
                        </div>

                        {loadingDocuments ? (
                            <div className="flex justify-center items-center h-32">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
                            </div>
                        ) : caseDocuments.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-32 text-gray-500">
                                <FolderOpen size={48} className="text-gray-300 mb-2" />
                                <p className="text-sm">No documents in this case library yet</p>
                                <p className="text-xs text-gray-400 mt-1">Click "Add Files" to get started</p>
                            </div>
                        ) : (
                            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                                {caseDocuments.map(doc => (
                                    <div key={doc._id} className="border border-gray-200 rounded-lg p-3 hover:border-orange-300 hover:shadow-sm transition-all">
                                        <div className="flex items-start gap-3">
                                            <div className="flex-shrink-0">
                                                {getFileIcon(doc.type)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-gray-800 truncate text-sm" title={doc.name}>
                                                    {doc.name}
                                                </p>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {formatSize(doc.size)} • {new Date(doc.createdAt).toLocaleDateString()}
                                                </p>
                                                <p className="text-xs text-gray-400 mt-1">
                                                    By: {doc.uploadedBy?.name || 'Unknown'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                                            <button
                                                onClick={() => window.open(doc.url, '_blank')}
                                                className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-xs bg-green-50 text-green-700 rounded hover:bg-green-100 transition-colors"
                                            >
                                                <Download size={14} />
                                                Download
                                            </button>
                                            <button
                                                onClick={() => handleRemoveDocument(doc)}
                                                className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-xs bg-red-50 text-red-700 rounded hover:bg-red-100 transition-colors"
                                            >
                                                <Trash2 size={14} />
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Single overlay message when no case is attached - covers both sections */}
                    {!task.case && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="bg-white rounded-xl shadow-lg px-5 py-4 text-center border-2 border-orange-500 pointer-events-auto">

                                <h3 className="text-base font-bold text-gray-900 mb-1">No Case Attached</h3>
                                <p className="text-sm text-gray-600 mb-3">This task is not attached to a case</p>
                                {canEditDelete && (
                                    <button
                                        onClick={() => setShowAttachCaseModal(true)}
                                        className="px-4 py-1.5 bg-orange-600 text-white text-sm rounded-lg hover:bg-orange-700 transition-colors font-semibold"
                                    >
                                        Attach to Case
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column - Subtasks and Task Details Sidebar */}
                <div className="space-y-6">
                    {/* Subtasks Section */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <CheckSquare className="w-6 h-6 text-orange-600" />
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

                        {/* Add Subtask Input */}
                        {canManageSubtasks && (
                            <div className="mb-4">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newSubtask}
                                        onChange={(e) => setNewSubtask(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleAddSubtask()}
                                        placeholder="Add a new subtask..."
                                        className="flex-1 px-3 py-2 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
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
                                        className="group flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg border border-gray-100 transition-colors"
                                    >
                                        {editingSubtaskId === subtask._id ? (
                                            // Edit Mode
                                            <>
                                                <input
                                                    type="text"
                                                    value={editingSubtaskText}
                                                    onChange={(e) => setEditingSubtaskText(e.target.value)}
                                                    onKeyPress={(e) => e.key === 'Enter' && handleSaveSubtaskEdit()}
                                                    className="flex-1 px-2 py-1 border text-black border-gray-300 rounded focus:ring-2 focus:ring-orange-500"
                                                    autoFocus
                                                />
                                                <button
                                                    onClick={handleSaveSubtaskEdit}
                                                    className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
                                                    title="Save"
                                                >
                                                    <Check className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={handleCancelSubtaskEdit}
                                                    className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                                                    title="Cancel"
                                                >
                                                    <X className="w-5 h-5" />
                                                </button>
                                            </>
                                        ) : (
                                            // View Mode
                                            <>
                                                <input
                                                    type="checkbox"
                                                    checked={subtask.isCompleted}
                                                    onChange={() => canManageSubtasks && handleToggleSubtask(subtask._id)}
                                                    disabled={!canManageSubtasks}
                                                    className="w-5 h-5 rounded text-orange-600 focus:ring-orange-500 cursor-pointer disabled:cursor-not-allowed"
                                                />
                                                <span className={`flex-1 ${subtask.isCompleted ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                                                    {subtask.title}
                                                </span>
                                                {subtask.isCompleted && (
                                                    <Check className="w-4 h-4 text-green-600" />
                                                )}
                                                {/* Edit and Delete buttons - shown on hover */}
                                                {canManageSubtasks && (
                                                    <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
                                                        <button
                                                            onClick={() => handleEditSubtask(subtask)}
                                                            className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                            title="Edit subtask"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteSubtask(subtask._id)}
                                                            className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                                                            title="Delete subtask"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-gray-500 italic text-center py-4">No subtasks yet</p>
                            )}
                        </div>
                    </div>

                    {/* Task Info */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Task Details</h3>
                        <div className="space-y-4">
                            {task.case && (
                                <div className="flex items-start gap-2">
                                    <Briefcase className="w-4 h-4 text-gray-400 mt-0.5" />
                                    <div>
                                        <p className="text-xs text-gray-500">Related Case</p>
                                        <p className="text-sm font-medium text-gray-900">{task.case.caseTitle}</p>
                                    </div>
                                </div>
                            )}

                            {/* Task Force Section - All people working on the task */}
                            <div>
                                <div className="flex items-start gap-2 mb-3">
                                    <Users className="w-4 h-4 text-gray-400 mt-0.5" />
                                    <p className="text-xs text-gray-500 font-semibold">Task Force</p>
                                </div>
                                <div className="space-y-2">
                                    {/* Owner */}
                                    {task.createdBy && (
                                        <div className="flex items-center justify-between p-2 bg-purple-50 rounded-lg border border-purple-100">
                                            <span className="text-sm text-gray-900">{task.createdBy.name}</span>
                                            <span className="px-2 py-0.5 text-xs font-semibold bg-purple-600 text-white rounded-full">
                                                Owner
                                            </span>
                                        </div>
                                    )}

                                    {/* Assignees */}
                                    {task.assignedTo && task.assignedTo.length > 0 && (
                                        <>
                                            {task.assignedTo.map(assignee => (
                                                <div key={assignee._id} className="flex items-center justify-between p-2 bg-green-50 rounded-lg border border-green-100">
                                                    <span className="text-sm text-gray-900">{assignee.name}</span>
                                                    <span className="px-2 py-0.5 text-xs font-semibold bg-green-600 text-white rounded-full">
                                                        Assignee
                                                    </span>
                                                </div>
                                            ))}
                                        </>
                                    )}

                                    {/* Collaborators */}
                                    {task.collaborators && task.collaborators.length > 0 && (
                                        <>
                                            {task.collaborators.map(collab => (
                                                <div key={collab._id} className="flex items-center justify-between p-2 bg-blue-50 rounded-lg border border-blue-100">
                                                    <span className="text-sm text-gray-900">{collab.name}</span>
                                                    <span className="px-2 py-0.5 text-xs font-semibold bg-blue-600 text-white rounded-full">
                                                        Collaborator
                                                    </span>
                                                </div>
                                            ))}
                                        </>
                                    )}

                                    {/* Empty state */}
                                    {!task.createdBy && (!task.assignedTo || task.assignedTo.length === 0) && (!task.collaborators || task.collaborators.length === 0) && (
                                        <div className="text-sm text-gray-500 italic text-center py-4">
                                            <p className="mb-2">No team members assigned yet.</p>
                                            {canEditDelete && (
                                                <button
                                                    onClick={handleEditClick}
                                                    className="text-orange-600 hover:text-orange-700 underline text-xs"
                                                >
                                                    Click here to assign team members
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                            {task.startDate && (
                                <div className="flex items-start gap-2">
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
                                <div className="flex items-start gap-2">
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
                    </div>
                </div>
            </div>

            {/* Comments Section - Full Width */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-6">
                <div className="flex items-center gap-3 mb-6">
                    <MessageCircle className="w-6 h-6 text-orange-600" />
                    <h3 className="text-xl font-bold text-gray-900">Comments & Updates</h3>
                    <span className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded-full">
                        {task.comments?.length || 0}
                    </span>
                </div>

                {/* Add Comment Input */}
                <div className="mb-6">
                    <div className="flex gap-3">
                        <div className={`w-10 h-10 rounded-full ${getAvatarColor(0)} flex items-center justify-center flex-shrink-0`}>
                            <span className="text-white font-semibold text-sm">
                                {getInitials(JSON.parse(localStorage.getItem('user') || '{}').name)}
                            </span>
                        </div>
                        <div className="flex-1 relative">
                            <textarea
                                ref={commentTextareaRef}
                                value={newComment}
                                onChange={handleCommentChange}
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey && !showMentionDropdown) {
                                        e.preventDefault();
                                        handleAddComment();
                                    }
                                }}
                                placeholder="Write a comment or update... (Type @ to mention someone)"
                                className="w-full px-4 py-3 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 resize-none"
                                rows="3"
                            />

                            {/* Mention Dropdown */}
                            {showMentionDropdown && (
                                <div className="absolute z-10 mt-1 w-full max-w-xs bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                    {getFilteredMentionUsers().length > 0 ? (
                                        getFilteredMentionUsers().map((user, index) => (
                                            <button
                                                key={user._id}
                                                onClick={() => handleMentionSelect(user)}
                                                className="w-full px-4 py-2 text-left hover:bg-orange-50 transition-colors flex items-center gap-3 border-b last:border-b-0"
                                            >
                                                <div className={`w-8 h-8 rounded-full ${getAvatarColor(index)} flex items-center justify-center flex-shrink-0`}>
                                                    <span className="text-white font-semibold text-xs">
                                                        {getInitials(user.name)}
                                                    </span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                                                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                                                </div>
                                            </button>
                                        ))
                                    ) : (
                                        <div className="px-4 py-3 text-sm text-gray-500 text-center">
                                            No members found
                                        </div>
                                    )}
                                </div>
                            )}
                            <div className="flex justify-end mt-2">
                                <button
                                    onClick={handleAddComment}
                                    disabled={!newComment.trim() || isPostingComment}
                                    className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                                >
                                    <Send className="w-4 h-4" />
                                    {isPostingComment ? 'Posting...' : 'Post Comment'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Comments List */}
                <div className="space-y-6">
                    {task.comments && task.comments.length > 0 ? (
                        [...task.comments].reverse().map((comment, commentIndex) => (
                            <div key={comment._id} className="border-b border-gray-100 pb-6 last:border-0">
                                {/* Comment */}
                                <div className="flex gap-3">
                                    <div className={`w-10 h-10 rounded-full ${getAvatarColor(commentIndex)} flex items-center justify-center flex-shrink-0`}>
                                        <span className="text-white font-semibold text-sm">
                                            {getInitials(comment.user?.name)}
                                        </span>
                                    </div>
                                    <div className="flex-1">
                                        <div className="bg-gray-50 rounded-2xl px-4 py-3">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="font-semibold text-gray-900 text-sm">{comment.user?.name}</span>
                                                {comment.user?._id === getCurrentUserId() && (
                                                    <button
                                                        onClick={() => handleDeleteComment(comment._id)}
                                                        className="text-red-500 hover:text-red-700 transition-colors"
                                                        title="Delete comment"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                            <p className="text-gray-700 text-sm whitespace-pre-wrap">{comment.text}</p>
                                        </div>
                                        <div className="flex items-center gap-4 mt-2 px-2">
                                            <span className="text-xs text-gray-500">{formatCommentTime(comment.createdAt)}</span>
                                            <button
                                                onClick={() => setReplyingTo(comment._id)}
                                                className="text-xs font-semibold text-orange-600 hover:text-orange-700"
                                            >
                                                Reply
                                            </button>
                                        </div>

                                        {/* Reply Input */}
                                        {replyingTo === comment._id && (
                                            <div className="mt-3 ml-4 flex gap-2">
                                                <input
                                                    type="text"
                                                    value={replyText}
                                                    onChange={(e) => setReplyText(e.target.value)}
                                                    onKeyPress={(e) => {
                                                        if (e.key === 'Enter') {
                                                            handleAddReply(comment._id);
                                                        }
                                                    }}
                                                    placeholder="Write a reply..."
                                                    className="flex-1 px-3 py-2 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-sm"
                                                    autoFocus
                                                />
                                                <button
                                                    onClick={() => handleAddReply(comment._id)}
                                                    className="px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm"
                                                >
                                                    <Send className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setReplyingTo(null);
                                                        setReplyText('');
                                                    }}
                                                    className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )}

                                        {/* Replies */}
                                        {comment.replies && comment.replies.length > 0 && (
                                            <div className="mt-4 ml-4 space-y-3 border-l-2 border-gray-200 pl-4">
                                                {comment.replies.map((reply, replyIndex) => (
                                                    <div key={reply._id} className="flex gap-2">
                                                        <div className={`w-8 h-8 rounded-full ${getAvatarColor(replyIndex + 10)} flex items-center justify-center flex-shrink-0`}>
                                                            <span className="text-white font-semibold text-xs">
                                                                {getInitials(reply.user?.name)}
                                                            </span>
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="bg-gray-50 rounded-xl px-3 py-2">
                                                                <div className="flex items-center justify-between mb-1">
                                                                    <span className="font-semibold text-gray-900 text-xs">{reply.user?.name}</span>
                                                                    {reply.user?._id === getCurrentUserId() && (
                                                                        <button
                                                                            onClick={() => handleDeleteReply(comment._id, reply._id)}
                                                                            className="text-red-500 hover:text-red-700 transition-colors"
                                                                            title="Delete reply"
                                                                        >
                                                                            <Trash2 className="w-3 h-3" />
                                                                        </button>
                                                                    )}
                                                                </div>
                                                                <p className="text-gray-700 text-xs whitespace-pre-wrap">{reply.text}</p>
                                                            </div>
                                                            <span className="text-xs text-gray-500 mt-1 inline-block px-2">{formatCommentTime(reply.createdAt)}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-12">
                            <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500">No comments yet. Be the first to comment!</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Edit Modal */}
            <EditTaskModal
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                onSubmit={handleEditSubmit}
                formData={editFormData}
                setFormData={setEditFormData}
                task={task}
                cases={cases}
                availableForAssignment={availableForAssignment}
                availableForCollaboration={availableForCollaboration}
                toggleAssignee={toggleAssignee}
                toggleCollaborator={toggleCollaborator}
                isLoading={isLoadingEdit}
                isSaving={isSaving}
            />

            {/* Delete Confirmation Modal */}
            <DeleteTaskModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleDeleteConfirm}
                taskName={task.name}
                isDeleting={isDeleting}
            />

            {/* Document Selector Drawer */}
            {task.case && (
                <DocumentSelectorDrawer
                    isOpen={showDocumentDrawer}
                    onClose={() => setShowDocumentDrawer(false)}
                    onSelectDocuments={handleAddDocumentsToCase}
                    caseId={task.case._id}
                />
            )}

            {/* Remove Document Confirmation Modal */}
            <RemoveDocumentModal
                isOpen={showRemoveModal}
                onClose={() => {
                    setShowRemoveModal(false);
                    setDocumentToRemove(null);
                }}
                onConfirm={confirmRemoveDocument}
                documentName={documentToRemove?.name}
            />

            {/* Attach Case Modal */}
            <AttachCaseModal
                isOpen={showAttachCaseModal}
                onClose={() => setShowAttachCaseModal(false)}
                onAttach={() => window.location.reload()}
                taskId={id}
            />

            {/* Delete Subtask Confirmation Modal */}
            {showDeleteSubtaskModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                                    <Trash2 className="w-6 h-6 text-red-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">Delete Subtask?</h3>
                                    <p className="text-sm text-gray-600">This action cannot be undone</p>
                                </div>
                            </div>
                            <p className="text-gray-700 mb-6">
                                Are you sure you want to delete this subtask? This will permanently remove it from the task.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setShowDeleteSubtaskModal(false);
                                        setSubtaskToDelete(null);
                                    }}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDeleteSubtask}
                                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TaskDetails;
