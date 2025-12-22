import React, { useState, useEffect } from 'react';
import { Send, Clock, User, FileText, AlertCircle } from 'lucide-react';
import API_BASE_URL from '../../../config/api';

const CaseReports = ({ caseId }) => {
    const [reports, setReports] = useState([]);
    const [newReport, setNewReport] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchReports();
    }, [caseId]);

    const fetchReports = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/api/cases/${caseId}/reports`, {
                headers: { 'x-auth-token': token }
            });

            if (response.ok) {
                const data = await response.json();
                setReports(data);
            }
        } catch (err) {
            console.error('Error fetching reports:', err);
            setError('Failed to load reports');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newReport.trim()) return;

        setIsSubmitting(true);
        setError('');

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/api/cases/${caseId}/reports`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token
                },
                body: JSON.stringify({ content: newReport })
            });

            if (response.ok) {
                const savedReport = await response.json();
                setReports([savedReport, ...reports]);
                setNewReport('');
            } else {
                setError('Failed to save report');
            }
        } catch (err) {
            console.error('Error saving report:', err);
            setError('Error saving report');
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            hour12: true
        });
    };

    const getReportIcon = (type, actionType) => {
        if (type === 'Automated') {
            if (actionType === 'Creation') return <FileText className="w-4 h-4 text-blue-500" />;
            if (actionType === 'StatusChange') return <Clock className="w-4 h-4 text-orange-500" />;
            if (actionType === 'Assignment') return <User className="w-4 h-4 text-purple-500" />;
            return <AlertCircle className="w-4 h-4 text-gray-500" />;
        }
        return <FileText className="w-4 h-4 text-gray-500" />;
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Case Reports & Updates</h3>

            {/* Add New Report Form */}
            <form onSubmit={handleSubmit} className="mb-8">
                <div className="relative">
                    <textarea
                        value={newReport}
                        onChange={(e) => setNewReport(e.target.value)}
                        placeholder="Write a new report or update..."
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12 min-h-[100px] text-black"
                    />
                    <button
                        type="submit"
                        disabled={isSubmitting || !newReport.trim()}
                        className="absolute bottom-3 right-3 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>
                {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            </form>

            {/* Reports Timeline */}
            <div className="space-y-6">
                {isLoading ? (
                    <p className="text-center text-gray-500 py-4">Loading reports...</p>
                ) : reports.length === 0 ? (
                    <p className="text-center text-gray-500 py-4">No reports yet.</p>
                ) : (
                    reports.map((report) => (
                        <div key={report._id} className="flex gap-4">
                            <div className="flex-shrink-0 mt-1">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${report.type === 'Automated' ? 'bg-gray-100' : 'bg-blue-100'
                                    }`}>
                                    {getReportIcon(report.type, report.actionType)}
                                </div>
                            </div>
                            <div className="flex-grow">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="font-medium text-gray-900">
                                        {report.author?.name || 'Unknown User'}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                        {formatDate(report.createdAt)}
                                    </span>
                                </div>
                                <div className={`p-3 rounded-lg ${report.type === 'Automated'
                                        ? 'bg-gray-50 border border-gray-100 text-gray-600 italic text-sm'
                                        : 'bg-white border border-gray-200 text-gray-800'
                                    }`}>
                                    <p className="whitespace-pre-wrap">{report.content}</p>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default CaseReports;
