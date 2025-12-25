import React, { useState, useEffect } from 'react';
import { Bell, Calendar, CheckSquare, DollarSign, Upload, Activity, Briefcase, FileText, Ticket, Users, Clock, ArrowRight, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import API_BASE_URL from '../../config/api';
import LoadingSpinner from '../../components/AdminOfficer/LoadingSpinner';

const LawyerDashboard = () => {
    const navigate = useNavigate();
    const [userName, setUserName] = useState('');
    const [unreadCount, setUnreadCount] = useState(0);
    const [stats, setStats] = useState({
        assignedCases: 0,
        fundRequisitions: 0,
        documents: 0,
        supportTickets: 0,
        upcomingMeetings: 0,
        totalTasks: 0
    });
    const [activities, setActivities] = useState({
        meetings: [],
        broadcasts: [],
        tasks: []
    });
    const [recentData, setRecentData] = useState({
        cases: [],
        requisitions: [],
        tickets: { complaints: [], featureRequests: [] },
        notifications: []
    });
    const [activeTicketTab, setActiveTicketTab] = useState('complaints');
    const [activeRecentTab, setActiveRecentTab] = useState('cases');
    const [isLoading, setIsLoading] = useState(true);
    const [selectedMeeting, setSelectedMeeting] = useState(null);
    const [showMeetingModal, setShowMeetingModal] = useState(false);

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        setUserName(user.name || 'Lawyer');
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('token');
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const userId = user.id;

            // 1. Assigned Cases
            const casesRes = await fetch(`${API_BASE_URL}/api/cases`, { headers: { 'x-auth-token': token } });
            let assignedCasesCount = 0;
            let recentCases = [];
            if (casesRes.ok) {
                const cases = await casesRes.json();
                const myCases = cases.filter(c =>
                    c.assignedLawyers && c.assignedLawyers.some(l => l._id === userId || l === userId)
                );
                assignedCasesCount = myCases.length;
                recentCases = myCases.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);
            }

            // 2. Fund Requisitions
            const fundsRes = await fetch(`${API_BASE_URL}/api/funds`, { headers: { 'x-auth-token': token } });
            let fundsCount = 0;
            let recentRequisitions = [];
            if (fundsRes.ok) {
                const funds = await fundsRes.json();
                const myFunds = funds.filter(f => f.requestedBy && (f.requestedBy._id === userId || f.requestedBy === userId));
                fundsCount = myFunds.length;
                recentRequisitions = myFunds.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);
            }

            // 3. Documents
            const docsRes = await fetch(`${API_BASE_URL}/api/documents`, { headers: { 'x-auth-token': token } });
            let docsCount = 0;
            let recentDocuments = [];
            if (docsRes.ok) {
                const docs = await docsRes.json();
                const myDocs = docs.filter(doc =>
                    (doc.uploadedBy && (doc.uploadedBy._id === userId || doc.uploadedBy === userId)) ||
                    (doc.sharedWith && doc.sharedWith.some(u => (u._id === userId || u === userId)))
                );
                docsCount = myDocs.length;
                recentDocuments = myDocs.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt)).slice(0, 5);
            }

            // 4. Support Tickets
            const ticketsRes = await fetch(`${API_BASE_URL}/api/support`, { headers: { 'x-auth-token': token } });
            let ticketsCount = 0;
            let recentTickets = { complaints: [], featureRequests: [] };
            if (ticketsRes.ok) {
                const tickets = await ticketsRes.json();
                ticketsCount = tickets.length;
                // Split into complaints and feature requests
                const complaints = tickets.filter(t => t.type === 'Complaint').slice(0, 5);
                const featureRequests = tickets.filter(t => t.type === 'Feature Request').slice(0, 5);
                recentTickets = { complaints, featureRequests };
            }

            // 5. Upcoming Meetings & Activities
            const meetingsRes = await fetch(`${API_BASE_URL}/api/meetings`, { headers: { 'x-auth-token': token } });
            let meetingsCount = 0;
            let upcomingMeetings = [];
            if (meetingsRes.ok) {
                const meetings = await meetingsRes.json();
                const now = new Date();
                const sevenDaysFromNow = new Date();
                sevenDaysFromNow.setDate(now.getDate() + 7);

                const userMeetings = meetings.filter(m => {
                    const isAttendee = m.attendees && m.attendees.some(a => (a._id === userId || a === userId) || a.email === user.email);
                    const isHost = m.host && (m.host._id === userId || m.host === userId);
                    const isCreator = m.createdBy && (m.createdBy._id === userId || m.createdBy === userId);

                    // Combine date and time into a single DateTime
                    const meetingDate = new Date(m.date);
                    if (m.time) {
                        const [hours, minutes] = m.time.split(':');
                        meetingDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
                    }

                    // Check if meeting is in the future (including time check for today)
                    const isFuture = meetingDate > now;

                    // Check if meeting is within the next 7 days
                    const isWithinSevenDays = meetingDate <= sevenDaysFromNow;

                    return (isAttendee || isHost || isCreator) && isFuture && isWithinSevenDays && m.status !== 'cancelled';
                });
                meetingsCount = userMeetings.length;
                upcomingMeetings = userMeetings.sort((a, b) => new Date(a.date) - new Date(b.date));
            }

            // 6. Total Tasks & Activities
            const tasksRes = await fetch(`${API_BASE_URL}/api/tasks/my-tasks`, { headers: { 'x-auth-token': token } });
            let tasksCount = 0;
            let myTasks = [];
            if (tasksRes.ok) {
                const tasks = await tasksRes.json();
                tasksCount = tasks.length;
                const now = new Date();
                const nextWeek = new Date();
                nextWeek.setDate(now.getDate() + 7);

                myTasks = tasks.filter(t => {
                    if (t.status === 'Completed') return false;
                    const dueDate = new Date(t.endDate);
                    return dueDate >= now && dueDate <= nextWeek;
                }).sort((a, b) => new Date(a.endDate) - new Date(b.endDate));
            }

            // 7. Broadcasts
            const broadcastsRes = await fetch(`${API_BASE_URL}/api/broadcasts`, { headers: { 'x-auth-token': token } });
            let recentBroadcasts = [];
            if (broadcastsRes.ok) {
                const broadcasts = await broadcastsRes.json();
                recentBroadcasts = broadcasts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            }

            // 8. Notifications (Fetch all to get recent list)
            const notifRes = await fetch(`${API_BASE_URL}/api/notifications`, { headers: { 'x-auth-token': token } });
            let recentNotifications = [];
            if (notifRes.ok) {
                const notifications = await notifRes.json();
                recentNotifications = notifications.slice(0, 5);
                const unread = notifications.filter(n => !n.read).length;
                setUnreadCount(unread);
            }

            setStats({
                assignedCases: assignedCasesCount,
                fundRequisitions: fundsCount,
                documents: docsCount,
                supportTickets: ticketsCount,
                upcomingMeetings: meetingsCount,
                totalTasks: tasksCount
            });

            setActivities({
                meetings: upcomingMeetings,
                broadcasts: recentBroadcasts,
                tasks: myTasks
            });

            setRecentData({
                cases: recentCases,
                requisitions: recentRequisitions,
                tickets: recentTickets,
                notifications: recentNotifications
            });

        } catch (error) {
            console.error("Error fetching dashboard data:", error);
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
            'In Progress': 'bg-blue-100 text-blue-800',
            'Completed': 'bg-green-100 text-green-800'
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    const quickActions = [
        {
            title: 'Schedule Meeting',
            icon: Calendar,
            path: '/lawyer/meetings',
            description: 'Set up a new meeting',
            color: 'bg-purple-100 text-purple-600'
        },
        {
            title: 'Add Task',
            icon: CheckSquare,
            path: '/lawyer/tasks',
            description: 'Create a new task',
            color: 'bg-blue-100 text-blue-600'
        },
        {
            title: 'Request Funds',
            icon: DollarSign,
            path: '/lawyer/funds/request',
            description: 'Submit a fund requisition',
            color: 'bg-green-100 text-green-600'
        },
        {
            title: 'Upload Document',
            icon: Upload,
            path: '/lawyer/documents',
            description: 'Upload new files',
            color: 'bg-orange-100 text-orange-600'
        }
    ];

    const statCards = [
        { title: 'Assigned Cases', value: stats.assignedCases, icon: Briefcase, color: 'bg-purple-100 text-purple-600' },
        { title: 'Fund Requisitions', value: stats.fundRequisitions, icon: DollarSign, color: 'bg-yellow-100 text-yellow-600' },
        { title: 'Documents', value: stats.documents, icon: FileText, color: 'bg-orange-100 text-orange-600' },
        { title: 'Support Tickets', value: stats.supportTickets, icon: Ticket, color: 'bg-red-100 text-red-600' },
        { title: 'Upcoming Meetings', value: stats.upcomingMeetings, icon: Calendar, color: 'bg-green-100 text-green-600' },
        { title: 'Total Tasks', value: stats.totalTasks, icon: CheckSquare, color: 'bg-blue-100 text-blue-600' }
    ];

    if (isLoading) {
        return <LoadingSpinner />;
    }

    return (
        <div className="p-6">
            {/* Header */}
            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                        Welcome Lawyer, {userName}
                    </h1>
                    <p className="text-gray-600">
                        Here's an overview of your legal activities
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/lawyer/notifications')} className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                        <Bell className="w-6 h-6" />
                        {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[1.25rem] h-5 flex items-center justify-center border-2 border-white px-1">
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
            <div className="mb-10">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-green-600" />
                    Quick Actions
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {quickActions.map((action, index) => (
                        <button
                            key={index}
                            onClick={() => navigate(action.path)}
                            className="flex items-center p-4 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-all duration-200 group text-left"
                        >
                            <div className={`p-3 rounded-lg ${action.color} mr-4 group-hover:scale-110 transition-transform`}>
                                <action.icon className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900">{action.title}</h3>
                                <p className="text-sm text-gray-500">{action.description}</p>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Stats Grid */}
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                {statCards.map((stat, index) => (
                    <div key={index} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                            <h3 className="text-3xl font-bold text-gray-900">{isLoading ? '-' : stat.value}</h3>
                        </div>
                        <div className={`p-3 rounded-lg ${stat.color}`}>
                            <stat.icon className="w-6 h-6" />
                        </div>
                    </div>
                ))}
            </div>

            {/* 3-Column Layout for Activities */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Column 1: Upcoming Meetings */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col h-full">
                    <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                        <h2 className="font-bold text-gray-900 flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-orange-600" />
                            Upcoming Meetings
                        </h2>
                        <button onClick={() => navigate('/lawyer/meetings')} className="text-sm text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1">
                            View More <Activity className="w-3 h-3" />
                        </button>
                    </div>
                    <div className="p-4 flex-1">
                        {activities.meetings.length > 0 ? (
                            <div className="space-y-4">
                                {activities.meetings.slice(0, 5).map((meeting, index) => (
                                    <div
                                        key={index}
                                        onClick={() => {
                                            setSelectedMeeting(meeting);
                                            setShowMeetingModal(true);
                                        }}
                                        className="flex items-start gap-3 pb-4 border-b border-gray-50 last:border-0 last:pb-0 cursor-pointer hover:bg-gray-50 -mx-4 px-4 py-2 rounded transition-colors"
                                    >
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-gray-900 text-sm mb-1">{meeting.title}</h3>
                                            <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                                                <Clock className="w-3 h-3" />
                                                {new Date(meeting.date).toLocaleString([], { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                                <Activity className="w-3 h-3" />
                                                {meeting.type || 'Online'}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400 py-8">
                                <Calendar className="w-8 h-8 mb-2 opacity-50" />
                                <p className="text-sm">No upcoming meetings</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Column 2: Recent Broadcasts */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col h-full">
                    <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                        <h2 className="font-bold text-gray-900 flex items-center gap-2">
                            <Activity className="w-5 h-5 text-orange-600" />
                            Recent Broadcasts
                        </h2>
                        <button onClick={() => navigate('/lawyer/broadcast')} className="text-sm text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1">
                            View More <Activity className="w-3 h-3" />
                        </button>
                    </div>
                    <div className="p-4 flex-1">
                        {activities.broadcasts.length > 0 ? (
                            <div className="space-y-4">
                                {activities.broadcasts.slice(0, 3).map((broadcast, index) => (
                                    <div key={index} className="pb-4 border-b border-gray-50 last:border-0 last:pb-0">
                                        <h3 className="font-semibold text-gray-900 text-sm mb-1">{broadcast.title}</h3>
                                        <p className="text-xs text-gray-500 line-clamp-2 mb-2">{broadcast.message}</p>
                                        <p className="text-xs text-gray-400">
                                            {new Date(broadcast.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400 py-8">
                                <Activity className="w-8 h-8 mb-2 opacity-50" />
                                <p className="text-sm">No recent broadcasts</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Column 3: My Tasks (Due Soon) */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col h-full">
                    <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                        <h2 className="font-bold text-gray-900 flex items-center gap-2">
                            <CheckSquare className="w-5 h-5 text-orange-600" />
                            My Tasks (Due Soon)
                        </h2>
                        <button onClick={() => navigate('/lawyer/tasks')} className="text-sm text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1">
                            View More <Activity className="w-3 h-3" />
                        </button>
                    </div>
                    <div className="p-4 flex-1">
                        {activities.tasks.length > 0 ? (
                            <div className="space-y-4">
                                {activities.tasks.slice(0, 5).map((task, index) => (
                                    <div
                                        key={index}
                                        onClick={() => navigate(`/lawyer/tasks/${task._id}`)}
                                        className="flex items-start justify-between pb-4 border-b border-gray-50 last:border-0 last:pb-0 cursor-pointer hover:bg-gray-50 -mx-4 px-4 py-2 rounded transition-colors"
                                    >
                                        <div>
                                            <h3 className="font-semibold text-gray-900 text-sm mb-1">{task.name}</h3>
                                            <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                                                <Clock className="w-3 h-3" />
                                                Due {new Date(task.endDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                            </div>
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${task.status === 'Completed' ? 'bg-green-100 text-green-800' :
                                                task.status === 'Ongoing' ? 'bg-blue-100 text-blue-800' :
                                                    'bg-gray-100 text-gray-800'
                                                }`}>
                                                {task.status}
                                            </span>
                                        </div>
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${task.priority === 'High' ? 'bg-red-100 text-red-800' :
                                            task.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-blue-100 text-blue-800'
                                            }`}>
                                            {task.priority}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400 py-8">
                                <CheckSquare className="w-8 h-8 mb-2 opacity-50" />
                                <p className="text-sm">No tasks due soon</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Recent Activity - Tabbed Interface */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 mt-8">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-orange-600" />
                        <h3 className="font-semibold text-gray-900">Recent Activity</h3>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-100 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100" style={{ scrollbarWidth: 'thin', WebkitOverflowScrolling: 'touch' }}>
                    {['cases', 'requisitions', 'tickets', 'notifications'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveRecentTab(tab)}
                            className={`px-6 py-3 text-sm font-medium whitespace-nowrap transition-colors capitalize ${activeRecentTab === tab
                                ? 'text-orange-600 border-b-2 border-orange-600 bg-orange-50/50'
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="p-4">
                    {/* Cases Tab */}
                    {activeRecentTab === 'cases' && (
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <h4 className="text-sm font-medium text-gray-700">Recent Cases</h4>
                                <button onClick={() => navigate('/lawyer/cases')} className="text-xs text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1">
                                    View All <ArrowRight size={12} />
                                </button>
                            </div>
                            {recentData.cases.length === 0 ? (
                                <p className="text-sm text-gray-500 text-center py-8">No cases yet</p>
                            ) : (
                                <div className="space-y-3">
                                    {recentData.cases.map(caseItem => (
                                        <div key={caseItem._id} onClick={() => navigate(`/lawyer/cases`)} className="border-b border-gray-100 pb-3 last:border-0 last:pb-0 cursor-pointer hover:bg-gray-50 -mx-4 px-4 py-2 rounded transition-colors">
                                            <p className="text-sm font-medium text-gray-900">{caseItem.caseTitle}</p>
                                            <p className="text-xs text-gray-600 line-clamp-1">{caseItem.summary}</p>
                                            <div className="flex gap-2 mt-1 flex-wrap">
                                                <span className="text-xs text-gray-500">{formatDate(caseItem.createdAt)}</span>
                                                <span className="text-xs text-gray-400">•</span>
                                                <span className="text-xs text-orange-600">{caseItem.caseType}</span>
                                            </div>
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
                                <button onClick={() => navigate('/lawyer/funds')} className="text-xs text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1">
                                    View All <ArrowRight size={12} />
                                </button>
                            </div>
                            {recentData.requisitions.length === 0 ? (
                                <p className="text-sm text-gray-500 text-center py-8">No requisitions yet</p>
                            ) : (
                                <div className="space-y-3">
                                    {recentData.requisitions.map(req => (
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
                                <button onClick={() => navigate('/lawyer/support')} className="text-xs text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1">
                                    View All <ArrowRight size={12} />
                                </button>
                            </div>
                            {/* Sub-tabs for Complaints and Feature Requests */}
                            <div className="flex gap-2 mb-4">
                                <button
                                    onClick={() => setActiveTicketTab('complaints')}
                                    className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors ${activeTicketTab === 'complaints'
                                        ? 'bg-orange-100 text-orange-700'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                >
                                    Complaints
                                </button>
                                <button
                                    onClick={() => setActiveTicketTab('featureRequests')}
                                    className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors ${activeTicketTab === 'featureRequests'
                                        ? 'bg-orange-100 text-orange-700'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                >
                                    Feature Requests
                                </button>
                            </div>
                            {recentData.tickets[activeTicketTab].length === 0 ? (
                                <p className="text-sm text-gray-500 text-center py-8">
                                    No {activeTicketTab === 'complaints' ? 'complaints' : 'feature requests'} yet
                                </p>
                            ) : (
                                <div className="space-y-3">
                                    {recentData.tickets[activeTicketTab].map(ticket => (
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
                                <button onClick={() => navigate('/lawyer/notifications')} className="text-xs text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1">
                                    View All <ArrowRight size={12} />
                                </button>
                            </div>
                            {recentData.notifications.length === 0 ? (
                                <p className="text-sm text-gray-500 text-center py-8">No notifications yet</p>
                            ) : (
                                <div className="space-y-3">
                                    {recentData.notifications.map((notif, idx) => (
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

            {/* Meeting Details Modal */}
            {showMeetingModal && selectedMeeting && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowMeetingModal(false)}>
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white z-10">
                            <h3 className="text-xl font-bold text-gray-900">Meeting Details</h3>
                            <button onClick={() => setShowMeetingModal(false)} className="text-gray-500 hover:text-gray-700">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                                <p className="text-gray-900">{selectedMeeting.title}</p>
                            </div>

                            {selectedMeeting.description && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                    <p className="text-gray-900 whitespace-pre-wrap">{selectedMeeting.description}</p>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Date & Time</label>
                                    <p className="text-gray-900">{new Date(selectedMeeting.date).toLocaleString([], { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                    <p className="text-gray-900">{selectedMeeting.type || 'Online'}</p>
                                </div>
                            </div>

                            {selectedMeeting.location && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                                    <p className="text-gray-900">{selectedMeeting.location}</p>
                                </div>
                            )}

                            {selectedMeeting.meetingLink && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Link</label>
                                    <a href={selectedMeeting.meetingLink} target="_blank" rel="noopener noreferrer" className="text-orange-600 hover:text-orange-700 underline">
                                        {selectedMeeting.meetingLink}
                                    </a>
                                </div>
                            )}

                            {selectedMeeting.attendees && selectedMeeting.attendees.length > 0 && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Attendees</label>
                                    <div className="flex flex-wrap gap-2">
                                        {/* Show creator first with badge */}
                                        {selectedMeeting.createdBy && (
                                            <div className="flex items-center justify-between w-full">
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm border border-purple-200">
                                                    {typeof selectedMeeting.createdBy === 'string'
                                                        ? selectedMeeting.createdBy
                                                        : (selectedMeeting.createdBy.name || selectedMeeting.createdBy.email)}
                                                    <span className="text-[10px] font-bold bg-purple-600 text-white px-1.5 py-0.5 rounded">HOST</span>
                                                </span>
                                                <span className="px-2 py-0.5 rounded-full text-xs font-medium capitalize bg-green-100 text-green-800">Accepted</span>
                                            </div>
                                        )}
                                        {/* Show other attendees */}
                                        {selectedMeeting.attendees.map((attendee, idx) => {
                                            const attendeeEmail = attendee.email || attendee;
                                            const creatorEmail = typeof selectedMeeting.createdBy === 'string'
                                                ? selectedMeeting.createdBy
                                                : (selectedMeeting.createdBy?.email || '');

                                            // Skip creator as they're shown above
                                            if (attendeeEmail === creatorEmail) return null;

                                            return (
                                                <span key={idx} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                                                    {attendee.name || attendee.email || attendee}
                                                </span>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-6 border-t border-gray-200 flex justify-end">
                            <button
                                onClick={() => setShowMeetingModal(false)}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div >
            )}
        </div >
    );
};

export default LawyerDashboard;
