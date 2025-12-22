import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
import API_BASE_URL from '../../../config/api';
    ArrowLeft,
    User, Mail, Phone, MapPin, Building, Calendar,
    Briefcase, Users, FileText, AlertCircle, Plus,
} from 'lucide-react';

const ClientDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [client, setClient] = useState(null);
    const [cases, setCases] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentUserId, setCurrentUserId] = useState('');

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        setCurrentUserId(user.id);
        fetchClientDetails();
        fetchClientCases();
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
            <div className="p-8 flex justify-center items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
        );
    }

    if (!client) {
        return (
            <div className="p-8 text-center">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Client not found</p>
                <button
                    onClick={() => navigate('/hoc/clients')}
                    className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                    Back to Clients
                </button>
            </div>
        );
    }

    return (
        <div className="p-6">
            {/* Header with Back Button */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/hoc/clients')}
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
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Cases</h3>
                    <button
                        onClick={() => navigate(`/hoc/cases/add?clientId=${id}`)}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Add Case
                    </button>
                </div>

                {cases.length === 0 ? (
                    <div className="text-center py-8">
                        <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">No cases added yet</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {cases.map((caseItem) => {
                            const isAssignedToMe = caseItem.assignedTo && (
                                (typeof caseItem.assignedTo === 'object' && caseItem.assignedTo._id === currentUserId) ||
                                (typeof caseItem.assignedTo === 'string' && caseItem.assignedTo === currentUserId)
                            );

                            return (
                                <div
                                    key={caseItem._id}
                                    onClick={() => isAssignedToMe && navigate(`/hoc/cases/${caseItem._id}`)}
                                    className={`border border-gray-200 rounded-lg p-4 transition-colors ${isAssignedToMe
                                        ? 'hover:bg-purple-50 cursor-pointer border-l-4 border-l-purple-500'
                                        : 'bg-gray-50 opacity-75 cursor-not-allowed'
                                        }`}
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start mb-2">
                                                <h4 className="font-semibold text-gray-900">{caseItem.caseTitle}</h4>
                                                {isAssignedToMe ? (
                                                    <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide bg-purple-100 text-purple-700 rounded border border-purple-200">
                                                        Assigned to You
                                                    </span>
                                                ) : (
                                                    <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide bg-gray-200 text-gray-600 rounded border border-gray-300">
                                                        Not Assigned
                                                    </span>
                                                )}
                                            </div>
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
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ClientDetails;
