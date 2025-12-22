import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Edit, Trash2, Plus,
    User, Mail, Phone, MapPin, Building, Calendar,
    Briefcase, Users, FileText, AlertCircle, MessageSquare
} from 'lucide-react';
import LoadingSpinner from '../../components/AdminOfficer/LoadingSpinner';
import API_BASE_URL from '../../../config/api';

const ClientDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [client, setClient] = useState(null);
    const [cases, setCases] = useState([]);
    const [complaints, setComplaints] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteConfirmation, setDeleteConfirmation] = useState('');

    useEffect(() => {
        fetchClientDetails();
        fetchClientCases();
        fetchClientComplaints();
    }, [id]);

    const fetchClientDetails = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/api/clients/${id}`, {
                headers: { 'x-auth-token': token }
            });

            if (response.ok) {
                const data = await response.json();
                setClient(data);
            } else {
                console.error('Failed to fetch client details');
            }
        } catch (err) {
            console.error('Error fetching client details:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchClientCases = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/api/cases/client/${id}`, {
                headers: { 'x-auth-token': token }
            });

            if (response.ok) {
                const data = await response.json();
                setCases(data);
            } else {
                console.error('Failed to fetch client cases');
            }
        } catch (err) {
            console.error('Error fetching client cases:', err);
        }
    };

    const fetchClientComplaints = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/api/complaints/client/${id}`, {
                headers: { 'x-auth-token': token }
            });

            if (response.ok) {
                const data = await response.json();
                setComplaints(data);
            } else {
                console.error('Failed to fetch client complaints');
            }
        } catch (err) {
            console.error('Error fetching client complaints:', err);
        }
    };

    const handleDeleteClient = async () => {
        // Check if confirmation matches client name in CAPS
        if (deleteConfirmation !== client.name.toUpperCase()) {
            return; // Don't proceed if confirmation doesn't match
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/api/clients/${id}`, {
                method: 'DELETE',
                headers: { 'x-auth-token': token }
            });

            if (response.ok) {
                navigate('/admin/clients');
            }
        } catch (err) {
            console.error('Error deleting client:', err);
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            'Active': 'bg-green-100 text-green-800',
            'Inactive': 'bg-gray-100 text-gray-800',
            'Completed': 'bg-blue-100 text-blue-800'
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    const getClientTypeColor = (type) => {
        const colors = {
            'Individual': 'bg-blue-100 text-blue-800',
            'Corporate Organization': 'bg-purple-100 text-purple-800',
            'Government Agency': 'bg-green-100 text-green-800'
        };
        return colors[type] || 'bg-gray-100 text-gray-800';
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    if (isLoading) {
        return (
            <div className="p-8">
                <LoadingSpinner message="Loading client details..." />
            </div>
        );
    }

    if (!client) {
        return (
            <div className="p-8 text-center">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Client not found</p>
                <button
                    onClick={() => navigate('/admin/clients')}
                    className="mt-4 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                >
                    Back to Clients
                </button>
            </div>
        );
    }

    return (
        <div>
            {/* Header with Action Buttons */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/admin/clients')}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </button>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">{client.name}</h2>
                        <div className="flex gap-2 mt-2">
                            <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${getClientTypeColor(client.clientType)}`}>
                                {client.clientType}
                            </span>
                            <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(client.status)}`}>
                                {client.status}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                    <button
                        onClick={() => navigate(`/admin/clients/edit/${id}`)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                        <Edit className="w-4 h-4" />
                        Edit Client
                    </button>
                    <button
                        onClick={() => setShowDeleteModal(true)}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                    >
                        <Trash2 className="w-4 h-4" />
                        Delete Client
                    </button>
                </div>
            </div>

            {/* Client Portal Link Section */}
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl shadow-sm border border-purple-200 p-6 mb-6">
                <div className="flex items-center gap-2 mb-4">
                    <Briefcase className="w-5 h-5 text-purple-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Client Portal Access</h3>
                </div>

                {client.shareToken ? (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Portal Link</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={`${window.location.origin}/client-portal/${client.shareToken}`}
                                    readOnly
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 text-sm"
                                />
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(`${window.location.origin}/client-portal/${client.shareToken}`);
                                        alert('Portal link copied to clipboard!');
                                    }}
                                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                                >
                                    Copy Link
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-700">
                                    <span className="font-medium">PIN Status:</span>{' '}
                                    <span className={client.pinSetupCompleted ? 'text-green-600' : 'text-orange-600'}>
                                        {client.pinSetupCompleted ? '✓ Set up' : '⚠ Not set up'}
                                    </span>
                                </p>
                                {!client.pinSetupCompleted && (
                                    <p className="text-xs text-gray-500 mt-1">Client needs to set up PIN on first login</p>
                                )}
                            </div>

                            {client.pinSetupCompleted && (
                                <button
                                    onClick={async () => {
                                        if (confirm('Reset client PIN? Client will need to set up a new PIN.')) {
                                            try {
                                                const token = localStorage.getItem('token');
                                                const response = await fetch(`${API_BASE_URL}/api/clients/${id}/reset-pin`, {
                                                    method: 'POST',
                                                    headers: { 'x-auth-token': token }
                                                });
                                                if (response.ok) {
                                                    alert('PIN reset successfully!');
                                                    fetchClientDetails();
                                                }
                                            } catch (err) {
                                                alert('Failed to reset PIN');
                                            }
                                        }
                                    }}
                                    className="px-3 py-1.5 text-sm bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                                >
                                    Reset PIN
                                </button>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-4">
                        <p className="text-gray-600 mb-3">No portal link generated yet</p>
                        <button
                            onClick={async () => {
                                try {
                                    const token = localStorage.getItem('token');
                                    const response = await fetch(`${API_BASE_URL}/api/clients/${id}/generate-portal-link`, {
                                        method: 'POST',
                                        headers: { 'x-auth-token': token }
                                    });
                                    if (response.ok) {
                                        alert('Portal link generated!');
                                        fetchClientDetails();
                                    }
                                } catch (err) {
                                    alert('Failed to generate link');
                                }
                            }}
                            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                        >
                            Generate Portal Link
                        </button>
                    </div>
                )}
            </div>

            {/* Client Information */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Client Information</h3>

                {/* Individual Client */}
                {client.clientType === 'Individual' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex items-start gap-3">
                            <User className="w-5 h-5 text-gray-400 mt-0.5" />
                            <div>
                                <p className="text-sm text-gray-500">Full Name</p>
                                <p className="text-gray-900 font-medium">{client.name}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <Users className="w-5 h-5 text-gray-400 mt-0.5" />
                            <div>
                                <p className="text-sm text-gray-500">Gender</p>
                                <p className="text-gray-900 font-medium">{client.gender || 'N/A'}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                            <div>
                                <p className="text-sm text-gray-500">Date of Birth</p>
                                <p className="text-gray-900 font-medium">
                                    {client.dateOfBirth ? formatDate(client.dateOfBirth) : 'N/A'}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                            <div>
                                <p className="text-sm text-gray-500">Nationality</p>
                                <p className="text-gray-900 font-medium">{client.nationality || 'N/A'}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <Briefcase className="w-5 h-5 text-gray-400 mt-0.5" />
                            <div>
                                <p className="text-sm text-gray-500">Occupation</p>
                                <p className="text-gray-900 font-medium">{client.occupation || 'N/A'}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                            <div>
                                <p className="text-sm text-gray-500">Email</p>
                                <p className="text-gray-900 font-medium">{client.email}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                            <div>
                                <p className="text-sm text-gray-500">Phone</p>
                                <p className="text-gray-900 font-medium">{client.phone}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                            <div>
                                <p className="text-sm text-gray-500">Address</p>
                                <p className="text-gray-900 font-medium">{client.address}</p>
                            </div>
                        </div>
                        {client.emergencyContact && (
                            <div className="md:col-span-2 border-t pt-4 mt-2">
                                <h4 className="font-semibold text-gray-900 mb-3">Emergency Contact</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-500">Name</p>
                                        <p className="text-gray-900 font-medium">{client.emergencyContact.name}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Relationship</p>
                                        <p className="text-gray-900 font-medium">{client.emergencyContact.relationship}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Phone</p>
                                        <p className="text-gray-900 font-medium">{client.emergencyContact.phone}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Corporate Organization Client */}
                {client.clientType === 'Corporate Organization' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex items-start gap-3">
                            <Building className="w-5 h-5 text-gray-400 mt-0.5" />
                            <div>
                                <p className="text-sm text-gray-500">Company Name</p>
                                <p className="text-gray-900 font-medium">{client.name}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <FileText className="w-5 h-5 text-gray-400 mt-0.5" />
                            <div>
                                <p className="text-sm text-gray-500">RC Number</p>
                                <p className="text-gray-900 font-medium">{client.rcNumber || 'N/A'}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                            <div>
                                <p className="text-sm text-gray-500">Email</p>
                                <p className="text-gray-900 font-medium">{client.email}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                            <div>
                                <p className="text-sm text-gray-500">Phone</p>
                                <p className="text-gray-900 font-medium">{client.phone}</p>
                            </div>
                        </div>
                        <div className="md:col-span-2 flex items-start gap-3">
                            <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                            <div>
                                <p className="text-sm text-gray-500">Address</p>
                                <p className="text-gray-900 font-medium">{client.address}</p>
                            </div>
                        </div>
                        {client.primaryContact && (
                            <div className="md:col-span-2 border-t pt-4 mt-2">
                                <h4 className="font-semibold text-gray-900 mb-3">Primary Contact Person</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-500">Name</p>
                                        <p className="text-gray-900 font-medium">{client.primaryContact.name}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Designation</p>
                                        <p className="text-gray-900 font-medium">{client.primaryContact.designation}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Phone</p>
                                        <p className="text-gray-900 font-medium">{client.primaryContact.phone}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Email</p>
                                        <p className="text-gray-900 font-medium">{client.primaryContact.email}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                        {client.secondaryContact && client.secondaryContact.name && (
                            <div className="md:col-span-2 border-t pt-4 mt-2">
                                <h4 className="font-semibold text-gray-900 mb-3">Secondary Contact Person</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-500">Name</p>
                                        <p className="text-gray-900 font-medium">{client.secondaryContact.name}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Designation</p>
                                        <p className="text-gray-900 font-medium">{client.secondaryContact.designation}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Phone</p>
                                        <p className="text-gray-900 font-medium">{client.secondaryContact.phone}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Email</p>
                                        <p className="text-gray-900 font-medium">{client.secondaryContact.email}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Government Agency Client */}
                {client.clientType === 'Government Agency' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex items-start gap-3">
                            <Building className="w-5 h-5 text-gray-400 mt-0.5" />
                            <div>
                                <p className="text-sm text-gray-500">Agency Name</p>
                                <p className="text-gray-900 font-medium">{client.name}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <FileText className="w-5 h-5 text-gray-400 mt-0.5" />
                            <div>
                                <p className="text-sm text-gray-500">Agency Type</p>
                                <p className="text-gray-900 font-medium">{client.agencyType || 'N/A'}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <Building className="w-5 h-5 text-gray-400 mt-0.5" />
                            <div>
                                <p className="text-sm text-gray-500">Ministry/Department</p>
                                <p className="text-gray-900 font-medium">{client.ministry || 'N/A'}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                            <div>
                                <p className="text-sm text-gray-500">Official Email</p>
                                <p className="text-gray-900 font-medium">{client.email}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                            <div>
                                <p className="text-sm text-gray-500">Official Phone</p>
                                <p className="text-gray-900 font-medium">{client.phone}</p>
                            </div>
                        </div>
                        <div className="md:col-span-2 flex items-start gap-3">
                            <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                            <div>
                                <p className="text-sm text-gray-500">Agency Address</p>
                                <p className="text-gray-900 font-medium">{client.address}</p>
                            </div>
                        </div>
                        {client.primaryContact && (
                            <div className="md:col-span-2 border-t pt-4 mt-2">
                                <h4 className="font-semibold text-gray-900 mb-3">Primary Contact Person</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-500">Name</p>
                                        <p className="text-gray-900 font-medium">{client.primaryContact.name}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Designation/Rank</p>
                                        <p className="text-gray-900 font-medium">{client.primaryContact.designation}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Phone</p>
                                        <p className="text-gray-900 font-medium">{client.primaryContact.phone}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Email</p>
                                        <p className="text-gray-900 font-medium">{client.primaryContact.email}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                        {client.secondaryContact && client.secondaryContact.name && (
                            <div className="md:col-span-2 border-t pt-4 mt-2">
                                <h4 className="font-semibold text-gray-900 mb-3">Secondary Contact Person</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-500">Name</p>
                                        <p className="text-gray-900 font-medium">{client.secondaryContact.name}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Designation/Rank</p>
                                        <p className="text-gray-900 font-medium">{client.secondaryContact.designation}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Phone</p>
                                        <p className="text-gray-900 font-medium">{client.secondaryContact.phone}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Email</p>
                                        <p className="text-gray-900 font-medium">{client.secondaryContact.email}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Cases Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Cases</h3>
                </div>

                {cases.length === 0 ? (
                    <div className="text-center py-8">
                        <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">No cases added yet</p>
                        <p className="text-sm text-gray-400 mt-1">
                            Click "Add Case" to create a new case for this client
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {cases.map((caseItem) => (
                            <div
                                key={caseItem._id}
                                onClick={() => navigate(`/admin/cases/${caseItem._id}`)}
                                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-gray-900">{caseItem.caseTitle}</h4>
                                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{caseItem.summary}</p>
                                        <div className="flex gap-2 mt-3">
                                            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
                                                {caseItem.caseType}
                                            </span>
                                            <span className={`px-2 py-1 text-xs rounded ${caseItem.status === 'Open' ? 'bg-green-100 text-green-700' :
                                                caseItem.status === 'Closed' ? 'bg-gray-100 text-gray-700' :
                                                    caseItem.status === 'Won' ? 'bg-emerald-100 text-emerald-700' :
                                                        caseItem.status === 'Lost' ? 'bg-red-100 text-red-700' :
                                                            'bg-yellow-100 text-yellow-700'
                                                }`}>
                                                {caseItem.status}
                                            </span>
                                            {caseItem.inCourt && (
                                                <span className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded">
                                                    In Court
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Complaints Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mt-6">
                <div className="flex items-center gap-2 mb-4">
                    <MessageSquare className="w-5 h-5 text-red-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Complaints</h3>
                    {complaints.length > 0 && (
                        <span className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded-full font-medium">
                            {complaints.length}
                        </span>
                    )}
                </div>

                {complaints.length === 0 ? (
                    <div className="text-center py-8">
                        <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">No complaints submitted yet</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {complaints.map((complaint) => (
                            <div
                                key={complaint._id}
                                onClick={() => navigate(`/admin/complaints/${complaint._id}`)}
                                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-gray-900">{complaint.subject}</h4>
                                        <div className="flex items-center gap-2 mt-2">
                                            <span className={`px-2 py-1 text-xs rounded-full font-medium ${complaint.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                                                    complaint.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                                                        complaint.status === 'Resolved' ? 'bg-green-100 text-green-700' :
                                                            'bg-gray-100 text-gray-700'
                                                }`}>
                                                {complaint.status}
                                            </span>
                                            {complaint.case && (
                                                <span className="px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded">
                                                    {complaint.case.caseTitle}
                                                </span>
                                            )}
                                            <span className="text-xs text-gray-400">
                                                • {formatDate(complaint.createdAt)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-[#000000]/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Client</h3>
                        <p className="text-gray-600 mb-4">
                            This action cannot be undone. This will permanently delete the client and all associated data.
                        </p>
                        <div className="mb-6">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Type <span className="font-mono bg-gray-100 px-2 py-1 rounded">{client.name.toUpperCase()}</span> to confirm:
                            </label>
                            <input
                                type="text"
                                value={deleteConfirmation}
                                onChange={(e) => setDeleteConfirmation(e.target.value)}
                                placeholder="Enter client name in CAPS"
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-black"
                                autoFocus
                            />
                            <p className="text-xs text-gray-500 mt-2">
                                You must type the client's full name in CAPITAL LETTERS to confirm deletion.
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setShowDeleteModal(false);
                                    setDeleteConfirmation('');
                                }}
                                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteClient}
                                disabled={deleteConfirmation !== client.name.toUpperCase()}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClientDetails;
