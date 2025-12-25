import React, { useState, useEffect, useRef } from 'react';
import { Send, Clock, User, FileText, AlertCircle, AtSign } from 'lucide-react';
import API_BASE_URL from '../../config/api';

const CaseReports = ({ caseId }) => {
    const [reports, setReports] = useState([]);
    const [newReport, setNewReport] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    // Mention states
    const [showMentionDropdown, setShowMentionDropdown] = useState(false);
    const [mentionSearch, setMentionSearch] = useState('');
    const [mentionPosition, setMentionPosition] = useState(0);
    const [caseStakeholders, setCaseStakeholders] = useState([]);
    const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);

    const textareaRef = useRef(null);
    const dropdownRef = useRef(null);

    useEffect(() => {
        fetchReports();
        fetchCaseStakeholders();
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

    const fetchCaseStakeholders = async () => {
        try {
            const token = localStorage.getItem('token');

            // Fetch case details to get assigned lawyers and paralegals
            const caseResponse = await fetch(`${API_BASE_URL}/api/cases/${caseId}`, {
                headers: { 'x-auth-token': token }
            });

            if (caseResponse.ok) {
                const caseData = await caseResponse.json();

                // Fetch all admins
                const adminsResponse = await fetch(`${API_BASE_URL}/api/users/admins`, {
                    headers: { 'x-auth-token': token }
                });

                // Fetch all HOC users
                const hocResponse = await fetch(`${API_BASE_URL}/api/users/hoc`, {
                    headers: { 'x-auth-token': token }
                });

                const stakeholders = [];

                // Add admins
                if (adminsResponse.ok) {
                    const admins = await adminsResponse.json();
                    admins.forEach(admin => {
                        stakeholders.push({
                            id: admin._id,
                            name: admin.name,
                            email: admin.email,
                            role: 'Admin'
                        });
                    });
                }

                // Add HOC users
                if (hocResponse.ok) {
                    const hocUsers = await hocResponse.json();
                    hocUsers.forEach(hoc => {
                        stakeholders.push({
                            id: hoc._id,
                            name: hoc.name,
                            email: hoc.email,
                            role: 'HOC'
                        });
                    });
                }

                // Add assigned lawyers
                if (caseData.assignedLawyers && caseData.assignedLawyers.length > 0) {
                    caseData.assignedLawyers.forEach(lawyer => {
                        stakeholders.push({
                            id: lawyer._id,
                            name: lawyer.name,
                            email: lawyer.email,
                            role: 'Lawyer'
                        });
                    });
                }

                // Add assigned paralegals
                if (caseData.assignedParalegals && caseData.assignedParalegals.length > 0) {
                    caseData.assignedParalegals.forEach(paralegal => {
                        stakeholders.push({
                            id: paralegal._id,
                            name: paralegal.name,
                            email: paralegal.email,
                            role: 'Paralegal'
                        });
                    });
                }

                setCaseStakeholders(stakeholders);
            }
        } catch (err) {
            console.error('Error fetching case stakeholders:', err);
        }
    };

    const handleTextareaChange = (e) => {
        const value = e.target.value;
        const cursorPosition = e.target.selectionStart;

        setNewReport(value);

        // Check for @ symbol
        const textBeforeCursor = value.substring(0, cursorPosition);
        const lastAtIndex = textBeforeCursor.lastIndexOf('@');

        if (lastAtIndex !== -1) {
            const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);

            // Check if there's a space after @ (which would close the mention)
            if (!textAfterAt.includes(' ') && !textAfterAt.includes('\n')) {
                setMentionSearch(textAfterAt.toLowerCase());
                setMentionPosition(lastAtIndex);
                setShowMentionDropdown(true);
                setSelectedMentionIndex(0);
            } else {
                setShowMentionDropdown(false);
            }
        } else {
            setShowMentionDropdown(false);
        }
    };

    const handleMentionSelect = (user) => {
        const beforeMention = newReport.substring(0, mentionPosition);
        const afterMention = newReport.substring(textareaRef.current.selectionStart);
        const newText = `${beforeMention}@${user.name} ${afterMention}`;

        setNewReport(newText);
        setShowMentionDropdown(false);
        setMentionSearch('');

        // Focus back on textarea
        setTimeout(() => {
            if (textareaRef.current) {
                const newCursorPosition = mentionPosition + user.name.length + 2;
                textareaRef.current.focus();
                textareaRef.current.setSelectionRange(newCursorPosition, newCursorPosition);
            }
        }, 0);
    };

    const handleKeyDown = (e) => {
        if (!showMentionDropdown) return;

        const filteredUsers = getFilteredStakeholders();

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedMentionIndex(prev =>
                prev < filteredUsers.length - 1 ? prev + 1 : prev
            );
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedMentionIndex(prev => prev > 0 ? prev - 1 : 0);
        } else if (e.key === 'Enter' && filteredUsers.length > 0) {
            e.preventDefault();
            handleMentionSelect(filteredUsers[selectedMentionIndex]);
        } else if (e.key === 'Escape') {
            setShowMentionDropdown(false);
        }
    };

    const getFilteredStakeholders = () => {
        if (!mentionSearch) return caseStakeholders;

        return caseStakeholders.filter(user =>
            user.name.toLowerCase().includes(mentionSearch) ||
            user.email.toLowerCase().includes(mentionSearch)
        );
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

    const getRoleBadgeColor = (role) => {
        switch (role) {
            case 'Admin':
                return 'bg-blue-100 text-blue-700';
            case 'HOC':
                return 'bg-purple-100 text-purple-700';
            case 'Lawyer':
                return 'bg-green-100 text-green-700';
            case 'Paralegal':
                return 'bg-orange-100 text-orange-700';
            default:
                return 'bg-gray-100 text-gray-700';
        }
    };

    const filteredStakeholders = getFilteredStakeholders();

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Case Reports & Updates</h3>

            {/* Add New Report Form */}
            <form onSubmit={handleSubmit} className="mb-8">
                <div className="relative">
                    <textarea
                        ref={textareaRef}
                        value={newReport}
                        onChange={handleTextareaChange}
                        onKeyDown={handleKeyDown}
                        placeholder="Write a new report or update... (Type @ to mention someone)"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12 min-h-[100px] text-black"
                    />

                    {/* Mention Dropdown */}
                    {showMentionDropdown && filteredStakeholders.length > 0 && (
                        <div
                            ref={dropdownRef}
                            className="absolute z-50 mt-1 w-80 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                            style={{ top: '110px', left: '16px' }}
                        >
                            {filteredStakeholders.map((user, index) => (
                                <div
                                    key={user.id}
                                    onClick={() => handleMentionSelect(user)}
                                    className={`px-4 py-3 cursor-pointer flex items-center gap-3 ${index === selectedMentionIndex
                                            ? 'bg-blue-50 border-l-2 border-blue-500'
                                            : 'hover:bg-gray-50'
                                        }`}
                                >
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                                        {user.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm font-medium text-gray-900">{user.name}</p>
                                            <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${getRoleBadgeColor(user.role)}`}>
                                                {user.role}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500">{user.email}</p>
                                    </div>
                                    <AtSign className="w-4 h-4 text-gray-400" />
                                </div>
                            ))}
                        </div>
                    )}

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
