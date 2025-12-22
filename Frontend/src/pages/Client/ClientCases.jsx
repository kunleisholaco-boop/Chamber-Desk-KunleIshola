import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { Briefcase, Calendar, FileText, Search, CheckCircle, Clock, AlertCircle, Award, XCircle } from 'lucide-react';
import API_BASE_URL from '../../../config/api';

const ClientCases = () => {
    const { shareToken } = useOutletContext();
    const navigate = useNavigate();
    const [cases, setCases] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchCases();
    }, [shareToken]);

    const fetchCases = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/client-portal/${shareToken}/cases`);
            if (response.ok) {
                const data = await response.json();
                setCases(data);
            }
        } catch (err) {
            console.error('Error fetching cases:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const getStatusColor = (status) => {
        const colors = {
            'Open': 'bg-green-100 text-green-700',
            'Pending': 'bg-yellow-100 text-yellow-700',
            'Closed': 'bg-gray-100 text-gray-700',
            'Completed-Won': 'bg-emerald-100 text-emerald-700',
            'Completed-Lost': 'bg-red-100 text-red-700'
        };
        return colors[status] || 'bg-gray-100 text-gray-700';
    };

    const stats = {
        total: cases.length,
        open: cases.filter(c => c.status === 'Open').length,
        pending: cases.filter(c => c.status === 'Pending').length,
        closed: cases.filter(c => c.status === 'Closed').length,
        won: cases.filter(c => c.status === 'Completed-Won').length,
        lost: cases.filter(c => c.status === 'Completed-Lost').length
    };

    const StatCard = ({ icon: Icon, label, count, colorClass, iconColorClass }) => (
        <div className={`rounded-xl p-4 border ${colorClass} flex flex-col justify-between h-24`}>
            <div className="flex justify-between items-start">
                <Icon className={`w-5 h-5 ${iconColorClass}`} />
                <span className={`text-2xl font-bold ${iconColorClass}`}>{count}</span>
            </div>
            <span className={`text-sm font-semibold ${iconColorClass}`}>{label}</span>
        </div>
    );

    const filteredCases = cases.filter(c =>
        c.caseTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.caseType.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">My Cases</h1>
                    <p className="text-gray-600 mt-1">Manage and view details of your legal cases</p>
                </div>
                <div className="relative">
                    <Search className="absolute text-black left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search cases..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 text-black border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 w-full md:w-64"
                    />
                </div>
            </div>

            {/* Stats Section */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                <StatCard
                    icon={Briefcase}
                    label="Total Cases"
                    count={stats.total}
                    colorClass="bg-blue-50 border-blue-100"
                    iconColorClass="text-blue-600"
                />
                <StatCard
                    icon={CheckCircle}
                    label="Open Cases"
                    count={stats.open}
                    colorClass="bg-green-50 border-green-100"
                    iconColorClass="text-green-600"
                />
                <StatCard
                    icon={Clock}
                    label="Pending Cases"
                    count={stats.pending}
                    colorClass="bg-yellow-50 border-yellow-100"
                    iconColorClass="text-yellow-600"
                />
                <StatCard
                    icon={AlertCircle}
                    label="Closed Cases"
                    count={stats.closed}
                    colorClass="bg-gray-50 border-gray-100"
                    iconColorClass="text-gray-600"
                />
                <StatCard
                    icon={Award}
                    label="Won Cases"
                    count={stats.won}
                    colorClass="bg-emerald-50 border-emerald-100"
                    iconColorClass="text-emerald-600"
                />
                <StatCard
                    icon={XCircle}
                    label="Lost Cases"
                    count={stats.lost}
                    colorClass="bg-red-50 border-red-100"
                    iconColorClass="text-red-600"
                />
            </div>

            {filteredCases.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                    <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Cases Found</h3>
                    <p className="text-gray-500">
                        {searchTerm ? 'No cases match your search criteria.' : 'You don\'t have any cases at the moment.'}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredCases.map((caseItem) => (
                        <div
                            key={caseItem._id}
                            onClick={() => navigate(`/client-portal/${shareToken}/case/${caseItem._id}`)}
                            className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg hover:border-purple-300 transition-all cursor-pointer group"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="p-2 bg-purple-50 rounded-lg group-hover:bg-purple-100 transition-colors">
                                    <Briefcase className="w-6 h-6 text-purple-600" />
                                </div>
                                <span className={`px-2 py-1 text-xs rounded-full font-medium ${getStatusColor(caseItem.status)}`}>
                                    {caseItem.status}
                                </span>
                            </div>

                            <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-purple-600 transition-colors line-clamp-1">
                                {caseItem.caseTitle}
                            </h3>

                            <p className="text-sm text-gray-600 mb-4 line-clamp-2 h-10">
                                {caseItem.summary}
                            </p>

                            <div className="flex flex-wrap gap-2 mb-4">
                                <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                                    {caseItem.caseType}
                                </span>
                                {caseItem.inCourt && (
                                    <span className="px-2 py-1 text-xs bg-orange-100 text-orange-700 rounded">
                                        In Court
                                    </span>
                                )}
                            </div>

                            <div className="pt-4 border-t border-gray-100 flex items-center gap-2 text-xs text-gray-500">
                                <Calendar className="w-4 h-4" />
                                <span>Started {formatDate(caseItem.dateIssueStarted)}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ClientCases;

