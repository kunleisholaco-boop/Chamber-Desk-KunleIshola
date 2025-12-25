import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, FolderOpen, Clock, CheckCircle, XCircle, Award, AlertCircle, UserCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../../components/AdminOfficer/LoadingSpinner';
import API_BASE_URL from '../../config/api';

const CaseManagement = () => {
    const navigate = useNavigate();
    const [cases, setCases] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');

    // Get user role for conditional rendering
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userRole = user.role;
    const userId = user.id;

    useEffect(() => {
        fetchCases();
    }, []);

    const fetchCases = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/api/cases`, {
                headers: {
                    'x-auth-token': token
                }
            });

            if (response.ok) {
                const data = await response.json();

                // Backend now handles all filtering including task-based access
                // HOC: Filter cases assigned to or created by this HOC
                if (userRole === 'HOC') {
                    const hocCases = data.filter(caseItem =>
                        (caseItem.assignedTo && caseItem.assignedTo._id === userId) ||
                        (caseItem.createdBy && caseItem.createdBy._id === userId)
                    );
                    setCases(hocCases);
                } else {
                    // Lawyer and Admin: Backend returns correctly filtered cases
                    setCases(data);
                }
            }
        } catch (err) {
            console.error('Error fetching cases:', err);
        } finally {
            setIsLoading(false);
        }
    };

    // Calculate case stats
    const totalCases = cases.length;
    const openCases = cases.filter(c => c.status === 'Open').length;
    const pendingCases = cases.filter(c => c.status === 'Pending').length;
    const closedCases = cases.filter(c => c.status === 'Closed').length;
    const wonCases = cases.filter(c => c.status === 'Completed-Won').length;
    const lostCases = cases.filter(c => c.status === 'Completed-Lost').length;

    // Filter and search cases
    const filteredCases = cases.filter(caseItem => {
        const matchesSearch = caseItem.caseTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
            caseItem.client?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            caseItem.caseNumber?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus = filterStatus === 'All' || caseItem.status === filterStatus;

        return matchesSearch && matchesStatus;
    });

    // Get status color
    const getStatusColor = (status) => {
        const colors = {
            'Open': 'bg-green-100 text-green-800',
            'Pending': 'bg-yellow-100 text-yellow-800',
            'Closed': 'bg-gray-100 text-gray-800',
            'Completed-Won': 'bg-emerald-100 text-emerald-800',
            'Completed-Lost': 'bg-red-100 text-red-800'
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    // Get case type color
    const getCaseTypeColor = (type) => {
        const colors = {
            'Civil': 'bg-blue-100 text-blue-800',
            'Criminal': 'bg-purple-100 text-purple-800',
            'Corporate': 'bg-indigo-100 text-indigo-800',
            'Family': 'bg-pink-100 text-pink-800',
            'Property': 'bg-orange-100 text-orange-800'
        };
        return colors[type] || 'bg-gray-100 text-gray-800';
    };

    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const getBasePath = () => {
        if (userRole === 'Lawyer') return '/lawyer';
        return userRole === 'Admin' ? '/admin' : userRole === 'HOC' ? '/hoc' : '/dashboard';
    };

    const getPrimaryColor = () => {
        if (userRole === 'Lawyer') return 'green';
        return userRole === 'Admin' ? 'orange' : 'purple';
    };

    const primaryColor = getPrimaryColor();

    return (
        <div className={userRole === 'HOC' || userRole === 'Lawyer' ? 'p-6' : ''}>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Case Management</h2>
                {/* HOC-only: Add New Case Button */}
                {userRole === 'HOC' && (
                    <button
                        onClick={() => navigate('/hoc/cases/add')}
                        className="px-6 py-2.5 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
                    >
                        <Plus className="w-5 h-5" />
                        Add New Case
                    </button>
                )}
            </div>

            {/* Stats Counters */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
                {/* Total Cases */}
                <div className={`bg-gradient-to-br ${userRole === 'Admin' ? 'from-blue-50 to-blue-100 border-blue-200' : 'from-white to-white border-gray-200'} rounded-xl p-4 border shadow-sm`}>
                    <div className="flex items-center justify-between mb-2">
                        <FolderOpen className={`w-5 h-5 ${userRole === 'Admin' ? 'text-blue-600' : 'text-purple-600'}`} />
                        <p className={`text-2xl font-bold ${userRole === 'Admin' ? 'text-blue-900' : 'text-gray-900'}`}>{totalCases}</p>
                    </div>
                    <p className={`text-xs font-medium ${userRole === 'Admin' ? 'text-blue-600' : 'text-gray-600'}`}>Total Cases</p>
                </div>

                {/* Open Cases */}
                <div className={`bg-gradient-to-br ${userRole === 'Admin' ? 'from-green-50 to-green-100 border-green-200' : 'from-white to-white border-gray-200'} rounded-xl p-4 border shadow-sm`}>
                    <div className="flex items-center justify-between mb-2">
                        <CheckCircle className={`w-5 h-5 text-green-600`} />
                        <p className={`text-2xl font-bold ${userRole === 'Admin' ? 'text-green-900' : 'text-gray-900'}`}>{openCases}</p>
                    </div>
                    <p className={`text-xs font-medium ${userRole === 'Admin' ? 'text-green-600' : 'text-gray-600'}`}>Open Cases</p>
                </div>

                {/* Pending Cases */}
                <div className={`bg-gradient-to-br ${userRole === 'Admin' ? 'from-yellow-50 to-yellow-100 border-yellow-200' : 'from-white to-white border-gray-200'} rounded-xl p-4 border shadow-sm`}>
                    <div className="flex items-center justify-between mb-2">
                        <Clock className={`w-5 h-5 text-yellow-600`} />
                        <p className={`text-2xl font-bold ${userRole === 'Admin' ? 'text-yellow-900' : 'text-gray-900'}`}>{pendingCases}</p>
                    </div>
                    <p className={`text-xs font-medium ${userRole === 'Admin' ? 'text-yellow-600' : 'text-gray-600'}`}>Pending Cases</p>
                </div>

                {/* Closed Cases */}
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <AlertCircle className="w-5 h-5 text-gray-600" />
                        <p className="text-2xl font-bold text-gray-900">{closedCases}</p>
                    </div>
                    <p className="text-xs font-medium text-gray-600">Closed Cases</p>
                </div>

                {/* Won Cases */}
                <div className={`bg-gradient-to-br ${userRole === 'Admin' ? 'from-emerald-50 to-emerald-100 border-emerald-200' : 'from-white to-white border-gray-200'} rounded-xl p-4 border shadow-sm`}>
                    <div className="flex items-center justify-between mb-2">
                        <Award className={`w-5 h-5 text-emerald-600`} />
                        <p className={`text-2xl font-bold ${userRole === 'Admin' ? 'text-emerald-900' : 'text-gray-900'}`}>{wonCases}</p>
                    </div>
                    <p className={`text-xs font-medium ${userRole === 'Admin' ? 'text-emerald-600' : 'text-gray-600'}`}>Won Cases</p>
                </div>

                {/* Lost Cases */}
                <div className={`bg-gradient-to-br ${userRole === 'Admin' ? 'from-red-50 to-red-100 border-red-200' : 'from-white to-white border-gray-200'} rounded-xl p-4 border shadow-sm`}>
                    <div className="flex items-center justify-between mb-2">
                        <XCircle className={`w-5 h-5 text-red-600`} />
                        <p className={`text-2xl font-bold ${userRole === 'Admin' ? 'text-red-900' : 'text-gray-900'}`}>{lostCases}</p>
                    </div>
                    <p className={`text-xs font-medium ${userRole === 'Admin' ? 'text-red-600' : 'text-gray-600'}`}>Lost Cases</p>
                </div>
            </div>

            {/* Search and Filter Bar */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Search Bar */}
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by case title, client name, or case number..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={`w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-${primaryColor}-500 focus:border-transparent text-black`}
                        />
                    </div>

                    {/* Filter by Status Dropdown */}
                    <div className="relative">
                        <Filter className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className={`pl-10 pr-8 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-${primaryColor}-500 focus:border-transparent text-black appearance-none bg-white min-w-[200px]`}
                        >
                            <option value="All">All Statuses</option>
                            <option value="Open">Open</option>
                            <option value="Pending">Pending</option>
                            <option value="Closed">Closed</option>
                            <option value="Completed-Won">Won</option>
                            <option value="Completed-Lost">Lost</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Cases Grid */}
            {isLoading ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
                    <LoadingSpinner message="Loading cases..." />
                </div>
            ) : filteredCases.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                    <p className="text-gray-500">
                        {searchQuery || filterStatus !== 'All'
                            ? 'No cases found matching your search criteria'
                            : userRole === 'HOC'
                                ? 'No cases assigned to you yet'
                                : 'No cases added yet'}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredCases.map((caseItem) => (
                        <div
                            key={caseItem._id}
                            onClick={() => navigate(`${getBasePath()}/cases/${caseItem._id}`)}
                            className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow cursor-pointer ${userRole === 'HOC' ? 'hover:border-purple-200' : ''}`}
                        >
                            {/* Header with Status and Type */}
                            <div className="flex justify-between items-start mb-4">
                                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(caseItem.status)}`}>
                                    {caseItem.status}
                                </span>
                                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getCaseTypeColor(caseItem.caseType)}`}>
                                    {caseItem.caseType}
                                </span>
                            </div>

                            {/* Case Title */}
                            <h3 className="font-semibold text-gray-900 text-lg mb-2 line-clamp-2">
                                {caseItem.caseTitle}
                            </h3>

                            {/* Case Number */}
                            {caseItem.caseNumber && (
                                <p className="text-sm text-gray-500 mb-2 font-mono">
                                    #{caseItem.caseNumber}
                                </p>
                            )}

                            {/* Client Name */}
                            <p className="text-sm text-gray-600 mb-2">
                                <span className="font-medium">Client:</span> {caseItem.client?.name || 'N/A'}
                            </p>

                            {/* Assigned HOC - Admin only */}
                            {userRole === 'Admin' && (
                                <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                                    <UserCircle className="w-4 h-4" />
                                    <span className="font-medium">HOC:</span>
                                    <span>{caseItem.assignedTo?.name || 'Not Assigned'}</span>
                                </div>
                            )}

                            {/* Assigned Lawyer */}
                            <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                                <UserCircle className="w-4 h-4" />
                                <span className="font-medium">Lawyer:</span>
                                <span>
                                    {caseItem.assignedLawyers && caseItem.assignedLawyers.length > 0
                                        ? caseItem.assignedLawyers.map(l => l.name).join(', ')
                                        : 'Not Assigned'}
                                </span>
                            </div>

                            {/* Assigned Paralegals */}
                            <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                                <UserCircle className="w-4 h-4" />
                                <span className="font-medium">Paralegal:</span>
                                <span>
                                    {caseItem.assignedParalegals && caseItem.assignedParalegals.length > 0
                                        ? caseItem.assignedParalegals.map(p => p.name).join(', ')
                                        : 'Not Assigned'}
                                </span>
                            </div>

                            {/* Task Access Badge */}
                            {caseItem.accessType === 'task' && (
                                <div className="mb-3 pt-3 border-t border-gray-200">
                                    <div className="flex flex-col gap-1">
                                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium w-fit">
                                            Task Access
                                        </span>
                                        {caseItem.taskInfo?.task?.name && (
                                            <span className="text-xs text-gray-500">
                                                via task: {caseItem.taskInfo.task.name}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Date Started */}
                            <p className="text-xs text-gray-500">
                                <span className="font-medium">Started:</span> {formatDate(caseItem.dateIssueStarted)}
                            </p>
                        </div>
                    ))}
                </div>
            )}

            {/* Results Count */}
            {!isLoading && filteredCases.length > 0 && (
                <div className="mt-6 text-center text-sm text-gray-600">
                    Showing {filteredCases.length} of {cases.length} case{cases.length !== 1 ? 's' : ''}
                </div>
            )}
        </div>
    );
};

export default CaseManagement;
