import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, MessageCircle, AlertCircle, User as UserIcon } from 'lucide-react';
import LoadingSpinner from '../../components/AdminOfficer/LoadingSpinner';
import API_BASE_URL from '../../../config/api';

const ComplaintDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [complaint, setComplaint] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [replyContent, setReplyContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [selectedStatus, setSelectedStatus] = useState('');

    useEffect(() => {
        fetchComplaintDetails();
    }, [id]);

    const fetchComplaintDetails = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/api/complaints/${id}`, {
                headers: { 'x-auth-token': token }
            });

            if (response.ok) {
                const data = await response.json();
                setComplaint(data);
                setSelectedStatus(data.status);
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
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/api/complaints/${id}/reply`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token
                },
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

    const handleStatusUpdate = async () => {
        if (selectedStatus === complaint.status) return;

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/api/complaints/${id}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token
                },
                body: JSON.stringify({ status: selectedStatus })
            });

            const data = await response.json();

            if (response.ok) {
                setMessage({ type: 'success', text: 'Status updated successfully' });
                fetchComplaintDetails();
            } else {
                setMessage({ type: 'error', text: data.msg || 'Failed to update status' });
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'Connection error. Please try again.' });
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
            <div className="p-8">
                <LoadingSpinner message="Loading complaint details..." />
            </div>
        );
    }

    if (!complaint) {
        return (
            <div className="p-8 text-center">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Complaint Not Found</h3>
                <button
                    onClick={() => navigate(-1)}
                    className="mt-4 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                >
                    Go Back
                </button>
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={() => navigate(`/admin/clients/${complaint.client._id}`)}
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

            {/* Client Info */}
            <div className="bg-gradient-to-br from-orange-50 to-purple-50 rounded-xl shadow-sm border border-orange-200 p-4 mb-6">
                <div className="flex items-center gap-3">
                    <UserIcon className="w-5 h-5 text-orange-600" />
                    <div>
                        <p className="text-sm text-gray-600">Client</p>
                        <p className="font-semibold text-gray-900">{complaint.client.name}</p>
                        <p className="text-sm text-gray-600">{complaint.client.email} • {complaint.client.phone}</p>
                    </div>
                </div>
            </div>

            {/* Status Update */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Update Status</h2>
                <div className="flex gap-3">
                    <select
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        className="flex-1 px-4 text-black  py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    >
                        <option value="Pending">Pending</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Resolved">Resolved</option>
                        <option value="Closed">Closed</option>
                    </select>
                    <button
                        onClick={handleStatusUpdate}
                        disabled={selectedStatus === complaint.status}
                        className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        Update
                    </button>
                </div>
            </div>

            {/* Complaint Details */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Complaint Details</h2>

                {complaint.case && (
                    <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-700">
                            <span className="font-medium">Related Case:</span>{' '}
                            <button
                                onClick={() => navigate(`/admin/cases/${complaint.case._id}`)}
                                className="underline hover:text-blue-800"
                            >
                                {complaint.case.caseTitle} ({complaint.case.caseType})
                            </button>
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
                                className={`p-4 rounded-lg ${reply.authorType === 'client' ? 'bg-purple-50 border border-purple-100' : 'bg-orange-50 border border-orange-100'}`}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-gray-900">{reply.authorName}</span>
                                        <span className={`px-2 py-0.5 text-xs rounded-full ${reply.authorType === 'client' ? 'bg-purple-200 text-purple-700' : 'bg-orange-200 text-orange-700'}`}>
                                            {reply.authorType === 'client' ? 'Client' : reply.authorRole || 'Staff'}
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
                            className="w-full px-4 text-black  py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
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
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-colors"
                    >
                        <Send className="w-4 h-4" />
                        {isSubmitting ? 'Posting...' : 'Post Reply'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ComplaintDetails;
