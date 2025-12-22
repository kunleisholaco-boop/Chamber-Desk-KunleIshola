import React, { useState } from 'react';
import { X, Send, Paperclip, Download, User, Calendar } from 'lucide-react';
import axios from 'axios';
import API_BASE_URL from '../../config/api';

const SupportTicketDetail = ({ ticket, isOpen, onClose, onUpdate, userRole }) => {
    const [replyMessage, setReplyMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [updatingStatus, setUpdatingStatus] = useState(false);

    if (!isOpen || !ticket) return null;

    const handleSubmitReply = async (e) => {
        e.preventDefault();
        if (!replyMessage.trim()) return;

        setSubmitting(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(
                `${API_BASE_URL}/api/support/${ticket._id}/reply`,
                { message: replyMessage },
                { headers: { 'x-auth-token': token } }
            );
            setReplyMessage('');
            onUpdate(res.data);
        } catch (err) {
            console.error('Error submitting reply:', err);
            alert('Failed to submit reply');
        } finally {
            setSubmitting(false);
        }
    };

    const handleStatusChange = async (newStatus) => {
        setUpdatingStatus(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.put(
                `${API_BASE_URL}/api/support/${ticket._id}/status`,
                { status: newStatus },
                { headers: { 'x-auth-token': token } }
            );
            onUpdate(res.data);
        } catch (err) {
            console.error('Error updating status:', err);
            alert('Failed to update status');
        } finally {
            setUpdatingStatus(false);
        }
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
        return new Date(dateString).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 z-50 transition-opacity"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden pointer-events-auto flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-200">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <h2 className="text-xl font-bold text-gray-900">{ticket.title}</h2>
                                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(ticket.status)}`}>
                                    {ticket.status}
                                </span>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                                <div className="flex items-center gap-1">
                                    <User size={14} />
                                    {ticket.user?.name || 'Unknown User'}
                                </div>
                                <div className="flex items-center gap-1">
                                    <Calendar size={14} />
                                    {formatDate(ticket.createdAt)}
                                </div>
                                <span className={`px-2 py-0.5 text-xs rounded ${ticket.type === 'Complaint' ? 'bg-red-50 text-red-600' : 'bg-purple-50 text-purple-600'
                                    }`}>
                                    {ticket.type}
                                </span>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <X size={20} className="text-gray-500" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {/* Description */}
                        <div>
                            <h3 className="text-sm font-semibold text-gray-700 mb-2">Description</h3>
                            <p className="text-gray-900 whitespace-pre-wrap">{ticket.description}</p>
                        </div>

                        {/* Attachments */}
                        {ticket.attachments && ticket.attachments.length > 0 && (
                            <div>
                                <h3 className="text-sm font-semibold text-gray-700 mb-2">Attachments</h3>
                                <div className="space-y-2">
                                    {ticket.attachments.map((doc) => (
                                        <div key={doc._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                                            <div className="flex items-center gap-3">
                                                <Paperclip size={16} className="text-gray-400" />
                                                <span className="text-sm text-gray-700">{doc.name}</span>
                                            </div>
                                            <a
                                                href={doc.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-1 text-sm text-orange-600 hover:text-orange-700"
                                            >
                                                <Download size={14} />
                                                Download
                                            </a>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Replies */}
                        <div>
                            <h3 className="text-sm font-semibold text-gray-700 mb-3">
                                Tech Support Replies ({ticket.replies?.length || 0})
                            </h3>
                            {ticket.replies && ticket.replies.length > 0 ? (
                                <div className="space-y-3">
                                    {ticket.replies.map((reply, index) => (
                                        <div key={index} className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-sm font-semibold text-blue-900">
                                                    {reply.user?.name || 'Tech Support'}
                                                </span>
                                                <span className="text-xs text-blue-600">
                                                    {formatDate(reply.createdAt)}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-800 whitespace-pre-wrap">{reply.message}</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500 italic">No replies yet</p>
                            )}
                        </div>

                        {/* Status Change (Superadmin only) */}
                        {userRole === 'Superadmin' && (
                            <div>
                                <h3 className="text-sm font-semibold text-gray-700 mb-3">Change Status</h3>
                                {ticket.type === 'Complaint' ? (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleStatusChange('Fixing')}
                                            disabled={updatingStatus || ticket.status === 'Fixing'}
                                            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${ticket.status === 'Fixing'
                                                ? 'bg-blue-600 text-white cursor-default'
                                                : 'bg-blue-100 text-blue-700 hover:bg-blue-200 disabled:opacity-50'
                                                }`}
                                        >
                                            {ticket.status === 'Fixing' ? '✓ Fixing' : 'Mark as Fixing'}
                                        </button>
                                        <button
                                            onClick={() => handleStatusChange('Fixed')}
                                            disabled={updatingStatus || ticket.status === 'Fixed'}
                                            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${ticket.status === 'Fixed'
                                                ? 'bg-green-600 text-white cursor-default'
                                                : 'bg-green-100 text-green-700 hover:bg-green-200 disabled:opacity-50'
                                                }`}
                                        >
                                            {ticket.status === 'Fixed' ? '✓ Fixed' : 'Mark as Fixed'}
                                        </button>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            onClick={() => handleStatusChange('Seen')}
                                            disabled={updatingStatus || ticket.status === 'Seen'}
                                            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${ticket.status === 'Seen'
                                                ? 'bg-emerald-600 text-white cursor-default'
                                                : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 disabled:opacity-50'
                                                }`}
                                        >
                                            {ticket.status === 'Seen' ? '✓ Seen' : 'Mark as Seen'}
                                        </button>
                                        <button
                                            onClick={() => handleStatusChange('Implementing')}
                                            disabled={updatingStatus || ticket.status === 'Implementing'}
                                            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${ticket.status === 'Implementing'
                                                ? 'bg-blue-600 text-white cursor-default'
                                                : 'bg-blue-100 text-blue-700 hover:bg-blue-200 disabled:opacity-50'
                                                }`}
                                        >
                                            {ticket.status === 'Implementing' ? '✓ Implementing' : 'Implementing'}
                                        </button>
                                        <button
                                            onClick={() => handleStatusChange('Added')}
                                            disabled={updatingStatus || ticket.status === 'Added'}
                                            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${ticket.status === 'Added'
                                                ? 'bg-green-600 text-white cursor-default'
                                                : 'bg-green-100 text-green-700 hover:bg-green-200 disabled:opacity-50'
                                                }`}
                                        >
                                            {ticket.status === 'Added' ? '✓ Added' : 'Mark as Added'}
                                        </button>
                                        <button
                                            onClick={() => handleStatusChange('Not Added')}
                                            disabled={updatingStatus || ticket.status === 'Not Added'}
                                            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${ticket.status === 'Not Added'
                                                ? 'bg-red-600 text-white cursor-default'
                                                : 'bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-50'
                                                }`}
                                        >
                                            {ticket.status === 'Not Added' ? '✓ Not Added' : 'Not Added'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Reply Form - Available for all users */}
                    <div className="border-t border-gray-200 p-6 bg-gray-50">
                        <form onSubmit={handleSubmitReply}>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Add Reply
                            </label>
                            <textarea
                                value={replyMessage}
                                onChange={(e) => setReplyMessage(e.target.value)}
                                placeholder="Type your response here..."
                                rows={3}
                                className="w-full px-4 py-2 text-black border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none mb-3"
                                required
                            />
                            <button
                                type="submit"
                                disabled={submitting || !replyMessage.trim()}
                                className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Send size={16} />
                                {submitting ? 'Sending...' : 'Send Reply'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
};

export default SupportTicketDetail;
