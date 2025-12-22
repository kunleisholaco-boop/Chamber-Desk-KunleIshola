import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, MessageCircle, User as UserIcon, FileText } from 'lucide-react';
import API_BASE_URL from '../../../config/api';

const HOCReportThread = () => {
    const { caseId, reportId } = useParams();
    const navigate = useNavigate();
    const [caseData, setCaseData] = useState(null);
    const [report, setReport] = useState(null);
    const [replyContent, setReplyContent] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        fetchReportData();
    }, [caseId, reportId]);

    const fetchReportData = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/api/cases/${caseId}`, {
                headers: { 'x-auth-token': token }
            });

            if (response.ok) {
                const data = await response.json();
                setCaseData(data);
                const foundReport = data.clientReports.find(r => r._id === reportId);
                setReport(foundReport);
            }
        } catch (err) {
            console.error('Error fetching report:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmitReply = async (e) => {
        e.preventDefault();
        if (!replyContent.trim()) return;

        setIsSubmitting(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/api/cases/${caseId}/report/${reportId}/reply`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token
                },
                body: JSON.stringify({ content: replyContent })
            });

            if (response.ok) {
                setMessage({ type: 'success', text: 'Reply posted successfully' });
                setReplyContent('');
                fetchReportData(); // Refresh to show new reply
            } else {
                const data = await response.json();
                setMessage({ type: 'error', text: data.msg || 'Failed to post reply' });
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'Failed to post reply' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-gray-600">Loading...</div>
            </div>
        );
    }

    if (!report) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-gray-600">Report not found</div>
            </div>
        );
    }

    return (
        <div className="p-6">
            {/* Header */}
            <div className="mb-6">
                <button
                    onClick={() => navigate(`/hoc/cases/${caseId}`)}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                    <span>Back to Case Details</span>
                </button>
                <h1 className="text-3xl font-bold text-gray-900">{caseData?.caseTitle}</h1>
                <p className="text-gray-600 mt-1">Client: {caseData?.client?.name}</p>
            </div>

            {/* Original Report */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
                <div className="flex items-start gap-3 mb-4">
                    <div className="p-2 bg-green-100 rounded-full">
                        <FileText className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="flex-1">
                        <h2 className="text-xl font-bold text-gray-900 mb-1">{report.subject}</h2>
                        <p className="text-sm text-gray-500">
                            Posted by {report.author?.name || 'You'} • {formatDate(report.createdAt)}
                        </p>
                    </div>
                </div>
                <div className="pl-11">
                    <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">{report.content}</p>
                </div>
            </div>

            {/* Conversation Thread */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
                <div className="flex items-center gap-2 mb-4">
                    <MessageCircle className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-900">
                        Discussion ({report.replies?.length || 0})
                    </h3>
                </div>

                {report.replies && report.replies.length > 0 ? (
                    <div className="space-y-4 mb-6">
                        {report.replies.map((reply, index) => (
                            <div
                                key={index}
                                className={`flex gap-3 ${reply.authorType === 'hoc' ? 'flex-row-reverse' : 'flex-row'}`}
                            >
                                <div className={`p-2 rounded-full ${reply.authorType === 'hoc' ? 'bg-green-100' : 'bg-blue-100'}`}>
                                    <UserIcon className={`w-4 h-4 ${reply.authorType === 'hoc' ? 'text-green-600' : 'text-blue-600'}`} />
                                </div>
                                <div className={`flex-1 ${reply.authorType === 'hoc' ? 'text-right' : 'text-left'}`}>
                                    <div className={`inline-block max-w-[80%] p-3 rounded-lg ${reply.authorType === 'hoc'
                                            ? 'bg-green-50 border border-green-100'
                                            : 'bg-blue-50 border border-blue-100'
                                        }`}>
                                        <p className="text-xs font-semibold text-gray-700 mb-1">
                                            {reply.authorName}
                                            {reply.authorType === 'client' && ' (Client)'}
                                        </p>
                                        <p className="text-gray-800 whitespace-pre-wrap">{reply.content}</p>
                                        <p className="text-xs text-gray-500 mt-2">
                                            {formatDate(reply.createdAt)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500 text-center py-4 mb-6">No replies yet from the client.</p>
                )}

                {/* Reply Form */}
                <form onSubmit={handleSubmitReply} className="border-t pt-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Reply to Client
                    </label>
                    <textarea
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        placeholder="Type your reply to the client..."
                        className="w-full px-4 text-black py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                        rows="4"
                        disabled={isSubmitting}
                    />
                    {message.text && (
                        <p className={`text-sm mt-2 ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                            {message.text}
                        </p>
                    )}
                    <div className="flex justify-end mt-3">
                        <button
                            type="submit"
                            disabled={isSubmitting || !replyContent.trim()}
                            className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <Send className="w-4 h-4" />
                            {isSubmitting ? 'Posting...' : 'Post Reply'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default HOCReportThread;
