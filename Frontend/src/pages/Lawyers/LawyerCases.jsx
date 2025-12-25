import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, Search, Tag, Calendar, User } from 'lucide-react';
import API_BASE_URL from '../../config/api';

const LawyerCases = () => {
    const navigate = useNavigate();
    const [cases, setCases] = useState([]);
    const [filteredCases, setFilteredCases] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');

    useEffect(() => {
        fetchCases();
    }, []);

    useEffect(() => {
        filterCases();
    }, [searchTerm, statusFilter, cases]);

    const fetchCases = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/api/cases`, {
                headers: { 'x-auth-token': token }
            });

            if (response.ok) {
                const data = await response.json();
                setCases(data);
                setFilteredCases(data);
            }
        } catch (err) {
            console.error('Error fetching cases:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const filterCases = () => {
        let filtered = cases;

        // Filter by search term
        if (searchTerm) {
            filtered = filtered.filter(c =>
                c.caseTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                c.client?.name?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Filter by status
        if (statusFilter !== 'All') {
            filtered = filtered.filter(c => c.status === statusFilter);
        }

        setFilteredCases(filtered);
    };

    const getStatusColor = (status) => {
        const colors = {
            'Open': 'bg-blue-100 text-blue-700',
            'Pending': 'bg-yellow-100 text-yellow-700',
            'Closed': 'bg-gray-100 text-gray-700',
            'Completed-Won': 'bg-green-100 text-green-700',
            'Completed-Lost': 'bg-red-100 text-red-700'
        };
        return colors[status] || 'bg-gray-100 text-gray-700';
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Cases</h1>
                <p className="text-gray-600">Manage and view all your assigned cases</p>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search by case title or client name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-black"
                        />
                    </div>

                    {/* Status Filter */}
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-black"
                    >
                        <option value="All">All Statuses</option>
                        <option value="Open">Open</option>
                        <option value="Pending">Pending</option>
                        <option value="Closed">Closed</option>
                        <option value="Completed-Won">Completed-Won</option>
                        <option value="Completed-Lost">Completed-Lost</option>
                    </select>
                </div>
            </div>

            {/* Cases Grid */}
            {filteredCases.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                    <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No cases found</h3>
                    <p className="text-gray-500">
                        {searchTerm || statusFilter !== 'All'
                            ? 'Try adjusting your filters'
                            : 'You have no assigned cases yet'}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredCases.map((caseItem) => (
                        <div
                            key={caseItem._id}
                            onClick={() => navigate(`/lawyer/cases/${caseItem._id}`)}
                            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
                        >
                            {/* Case Title */}
                            <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                                {caseItem.caseTitle}
                            </h3>

                            {/* Client Name */}
                            <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                                <User className="w-4 h-4" />
                                <span>{caseItem.client?.name || 'Unknown Client'}</span>
                            </div>

                            {/* Case Type */}
                            <div className="flex items-center gap-2 mb-3">
                                <Tag className="w-4 h-4 text-green-600" />
                                <span className="text-sm text-gray-700">{caseItem.caseType}</span>
                            </div>

                            {/* Status Badge */}
                            <div className="flex items-center gap-2 mb-3">
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(caseItem.status)}`}>
                                    {caseItem.status}
                                </span>
                            </div>

                            {/* Task Access Badge */}
                            {caseItem.accessType === 'task' && (
                                <div className="mt-3 pt-3 border-t border-gray-200">
                                    <div className="flex items-center gap-2">
                                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                                            Task Access
                                        </span>
                                        {caseItem.taskInfo?.task?.name && (
                                            <span className="text-xs text-gray-500 truncate">
                                                via {caseItem.taskInfo.task.name}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Date */}
                            <div className="flex items-center gap-2 text-xs text-gray-500 mt-3">
                                <Calendar className="w-3 h-3" />
                                <span>Created {formatDate(caseItem.createdAt)}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Summary */}
            <div className="mt-6 text-center text-sm text-gray-600">
                Showing {filteredCases.length} of {cases.length} cases
            </div>
        </div>
    );
};

export default LawyerCases;
