import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckSquare, Plus, Calendar, User, Briefcase, Clock, AlertCircle, X, Search } from 'lucide-react';
import LoadingSpinner from '../../components/AdminOfficer/LoadingSpinner';
import AddTaskModal from '../../components/Modals/AddTaskModal';
import API_BASE_URL from '../../../config/api';


const Tasks = () => {
    const navigate = useNavigate();
    const [tasks, setTasks] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('my_tasks'); // 'my_tasks', 'assigned', 'joint'
    const [showModal, setShowModal] = useState(false);
    const [initialStatus, setInitialStatus] = useState('To-Do');
    const [draggedTask, setDraggedTask] = useState(null);
    const [dragOverColumn, setDragOverColumn] = useState(null);

    useEffect(() => {
        fetchTasks();
    }, [activeTab]);

    const fetchTasks = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/api/tasks?type=${activeTab}`, {
                headers: { 'x-auth-token': token }
            });
            if (response.ok) {
                const data = await response.json();
                setTasks(data);
            }
        } catch (err) {
            console.error('Error fetching tasks:', err);
        } finally {
            setIsLoading(false);
        }
    };

    // Drag and Drop Handlers
    const handleDragStart = (e, task) => {
        setDraggedTask(task);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', e.target);
        // Add slight opacity to dragged item
        e.target.style.opacity = '0.5';
    };

    const handleDragEnd = (e) => {
        e.target.style.opacity = '1';
        setDraggedTask(null);
        setDragOverColumn(null);
    };

    const handleDragOver = (e) => {
        e.preventDefault(); // Necessary to allow drop
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDragEnter = (columnId) => {
        setDragOverColumn(columnId);
    };

    const handleDragLeave = () => {
        setDragOverColumn(null);
    };

    const handleDrop = async (e, targetStatus) => {
        e.preventDefault();
        setDragOverColumn(null);

        if (!draggedTask || draggedTask.status === targetStatus) {
            return; // No change needed
        }

        // Optimistic update
        const updatedTasks = tasks.map(t =>
            t._id === draggedTask._id ? { ...t, status: targetStatus } : t
        );
        setTasks(updatedTasks);

        // Update on backend
        try {
            const token = localStorage.getItem('token');
            await fetch(`${API_BASE_URL}/api/tasks/${draggedTask._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token
                },
                body: JSON.stringify({ status: targetStatus })
            });
        } catch (err) {
            console.error('Error updating task status:', err);
            // Revert on error
            fetchTasks();
        }

        setDraggedTask(null);
    };

    const handleTaskClick = (taskId) => {
        navigate(`/admin/tasks/${taskId}`);
    };

    // Kanban Helper Functions
    const getPriorityBadgeColor = (priority) => {
        const colors = {
            Low: 'bg-blue-100 text-blue-700',
            Medium: 'bg-yellow-100 text-yellow-700',
            High: 'bg-red-100 text-red-700'
        };
        return colors[priority] || 'bg-gray-100 text-gray-700';
    };

    const getInitials = (name) => {
        if (!name) return '?';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    const getAvatarColor = (index) => {
        const colors = [
            'bg-purple-500',
            'bg-blue-500',
            'bg-green-500',
            'bg-yellow-500',
            'bg-pink-500',
            'bg-indigo-500'
        ];
        return colors[index % colors.length];
    };

    // Group tasks by status
    const groupedTasks = {
        'To-Do': tasks.filter(t => t.status === 'To-Do'),
        'Ongoing': tasks.filter(t => t.status === 'Ongoing' || t.status === 'In-Progress'),
        'Completed': tasks.filter(t => t.status === 'Completed'),
        'Cancelled': tasks.filter(t => t.status === 'Cancelled'),
        'Overdue': tasks.filter(t => {
            if (t.status === 'Completed' || t.status === 'Cancelled') return false;
            if (!t.endDate) return false;
            return new Date(t.endDate) < new Date();
        })
    };

    const columns = [
        { id: 'To-Do', label: 'To Do', hasAddNew: true },
        { id: 'Ongoing', label: 'Ongoing', hasAddNew: true },
        { id: 'Completed', label: 'Completed', hasAddNew: false },
        { id: 'Cancelled', label: 'Cancelled', hasAddNew: false },
        { id: 'Overdue', label: 'Overdue', hasAddNew: false }
    ];

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <CheckSquare className="w-6 h-6 text-orange-600" />
                        Task Management
                    </h1>
                    <p className="text-gray-600 mt-1">Track and manage your tasks and assignments</p>
                </div>
                <button
                    onClick={() => {
                        setInitialStatus('To-Do');
                        setShowModal(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                >
                    <Plus className="w-5 h-5" />
                    Add Task
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-gray-200 mb-6">
                {[
                    { id: 'my_tasks', label: 'My Tasks' },
                    { id: 'assigned', label: 'Assigned to Me' },
                    { id: 'joint', label: 'Joint Tasks' }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id
                            ? 'border-orange-600 text-orange-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Kanban Board */}
            {isLoading ? (
                <LoadingSpinner message="Loading tasks..." />
            ) : tasks.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm p-8 text-center border border-gray-200">
                    <CheckSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <h3 className="text-lg font-medium text-gray-900">No Tasks Found</h3>
                    <p className="text-gray-500">You don't have any tasks in this category yet.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {columns.map((column) => (
                        <div key={column.id} className="flex flex-col">
                            {/* Column Header */}
                            <div className="mb-4 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <h3 className="font-semibold text-gray-900">{column.label}</h3>
                                    <span className="px-2 py-0.5 text-xs font-medium bg-gray-200 text-gray-700 rounded-full">
                                        {groupedTasks[column.id].length}
                                    </span>
                                </div>
                            </div>

                            {/* Column Content */}
                            <div
                                className={`space-y-3 min-h-[200px] p-2 rounded-lg transition-colors ${dragOverColumn === column.id ? 'bg-orange-50 border-2 border-dashed border-orange-400' : ''
                                    }`}
                                onDragOver={handleDragOver}
                                onDragEnter={() => handleDragEnter(column.id)}
                                onDragLeave={handleDragLeave}
                                onDrop={(e) => handleDrop(e, column.id)}
                            >
                                {groupedTasks[column.id].map((task) => (
                                    <div
                                        key={task._id}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, task)}
                                        onDragEnd={handleDragEnd}
                                        onClick={() => handleTaskClick(task._id)}
                                        className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-md transition-all cursor-move"
                                    >
                                        {/* Task Title */}
                                        <h4 className="text-sm font-medium text-gray-900 mb-3 line-clamp-2">
                                            {task.name}
                                        </h4>

                                        {/* Priority and Category Badges */}
                                        <div className="flex flex-wrap gap-2 mb-3">
                                            <span className={`px-2 py-1 text-xs font-medium rounded ${getPriorityBadgeColor(task.priority)}`}>
                                                {task.priority}
                                            </span>
                                            {task.case && (
                                                <span className="px-2 py-1 text-xs font-medium rounded bg-purple-100 text-purple-700">
                                                    {task.case.caseTitle.length > 15 ? task.case.caseTitle.slice(0, 15) + '...' : task.case.caseTitle}
                                                </span>
                                            )}
                                        </div>

                                        {/* Date and Avatars */}
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-1 text-xs text-gray-500">
                                                <Calendar className="w-3 h-3" />
                                                <span>
                                                    {task.startDate && task.endDate
                                                        ? `${new Date(task.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${new Date(task.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                                                        : task.endDate
                                                            ? new Date(task.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                                                            : 'No date'
                                                    }
                                                </span>
                                            </div>

                                            {/* Assignee Avatars */}
                                            <div className="flex -space-x-2">
                                                {task.assignedTo && (
                                                    <div
                                                        className={`w-6 h-6 rounded-full ${getAvatarColor(0)} border-2 border-white flex items-center justify-center text-[10px] font-bold text-white`}
                                                        title={task.assignedTo.name}
                                                    >
                                                        {getInitials(task.assignedTo.name)}
                                                    </div>
                                                )}
                                                {task.collaborators && task.collaborators.slice(0, 2).map((collab, idx) => (
                                                    <div
                                                        key={idx}
                                                        className={`w-6 h-6 rounded-full ${getAvatarColor(idx + 1)} border-2 border-white flex items-center justify-center text-[10px] font-bold text-white`}
                                                        title={collab.name}
                                                    >
                                                        {getInitials(collab.name)}
                                                    </div>
                                                ))}
                                                {task.collaborators && task.collaborators.length > 2 && (
                                                    <div className="w-6 h-6 rounded-full bg-gray-300 border-2 border-white flex items-center justify-center text-[10px] font-bold text-gray-700">
                                                        +{task.collaborators.length - 2}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {/* Add New Button */}
                                {column.hasAddNew && (
                                    <button
                                        onClick={() => {
                                            setInitialStatus(column.id);
                                            setShowModal(true);
                                        }}
                                        className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Add New
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add Task Modal */}
            <AddTaskModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                onSuccess={fetchTasks}
                initialStatus={initialStatus}
            />
        </div>
    );
};

export default Tasks;
