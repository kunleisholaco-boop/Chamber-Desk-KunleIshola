import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DollarSign, User, Calendar, CheckCircle, XCircle, Clock, Send, Plus, Search, Filter, Eye } from 'lucide-react';

const Funds = () => {
    const navigate = useNavigate();
    const [requisitions, setRequisitions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [viewRequisition, setViewRequisition] = useState(null);

    // Filter states
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');
    const [historyFilter, setHistoryFilter] = useState('All');
    const [historyPeriod, setHistoryPeriod] = useState('all');
    const [historyFromDate, setHistoryFromDate] = useState('');
    const [historyToDate, setHistoryToDate] = useState('');

    useEffect(() => {
        fetchRequisitions();
    }, []);

    const fetchRequisitions = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('token');
            const user = JSON.parse(localStorage.getItem('user'));
            const currentUserId = user?.id;

            const response = await fetch(`${API_BASE_URL}/api/funds', {
                headers: { 'x-auth-token': token }
            });

            if (response.ok) {
                const data = await response.json();
                // Filter to show only current user's requisitions
                const userRequisitions = data.filter(req => req.requestedBy?._id === currentUserId);
                setRequisitions(userRequisitions);
            }
        } catch (err) {
            console.error('Error fetching requisitions:', err);
        } finally {
            setIsLoading(false);
        }
    };

    // Calculate stats
    const totalRequisitions = requisitions.length;
    const totalAmount = requisitions.reduce((sum, req) => sum + req.amount, 0);

    const approvedReqs = requisitions.filter(r => r.status === 'Approved');
    const approvedCount = approvedReqs.length;
    const approvedAmount = approvedReqs.reduce((sum, req) => sum + req.amount, 0);

    const pendingReqs = requisitions.filter(r => r.status === 'Pending');
    const pendingCount = pendingReqs.length;
    const pendingAmount = pendingReqs.reduce((sum, req) => sum + req.amount, 0);

    const assignedReqs = requisitions.filter(r => r.status === 'Assigned');
    const assignedCount = assignedReqs.length;
    const assignedAmount = assignedReqs.reduce((sum, req) => sum + req.amount, 0);

    const deniedReqs = requisitions.filter(r => r.status === 'Rejected');
    const deniedCount = deniedReqs.length;
    const deniedAmount = deniedReqs.reduce((sum, req) => sum + req.amount, 0);

    // Filter requisitions for main list
    const filteredRequisitions = requisitions.filter(req => {
        const matchesSearch = req.purpose.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = filterStatus === 'All' || req.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    // Filter for history
    const getHistoryRequisitions = () => {
        let filtered = requisitions.filter(req =>
            req.status === 'Approved' || req.status === 'Rejected'
        );

        if (historyFilter !== 'All') {
            filtered = filtered.filter(req => req.status === historyFilter);
        }

        // Apply period filter first
        if (historyPeriod !== 'all') {
            const now = new Date();
            filtered = filtered.filter(req => {
                const reqDate = new Date(req.updatedAt || req.createdAt);
                const diffTime = Math.abs(now - reqDate);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                switch (historyPeriod) {
                    case 'day':
                        return diffDays <= 1;
                    case 'week':
                        return diffDays <= 7;
                    case 'month':
                        return diffDays <= 30;
                    case 'year':
                        return diffDays <= 365;
                    default:
                        return true;
                }
            });
        }

        // Then apply date range
        if (historyFromDate) {
            filtered = filtered.filter(req => {
                const reqDate = new Date(req.updatedAt || req.createdAt);
                return reqDate >= new Date(historyFromDate);
            });
        }

        if (historyToDate) {
            filtered = filtered.filter(req => {
                const reqDate = new Date(req.updatedAt || req.createdAt);
                const toDate = new Date(historyToDate);
                toDate.setHours(23, 59, 59, 999);
                return reqDate <= toDate;
            });
        }

        return filtered;
    };

    const formatCurrency = (amount) => {
        return `₦${amount.toLocaleString()}`;
    };

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusBadge = (status) => {
        const config = {
            'Pending': 'bg-yellow-100 text-yellow-800',
            'Assigned': 'bg-blue-100 text-blue-800',
            'Approved': 'bg-green-100 text-green-800',
            'Rejected': 'bg-red-100 text-red-800'
        };
        return config[status] || 'bg-gray-100 text-gray-800';
    };

    return (
        <div className='p-6'>
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Fund Requisitions</h2>
                <button
                    onClick={() => navigate('/hoc/funds/request')}
                    className="px-6 py-2.5 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" />
                    Request Funds
                </button>
            </div>

            {/* Stats Counter Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Total Requisitions</p>
                            <p className="text-2xl font-bold text-gray-900">{totalRequisitions}</p>
                            <p className="text-xs text-gray-500 mt-1">{formatCurrency(totalAmount)}</p>
                        </div>
                        <div className="p-3 bg-blue-100 rounded-lg">
                            <DollarSign className="w-6 h-6 text-blue-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Approved</p>
                            <p className="text-2xl font-bold text-green-600">{approvedCount}</p>
                            <p className="text-xs text-gray-500 mt-1">{formatCurrency(approvedAmount)}</p>
                        </div>
                        <div className="p-3 bg-green-100 rounded-lg">
                            <CheckCircle className="w-6 h-6 text-green-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Pending</p>
                            <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
                            <p className="text-xs text-gray-500 mt-1">{formatCurrency(pendingAmount)}</p>
                        </div>
                        <div className="p-3 bg-yellow-100 rounded-lg">
                            <Clock className="w-6 h-6 text-yellow-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Assigned</p>
                            <p className="text-2xl font-bold text-purple-600">{assignedCount}</p>
                            <p className="text-xs text-gray-500 mt-1">{formatCurrency(assignedAmount)}</p>
                        </div>
                        <div className="p-3 bg-purple-100 rounded-lg">
                            <Send className="w-6 h-6 text-purple-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Denied</p>
                            <p className="text-2xl font-bold text-red-600">{deniedCount}</p>
                            <p className="text-xs text-gray-500 mt-1">{formatCurrency(deniedAmount)}</p>
                        </div>
                        <div className="p-3 bg-red-100 rounded-lg">
                            <XCircle className="w-6 h-6 text-red-600" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by purpose..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 pr-4 py-2.5 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-black"
                        />
                    </div>

                    <div className="relative">
                        <Filter className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="pl-10 pr-8 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-black appearance-none bg-white min-w-[180px]"
                        >
                            <option value="All">All Statuses</option>
                            <option value="Pending">Pending</option>
                            <option value="Assigned">Assigned</option>
                            <option value="Approved">Approved</option>
                            <option value="Rejected">Rejected</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Main Requisitions Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900">All Requisitions</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Amount</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Purpose</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {isLoading ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500">Loading...</td>
                                </tr>
                            ) : filteredRequisitions.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500">No requisitions found</td>
                                </tr>
                            ) : (
                                filteredRequisitions.map((req) => (
                                    <tr key={req._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap font-semibold text-gray-900">{formatCurrency(req.amount)}</td>
                                        <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">{req.purpose}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{formatDate(req.createdAt)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusBadge(req.status)}`}>
                                                {req.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <button
                                                onClick={() => setViewRequisition(req)}
                                                className="px-3 py-1.5 bg-purple-600 text-white text-sm font-semibold rounded-lg hover:bg-purple-700 flex items-center gap-1"
                                            >
                                                <Eye className="w-4 h-4" />
                                                View
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Transaction History */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Transaction History</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* Status Filter */}
                        <select
                            value={historyFilter}
                            onChange={(e) => setHistoryFilter(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-black text-sm"
                        >
                            <option value="All">All Transactions</option>
                            <option value="Approved">Approved Only</option>
                            <option value="Rejected">Denied Only</option>
                        </select>

                        {/* Period Filter */}
                        <select
                            value={historyPeriod}
                            onChange={(e) => setHistoryPeriod(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-black text-sm"
                        >
                            <option value="all">All Time</option>
                            <option value="day">Today</option>
                            <option value="week">This Week</option>
                            <option value="month">This Month</option>
                            <option value="year">This Year</option>
                        </select>

                        {/* Date Range Filters */}
                        <div className="flex gap-2 col-span-1 lg:col-span-1">
                            <div className="flex-1">
                                <label className="block text-xs font-medium text-gray-700 mb-1">From:</label>
                                <input
                                    type="date"
                                    value={historyFromDate}
                                    onChange={(e) => setHistoryFromDate(e.target.value)}
                                    onClick={(e) => e.target.showPicker?.()}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-black text-sm"
                                />
                            </div>
                            <div className="flex-1">
                                <label className="block text-xs font-medium text-gray-700 mb-1">To:</label>
                                <input
                                    type="date"
                                    value={historyToDate}
                                    onChange={(e) => setHistoryToDate(e.target.value)}
                                    onClick={(e) => e.target.showPicker?.()}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-black text-sm"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Amount</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Purpose</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {getHistoryRequisitions().length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-8 text-center text-gray-500">No transaction history</td>
                                </tr>
                            ) : (
                                getHistoryRequisitions().map((req) => (
                                    <tr key={req._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap font-semibold text-gray-900">{formatCurrency(req.amount)}</td>
                                        <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">{req.purpose}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{formatDate(req.updatedAt || req.createdAt)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusBadge(req.status)}`}>
                                                {req.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* View Requisition Modal */}
            {viewRequisition && (
                <div className="fixed inset-0 bg-[#000000]/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex justify-between items-start">
                                <h3 className="text-2xl font-bold text-gray-900">Requisition Details</h3>
                                <button
                                    onClick={() => setViewRequisition(null)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <XCircle className="w-6 h-6" />
                                </button>
                            </div>
                        </div>
                        <div className="p-6">
                            {/* Amount - Full Width */}
                            <div className="bg-purple-50 p-4 rounded-lg mb-4">
                                <p className="text-sm text-gray-600 mb-1">Amount Requested</p>
                                <p className="text-3xl font-bold text-purple-600">{formatCurrency(viewRequisition.amount)}</p>
                            </div>

                            {/* 2-Column Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                {/* Status */}
                                <div>
                                    <p className="text-sm font-medium text-gray-700 mb-1">Status</p>
                                    <span className={`inline-block px-3 py-1 text-sm font-semibold rounded-full ${getStatusBadge(viewRequisition.status)}`}>
                                        {viewRequisition.status}
                                    </span>
                                </div>

                                {/* Assigned Manager */}
                                {viewRequisition.assignedTo && (
                                    <div>
                                        <p className="text-sm font-medium text-gray-700 mb-1">Assigned Manager</p>
                                        <p className="text-gray-900">{viewRequisition.assignedTo.name || 'Unknown'}</p>
                                        {viewRequisition.assignedTo.email && (
                                            <p className="text-sm text-gray-600">{viewRequisition.assignedTo.email}</p>
                                        )}
                                    </div>
                                )}

                                {/* Requisition Type */}
                                {viewRequisition.type && (
                                    <div>
                                        <p className="text-sm font-medium text-gray-700 mb-1">Requisition Type</p>
                                        <p className="text-gray-900">{viewRequisition.type}</p>
                                    </div>
                                )}

                                {/* Urgency */}
                                {viewRequisition.urgency && (
                                    <div>
                                        <p className="text-sm font-medium text-gray-700 mb-1">Urgency Level</p>
                                        <p className="text-gray-900">{viewRequisition.urgency}</p>
                                    </div>
                                )}

                                {/* Date Requested */}
                                <div>
                                    <p className="text-sm font-medium text-gray-700 mb-1">Date Requested</p>
                                    <p className="text-gray-900">{formatDate(viewRequisition.createdAt)}</p>
                                </div>

                                {/* Related Case */}
                                {viewRequisition.caseId && (
                                    <div>
                                        <p className="text-sm font-medium text-gray-700 mb-1">Related Case</p>
                                        <p className="text-gray-900">{viewRequisition.caseId.caseTitle || viewRequisition.caseId._id}</p>
                                    </div>
                                )}

                                {/* Related Client */}
                                {viewRequisition.clientId && (
                                    <div>
                                        <p className="text-sm font-medium text-gray-700 mb-1">Related Client</p>
                                        <p className="text-gray-900">{viewRequisition.clientId.name || 'Unknown'}</p>
                                        {viewRequisition.clientId.email && (
                                            <p className="text-sm text-gray-600">{viewRequisition.clientId.email}</p>
                                        )}
                                    </div>
                                )}

                                {/* Last Updated */}
                                {viewRequisition.updatedAt && viewRequisition.updatedAt !== viewRequisition.createdAt && (
                                    <div>
                                        <p className="text-sm font-medium text-gray-700 mb-1">Last Updated</p>
                                        <p className="text-gray-900">{formatDate(viewRequisition.updatedAt)}</p>
                                    </div>
                                )}
                            </div>

                            {/* Purpose - Full Width */}
                            <div>
                                <p className="text-sm font-medium text-gray-700 mb-1">Purpose</p>
                                <p className="text-gray-900 whitespace-pre-wrap">{viewRequisition.purpose}</p>
                            </div>
                        </div>
                        <div className="p-6 border-t border-gray-200">
                            <button
                                onClick={() => setViewRequisition(null)}
                                className="w-full px-4 py-2 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Funds;
