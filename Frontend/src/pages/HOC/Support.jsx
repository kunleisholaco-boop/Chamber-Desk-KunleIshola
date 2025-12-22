import React, { useState, useEffect } from 'react';
import { MessageSquare, Lightbulb, Send, Paperclip, X, Eye } from 'lucide-react';
import axios from 'axios';
import DocumentSelectorDrawer from '../../components/DocumentSelectorDrawer';
import SupportTicketDetail from '../../components/SupportTicketDetail';
import API_BASE_URL from '../../../config/api';

const HOCSupport = () => {
    const [activeView, setActiveView] = useState('menu');
    const [activeTicketTab, setActiveTicketTab] = useState('complaints'); // 'complaints' or 'requests'
    const [formData, setFormData] = useState({
        title: '',
        description: ''
    });
    const [selectedDocuments, setSelectedDocuments] = useState([]);
    const [showDocumentDrawer, setShowDocumentDrawer] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [tickets, setTickets] = useState([]);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [userRole, setUserRole] = useState('');
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        fetchTickets();
        fetchUserRole();
    }, []);

    const fetchTickets = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_BASE_URL}/api/support', {
                headers: { 'x-auth-token': token }
            });

            // Backend already filters by user, so we can use res.data directly
            setTickets(res.data);
        } catch (err) {
            console.error('Error fetching tickets:', err);
        }
    };

    const fetchUserRole = () => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        setUserRole(user.role || '');
    };

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleDocumentsSelected = (docs) => {
        setSelectedDocuments(docs);
        setShowDocumentDrawer(false);
    };

    const handleRemoveDocument = (docId) => {
        setSelectedDocuments(selectedDocuments.filter(doc => doc._id !== docId));
    };

    const handleSubmit = async (type) => {
        if (!formData.title || !formData.description) {
            setMessage({ type: 'error', text: 'Please fill in all required fields' });
            return;
        }

        setSubmitting(true);
        setMessage({ type: '', text: '' });
        try {
            const token = localStorage.getItem('token');
            const payload = {
                type,
                title: formData.title,
                description: formData.description,
                attachments: selectedDocuments.map(doc => doc._id)
            };

            await axios.post(`${API_BASE_URL}/api/support', payload, {
                headers: { 'x-auth-token': token }
            });

            setMessage({ type: 'success', text: `${type} submitted successfully!` });
            setFormData({ title: '', description: '' });
            setSelectedDocuments([]);
            setTimeout(() => {
                setActiveView('menu');
                fetchTickets(); // Refresh tickets list
            }, 1500);
        } catch (err) {
            console.error('Error submitting ticket:', err);
            setMessage({ type: 'error', text: 'Failed to submit ticket' });
        } finally {
            setSubmitting(false);
        }
    };

    const handleViewTicket = async (ticketId) => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_BASE_URL}/api/support/${ticketId}`, {
                headers: { 'x-auth-token': token }
            });
            setSelectedTicket(res.data);
            setShowDetailModal(true);
        } catch (err) {
            console.error('Error fetching ticket details:', err);
        }
    };

    const handleTicketUpdate = (updatedTicket) => {
        setSelectedTicket(updatedTicket);
        setTickets(tickets.map(t => t._id === updatedTicket._id ? updatedTicket : t));
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
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const complaints = tickets.filter(t => t.type === 'Complaint');
    const featureRequests = tickets.filter(t => t.type === 'Feature Request');

    const renderMenu = () => (
        <div className="max-w-4xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Support Center</h1>
                <p className="text-gray-600 mt-2">How can we help you today?</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <button
                    onClick={() => setActiveView('complaint')}
                    className="bg-white border-2 border-gray-200 rounded-xl p-8 hover:border-purple-500 hover:shadow-lg transition-all text-left group"
                >
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-red-100 rounded-lg group-hover:bg-red-200 transition-colors">
                            <MessageSquare className="w-8 h-8 text-red-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900">File a Complaint</h2>
                    </div>
                    <p className="text-gray-600">
                        Report an issue or problem you're experiencing with the system
                    </p>
                </button>

                <button
                    onClick={() => setActiveView('feature')}
                    className="bg-white border-2 border-gray-200 rounded-xl p-8 hover:border-purple-500 hover:shadow-lg transition-all text-left group"
                >
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                            <Lightbulb className="w-8 h-8 text-purple-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900">Request a Feature</h2>
                    </div>
                    <p className="text-gray-600">
                        Suggest a new feature or improvement for the system
                    </p>
                </button>
            </div>

            {/* My Tickets Section with Tabs */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Tabs */}
                <div className="border-b border-gray-200 px-4">
                    <nav className="-mb-px flex space-x-8">
                        <button
                            onClick={() => setActiveTicketTab('complaints')}
                            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTicketTab === 'complaints'
                                    ? 'border-red-500 text-red-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                <MessageSquare size={18} />
                                My Complaints ({complaints.length})
                            </div>
                        </button>
                        <button
                            onClick={() => setActiveTicketTab('requests')}
                            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTicketTab === 'requests'
                                    ? 'border-purple-500 text-purple-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                <Lightbulb size={18} />
                                My Feature Requests ({featureRequests.length})
                            </div>
                        </button>
                    </nav>
                </div>

                {/* Tab Content */}
                <div className="p-4">
                    {activeTicketTab === 'complaints' && (
                        complaints.length === 0 ? (
                            <div className="text-center py-12">
                                <MessageSquare size={48} className="mx-auto mb-3 text-gray-300" />
                                <p className="text-gray-500">No complaints submitted yet</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {complaints.map(ticket => (
                                    <div key={ticket._id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="font-semibold text-gray-900">{ticket.title}</h4>
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(ticket.status)}`}>
                                                {ticket.status}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{ticket.description}</p>
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-gray-500">{formatDate(ticket.createdAt)}</span>
                                            <button
                                                onClick={() => handleViewTicket(ticket._id)}
                                                className="inline-flex items-center gap-1 px-3 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
                                            >
                                                <Eye size={14} />
                                                View Details
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )
                    )}

                    {activeTicketTab === 'requests' && (
                        featureRequests.length === 0 ? (
                            <div className="text-center py-12">
                                <Lightbulb size={48} className="mx-auto mb-3 text-gray-300" />
                                <p className="text-gray-500">No feature requests submitted yet</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {featureRequests.map(ticket => (
                                    <div key={ticket._id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="font-semibold text-gray-900">{ticket.title}</h4>
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(ticket.status)}`}>
                                                {ticket.status}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{ticket.description}</p>
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-gray-500">{formatDate(ticket.createdAt)}</span>
                                            <button
                                                onClick={() => handleViewTicket(ticket._id)}
                                                className="inline-flex items-center gap-1 px-3 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
                                            >
                                                <Eye size={14} />
                                                View Details
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )
                    )}
                </div>
            </div>
        </div>
    );

    const renderForm = (type) => (
        <div className="max-w-3xl mx-auto">
            <button
                onClick={() => setActiveView('menu')}
                className="mb-6 text-purple-600 hover:text-purple-700 font-medium flex items-center gap-2"
            >
                ← Back to Menu
            </button>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
                <div className="flex items-center gap-4 mb-6">
                    <div className={`p-3 ${type === 'Complaint' ? 'bg-red-100' : 'bg-purple-100'} rounded-lg`}>
                        {type === 'Complaint' ? (
                            <MessageSquare className="w-8 h-8 text-red-600" />
                        ) : (
                            <Lightbulb className="w-8 h-8 text-purple-600" />
                        )}
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">
                            {type === 'Complaint' ? 'File a Complaint' : 'Request a Feature'}
                        </h2>
                        <p className="text-gray-600">
                            {type === 'Complaint'
                                ? 'Describe the issue you\'re experiencing'
                                : 'Tell us about your feature idea'}
                        </p>
                    </div>
                </div>

                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Title <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleInputChange}
                            placeholder={type === 'Complaint' ? 'Brief summary of the issue' : 'Brief description of the feature'}
                            className="w-full px-4 py-2 text-black border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Description <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            placeholder={type === 'Complaint'
                                ? 'Provide detailed information about the problem...'
                                : 'Explain how this feature would help...'}
                            rows={6}
                            className="w-full px-4 py-2 text-black border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Attachments (Optional)
                        </label>
                        <button
                            onClick={() => setShowDocumentDrawer(true)}
                            className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 transition-colors text-gray-600 hover:text-purple-600"
                        >
                            <Paperclip size={18} />
                            Attach Files
                        </button>

                        {selectedDocuments.length > 0 && (
                            <div className="mt-3 space-y-2">
                                {selectedDocuments.map(doc => (
                                    <div key={doc._id} className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200">
                                        <span className="text-sm text-gray-700">{doc.name}</span>
                                        <button
                                            onClick={() => handleRemoveDocument(doc._id)}
                                            className="text-red-600 hover:text-red-700"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <button
                        onClick={() => handleSubmit(type)}
                        disabled={submitting}
                        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Send size={18} />
                        {submitting ? 'Submitting...' : `Submit ${type}`}
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="p-8">
            {activeView === 'menu' && renderMenu()}
            {activeView === 'complaint' && renderForm('Complaint')}
            {activeView === 'feature' && renderForm('Feature Request')}

            <DocumentSelectorDrawer
                isOpen={showDocumentDrawer}
                onClose={() => setShowDocumentDrawer(false)}
                onSelectDocuments={handleDocumentsSelected}
                actionLabel="Attach Files"
            />

            <SupportTicketDetail
                ticket={selectedTicket}
                isOpen={showDetailModal}
                onClose={() => setShowDetailModal(false)}
                onUpdate={handleTicketUpdate}
                userRole={userRole}
            />
        </div>
    );
};

export default HOCSupport;
