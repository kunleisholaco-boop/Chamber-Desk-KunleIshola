import React, { useState, useEffect } from 'react';
import { AlertCircle, Lightbulb, Eye, TrendingUp, CheckCircle, Clock } from 'lucide-react';
import axios from 'axios';
import SupportTicketDetail from '../../components/SupportTicketDetail';
import API_BASE_URL from '../../../config/api';

const SuperadminSupportTickets = () => {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [userRole, setUserRole] = useState('');
    const [activeTab, setActiveTab] = useState('complaints'); // 'complaints' or 'requests'

    useEffect(() => {
        fetchAllTickets();
        fetchUserRole();
    }, []);

    const fetchAllTickets = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_BASE_URL}/api/support/all', {
                headers: { 'x-auth-token': token }
            });
            setTickets(res.data);
        } catch (err) {
            console.error('Error fetching tickets:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchUserRole = () => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        setUserRole(user.role || '');
    };

    const handleViewTicket = async (ticketId) => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_BASE_URL}/api/support/${ticketId}`, {
                headers: { 'x-auth-token': token }
            });
            setSelectedTicket(res.data);
            setShowDetailModal(true);
        } catch (err) {
            console.error('Error fetching ticket details:', err);
        }
    };

    const handleTicketUpdate = (updatedTicket) => {
        setSelectedTicket(updatedTicket);
        setTickets(tickets.map(t => t._id === updatedTicket._id ? updatedTicket : t));
    };

    const getStatusColor = (status) => {
        const colors = {
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

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const complaints = tickets.filter(t => t.type === 'Complaint');
    const featureRequests = tickets.filter(t => t.type === 'Feature Request');
    const awaitingReply = tickets.filter(t => t.status === 'Awaiting Reply' || t.status === 'Sent');
    const resolved = tickets.filter(t => t.status === 'Fixed' || t.status === 'Seen');

    const renderTicketTable = (ticketList, type) => {
        const icon = type === 'Complaint' ? AlertCircle : Lightbulb;
        const Icon = icon;

        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    {ticketList.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            <Icon size={48} className={`mx-auto mb-3 text-gray-300`} />
                            <p>No {type.toLowerCase()}s submitted yet</p>
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">User</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Title</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {ticketList.map(ticket => (
                                    <tr key={ticket._id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-3 text-sm text-gray-700">{ticket.user?.name || 'Unknown'}</td>
                                        <td className="px-4 py-3 text-sm font-medium text-gray-900 truncate max-w-[300px]">{ticket.title}</td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(ticket.status)}`}>
                                                {ticket.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600">{formatDate(ticket.createdAt)}</td>
                                        <td className="px-4 py-3 text-center">
                                            <button
                                                onClick={() => handleViewTicket(ticket._id)}
                                                className="inline-flex items-center gap-1 px-3 py-1 text-xs bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors"
                                            >
                                                <Eye size={14} />
                                                View
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="p-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Support Tickets</h1>
                <p className="text-gray-600 mt-1">Manage all support complaints and feature requests</p>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Total Tickets</p>
                            <p className="text-3xl font-bold text-gray-900">{tickets.length}</p>
                        </div>
                        <div className="p-3 bg-orange-100 rounded-lg">
                            <TrendingUp className="w-6 h-6 text-orange-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Complaints</p>
                            <p className="text-3xl font-bold text-gray-900">{complaints.length}</p>
                        </div>
                        <div className="p-3 bg-red-100 rounded-lg">
                            <AlertCircle className="w-6 h-6 text-red-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Feature Requests</p>
                            <p className="text-3xl font-bold text-gray-900">{featureRequests.length}</p>
                        </div>
                        <div className="p-3 bg-purple-100 rounded-lg">
                            <Lightbulb className="w-6 h-6 text-purple-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Awaiting Reply</p>
                            <p className="text-3xl font-bold text-gray-900">{awaitingReply.length}</p>
                        </div>
                        <div className="p-3 bg-yellow-100 rounded-lg">
                            <Clock className="w-6 h-6 text-yellow-600" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="mb-6">
                <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8">
                        <button
                            onClick={() => setActiveTab('complaints')}
                            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'complaints'
                                    ? 'border-red-500 text-red-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                <AlertCircle size={18} />
                                Complaints ({complaints.length})
                            </div>
                        </button>
                        <button
                            onClick={() => setActiveTab('requests')}
                            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'requests'
                                    ? 'border-purple-500 text-purple-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                <Lightbulb size={18} />
                                Feature Requests ({featureRequests.length})
                            </div>
                        </button>
                    </nav>
                </div>
            </div>

            {/* Tickets Table */}
            {loading ? (
                <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
                </div>
            ) : (
                <div>
                    {activeTab === 'complaints' && renderTicketTable(complaints, 'Complaint')}
                    {activeTab === 'requests' && renderTicketTable(featureRequests, 'Feature Request')}
                </div>
            )}

            <SupportTicketDetail
                ticket={selectedTicket}
                isOpen={showDetailModal}
                onClose={() => setShowDetailModal(false)}
                onUpdate={handleTicketUpdate}
                userRole={userRole}
            />
        </div>
    );
};

export default SuperadminSupportTickets;
