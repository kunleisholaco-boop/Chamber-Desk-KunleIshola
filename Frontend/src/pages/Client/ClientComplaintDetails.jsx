import React, { useState, useEffect } from 'react';
import { useParams, useOutletContext, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, MessageCircle, AlertCircle } from 'lucide-react';
import API_BASE_URL from '../../../config/api';

const ClientComplaintDetails = () => {
    const { complaintId } = useParams();
    const { shareToken } = useOutletContext();
    const navigate = useNavigate();
    const [complaint, setComplaint] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [replyContent, setReplyContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        fetchComplaintDetails();
    }, [complaintId]);

    const fetchComplaintDetails = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/client-portal/${shareToken}/complaints/${complaintId}`);
            if (response.ok) {
                const data = await response.json();
                setComplaint(data);
            } else {
                setMessage({ type: 'error', text: 'Failed to load complaint' });
            }
        } catch (err) {
            console.error('Error fetching complaint:', err);
            setMessage({ type: 'error', text: 'Connection error' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleReplySubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setMessage({ type: '', text: '' });

        try {
            const response = await fetch(`${API_BASE_URL}/api/client-portal/${shareToken}/complaints/${complaintId}/reply`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: replyContent })
            });

            const data = await response.json();

            if (response.ok) {
                setMessage({ type: 'success', text: 'Reply posted successfully' });
                setReplyContent('');
                fetchComplaintDetails();
            } else {
                setMessage({ type: 'error', text: data.msg || 'Failed to post reply' });
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'Connection error. Please try again.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            'Pending': 'bg-yellow-100 text-yellow-700',
            'In Progress': 'bg-blue-100 text-blue-700',
            'Resolved': 'bg-green-100 text-green-700',
            'Closed': 'bg-gray-100 text-gray-700'
        };
        return colors[status] || 'bg-gray-100 text-gray-700';
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
        );
    }

    if (!complaint) {
        return (
            <div className="max-w-4xl mx-auto text-center py-12">
                <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Complaint Not Found</h3>
                <button
                    onClick={() => navigate(`/client-portal/${shareToken}/complaints`)}
                    className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                    Back to Complaints
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={() => navigate(`/client-portal/${shareToken}/complaints`)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-gray-900">{complaint.subject}</h1>
                    <div className="flex items-center gap-2 mt-1">
                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${getStatusColor(complaint.status)}`}>
                            {complaint.status}
                        </span>
                        <span className="text-sm text-gray-500">• Submitted {formatDate(complaint.createdAt)}</span>
                    </div>
                </div>
            </div>

            {/* Complaint Details */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Complaint Details</h2>

                {complaint.case && (
                    <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-700">
                            <span className="font-medium">Related Case:</span> {complaint.case.caseTitle} ({complaint.case.caseType})
                        </p>
                    </div>
                )}

                <div className="prose max-w-none">
                    <p className="text-gray-700 whitespace-pre-wrap">{complaint.description}</p>
                </div>
            </div>

            {/* Replies Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
                <div className="flex items-center gap-2 mb-4">
                    <MessageCircle className="w-5 h-5 text-gray-600" />
                    <h2 className="text-lg font-semibold text-gray-900">
                        Replies ({complaint.replies?.length || 0})
                    </h2>
                </div>

                {complaint.replies && complaint.replies.length > 0 ? (
                    <div className="space-y-4">
                        {complaint.replies.map((reply, index) => (
                            <div
                                key={index}
                                className={`p-4 rounded-lg ${reply.authorType === 'client' ? 'bg-purple-50 border border-purple-100' : 'bg-gray-50 border border-gray-100'}`}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-gray-900">{reply.authorName}</span>
                                        <span className={`px-2 py-0.5 text-xs rounded-full ${reply.authorType === 'client' ? 'bg-purple-200 text-purple-700' : 'bg-blue-200 text-blue-700'}`}>
                                            {reply.authorType === 'client' ? 'You' : reply.authorRole || 'Staff'}
                                        </span>
                                    </div>
                                    <span className="text-xs text-gray-500">{formatDate(reply.createdAt)}</span>
                                </div>
                                <p className="text-gray-700 whitespace-pre-wrap">{reply.content}</p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500 text-center py-8">No replies yet. Be the first to reply!</p>
                )}
            </div>

            {/* Reply Form */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Add a Reply</h3>

                <form onSubmit={handleReplySubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Your Reply</label>
                        <textarea
                            required
                            rows="4"
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            className="w-full px-4 text-black  py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                            placeholder="Type your reply here..."
                        />
                    </div>

                    {message.text && (
                        <div className={`p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                            {message.text}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
                    >
                        <Send className="w-4 h-4" />
                        {isSubmitting ? 'Posting...' : 'Post Reply'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ClientComplaintDetails;

