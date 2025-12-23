import React, { useState, useEffect } from 'react';
import { MessageSquare, Lightbulb, Send, Paperclip, X, Eye, Book, CheckCircle2 } from 'lucide-react';
import axios from 'axios';
import DocumentSelectorDrawer from '../../components/DocumentSelectorDrawer';
import SupportTicketDetail from '../../components/SupportTicketDetail';
import Alert from '../../components/Alert';
import LoadingSpinner from '../../components/AdminOfficer/LoadingSpinner';
import API_BASE_URL from '../../config/api';

const Support = () => {
    // Get user role from localStorage for dynamic theming
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userRole = user.role || 'Admin';
    const primaryColor = userRole === 'HOC' ? 'purple' : 'orange';

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
    const [userRoleState, setUserRoleState] = useState('');
    const [message, setMessage] = useState({ type: '', text: '' });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchTickets();
        fetchUserRole();
    }, []);

    const fetchTickets = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_BASE_URL}/api/support`, {
                headers: { 'x-auth-token': token }
            });
            setTickets(res.data);
        } catch (err) {
            console.error('Error fetching tickets:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchUserRole = () => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        setUserRoleState(user.role || '');
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

            await axios.post(`${API_BASE_URL}/api/support`, payload, {
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
        <div className="">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Support Center</h1>
                <p className="text-gray-600 mt-2">How can we help you today?</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <button
                    onClick={() => setActiveView('complaint')}
                    className={`bg-white border-2 border-gray-200 rounded-xl p-8 hover:border-${primaryColor}-500 hover:shadow-lg transition-all text-left group`}
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
                    className={`bg-white border-2 border-gray-200 rounded-xl p-8 hover:border-${primaryColor}-500 hover:shadow-lg transition-all text-left group`}
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

                <button
                    onClick={() => setActiveView('developers')}
                    className={`bg-white border-2 border-gray-200 rounded-xl p-8 hover:border-${primaryColor}-500 hover:shadow-lg transition-all text-left group`}
                >
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-slate-100 rounded-lg group-hover:bg-slate-200 transition-colors">
                            <Book className="w-8 h-8 text-slate-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900">About the Developers</h2>
                    </div>
                    <p className="text-gray-600">
                        Learn about Khrien, the team behind ChamberDesk
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
                                                className={`inline-flex items-center gap-1 px-3 py-1 text-xs bg-${primaryColor}-600 text-white rounded hover:bg-${primaryColor}-700 transition-colors`}
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
                                                className={`inline-flex items-center gap-1 px-3 py-1 text-xs bg-${primaryColor}-600 text-white rounded hover:bg-${primaryColor}-700 transition-colors`}
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
                className={`mb-6 text-${primaryColor}-600 hover:text-${primaryColor}-700 font-medium flex items-center gap-2`}
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
                            className={`w-full px-4 py-2 text-black border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-${primaryColor}-500`}
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
                            className={`w-full px-4 py-2 text-black border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-${primaryColor}-500 resize-none`}
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Attachments (Optional)
                        </label>
                        <button
                            onClick={() => setShowDocumentDrawer(true)}
                            className={`flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-${primaryColor}-500 transition-colors text-gray-600 hover:text-${primaryColor}-600`}
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
                        className={`w-full flex items-center justify-center gap-2 px-6 py-3 bg-${primaryColor}-600 text-white font-semibold rounded-lg hover:bg-${primaryColor}-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                        <Send size={18} />
                        {submitting ? 'Submitting...' : `Submit ${type}`}
                    </button>
                </div>
            </div>
        </div>
    );

    const renderUserManual = () => {
        const manualSections = {
            clients: {
                title: 'Client Management',
                allowedRoles: ['Admin', 'HOC'], // Admin can add/edit/delete, HOC can view
                icon: '👥',
                color: 'blue',
                content: [
                    {
                        subtitle: 'Adding a Client',
                        steps: [
                            'Option 1: Click "Add Client" from the Quick Actions on the dashboard',
                            'Option 2: Navigate to Clients page from the sidebar and click "Add Client" button',
                            'Select client type (Individual, Corporate, or Government Agency)',
                            'Fill in all required fields marked with *',
                            'Click "Add Client" to save'
                        ]
                    },
                    {
                        subtitle: 'Viewing Clients',
                        steps: [
                            'Navigate to Clients page from the sidebar',
                            'View the total number of clients in your system',
                            'Click on any client to view their full details',
                            'Review client information, cases, and complaints'
                        ]
                    },
                    {
                        subtitle: 'Adding Cases from Client Details',
                        steps: [
                            'Open a client\'s details page',
                            'Click "Add Case" button',
                            'Fill in case information',
                            'The case will be automatically linked to the client'
                        ]
                    },
                    {
                        subtitle: 'Viewing Client Complaints',
                        steps: [
                            'Open a client\'s details page',
                            'Scroll to the "Complaints" section',
                            'View all complaints filed by the client',
                            'Click on any complaint to see details and responses'
                        ]
                    },
                    {
                        subtitle: 'Editing a Client',
                        steps: [
                            'Navigate to Clients page from the sidebar',
                            'Click on the client you want to edit',
                            'Click the "Edit Client" button',
                            'Update the necessary information and save'
                        ]
                    },
                    {
                        subtitle: 'Deleting a Client',
                        steps: [
                            'Go to the Clients page',
                            'Click on the client you want to delete',
                            'Click the "Delete Client" button',
                            'Confirm the deletion when prompted'
                        ]
                    }
                ]
            },
            funds: {
                title: 'Fund Requisitions',
                allowedRoles: ['Admin', 'HOC', 'Manager', 'Lawyer', 'Paralegal'], // All roles can request funds
                icon: '💰',
                color: 'green',
                content: [
                    {
                        subtitle: 'Requesting Funds',
                        steps: [
                            'Click "Request Funds" from Quick Actions',
                            'Enter the amount and purpose of the request',
                            'Attach any supporting documents if needed',
                            'Submit the request for manager approval'
                        ]
                    }
                ]
            },
            documents: {
                title: 'Document Management',
                allowedRoles: ['Admin', 'HOC', 'Manager', 'Lawyer', 'Paralegal'], // All roles can manage documents
                icon: '📄',
                color: 'orange',
                content: [
                    {
                        subtitle: 'Uploading Documents',
                        steps: [
                            'Click "Upload Document" from Quick Actions or Documents page',
                            'Select one or multiple files from your computer',
                            'Wait for the upload to complete',
                            'Documents will appear in "My Documents" tab'
                        ]
                    },
                    {
                        subtitle: 'Adding Documents to Cases',
                        steps: [
                            'Go to Documents page and find the document',
                            'Click the "Add to Case" icon (folder with plus)',
                            'Select the case(s) you want to link the document to',
                            'Click "Add to Case" to confirm'
                        ]
                    },
                    {
                        subtitle: 'Sharing Documents',
                        steps: [
                            'Find the document in "My Documents" tab',
                            'Click the Share icon',
                            'Search and select users to share with',
                            'Click "Share Document" to confirm'
                        ]
                    },
                    {
                        subtitle: 'Downloading Documents',
                        steps: [
                            'Locate the document you want to download',
                            'Click the Download icon',
                            'The file will open in a new tab or download automatically'
                        ]
                    }
                ]
            },
            cases: {
                title: 'Case Management',
                allowedRoles: ['Admin', 'HOC'], // Only Admin and HOC can manage cases
                icon: '⚖️',
                color: 'purple',
                content: [
                    {
                        subtitle: 'Adding a Case',
                        steps: [
                            'Click "Add Case" from Quick Actions or Cases page',
                            'Fill in case title, case number, and case type',
                            'Select the client for this case',
                            'Add case description and other details',
                            'Click "Add Case" to save'
                        ]
                    },
                    {
                        subtitle: 'Viewing Case Details',
                        steps: [
                            'Navigate to Cases page from the sidebar',
                            'Click on any case to view full details',
                            'Review case information, parties, court details, and documents',
                            'See assigned lawyers and case status'
                        ]
                    },
                    {
                        subtitle: 'Editing Cases',
                        steps: [
                            'Navigate to Cases page and select a case',
                            'Click "Edit Case" button at the top',
                            'Update case details as needed',
                            'Save changes'
                        ]
                    },
                    {
                        subtitle: 'Changing Case Status',
                        steps: [
                            'Open the case details page',
                            'Click "Change Status" button',
                            'Select new status (Open, Pending, Closed, Completed-Won, Completed-Lost)',
                            'Confirm the status change'
                        ]
                    },
                    {
                        subtitle: 'Assigning Lawyers to Cases',
                        steps: [
                            'Open the case details page',
                            'Find the "Assigned Lawyers" section',
                            'Click "Assign Lawyer" button',
                            'Select lawyer(s) from the dropdown',
                            'Save the assignment'
                        ]
                    },
                    {
                        subtitle: 'Sending Case Report to Client',
                        steps: [
                            'Open the case details page',
                            'Click "Share Client Link" or "Send Report" button',
                            'Copy the generated link or send report directly',
                            'Share the link with the client via email or other means'
                        ]
                    },
                    {
                        subtitle: 'Updating Opposing Counsel',
                        steps: [
                            'Open the case details page',
                            'Find the Opposing Counsel section under Case Details',
                            'Click "Update Opposing Counsel" button',
                            'Enter the new counsel\'s name',
                            'Save - the system maintains a history of all opposing counsels'
                        ]
                    },
                    {
                        subtitle: 'Adding Court Details',
                        steps: [
                            'Open the case details page',
                            'Scroll to the Court Information section',
                            'Click "Add Court Details" button',
                            'Fill in court name, location, case number, judge, and next court date',
                            'Add any court orders or notes',
                            'Save the court details'
                        ]
                    },
                    {
                        subtitle: 'Updating Court History',
                        steps: [
                            'From the case details page, locate Current Court Status',
                            'Click "Update Status" to add a new court date entry',
                            'Or click "Edit" to modify the current court details',
                            'Previous court dates are saved in Court History'
                        ]
                    },
                    {
                        subtitle: 'Adding Parties Involved',
                        steps: [
                            'Open the case details page',
                            'Scroll to the "Parties Involved" section',
                            'Click "Add Party" button',
                            'Enter party name, role (Plaintiff, Defendant, etc.), and contact information',
                            'Save the party details'
                        ]
                    },
                    {
                        subtitle: 'Managing Witnesses',
                        steps: [
                            'From the case details page, find the "Witnesses" section',
                            'Click "Add Witness" button',
                            'Fill in witness name, contact details, and role',
                            'Add any notes about the witness testimony',
                            'Save the witness information'
                        ]
                    },
                    {
                        subtitle: 'Adding Case Reports and Updates',
                        steps: [
                            'Open the case details page',
                            'Scroll to the "Case Notes" or "Updates" section',
                            'Click "Add Note" or "Add Update" button',
                            'Enter your note or update in the text field',
                            'Notes are timestamped and attributed to you automatically',
                            'Click "Save" to add the note'
                        ]
                    },
                    {
                        subtitle: 'Viewing Case Document Library',
                        steps: [
                            'Open the case details page',
                            'Scroll to the "Documents" or "Case Library" section',
                            'View all documents linked to this case',
                            'Click on any document to preview or download'
                        ]
                    },
                    {
                        subtitle: 'Uploading Documents to Case Library',
                        steps: [
                            'Open the case details page',
                            'Go to the Documents section',
                            'Click "Upload Document" or "Add Document" button',
                            'Select file(s) from your computer',
                            'Documents will be automatically linked to the case'
                        ]
                    }
                ]
            },
            notifications: {
                title: 'Managing Notifications',
                allowedRoles: ['Admin', 'HOC', 'Manager', 'Lawyer', 'Paralegal'], // All roles can view notifications
                icon: '🔔',
                color: 'red',
                content: [
                    {
                        subtitle: 'Viewing Notifications',
                        steps: [
                            'Click the bell icon in the sidebar to access Notifications page',
                            'View all your notifications in chronological order',
                            'Unread notifications are highlighted',
                            'Click on any notification to mark it as read'
                        ]
                    },
                    {
                        subtitle: 'Filtering Notifications',
                        steps: [
                            'On the Notifications page, use the date filter at the top',
                            'Select a date range to view notifications from specific periods',
                            'Filter by notification type if needed',
                            'Clear filters to see all notifications'
                        ]
                    },
                    {
                        subtitle: 'Notification Actions',
                        steps: [
                            'Some notifications have action buttons (e.g., "View Case", "View Client")',
                            'Click these buttons to navigate directly to the related item',
                            'This provides quick access to cases, clients, or funds mentioned in notifications'
                        ]
                    }
                ]
            },
            search: {
                title: 'Search & Filters',
                allowedRoles: ['Admin', 'HOC', 'Manager', 'Lawyer', 'Paralegal'], // All roles can search
                icon: '🔍',
                color: 'teal',
                content: [
                    {
                        subtitle: 'Searching for Clients',
                        steps: [
                            'Go to the Clients page',
                            'Use the search bar at the top to search by name, email, or phone',
                            'Results update automatically as you type',
                            'Click on any client to view their details'
                        ]
                    },
                    {
                        subtitle: 'Searching for Cases',
                        steps: [
                            'Navigate to the Cases page',
                            'Use the search bar to find cases by title, case number, or client name',
                            'Filter by case status using the dropdown filters',
                            'Sort cases by date, status, or case type'
                        ]
                    },
                    {
                        subtitle: 'Searching for Documents',
                        steps: [
                            'Go to the Documents page',
                            'Use the search bar to find documents by name',
                            'Filter by file type (PDF, Word, Excel, Images, etc.)',
                            'Sort by date uploaded, name, or file size',
                            'Switch between "My Documents" and "Shared with Me" tabs'
                        ]
                    }
                ]
            },
            meetings: {
                title: 'Meeting Management',
                allowedRoles: ['Admin', 'HOC', 'Manager', 'Lawyer', 'Paralegal'], // All roles can manage meetings
                icon: '📅',
                color: 'emerald',
                content: [
                    {
                        subtitle: 'Scheduling a Meeting',
                        steps: [
                            'Navigate to Meetings page from the sidebar',
                            'Click "Schedule Meeting" button',
                            'Enter meeting title and description',
                            'Choose meeting type: Online (with meeting link) or Physical (with location)',
                            'Set the date and time for the meeting',
                            'Select attendees from the list (Admins, HOCs, Clients)',
                            'Click "Schedule Meeting" to create',
                            'Attendees will receive notifications and can RSVP'
                        ]
                    },
                    {
                        subtitle: 'Managing Meeting RSVPs',
                        steps: [
                            'Open any meeting from the Meetings page',
                            'View the list of attendees and their RSVP status',
                            'Statuses include: Pending, Accepted, or Declined',
                            'As an admin, you can see who has responded to the meeting invite',
                            'Use this information to plan accordingly'
                        ]
                    },
                    {
                        subtitle: 'Editing or Cancelling Meetings',
                        steps: [
                            'Click on the meeting you want to modify',
                            'Click "Edit Meeting" to update details, date, time, or attendees',
                            'Or click "Cancel Meeting" to cancel it',
                            'All attendees will be notified of changes or cancellations',
                            'Cancelled meetings are marked with a "Cancelled" status'
                        ]
                    },
                    {
                        subtitle: 'Filtering Meetings',
                        steps: [
                            'Use the tabs to filter meetings: All, Upcoming, Past, or Cancelled',
                            'Upcoming meetings show all scheduled future meetings',
                            'Past meetings show completed meetings for reference',
                            'Search for specific meetings using the search bar'
                        ]
                    }
                ]
            },
            broadcast: {
                title: 'Broadcast Messages',
                allowedRoles: ['Admin', 'HOC', 'Manager', 'Lawyer', 'Paralegal'], // All roles can view broadcasts
                icon: '📢',
                color: 'violet',
                content: [
                    {
                        subtitle: 'Viewing Broadcasts',
                        steps: [
                            'Navigate to Broadcast page from the sidebar',
                            'View all broadcasts sent by Managers',
                            'Broadcasts are organized by date, newest first',
                            'Click on any broadcast to read the full message',
                            'See broadcast details including sender, date, and target audience'
                        ]
                    },
                    {
                        subtitle: 'Understanding Broadcast Status',
                        steps: [
                            'Active broadcasts are currently visible to all targeted users',
                            'Expired broadcasts have passed their expiry date',
                            'Check the status badge to see if a broadcast is active or expired',
                            'Expired broadcasts remain visible for reference but are no longer actively promoted'
                        ]
                    },
                    {
                        subtitle: 'Admin Permissions',
                        steps: [
                            'As an Admin, you can READ all broadcast messages',
                            'You CANNOT create, edit, or delete broadcasts',
                            'Only Managers have permission to send broadcasts',
                            'If you need to send a broadcast, contact a Manager',
                            'Use broadcasts to stay informed about important announcements and updates'
                        ]
                    },
                    {
                        subtitle: 'Staying Informed',
                        steps: [
                            'Check the Broadcast page regularly for important updates',
                            'You will receive notifications when new broadcasts are sent',
                            'Pay attention to broadcasts targeted to "All Users" or "Admins Only"',
                            'Read broadcasts promptly to stay up-to-date with system changes and announcements'
                        ]
                    }
                ]
            },
            tasks: {
                title: 'Task Management',
                allowedRoles: ['Admin', 'HOC', 'Manager', 'Lawyer', 'Paralegal'], // All roles can manage tasks
                icon: '✅',
                color: 'sky',
                content: [
                    {
                        subtitle: 'Creating a Task',
                        steps: [
                            'Navigate to Tasks page from the sidebar',
                            'Click "Add Task" button (or "Add New" in any Kanban column)',
                            'Enter task name and description',
                            'Choose if the task is related to a case (Yes/No)',
                            'If yes, select the case from the dropdown',
                            'Set task status (To-Do, Ongoing, Completed, Cancelled, Overdue)',
                            'Set priority level (Low, Medium, High)',
                            'Choose start and end dates',
                            'Assign team members to the task',
                            'Add collaborators who will work on the task',
                            'Click "Create Task" to save'
                        ]
                    },
                    {
                        subtitle: 'Using the Kanban Board',
                        steps: [
                            'View tasks organized in columns by status',
                            'Drag and drop tasks between columns to update their status',
                            'Click "Add New" in To-Do or Ongoing columns to create tasks with pre-selected status',
                            'Click on any task card to view full details',
                            'Use tabs to filter: My Tasks, Assigned to Me, or Joint Tasks',
                            'See task priority, due dates, and assigned team members at a glance'
                        ]
                    },
                    {
                        subtitle: 'Managing Task Details',
                        steps: [
                            'Click on a task to open the details page',
                            'Add subtasks to break down work into smaller steps',
                            'Check off subtasks as they are completed',
                            'Edit or delete subtasks using the action buttons',
                            'Change task status using the dropdown at the top',
                            'Edit task details by clicking the "Edit" button',
                            'Delete tasks if they are no longer needed'
                        ]
                    },
                    {
                        subtitle: 'Task Comments & Mentions',
                        steps: [
                            'Scroll to "Comments & Updates" section in task details',
                            'Type @ to mention team members (creator, assignees, collaborators)',
                            'Select a person from the dropdown to tag them',
                            'Add comments to provide updates or ask questions',
                            'Reply to existing comments for threaded discussions',
                            'Mentioned users will receive notifications',
                            'Use comments to keep everyone informed of progress'
                        ]
                    },
                    {
                        subtitle: 'Case-Linked Tasks',
                        steps: [
                            'Tasks linked to cases show case details and documents',
                            'View case information directly from the task page',
                            'Access the case library to see related documents',
                            'Add documents to the case from within the task',
                            'If no case is attached, you can attach one later by editing the task',
                            'Case details are blurred if task is not linked to a case'
                        ]
                    }
                ]
            },
            support: {
                title: 'Getting Help',
                icon: '💬',
                color: 'pink',
                content: [
                    {
                        subtitle: 'Filing a Complaint',
                        steps: [
                            'Click "Support" in the sidebar',
                            'Select "File a Complaint"',
                            'Enter a descriptive title for your issue',
                            'Provide detailed description of the problem',
                            'Attach screenshots or documents if helpful',
                            'Submit your complaint - you\'ll receive updates on its status'
                        ]
                    },
                    {
                        subtitle: 'Requesting a Feature',
                        steps: [
                            'Go to the Support page',
                            'Click "Request a Feature"',
                            'Describe the feature you\'d like to see',
                            'Explain how it would help your workflow',
                            'Submit the request - the team will review it'
                        ]
                    },
                    {
                        subtitle: 'Tracking Your Tickets',
                        steps: [
                            'On the Support page, scroll to "My Tickets"',
                            'View your complaints and feature requests in separate tabs',
                            'Check the status of each ticket (Awaiting Reply, Fixing, Fixed, etc.)',
                            'Click "View Details" to see responses and updates',
                            'Reply to tickets to provide additional information'
                        ]
                    }
                ]
            }
        };

        // Filter manual sections based on user role
        const filteredSections = Object.entries(manualSections)
            .filter(([key, section]) => section.allowedRoles && section.allowedRoles.includes(userRole))
            .reduce((obj, [key, value]) => ({ ...obj, [key]: value }), {});

        // If current tab is not in filtered sections, switch to first available section
        const availableSectionKeys = Object.keys(filteredSections);
        const currentTab = availableSectionKeys.includes(activeManualTab)
            ? activeManualTab
            : availableSectionKeys[0] || 'funds'; // Default to 'funds' if no sections available

        const currentSection = filteredSections[currentTab];
        const colorClasses = {
            blue: 'border-blue-500 bg-blue-50 text-blue-700',
            green: 'border-green-500 bg-green-50 text-green-700',
            orange: 'border-orange-500 bg-orange-50 text-orange-700',
            purple: 'border-purple-500 bg-purple-50 text-purple-700',
            indigo: 'border-indigo-500 bg-indigo-50 text-indigo-700',
            red: 'border-red-500 bg-red-50 text-red-700',
            teal: 'border-teal-500 bg-teal-50 text-teal-700',
            cyan: 'border-cyan-500 bg-cyan-50 text-cyan-700',
            amber: 'border-amber-500 bg-amber-50 text-amber-700',
            pink: 'border-pink-500 bg-pink-50 text-pink-700',
            emerald: 'border-emerald-500 bg-emerald-50 text-emerald-700',
            violet: 'border-violet-500 bg-violet-50 text-violet-700',
            sky: 'border-sky-500 bg-sky-50 text-sky-700'
        };

        return (
            <div className="max-w-7xl mx-auto">
                <button
                    onClick={() => setActiveView('menu')}
                    className={`mb-6 text-${primaryColor}-600 hover:text-${primaryColor}-700 font-medium flex items-center gap-2`}
                >
                    ← Back to Menu
                </button>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    {/* Header - Dynamic Theme Based on Role */}
                    <div className={`bg-gradient-to-r from-${primaryColor}-600 to-${primaryColor}-700 p-6`}>
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                                <Book className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white">{userRole} User Manual</h2>
                                <p className={`text-${primaryColor}-100`}>Step-by-step guides for using the system</p>
                            </div>
                        </div>
                    </div>

                    {/* Tab Layout: Left Tabs + Right Content */}
                    <div className="flex min-h-[600px]">
                        {/* Left Side - Navigation Tabs */}
                        <div className="w-64 bg-gray-50 border-r border-gray-200 p-4">
                            <nav className="space-y-2">
                                {Object.entries(filteredSections).map(([key, section]) => (
                                    <button
                                        key={key}
                                        onClick={() => setActiveManualTab(key)}
                                        className={`w-full text-left px-4 py-3 rounded-lg transition-all flex items-center gap-3 ${activeManualTab === key
                                            ? `${colorClasses[section.color]} font-semibold shadow-sm border-l-4`
                                            : 'text-gray-700 hover:bg-gray-100'
                                            }`}
                                    >
                                        <span className="text-2xl">{section.icon}</span>
                                        <span className="text-sm">{section.title}</span>
                                    </button>
                                ))}
                            </nav>
                        </div>

                        {/* Right Side - Content */}
                        <div className="flex-1 p-8 overflow-y-auto max-h-[600px]">
                            {currentSection ? (
                                <>
                                    <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                                        <span className="text-3xl">{currentSection.icon}</span>
                                        {currentSection.title}
                                    </h3>

                                    <div className="space-y-6">
                                        {currentSection.content.map((item, index) => (
                                            <div key={index} className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                                                <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                                    <CheckCircle2 className={`w-5 h-5 text-${currentSection.color}-600`} />
                                                    {item.subtitle}
                                                </h4>
                                                <ol className="space-y-3">
                                                    {item.steps.map((step, stepIndex) => (
                                                        <li key={stepIndex} className="flex gap-3">
                                                            <span className={`flex-shrink-0 w-6 h-6 rounded-full bg-${currentSection.color}-100 text-${currentSection.color}-700 flex items-center justify-center text-xs font-bold`}>
                                                                {stepIndex + 1}
                                                            </span>
                                                            <span className="text-gray-700 text-sm pt-0.5">{step}</span>
                                                        </li>
                                                    ))}
                                                </ol>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <div className="text-center py-12">
                                    <p className="text-gray-500">No manual sections available for your role.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderAboutDevelopers = () => (
        <div>
            <button
                onClick={() => setActiveView('menu')}
                className={`mb-6 text-${primaryColor}-600 hover:text-${primaryColor}-700 font-medium flex items-center gap-2`}
            >
                ← Back to Menu
            </button>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
                <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg">
                        <Book className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">About the Developers</h2>
                        <p className="text-gray-600">Meet the team behind ChamberDesk</p>
                    </div>
                </div>

                <div className="space-y-8">
                    {/* Company Info */}
                    <div className="border-l-4 border-orange-500 bg-orange-50 p-6 rounded-r-lg">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">Built by Khrien: The Innovation Company Behind ChamberDesk</h3>
                        <div className="space-y-4 text-gray-700 leading-relaxed">
                            <p>
                                ChamberDesk is developed by <strong>Khrien</strong>, a digital innovation company focused on building powerful software solutions that simplify work, enhance productivity, and empower organizations to thrive.
                            </p>
                            <p>
                                At Khrien, we combine deep industry insight with modern technology to create tools that solve real operational challenges. ChamberDesk is one of our flagship products, designed specifically to help law firms streamline case management, improve collaboration, and operate with clarity and efficiency.
                            </p>
                            <p>
                                We're committed to continuous improvement, user-focused design, and long-term support. As we evolve ChamberDesk, our mission remains the same:
                            </p>
                            <p className="text-center text-xl font-bold text-orange-600 py-4">
                                Empower. Innovate. Elevate.
                            </p>
                        </div>
                    </div>

                    {/* Contact Info */}
                    <div className="border-l-4 border-blue-500 bg-blue-50 p-6 rounded-r-lg">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">Need Support or Want to Work With Us?</h3>
                        <p className="text-gray-700 mb-6">We'd love to hear from you.</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200">
                                <span className="text-2xl">📧</span>
                                <div>
                                    <p className="text-xs text-gray-500">Email</p>
                                    <p className="font-semibold text-gray-900">hello@khrien.com</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200">
                                <span className="text-2xl">💬</span>
                                <div>
                                    <p className="text-xs text-gray-500">WhatsApp</p>
                                    <p className="font-semibold text-gray-900">+234 906 159 3966</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200">
                                <span className="text-2xl">🌐</span>
                                <div>
                                    <p className="text-xs text-gray-500">Website</p>
                                    <p className="font-semibold text-gray-900">www.khrien.com</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200">
                                <span className="text-2xl">📍</span>
                                <div>
                                    <p className="text-xs text-gray-500">Location</p>
                                    <p className="font-semibold text-gray-900">Lagos, Nigeria</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="p-8">
            {isLoading ? (
                <LoadingSpinner message="Loading support tickets..." color={primaryColor} />
            ) : (
                <>
                    {activeView === 'menu' && renderMenu()}
                    {activeView === 'complaint' && renderForm('Complaint')}
                    {activeView === 'feature' && renderForm('Feature Request')}
                    {activeView === 'manual' && renderUserManual()}
                    {activeView === 'developers' && renderAboutDevelopers()}
                </>
            )}

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

export default Support;

