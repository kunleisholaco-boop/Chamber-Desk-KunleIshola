import React, { useState, useEffect } from 'react';
import { Briefcase, DollarSign, FileText, Ticket, Upload, Bell, Users, ArrowRight, Plus, Calendar, CheckSquare, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../../components/AdminOfficer/LoadingSpinner';
import API_BASE_URL from '../../config/api';

const Home = () => {
    const navigate = useNavigate();
    const [userName, setUserName] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState({
        totalClients: 0,
        totalCases: 0,
        totalFunds: 0,
        totalDocuments: 0,
        totalTickets: 0,
        activeClients: 0
    });
    const [recentCases, setRecentCases] = useState([]);
    const [recentClients, setRecentClients] = useState([]);
    const [recentRequisitions, setRecentRequisitions] = useState([]);
    const [recentNotifications, setRecentNotifications] = useState([]);
    const [recentTickets, setRecentTickets] = useState({ complaints: [], featureRequests: [] });
    const [activeTicketTab, setActiveTicketTab] = useState('complaints');
    const [unreadCount, setUnreadCount] = useState(0);
    const [activeRecentTab, setActiveRecentTab] = useState('cases');
    const [upcomingMeetings, setUpcomingMeetings] = useState([]);
    const [recentBroadcasts, setRecentBroadcasts] = useState([]);
    const [myTasks, setMyTasks] = useState([]);

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        setUserName(user.name || 'User');
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('token');
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const userId = user.id;

            // Clients
            const clientsRes = await fetch(`${API_BASE_URL}/api/clients`, {
                headers: { 'x-auth-token': token }
            });
            if (clientsRes.ok) {
                const clients = await clientsRes.json();
                const activeClients = clients.filter(c => c.status === 'Active').length;
                setStats(prev => ({ ...prev, totalClients: clients.length, activeClients }));
                setRecentClients(clients.slice(0, 5));
            }

            // Cases - Only fetch cases assigned to this HOC
            const casesRes = await fetch(`${API_BASE_URL}/api/cases`, {
                headers: { 'x-auth-token': token }
            });
            if (casesRes.ok) {
                const allCases = await casesRes.json();

                // Filter cases assigned to this HOC
                const assignedCases = allCases.filter(caseItem =>
                    caseItem.assignedTo && (caseItem.assignedTo._id === userId || caseItem.assignedTo === userId)
                );

                setStats(prev => ({ ...prev, totalCases: assignedCases.length }));
                setRecentCases(assignedCases.slice(0, 5));
            }

            // Fund Requisitions
            const fundsRes = await fetch(`${API_BASE_URL}/api/funds`, {
                headers: { 'x-auth-token': token }
            });
            if (fundsRes.ok) {
                const funds = await fundsRes.json();
                setStats(prev => ({ ...prev, totalFunds: funds.length }));
                setRecentRequisitions(funds.slice(0, 5));
            }

            // Documents - Filter by uploadedBy or sharedWith
            const docsRes = await fetch(`${API_BASE_URL}/api/documents`, {
                headers: { 'x-auth-token': token }
            });
            if (docsRes.ok) {
                const allDocs = await docsRes.json();
                const userDocs = allDocs.filter(doc =>
                    (doc.uploadedBy && (doc.uploadedBy._id === userId || doc.uploadedBy === userId)) ||
                    (doc.sharedWith && doc.sharedWith.some(u => (u._id === userId || u === userId)))
                );
                setStats(prev => ({ ...prev, totalDocuments: userDocs.length }));
            }

            // Support Tickets
            const ticketsRes = await fetch(`${API_BASE_URL}/api/support`, {
                headers: { 'x-auth-token': token }
            });
            if (ticketsRes.ok) {
                const tickets = await ticketsRes.json();
                setStats(prev => ({ ...prev, totalTickets: tickets.length }));

                // Split into complaints and feature requests
                const complaints = tickets.filter(t => t.type === 'Complaint').slice(0, 5);
                const featureRequests = tickets.filter(t => t.type === 'Feature Request').slice(0, 5);
                setRecentTickets({ complaints, featureRequests });
            }

            // Notifications
            const notifRes = await fetch(`${API_BASE_URL}/api/notifications`, {
                headers: { 'x-auth-token': token }
            });
            if (notifRes.ok) {
                const notifications = await notifRes.json();
                setRecentNotifications(notifications.slice(0, 5));
                const unread = notifications.filter(n => !n.read).length;
                setUnreadCount(unread);
            }

            // Upcoming Meetings
            // Upcoming Meetings
            const meetingsRes = await fetch(`${API_BASE_URL}/api/meetings`, {
                headers: { 'x-auth-token': token }
            });
            if (meetingsRes.ok) {
                const meetings = await meetingsRes.json();
                const now = new Date();
                const sevenDaysFromNow = new Date();
                sevenDaysFromNow.setDate(now.getDate() + 7);

                const upcoming = meetings
                    .filter(m => {
                        const isCreator = m.createdBy && (m.createdBy._id === userId || m.createdBy === userId);

                        // Combine date and time into a single DateTime
                        const meetingDate = new Date(m.date);
                        if (m.time) {
                            const [hours, minutes] = m.time.split(':');
                            meetingDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
                        }

                        const isFuture = meetingDate > now;
                        const isWithinSevenDays = meetingDate <= sevenDaysFromNow;
                        return (isFuture && isWithinSevenDays && m.status !== 'cancelled') || isCreator;
                    })
                    .sort((a, b) => new Date(a.date) - new Date(b.date))
                    .slice(0, 5);
                setUpcomingMeetings(upcoming);
            }

            // Recent Broadcasts
            const broadcastsRes = await fetch(`${API_BASE_URL}/api/broadcasts`, {
                headers: { 'x-auth-token': token }
            });
            if (broadcastsRes.ok) {
                const broadcasts = await broadcastsRes.json();
                setRecentBroadcasts(broadcasts.slice(0, 5));
            }

            // My Tasks (close to due date)
            const tasksRes = await fetch(`${API_BASE_URL}/api/tasks/my-tasks`, {
                headers: { 'x-auth-token': token }
            });
            if (tasksRes.ok) {
                const tasks = await tasksRes.json();
                const now = new Date();
                const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
                const tasksDueSoon = tasks
                    .filter(t => {
                        if (!t.endDate) return false;
                        const dueDate = new Date(t.endDate);
                        return dueDate >= now && dueDate <= sevenDaysFromNow && t.status !== 'Completed';
                    })
                    .sort((a, b) => new Date(a.endDate) - new Date(b.endDate))
                    .slice(0, 5);
                setMyTasks(tasksDueSoon);
            }
        } catch (err) {
            console.error('Error fetching dashboard data:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });

    const getStatusColor = (status) => {
        const colors = {
            Pending: 'bg-yellow-100 text-yellow-800',
            Assigned: 'bg-blue-100 text-blue-800',
            Approved: 'bg-green-100 text-green-800',
            Rejected: 'bg-red-100 text-red-800',
            Open: 'bg-green-100 text-green-800',
            Closed: 'bg-gray-100 text-gray-800',
            'Awaiting Reply': 'bg-yellow-100 text-yellow-800',
            'Fixing': 'bg-blue-100 text-blue-800',
            'Fixed': 'bg-green-100 text-green-800',
            'Sent': 'bg-purple-100 text-purple-800',
            'Seen': 'bg-emerald-100 text-emerald-800',
            'Implementing': 'bg-blue-100 text-blue-800',
            'Added': 'bg-green-100 text-green-800',
            'Not Added': 'bg-gray-100 text-gray-800'
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    const getPriorityColor = (priority) => {
        const colors = {
            Low: 'bg-blue-100 text-blue-800',
            Medium: 'bg-yellow-100 text-yellow-800',
            High: 'bg-red-100 text-red-800'
        };
        return colors[priority] || 'bg-gray-100 text-gray-800';
    };

    const getDaysUntilDue = (endDate) => {
        const now = new Date();
        const due = new Date(endDate);
        const diffTime = due - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays === 0) return 'Due today';
        if (diffDays === 1) return 'Due tomorrow';
        if (diffDays < 0) return 'Overdue';
        return `Due in ${diffDays} days`;
    };

    const formatTime = (time) => {
        if (!time) return '';
        const [hours, minutes] = time.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const hour12 = hour % 12 || 12;
        return `${hour12}:${minutes} ${ampm}`;
    };

    return (
        <div className='p-6'>
            {isLoading ? (
                <LoadingSpinner message="Loading dashboard data..." color="purple" />
            ) : (
                <>
                    <div className="mb-6 flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl md:text-3xl text-black font-bold mb-2">Welcome HOC, {userName}</h1>
                            <p className="text-slate-600">Here's an overview of your chambers</p>
                        </div>
                        <div className='flex items-center gap-4'>
                            <button
                                onClick={() => navigate('/hoc/notifications')}
                                className="hidden md:block relative p-3 rounded-full hover:bg-gray-100 transition-colors"
                                title="Notifications"
                            >
                                <Bell className="w-6 h-6 text-gray-700" />
                                {unreadCount > 0 && (
                                    <span className="absolute top-1 right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                                        {unreadCount}
                                    </span>
                                )}
                            </button>
                            <div className="text-right hidden md:block border border-gray-200 rounded p-3">
                                <p className="text-sm font-medium text-gray-900">
                                    {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                </p>
                            </div>

                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="mb-8">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                            <button
                                onClick={() => navigate('/hoc/cases/add')}
                                className="bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-xl p-3 md:p-6 shadow-md hover:shadow-lg transition-all flex flex-col items-center gap-3"
                            >
                                <div className="p-3 bg-white/20 rounded-lg">
                                    <Plus className="w-6 h-6" />
                                </div>
                                <span className="font-semibold text-sm">Add Case</span>
                            </button>
                            <button
                                onClick={() => navigate('/hoc/meetings/schedule')}
                                className="bg-gradient-to-br from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-xl p-3 md:p-6 shadow-md hover:shadow-lg transition-all flex flex-col items-center gap-3"
                            >
                                <div className="p-3 bg-white/20 rounded-lg">
                                    <Calendar className="w-6 h-6" />
                                </div>
                                <span className="font-semibold text-sm">Schedule Meeting</span>
                            </button>
                            <button
                                onClick={() => navigate('/hoc/tasks/add')}
                                className="bg-gradient-to-br from-purple-700 to-purple-800 hover:from-purple-800 hover:to-purple-900 text-white rounded-xl p-3 md:p-6 shadow-md hover:shadow-lg transition-all flex flex-col items-center gap-3"
                            >
                                <div className="p-3 bg-white/20 rounded-lg">
                                    <CheckSquare className="w-6 h-6" />
                                </div>
                                <span className="font-semibold text-sm">Add Task</span>
                            </button>
                            <button
                                onClick={() => navigate('/hoc/funds/request')}
                                className="bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-xl p-3 md:p-6 shadow-md hover:shadow-lg transition-all flex flex-col items-center gap-3"
                            >
                                <div className="p-3 bg-white/20 rounded-lg">
                                    <DollarSign className="w-6 h-6" />
                                </div>
                                <span className="font-semibold text-sm">Request Funds</span>
                            </button>
                            <button
                                onClick={() => navigate('/hoc/documents')}
                                className="bg-gradient-to-br from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-xl p-3 md:p-6 shadow-md hover:shadow-lg transition-all flex flex-col items-center gap-3"
                            >
                                <div className="p-3 bg-white/20 rounded-lg">
                                    <Upload className="w-6 h-6" />
                                </div>
                                <span className="font-semibold text-sm">Upload Document</span>
                            </button>
                        </div>
                    </div>

                    {/* Statistics Cards - 2 Columns */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-8">
                        {/* Column 1 */}
                        <div className="space-y-4 md:space-y-6">
                            {/* Total Clients */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600 mb-1">Total Clients</p>
                                        <p className="text-3xl font-bold text-gray-900">{stats.totalClients}</p>
                                    </div>
                                    <div className="p-3 bg-blue-100 rounded-lg"><Users className="w-6 h-6 text-blue-600" /></div>
                                </div>
                            </div>
                            {/* Active Clients */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600 mb-1">Active Clients</p>
                                        <p className="text-3xl font-bold text-gray-900">{stats.activeClients}</p>
                                    </div>
                                    <div className="p-3 bg-green-100 rounded-lg"><Users className="w-6 h-6 text-green-600" /></div>
                                </div>
                            </div>
                            {/* Fund Requisitions */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600 mb-1">Fund Requisitions</p>
                                        <p className="text-3xl font-bold text-gray-900">{stats.totalFunds}</p>
                                    </div>
                                    <div className="p-3 bg-yellow-100 rounded-lg"><DollarSign className="w-6 h-6 text-yellow-600" /></div>
                                </div>
                            </div>
                        </div>

                        {/* Column 2 */}
                        <div className="space-y-4 md:space-y-6">
                            {/* Total Cases */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600 mb-1">Total Cases</p>
                                        <p className="text-3xl font-bold text-gray-900">{stats.totalCases}</p>
                                    </div>
                                    <div className="p-3 bg-purple-100 rounded-lg"><Briefcase className="w-6 h-6 text-purple-600" /></div>
                                </div>
                            </div>
                            {/* Support Tickets */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600 mb-1">Support Tickets</p>
                                        <p className="text-3xl font-bold text-gray-900">{stats.totalTickets}</p>
                                    </div>
                                    <div className="p-3 bg-red-100 rounded-lg"><Ticket className="w-6 h-6 text-red-600" /></div>
                                </div>
                            </div>
                            {/* Documents */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600 mb-1">Documents</p>
                                        <p className="text-3xl font-bold text-gray-900">{stats.totalDocuments}</p>
                                    </div>
                                    <div className="p-3 bg-orange-100 rounded-lg"><FileText className="w-6 h-6 text-orange-600" /></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Important Sections Grid - 3 columns */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8">
                        {/* Upcoming Meetings */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-5 h-5 text-purple-600" />
                                    <h3 className="font-semibold text-gray-900">Upcoming Meetings</h3>
                                </div>
                                <button
                                    onClick={() => navigate('/hoc/meetings')}
                                    className="text-xs text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
                                >
                                    View More <ArrowRight size={12} />
                                </button>
                            </div>
                            <div className="p-4">
                                {upcomingMeetings.length === 0 ? (
                                    <p className="text-sm text-gray-500 text-center py-4">No upcoming meetings</p>
                                ) : (
                                    <div className="space-y-3">
                                        {upcomingMeetings.map(meeting => (
                                            <div key={meeting._id} onClick={() => navigate('/hoc/meetings')} className="border-b border-gray-100 pb-3 last:border-0 last:pb-0 cursor-pointer hover:bg-gray-50 -mx-4 px-4 py-2 rounded transition-colors">
                                                <p className="text-sm font-medium text-gray-900 line-clamp-1">{meeting.title}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Clock className="w-3 h-3 text-gray-400" />
                                                    <p className="text-xs text-gray-500">
                                                        {formatDate(meeting.date)} at {formatTime(meeting.time)}
                                                    </p>
                                                </div>
                                                <p className="text-xs text-gray-600 mt-1">
                                                    {meeting.type === 'Physical' ? `📍 ${meeting.location}` : '💻 Online'}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Recent Broadcasts */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Bell className="w-5 h-5 text-purple-600" />
                                    <h3 className="font-semibold text-gray-900">Recent Broadcasts</h3>
                                </div>
                                <button
                                    onClick={() => navigate('/hoc/broadcast')}
                                    className="text-xs text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
                                >
                                    View More <ArrowRight size={12} />
                                </button>
                            </div>
                            <div className="p-4">
                                {recentBroadcasts.length === 0 ? (
                                    <p className="text-sm text-gray-500 text-center py-4">No broadcasts yet</p>
                                ) : (
                                    <div className="space-y-3">
                                        {recentBroadcasts.map(broadcast => (
                                            <div key={broadcast._id} onClick={() => navigate('/hoc/broadcast')} className="border-b border-gray-100 pb-3 last:border-0 last:pb-0 cursor-pointer hover:bg-gray-50 -mx-4 px-4 py-2 rounded transition-colors">
                                                <p className="text-sm font-medium text-gray-900 line-clamp-1">{broadcast.title}</p>
                                                <p className="text-xs text-gray-600 mt-1 line-clamp-2">{broadcast.message}</p>
                                                <p className="text-xs text-gray-500 mt-1">{formatDate(broadcast.createdAt)}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* My Tasks (Due Soon) */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <CheckSquare className="w-5 h-5 text-purple-600" />
                                    <h3 className="font-semibold text-gray-900">My Tasks (Due Soon)</h3>
                                </div>
                                <button
                                    onClick={() => navigate('/hoc/tasks')}
                                    className="text-xs text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
                                >
                                    View More <ArrowRight size={12} />
                                </button>
                            </div>
                            <div className="p-4">
                                {myTasks.length === 0 ? (
                                    <p className="text-sm text-gray-500 text-center py-4">No tasks due soon</p>
                                ) : (
                                    <div className="space-y-3">
                                        {myTasks.map(task => (
                                            <div key={task._id} onClick={() => navigate('/hoc/tasks')} className="border-b border-gray-100 pb-3 last:border-0 last:pb-0 cursor-pointer hover:bg-gray-50 -mx-4 px-4 py-2 rounded transition-colors">
                                                <div className="flex justify-between items-start mb-1">
                                                    <p className="text-sm font-medium text-gray-900 line-clamp-1 flex-1">{task.name}</p>
                                                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ml-2 ${getPriorityColor(task.priority)}`}>
                                                        {task.priority}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Clock className="w-3 h-3 text-gray-400" />
                                                    <p className="text-xs text-gray-500">{getDaysUntilDue(task.endDate)}</p>
                                                </div>
                                                <span className={`inline-block px-2 py-0.5 text-xs font-semibold rounded-full mt-1 ${getStatusColor(task.status)}`}>
                                                    {task.status}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Recent Activity - Tabbed Interface */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <FileText className="w-5 h-5 text-purple-600" />
                                <h3 className="font-semibold text-gray-900">Recent Activity</h3>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="flex border-b border-gray-100 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100" style={{ scrollbarWidth: 'thin', WebkitOverflowScrolling: 'touch' }}>
                            <button
                                onClick={() => setActiveRecentTab('cases')}
                                className={`px-6 py-3 text-sm font-medium whitespace-nowrap transition-colors ${activeRecentTab === 'cases'
                                    ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50/50'
                                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                    }`}
                            >
                                Cases
                            </button>
                            <button
                                onClick={() => setActiveRecentTab('clients')}
                                className={`px-6 py-3 text-sm font-medium whitespace-nowrap transition-colors ${activeRecentTab === 'clients'
                                    ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50/50'
                                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                    }`}
                            >
                                Clients
                            </button>
                            <button
                                onClick={() => setActiveRecentTab('requisitions')}
                                className={`px-6 py-3 text-sm font-medium whitespace-nowrap transition-colors ${activeRecentTab === 'requisitions'
                                    ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50/50'
                                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                    }`}
                            >
                                Requisitions
                            </button>
                            <button
                                onClick={() => setActiveRecentTab('tickets')}
                                className={`px-6 py-3 text-sm font-medium whitespace-nowrap transition-colors ${activeRecentTab === 'tickets'
                                    ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50/50'
                                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                    }`}
                            >
                                Tickets
                            </button>
                            <button
                                onClick={() => setActiveRecentTab('notifications')}
                                className={`px-6 py-3 text-sm font-medium whitespace-nowrap transition-colors ${activeRecentTab === 'notifications'
                                    ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50/50'
                                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                    }`}
                            >
                                Notifications
                            </button>
                        </div>

                        {/* Tab Content */}
                        <div className="p-4">
                            {/* Cases Tab */}
                            {activeRecentTab === 'cases' && (
                                <div>
                                    <div className="flex justify-between items-center mb-4">
                                        <h4 className="text-sm font-medium text-gray-700">Recent Cases</h4>
                                        <button
                                            onClick={() => navigate('/hoc/cases')}
                                            className="text-xs text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
                                        >
                                            View All <ArrowRight size={12} />
                                        </button>
                                    </div>
                                    {recentCases.length === 0 ? (
                                        <p className="text-sm text-gray-500 text-center py-8">No cases yet</p>
                                    ) : (
                                        <div className="space-y-3">
                                            {recentCases.map(caseItem => (
                                                <div key={caseItem._id} onClick={() => navigate(`/hoc/cases`)} className="border-b border-gray-100 pb-3 last:border-0 last:pb-0 cursor-pointer hover:bg-gray-50 -mx-4 px-4 py-2 rounded transition-colors">
                                                    <p className="text-sm font-medium text-gray-900">{caseItem.caseTitle}</p>
                                                    <p className="text-xs text-gray-600 line-clamp-1">{caseItem.summary}</p>
                                                    <div className="flex gap-2 mt-1 flex-wrap">
                                                        <span className="text-xs text-gray-500">{formatDate(caseItem.createdAt)}</span>
                                                        <span className="text-xs text-gray-400">•</span>
                                                        <span className="text-xs text-purple-600">{caseItem.caseType}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Clients Tab */}
                            {activeRecentTab === 'clients' && (
                                <div>
                                    <div className="flex justify-between items-center mb-4">
                                        <h4 className="text-sm font-medium text-gray-700">Recent Clients</h4>
                                        <button
                                            onClick={() => navigate('/hoc/clients')}
                                            className="text-xs text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
                                        >
                                            View All <ArrowRight size={12} />
                                        </button>
                                    </div>
                                    {recentClients.length === 0 ? (
                                        <p className="text-sm text-gray-500 text-center py-8">No clients yet</p>
                                    ) : (
                                        <div className="space-y-3">
                                            {recentClients.map(client => (
                                                <div key={client._id} onClick={() => navigate(`/hoc/clients/${client._id}`)} className="border-b border-gray-100 pb-3 last:border-0 last:pb-0 cursor-pointer hover:bg-gray-50 -mx-4 px-4 py-2 rounded transition-colors">
                                                    <p className="text-sm font-medium text-gray-900">{client.name}</p>
                                                    <p className="text-xs text-gray-600">{client.email}</p>
                                                    <p className="text-xs text-gray-500 mt-1">{formatDate(client.createdAt)}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Requisitions Tab */}
                            {activeRecentTab === 'requisitions' && (
                                <div>
                                    <div className="flex justify-between items-center mb-4">
                                        <h4 className="text-sm font-medium text-gray-700">Recent Requisitions</h4>
                                        <button
                                            onClick={() => navigate('/hoc/funds')}
                                            className="text-xs text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
                                        >
                                            View All <ArrowRight size={12} />
                                        </button>
                                    </div>
                                    {recentRequisitions.length === 0 ? (
                                        <p className="text-sm text-gray-500 text-center py-8">No requisitions yet</p>
                                    ) : (
                                        <div className="space-y-3">
                                            {recentRequisitions.map(req => (
                                                <div key={req._id} className="border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                                                    <div className="flex justify-between items-start mb-1">
                                                        <p className="text-sm font-medium text-gray-900">₦{req.amount.toLocaleString()}</p>
                                                        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${getStatusColor(req.status)}`}>{req.status}</span>
                                                    </div>
                                                    <p className="text-xs text-gray-600 line-clamp-1">{req.purpose}</p>
                                                    <p className="text-xs text-gray-500 mt-1">{formatDate(req.createdAt)}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Tickets Tab */}
                            {activeRecentTab === 'tickets' && (
                                <div>
                                    <div className="flex justify-between items-center mb-4">
                                        <h4 className="text-sm font-medium text-gray-700">Recent Tickets</h4>
                                        <button
                                            onClick={() => navigate('/hoc/support')}
                                            className="text-xs text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
                                        >
                                            View All <ArrowRight size={12} />
                                        </button>
                                    </div>
                                    {/* Sub-tabs for Complaints and Feature Requests */}
                                    <div className="flex gap-2 mb-4">
                                        <button
                                            onClick={() => setActiveTicketTab('complaints')}
                                            className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors ${activeTicketTab === 'complaints'
                                                ? 'bg-purple-100 text-purple-700'
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                }`}
                                        >
                                            Complaints
                                        </button>
                                        <button
                                            onClick={() => setActiveTicketTab('featureRequests')}
                                            className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors ${activeTicketTab === 'featureRequests'
                                                ? 'bg-purple-100 text-purple-700'
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                }`}
                                        >
                                            Feature Requests
                                        </button>
                                    </div>
                                    {recentTickets[activeTicketTab].length === 0 ? (
                                        <p className="text-sm text-gray-500 text-center py-8">
                                            No {activeTicketTab === 'complaints' ? 'complaints' : 'feature requests'} yet
                                        </p>
                                    ) : (
                                        <div className="space-y-3">
                                            {recentTickets[activeTicketTab].map(ticket => (
                                                <div key={ticket._id} className="border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                                                    <div className="flex justify-between items-start mb-1">
                                                        <p className="text-sm font-medium text-gray-900 line-clamp-1">{ticket.title}</p>
                                                        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${getStatusColor(ticket.status)}`}>
                                                            {ticket.status}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-gray-500 mt-1">{formatDate(ticket.createdAt)}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Notifications Tab */}
                            {activeRecentTab === 'notifications' && (
                                <div>
                                    <div className="flex justify-between items-center mb-4">
                                        <h4 className="text-sm font-medium text-gray-700">Recent Notifications</h4>
                                        <button
                                            onClick={() => navigate('/hoc/notifications')}
                                            className="text-xs text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
                                        >
                                            View All <ArrowRight size={12} />
                                        </button>
                                    </div>
                                    {recentNotifications.length === 0 ? (
                                        <p className="text-sm text-gray-500 text-center py-8">No notifications yet</p>
                                    ) : (
                                        <div className="space-y-3">
                                            {recentNotifications.map((notif, idx) => (
                                                <div key={idx} className="border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                                                    <p className="text-sm text-gray-900">{notif.message}</p>
                                                    <p className="text-xs text-gray-500 mt-1">{formatDate(notif.createdAt)}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default Home;
