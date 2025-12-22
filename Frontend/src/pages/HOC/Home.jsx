import React, { useState, useEffect } from 'react';
import { Briefcase, DollarSign, FileText, Ticket, Upload, Bell, Users, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
    const navigate = useNavigate();
    const [userName, setUserName] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState({
        totalClients: 0,
        totalCases: 0,
        totalFunds: 0,
        totalDocuments: 0,
        totalTickets: 0
    });
    const [recentCases, setRecentCases] = useState([]);
    const [recentClients, setRecentClients] = useState([]);
    const [recentRequisitions, setRecentRequisitions] = useState([]);
    const [recentNotifications, setRecentNotifications] = useState([]);
    const [recentTickets, setRecentTickets] = useState({ complaints: [], featureRequests: [] });
    const [activeTicketTab, setActiveTicketTab] = useState('complaints');

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
            const clientsRes = await fetch(`${API_BASE_URL}/api/clients', {
                headers: { 'x-auth-token': token }
            });
            if (clientsRes.ok) {
                const clients = await clientsRes.json();
                setStats(prev => ({ ...prev, totalClients: clients.length }));
                setRecentClients(clients.slice(0, 5));
            }

            // Cases - Only fetch cases assigned to this HOC
            const casesRes = await fetch(`${API_BASE_URL}/api/cases', {
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
            const fundsRes = await fetch(`${API_BASE_URL}/api/funds', {
                headers: { 'x-auth-token': token }
            });
            if (fundsRes.ok) {
                const funds = await fundsRes.json();
                setStats(prev => ({ ...prev, totalFunds: funds.length }));
                setRecentRequisitions(funds.slice(0, 5));
            }

            // Documents - Filter by uploadedBy or sharedWith
            const docsRes = await fetch(`${API_BASE_URL}/api/documents', {
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
            const ticketsRes = await fetch(`${API_BASE_URL}/api/support', {
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
            const notifRes = await fetch(`${API_BASE_URL}/api/notifications', {
                headers: { 'x-auth-token': token }
            });
            if (notifRes.ok) {
                const notifications = await notifRes.json();
                setRecentNotifications(notifications.slice(0, 5));
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

    return (
        <div className="p-6">
            <h1 className="text-3xl text-black font-bold mb-2">Welcome HOC, {userName}</h1>
            <p className="text-slate-600 mb-6">Here's an overview of your chambers</p>

            {/* Quick Actions */}
            <div className="mb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
                <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
                    <button
                        onClick={() => navigate('/hoc/funds/request')}
                        className="bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-xl p-6 shadow-md hover:shadow-lg transition-all flex flex-col items-center gap-3"
                    >
                        <div className="p-3 bg-white/20 rounded-lg">
                            <DollarSign className="w-6 h-6" />
                        </div>
                        <span className="font-semibold text-sm">Request Funds</span>
                    </button>
                    <button
                        onClick={() => navigate('/hoc/documents')}
                        className="bg-gradient-to-br from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-xl p-6 shadow-md hover:shadow-lg transition-all flex flex-col items-center gap-3"
                    >
                        <div className="p-3 bg-white/20 rounded-lg">
                            <Upload className="w-6 h-6" />
                        </div>
                        <span className="font-semibold text-sm">Upload Document</span>
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg shadow-md border border-slate-200">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-slate-600 text-sm font-medium">Total Clients</h3>
                        <Users className="text-purple-500" size={24} />
                    </div>
                    <p className="text-3xl font-bold text-slate-800">{stats.totalClients}</p>
                    <p className="text-xs text-slate-500 mt-2">All clients</p>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md border border-slate-200">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-slate-600 text-sm font-medium">Assigned Cases</h3>
                        <Briefcase className="text-purple-500" size={24} />
                    </div>
                    <p className="text-3xl font-bold text-slate-800">{stats.totalCases}</p>
                    <p className="text-xs text-slate-500 mt-2">Cases assigned to you</p>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md border border-slate-200">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-slate-600 text-sm font-medium">Fund Requisitions</h3>
                        <DollarSign className="text-purple-500" size={24} />
                    </div>
                    <p className="text-3xl font-bold text-slate-800">{stats.totalFunds}</p>
                    <p className="text-xs text-slate-500 mt-2">Total requisitions</p>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md border border-slate-200">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-slate-600 text-sm font-medium">Documents</h3>
                        <FileText className="text-purple-500" size={24} />
                    </div>
                    <p className="text-3xl font-bold text-slate-800">{stats.totalDocuments}</p>
                    <p className="text-xs text-slate-500 mt-2">Uploaded or shared with you</p>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md border border-slate-200">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-slate-600 text-sm font-medium">Support Tickets</h3>
                        <Ticket className="text-purple-500" size={24} />
                    </div>
                    <p className="text-3xl font-bold text-slate-800">{stats.totalTickets}</p>
                    <p className="text-xs text-slate-500 mt-2">Total tickets</p>
                </div>
            </div>

            {/* Recent Sections Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Recent Assigned Cases */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                    <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Briefcase className="w-5 h-5 text-purple-600" />
                            <h3 className="font-semibold text-gray-900">Recent Assigned Cases</h3>
                        </div>
                        <button
                            onClick={() => navigate('/hoc/cases')}
                            className="text-xs text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
                        >
                            View More <ArrowRight size={12} />
                        </button>
                    </div>
                    <div className="p-4">
                        {recentCases.length === 0 ? (
                            <p className="text-sm text-gray-500 text-center py-4">No cases assigned yet</p>
                        ) : (
                            <div className="space-y-3">
                                {recentCases.map(caseItem => (
                                    <div
                                        key={caseItem._id}
                                        onClick={() => navigate(`/hoc/cases`)}
                                        className="border-b border-gray-100 pb-3 last:border-0 last:pb-0 cursor-pointer hover:bg-gray-50 -mx-4 px-4 py-2 rounded transition-colors"
                                    >
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
                </div>

                {/* Recent Clients */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                    <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Users className="w-5 h-5 text-purple-600" />
                            <h3 className="font-semibold text-gray-900">Recent Clients</h3>
                        </div>
                        <button
                            onClick={() => navigate('/hoc/clients')}
                            className="text-xs text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
                        >
                            View More <ArrowRight size={12} />
                        </button>
                    </div>
                    <div className="p-4">
                        {recentClients.length === 0 ? (
                            <p className="text-sm text-gray-500 text-center py-4">No clients yet</p>
                        ) : (
                            <div className="space-y-3">
                                {recentClients.map(client => (
                                    <div
                                        key={client._id}
                                        onClick={() => navigate(`/hoc/clients/${client._id}`)}
                                        className="border-b border-gray-100 pb-3 last:border-0 last:pb-0 cursor-pointer hover:bg-gray-50 -mx-4 px-4 py-2 rounded transition-colors"
                                    >
                                        <p className="text-sm font-medium text-gray-900">{client.name}</p>
                                        <p className="text-xs text-gray-600">{client.email}</p>
                                        <div className="flex gap-2 mt-1 flex-wrap">
                                            <span className="text-xs text-gray-500">{formatDate(client.createdAt)}</span>
                                            <span className="text-xs text-gray-400">•</span>
                                            <span className={`text-xs ${client.status === 'Active' ? 'text-green-600' : 'text-gray-600'}`}>
                                                {client.status}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Recent Requisitions */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                    <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <DollarSign className="w-5 h-5 text-purple-600" />
                            <h3 className="font-semibold text-gray-900">Recent Requisitions</h3>
                        </div>
                        <button
                            onClick={() => navigate('/hoc/funds')}
                            className="text-xs text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
                        >
                            View More <ArrowRight size={12} />
                        </button>
                    </div>
                    <div className="p-4">
                        {recentRequisitions.length === 0 ? (
                            <p className="text-sm text-gray-500 text-center py-4">No requisitions yet</p>
                        ) : (
                            <div className="space-y-3">
                                {recentRequisitions.map(req => (
                                    <div key={req._id} className="border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                                        <div className="flex justify-between items-start mb-1">
                                            <p className="text-sm font-medium text-gray-900">₦{req.amount.toLocaleString()}</p>
                                            <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${getStatusColor(req.status)}`}>
                                                {req.status}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-600 line-clamp-1">{req.purpose}</p>
                                        <p className="text-xs text-gray-500 mt-1">{formatDate(req.createdAt)}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Recent Tickets (Replaces Notifications) */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                    <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Ticket className="w-5 h-5 text-purple-600" />
                            <h3 className="font-semibold text-gray-900">Recent Tickets</h3>
                        </div>
                        <button
                            onClick={() => navigate('/hoc/support')}
                            className="text-xs text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
                        >
                            View More <ArrowRight size={12} />
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b border-gray-100">
                        <button
                            onClick={() => setActiveTicketTab('complaints')}
                            className={`flex-1 py-2 text-sm font-medium text-center transition-colors ${activeTicketTab === 'complaints'
                                ? 'text-purple-600 border-b-2 border-purple-600'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Complaints
                        </button>
                        <button
                            onClick={() => setActiveTicketTab('featureRequests')}
                            className={`flex-1 py-2 text-sm font-medium text-center transition-colors ${activeTicketTab === 'featureRequests'
                                ? 'text-purple-600 border-b-2 border-purple-600'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Feature Requests
                        </button>
                    </div>

                    <div className="p-4">
                        {recentTickets[activeTicketTab].length === 0 ? (
                            <p className="text-sm text-gray-500 text-center py-4">
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
                </div>
                {/* Recent Notifications */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 col-span-1 md:col-span-2">
                    <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Bell className="w-5 h-5 text-purple-600" />
                            <h3 className="font-semibold text-gray-900">Recent Notifications</h3>
                        </div>
                        <button
                            onClick={() => navigate('/hoc/notifications')}
                            className="text-xs text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
                        >
                            View More <ArrowRight size={12} />
                        </button>
                    </div>
                    <div className="p-4">
                        {recentNotifications.length === 0 ? (
                            <p className="text-sm text-gray-500 text-center py-4">No notifications yet</p>
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
                </div>
            </div>
        </div>
    );
};

export default Home;
