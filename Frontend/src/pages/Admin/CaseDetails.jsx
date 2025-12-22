import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, User, Calendar, Briefcase, MapPin, Scale, Edit2,
    Users, FileText, AlertCircle, CheckCircle, Building, RefreshCw,
    FolderOpen, Plus, Trash2, Download, Image as ImageIcon, File, Video, Music, X
} from 'lucide-react';
import axios from 'axios';
import LoadingSpinner from '../../components/AdminOfficer/LoadingSpinner';
import CaseReports from '../../components/AdminOfficer/CaseReports';
import DocumentSelectorDrawer from '../../components/DocumentSelectorDrawer';
import CourtDetailsModal from '../../components/AdminOfficer/CourtDetailsModal';
import UpdateOpposingCounselModal from '../../components/AdminOfficer/UpdateOpposingCounselModal';
import OpposingCounselSection from '../../components/AdminOfficer/OpposingCounselSection';
import ShareCaseLinkModal from '../../components/AdminOfficer/ShareCaseLinkModal';
import ClientReportModal from '../../components/AdminOfficer/ClientReportModal';
import API_BASE_URL from '../../../config/api';

const CaseDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [caseData, setCaseData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [lawyerUsers, setLawyerUsers] = useState([]);
    const [selectedLawyers, setSelectedLawyers] = useState([]);
    const [selectedStatus, setSelectedStatus] = useState('');
    const [showLawyerModal, setShowLawyerModal] = useState(false);
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [showOpenCaseModal, setShowOpenCaseModal] = useState(false);
    const [isAssigning, setIsAssigning] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [showDocumentDrawer, setShowDocumentDrawer] = useState(false);
    const [caseDocuments, setCaseDocuments] = useState([]);
    const [loadingDocuments, setLoadingDocuments] = useState(false);
    const [showRemoveModal, setShowRemoveModal] = useState(false);
    const [documentToRemove, setDocumentToRemove] = useState(null);
    const [showCourtModal, setShowCourtModal] = useState(false);
    const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
    const [showCounselModal, setShowCounselModal] = useState(false);
    const [showShareLinkModal, setShowShareLinkModal] = useState(false);
    const [showClientReportModal, setShowClientReportModal] = useState(false);
    const [currentUserRole, setCurrentUserRole] = useState(null);
    const [clientHasOpenCase, setClientHasOpenCase] = useState(false);

    useEffect(() => {
        fetchCaseDetails();
        fetchLawyers();
        fetchCaseDocuments();

        // Get current user role
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        setCurrentUserRole(user.role);
    }, [id]);

    // Fetch client's open case status when client data is loaded
    useEffect(() => {
        if (caseData?.client?._id) {
            fetchClientOpenCaseStatus(caseData.client._id);
        }
    }, [caseData?.client?._id]);

    const fetchCaseDetails = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/api/cases/${id}`, {
                headers: { 'x-auth-token': token }
            });

            if (response.ok) {
                const data = await response.json();
                setCaseData(data);
                setSelectedLawyers(data.assignedLawyers?.map(l => l._id) || []);
                setSelectedStatus(data.status);
            } else {
                console.error('Failed to fetch case details');
            }
        } catch (err) {
            console.error('Error fetching case details:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchLawyers = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/api/users/lawyers', {
                headers: { 'x-auth-token': token }
            });

            if (response.ok) {
                const data = await response.json();
                setLawyerUsers(data);
            }
        } catch (err) {
            console.error('Error fetching lawyers:', err);
        }
    };

    const fetchClientOpenCaseStatus = async (clientId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/api/clients/${clientId}`, {
                headers: { 'x-auth-token': token }
            });

            if (response.ok) {
                const clientData = await response.json();
                // Check if client has any open cases
                const hasOpenCase = clientData.cases?.some(c => c.status === 'Open') || false;
                setClientHasOpenCase(hasOpenCase);
            }
        } catch (err) {
            console.error('Error fetching client status:', err);
        }
    };

    const handleAssignLawyers = async () => {
        if (selectedLawyers.length === 0) {
            setMessage({ type: 'error', text: 'Please select at least one lawyer' });
            return;
        }

        setIsAssigning(true);
        setMessage({ type: '', text: '' });

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/api/cases/${id}/assign-lawyers`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token
                },
                body: JSON.stringify({ lawyerIds: selectedLawyers })
            });

            if (response.ok) {
                const data = await response.json();
                setMessage({ type: 'success', text: 'Lawyers assigned successfully!' });
                setShowLawyerModal(false);
                setTimeout(() => {
                    fetchCaseDetails();
                }, 500);
            } else {
                const data = await response.json();
                setMessage({ type: 'error', text: data.msg || 'Failed to assign lawyers' });
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'Error assigning lawyers' });
        } finally {
            setIsAssigning(false);
        }
    };

    const updateStatus = async (status) => {
        setIsAssigning(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/api/cases/${id}/status`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token
                },
                body: JSON.stringify({ status })
            });

            if (response.ok) {
                const data = await response.json();
                setMessage({ type: 'success', text: 'Status updated successfully!' });
                setShowStatusModal(false);
                setShowOpenCaseModal(false);
                setTimeout(() => {
                    fetchCaseDetails();
                }, 500);
            } else {
                const data = await response.json();
                setMessage({ type: 'error', text: data.msg || 'Failed to update status' });
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'Error updating status' });
        } finally {
            setIsAssigning(false);
        }
    };

    const handleStatusChange = async () => {
        if (!selectedStatus) {
            setMessage({ type: 'error', text: 'Please select a status' });
            return;
        }

        if (selectedStatus === 'Open' && caseData.status === 'Pending') {
            setShowStatusModal(false);
            setShowOpenCaseModal(true);
            return;
        }

        await updateStatus(selectedStatus);
    };

    const handleUpdateCounsel = async (name) => {
        setIsAssigning(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/api/cases/${id}/opposing-counsel`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token
                },
                body: JSON.stringify({ opposingCounsel: name })
            });

            if (response.ok) {
                setMessage({ type: 'success', text: 'Opposing counsel updated successfully' });
                setShowCounselModal(false);
                fetchCaseDetails();
            } else {
                const data = await response.json();
                setMessage({ type: 'error', text: data.msg || 'Failed to update opposing counsel' });
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'Error updating opposing counsel' });
        } finally {
            setIsAssigning(false);
        }
    };

    const handlePostClientReport = async ({ subject, content }) => {
        setIsAssigning(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/api/cases/${id}/client-report`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token
                },
                body: JSON.stringify({ subject, content })
            });

            if (response.ok) {
                setMessage({ type: 'success', text: 'Client report posted successfully' });
                setShowClientReportModal(false);
                fetchCaseDetails();
            } else {
                const data = await response.json();
                setMessage({ type: 'error', text: data.msg || 'Failed to post client report' });
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'Error posting client report' });
        } finally {
            setIsAssigning(false);
        }
    };

    const toggleLawyer = (lawyerId) => {
        setSelectedLawyers(prev =>
            prev.includes(lawyerId)
                ? prev.filter(id => id !== lawyerId)
                : [...prev, lawyerId]
        );
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const getStatusColor = (status) => {
        const colors = {
            'Open': 'bg-green-100 text-green-800',
            'Pending': 'bg-yellow-100 text-yellow-800',
            'Closed': 'bg-gray-100 text-gray-800',
            'Completed-Won': 'bg-emerald-100 text-emerald-800',
            'Completed-Lost': 'bg-red-100 text-red-800'
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    const fetchCaseDocuments = async () => {
        setLoadingDocuments(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_BASE_URL}/api/documents/case/${id}`, {
                headers: { 'x-auth-token': token }
            });
            setCaseDocuments(res.data);
        } catch (err) {
            console.error('Error fetching case documents:', err);
        }
        setLoadingDocuments(false);
    };

    const handleAddDocumentsToCase = async (selectedDocs) => {
        try {
            const token = localStorage.getItem('token');
            for (const doc of selectedDocs) {
                await axios.put(`${API_BASE_URL}/api/documents/${doc._id}/link-to-case`,
                    { caseId: id },
                    { headers: { 'x-auth-token': token } }
                );
            }
            setMessage({ type: 'success', text: `${selectedDocs.length} document(s) added to case library` });
            fetchCaseDocuments();
        } catch (err) {
            console.error('Error adding documents to case:', err);
            setMessage({ type: 'error', text: 'Failed to add documents to case' });
        }
    };

    const handleRemoveDocument = (doc) => {
        setDocumentToRemove(doc);
        setShowRemoveModal(true);
    };

    const confirmRemoveDocument = async () => {
        if (!documentToRemove) return;

        try {
            const token = localStorage.getItem('token');
            await axios.put(`${API_BASE_URL}/api/documents/${documentToRemove._id}/unlink-from-case`, {}, {
                headers: { 'x-auth-token': token }
            });
            setMessage({ type: 'success', text: 'Document removed from case library' });
            fetchCaseDocuments();
            setShowRemoveModal(false);
            setDocumentToRemove(null);
        } catch (err) {
            console.error('Error removing document:', err);
            setMessage({ type: 'error', text: 'Failed to remove document' });
            setShowRemoveModal(false);
            setDocumentToRemove(null);
        }
    };

    const handleSaveCourtDetails = async (courtData) => {
        try {
            const token = localStorage.getItem('token');
            const updatedData = {
                inCourt: true,
                courtInfo: courtData,
                courtInfoAction: modalMode // 'add' or 'edit'
            };

            const response = await fetch(`${API_BASE_URL}/api/cases/${id}/court-details`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token
                },
                body: JSON.stringify(updatedData)
            });

            if (response.ok) {
                setMessage({ type: 'success', text: modalMode === 'add' ? 'New court update added successfully' : 'Court details updated successfully' });
                fetchCaseDetails(); // Refresh data
                setShowCourtModal(false);
            } else {
                throw new Error('Failed to update court details');
            }
        } catch (err) {
            console.error('Error updating court details:', err);
            setMessage({ type: 'error', text: 'Failed to update court details' });
        }
    };

    const getFileIcon = (type) => {
        const t = type.toLowerCase();
        if (['jpg', 'jpeg', 'png', 'gif'].includes(t)) return <ImageIcon className="w-6 h-6 text-purple-500" />;
        if (['pdf'].includes(t)) return <FileText className="w-6 h-6 text-red-500" />;
        if (['doc', 'docx'].includes(t)) return <FileText className="w-6 h-6 text-blue-500" />;
        if (['ppt', 'pptx'].includes(t)) return <FileText className="w-6 h-6 text-orange-500" />;
        if (['xls', 'xlsx'].includes(t)) return <FileText className="w-6 h-6 text-green-500" />;
        if (['mp4', 'mov', 'avi'].includes(t)) return <Video className="w-6 h-6 text-pink-500" />;
        if (['mp3', 'wav'].includes(t)) return <Music className="w-6 h-6 text-yellow-500" />;
        return <File className="w-6 h-6 text-gray-500" />;
    };

    const formatSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    if (isLoading) {
        return <LoadingSpinner message="Loading case details..." />;
    }

    if (!caseData) {
        return (
            <div className="text-center py-12">
                <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Case not found</p>
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </button>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">{caseData.caseTitle}</h2>
                        <p className="text-sm text-gray-600 mt-1">Case File Details</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    {currentUserRole === 'HOC' && (
                        <button
                            onClick={() => setShowClientReportModal(true)}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            Update Client Report
                        </button>
                    )}
                    <button
                        onClick={() => setShowStatusModal(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Change Status
                    </button>
                </div>
            </div>

            {message.text && (
                <div className={`mb-6 p-4 rounded-lg flex items-start gap-3 ${message.type === 'success'
                    ? 'bg-green-50 text-green-800 border border-green-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                    }`}>
                    {message.type === 'success' ? (
                        <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    ) : (
                        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    )}
                    <p className="text-sm">{message.text}</p>
                </div>
            )}

            {/* Case Overview and Client Information - Side by Side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Case Overview - LEFT */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                    <div className="flex flex-col lg:flex-row gap-6">
                        {/* Case Icon Section */}
                        <div className="flex flex-col items-center text-center lg:border-r lg:border-gray-700 lg:pr-6">
                            {/* Circular Icon with Briefcase */}
                            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center mb-3 shadow-xl border-4 border-gray-700">
                                <Briefcase className="w-16 h-16 text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-black mb-1">{caseData.caseTitle}</h3>
                            <span className={`px-3 py-1 text-xs rounded-full font-medium ${getStatusColor(caseData.status)}`}>
                                {caseData.status}
                            </span>
                        </div>

                        {/* Case Details Section */}
                        <div className="flex-1">
                            <h4 className="text-base font-semibold text-black mb-3 flex items-center gap-2">
                                <Briefcase className="w-4 h-4 text-purple-400" />
                                Case Overview
                            </h4>
                            <div className="space-y-3">
                                <div>
                                    <p className="text-xs text-black mb-1">Case Type</p>
                                    <span className="inline-block px-2 py-1 text-xs bg-blue-500 text-black rounded-full">
                                        {caseData.caseType}
                                    </span>
                                </div>
                                {caseData.subCategory && (
                                    <div>
                                        <p className="text-xs text-black mb-1">Sub-category</p>
                                        <p className="text-sm font-medium text-black">{caseData.subCategory}</p>
                                    </div>
                                )}
                                <div>
                                    <p className="text-xs text-black mb-1">Date Issue Started</p>
                                    <p className="text-sm font-medium text-black">{formatDate(caseData.dateIssueStarted)}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-black mb-1">Assigned HOC</p>
                                    {caseData.assignedTo ? (
                                        <p className="text-sm font-medium text-black">{caseData.assignedTo.name}</p>
                                    ) : (
                                        <p className="text-sm text-black italic">Not Assigned</p>
                                    )}
                                </div>
                                <div>
                                    <p className="text-xs text-black mb-1">Assigned Lawyers</p>
                                    {caseData.assignedLawyers && caseData.assignedLawyers.length > 0 ? (
                                        <div className="flex flex-wrap gap-1">
                                            {caseData.assignedLawyers.map((lawyer, idx) => (
                                                <span key={idx} className="px-2 py-1 text-xs bg-purple-500 text-black rounded-full">
                                                    {lawyer.name}
                                                </span>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-black italic">Not Assigned</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Client Information - RIGHT */}
                {caseData.client && (
                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <div className="flex flex-col lg:flex-row gap-6">
                            {/* Profile Section */}
                            <div className="flex flex-col items-center text-center lg:border-r lg:border-gray-700 lg:pr-6">
                                {/* Circular Avatar with Initials */}
                                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-3 shadow-xl border-4 border-gray-700">
                                    <span className="text-4xl font-bold text-white">
                                        {caseData.client.name.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                                <h3 className="text-xl font-bold text-black mb-1">{caseData.client.name}</h3>
                                <p className={`text-xs font-medium ${clientHasOpenCase ? 'text-green-400' : 'text-gray-400'}`}>
                                    {clientHasOpenCase ? 'Active Client' : 'Inactive Client'}
                                </p>
                            </div>

                            {/* Details Section */}
                            <div className="flex-1">
                                <h4 className="text-base font-semibold text-black mb-3 flex items-center gap-2">
                                    <User className="w-4 h-4 text-blue-400" />
                                    Client Details
                                </h4>
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-xs text-black mb-1">Email Address</p>
                                        <p className="text-sm font-medium text-black">{caseData.client.email}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-black mb-1">Phone Number</p>
                                        <p className="text-sm font-medium text-black">{caseData.client.phone || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-black mb-1">Address</p>
                                        <p className="text-sm font-medium text-black">{caseData.client.address || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-black mb-1">Occupation</p>
                                        <p className="text-sm font-medium text-black">{caseData.client.occupation || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Parties and Witnesses - Side by Side */}
            {(caseData.parties?.length > 0 || caseData.witnesses?.length > 0) && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    {/* Parties Involved */}
                    {caseData.parties && caseData.parties.length > 0 && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Parties Involved</h3>
                            <div className="space-y-3">
                                {caseData.parties.map((party, index) => (
                                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            <div>
                                                <p className="text-xs text-gray-600">Name</p>
                                                <p className="text-sm font-medium text-gray-900">{party.name || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-600">Role</p>
                                                <p className="text-sm font-medium text-gray-900">{party.role || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-600">Address</p>
                                                <p className="text-sm font-medium text-gray-900">{party.address || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-600">Contact</p>
                                                <p className="text-sm font-medium text-gray-900">{party.contact || 'N/A'}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Witnesses */}
                    {caseData.witnesses && caseData.witnesses.length > 0 && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Witnesses</h3>
                            <div className="space-y-3">
                                {caseData.witnesses.map((witness, index) => (
                                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                            <div>
                                                <p className="text-xs text-gray-600">Name</p>
                                                <p className="text-sm font-medium text-gray-900">{witness.name || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-600">Contact</p>
                                                <p className="text-sm font-medium text-gray-900">{witness.contact || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-600">Relationship</p>
                                                <p className="text-sm font-medium text-gray-900">{witness.relationship || 'N/A'}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}


            {/* Case Details */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Case Details</h3>

                <div className="space-y-4">
                    <div>
                        <p className="text-sm font-semibold text-gray-700 mb-2">Summary of Issue</p>
                        <p className="text-sm text-gray-900 whitespace-pre-wrap">{caseData.summary}</p>
                    </div>

                    <div>
                        <p className="text-sm font-semibold text-gray-700 mb-2">Client Objective</p>
                        <p className="text-sm text-gray-900">{caseData.clientObjective}</p>
                    </div>

                    <OpposingCounselSection
                        opposingCounselHistory={caseData.opposingCounselHistory}
                        onUpdateClick={() => setShowCounselModal(true)}
                        formatDate={formatDate}
                    />
                </div>
            </div>

            {/* Court Information - Side by Side */}
            {caseData.inCourt && caseData.courtInfo && caseData.courtInfo.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    {/* Current Court Status */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <Scale className="w-5 h-5 text-purple-600" />
                                    <h3 className="text-lg font-semibold text-gray-900">Current Court Status</h3>
                                </div>
                                <span className="inline-block px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded font-medium">
                                    {caseData.courtInfo.length === 1 ? '1st Court Date' :
                                        caseData.courtInfo.length === 2 ? '2nd Court Date' :
                                            caseData.courtInfo.length === 3 ? '3rd Court Date' :
                                                `${caseData.courtInfo.length}th Court Date`} (Current)
                                </span>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => {
                                        setModalMode('edit');
                                        setShowCourtModal(true);
                                    }}
                                    className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors border border-gray-200"
                                    title="Edit Court Details"
                                >
                                    <Edit2 size={18} />
                                </button>
                                <button
                                    onClick={() => {
                                        setModalMode('add');
                                        setShowCourtModal(true);
                                    }}
                                    className="p-2 bg-purple-600 text-white hover:bg-purple-700 rounded-lg transition-colors shadow-sm"
                                    title="Update Status"
                                >
                                    <Plus size={18} />
                                </button>
                            </div>
                        </div>
                        {(() => {
                            const currentInfo = caseData.courtInfo[caseData.courtInfo.length - 1];
                            return (
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-sm text-gray-600 mb-1">Court Name</p>
                                        <p className="text-sm font-medium text-gray-900">{currentInfo.courtName || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600 mb-1">Court Location</p>
                                        <p className="text-sm font-medium text-gray-900">{currentInfo.courtLocation || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600 mb-1">Case Number</p>
                                        <p className="text-sm font-medium text-gray-900">{currentInfo.caseNumber || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600 mb-1">Presiding Judge</p>
                                        <p className="text-sm font-medium text-gray-900">{currentInfo.presidingJudge || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600 mb-1">Next Court Date</p>
                                        <p className="text-sm font-medium text-gray-900">{formatDate(currentInfo.nextCourtDate)}</p>
                                    </div>
                                    {currentInfo.previousOrders && (
                                        <div>
                                            <p className="text-sm text-gray-600 mb-1">Court Orders / Notes</p>
                                            <p className="text-sm font-medium text-gray-900 whitespace-pre-wrap bg-gray-50 p-3 rounded-lg border border-gray-100">{currentInfo.previousOrders}</p>
                                        </div>
                                    )}
                                </div>
                            );
                        })()}
                    </div>

                    {/* Court History */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Court History</h3>
                        {caseData.courtInfo.length > 1 ? (
                            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                                {[...caseData.courtInfo].reverse().slice(1).map((info, index) => {
                                    const originalIndex = caseData.courtInfo.length - index - 2;
                                    const count = originalIndex + 1;
                                    const label = count === 1 ? '1st' : count === 2 ? '2nd' : count === 3 ? '3rd' : `${count}th`;

                                    return (
                                        <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{label} Court Date</span>
                                                <span className="text-xs text-gray-400">{formatDate(info.dateAdded || info.nextCourtDate)}</span>
                                            </div>
                                            <div className="space-y-2 text-sm">
                                                <div><span className="text-gray-500">Court:</span> <span className="text-gray-900">{info.courtName || '-'}</span></div>
                                                <div><span className="text-gray-500">Judge:</span> <span className="text-gray-900">{info.presidingJudge || '-'}</span></div>
                                                <div><span className="text-gray-500">Date:</span> <span className="text-gray-900">{formatDate(info.nextCourtDate)}</span></div>
                                                {info.previousOrders && (
                                                    <div className="mt-2 pt-2 border-t border-gray-200">
                                                        <p className="text-gray-500 text-xs mb-1">Orders/Notes:</p>
                                                        <p className="text-gray-800">{info.previousOrders}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <Scale className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                <p className="text-gray-500 text-sm">No court history yet</p>
                                <p className="text-gray-400 text-xs mt-1">Previous court dates will appear here</p>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-2">
                            <Scale className="w-5 h-5 text-gray-400" />
                            <h3 className="text-lg font-semibold text-gray-900">Court Information</h3>
                        </div>
                        <button
                            onClick={() => {
                                setModalMode('add');
                                setShowCourtModal(true);
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors text-sm font-medium"
                        >
                            <Plus size={16} />
                            Add Court Details
                        </button>
                    </div>
                    <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                        <Scale className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">This case is not currently in court</p>
                        <p className="text-xs text-gray-400 mt-1">Click "Add Court Details" if this case has moved to court</p>
                    </div>
                </div>
            )}

            {/* Case Reports and Library - Side by Side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Case Reports Section */}
                <div>
                    <CaseReports caseId={id} />
                </div>

                {/* Case Library Section */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <FolderOpen className="w-5 h-5 text-orange-600" />
                            <h3 className="text-lg font-semibold text-gray-900">Case Library</h3>
                            <span className="px-2 py-1 text-xs bg-orange-100 text-orange-700 rounded-full">
                                {caseDocuments.length} {caseDocuments.length === 1 ? 'Document' : 'Documents'}
                            </span>
                        </div>
                        <button
                            onClick={() => setShowDocumentDrawer(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700 transition-colors"
                        >
                            <Plus size={20} />
                            Add Files
                        </button>
                    </div>

                    {loadingDocuments ? (
                        <div className="flex justify-center items-center h-32">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
                        </div>
                    ) : caseDocuments.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-32 text-gray-500">
                            <FolderOpen size={48} className="text-gray-300 mb-2" />
                            <p className="text-sm">No documents in this case library yet</p>
                            <p className="text-xs text-gray-400 mt-1">Click "Add Files" to get started</p>
                        </div>
                    ) : (
                        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                            {caseDocuments.map(doc => (
                                <div key={doc._id} className="border border-gray-200 rounded-lg p-3 hover:border-orange-300 hover:shadow-sm transition-all">
                                    <div className="flex items-start gap-3">
                                        <div className="flex-shrink-0">
                                            {getFileIcon(doc.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-gray-800 truncate text-sm" title={doc.name}>
                                                {doc.name}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {formatSize(doc.size)} • {new Date(doc.createdAt).toLocaleDateString()}
                                            </p>
                                            <p className="text-xs text-gray-400 mt-1">
                                                By: {doc.uploadedBy?.name || 'Unknown'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                                        <button
                                            onClick={() => window.open(doc.url, '_blank')}
                                            className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-xs bg-green-50 text-green-700 rounded hover:bg-green-100 transition-colors"
                                        >
                                            <Download size={14} />
                                            Download
                                        </button>
                                        <button
                                            onClick={() => handleRemoveDocument(doc)}
                                            className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-xs bg-red-50 text-red-700 rounded hover:bg-red-100 transition-colors"
                                        >
                                            <Trash2 size={14} />
                                            Remove
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Document Selector Drawer */}
            <DocumentSelectorDrawer
                isOpen={showDocumentDrawer}
                onClose={() => setShowDocumentDrawer(false)}
                onSelectDocuments={handleAddDocumentsToCase}
                caseId={id}
            />


            {/* Assign Lawyers Modal */}
            {
                showLawyerModal && (
                    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 max-h-[80vh] overflow-y-auto">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Assign Lawyers to Case</h3>

                            <div className="mb-6">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Select Lawyers (multiple)
                                </label>
                                <div className="space-y-2 max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-3">
                                    {lawyerUsers.map(lawyer => (
                                        <label key={lawyer._id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                                            <input
                                                type="checkbox"
                                                checked={selectedLawyers.includes(lawyer._id)}
                                                onChange={() => toggleLawyer(lawyer._id)}
                                                className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                                            />
                                            <span className="text-sm text-gray-900">{lawyer.name} - {lawyer.email}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowLawyerModal(false)}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                                    disabled={isAssigning}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAssignLawyers}
                                    disabled={isAssigning}
                                    className={`flex-1 px-4 py-2 text-white rounded-lg ${isAssigning ? 'bg-orange-400 cursor-not-allowed' : 'bg-orange-600 hover:bg-orange-700'
                                        }`}
                                >
                                    {isAssigning ? 'Assigning...' : 'Assign Lawyers'}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Change Status Modal */}
            {
                showStatusModal && (
                    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Change Case Status</h3>

                            <div className="mb-6">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Select Status
                                </label>
                                <select
                                    value={selectedStatus}
                                    onChange={(e) => setSelectedStatus(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                                >
                                    <option value="Open">Open</option>
                                    <option value="Pending">Pending</option>
                                    <option value="Closed">Closed</option>
                                    <option value="Completed-Won">Completed-Won</option>
                                    <option value="Completed-Lost">Completed-Lost</option>
                                </select>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowStatusModal(false)}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                                    disabled={isAssigning}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleStatusChange}
                                    disabled={isAssigning}
                                    className={`flex-1 px-4 py-2 text-white rounded-lg ${isAssigning ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                                        }`}
                                >
                                    {isAssigning ? 'Updating...' : 'Update Status'}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Open Case Confirmation Modal */}
            {
                showOpenCaseModal && (
                    <div className="fixed inset-0 bg-[#000000]/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                            <div className="flex items-center gap-3 mb-4 text-orange-600">
                                <AlertCircle className="w-8 h-8" />
                                <h3 className="text-xl font-bold text-gray-900">Open Case Confirmation</h3>
                            </div>

                            <div className="mb-6 bg-orange-50 border border-orange-100 rounded-lg p-4">
                                <p className="text-gray-800 text-sm leading-relaxed">
                                    Before setting a case to <strong>Open</strong>, please ensure that:
                                </p>
                                <ul className="list-disc list-inside mt-2 text-sm text-gray-700 space-y-1">
                                    <li>The client has made either initial or full payment</li>
                                    <li>Every necessary detail and material have been collected</li>
                                </ul>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowOpenCaseModal(false)}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => updateStatus('Open')}
                                    disabled={isAssigning}
                                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                                >
                                    {isAssigning ? 'Opening...' : 'Open Case'}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Remove Document Confirmation Modal */}
            {
                showRemoveModal && (
                    <div className="fixed inset-0 bg-[#000000]/50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-bold text-gray-800">Remove Document</h3>
                                <button onClick={() => setShowRemoveModal(false)} className="text-gray-400 hover:text-gray-600">
                                    <X size={24} />
                                </button>
                            </div>
                            <div className="mb-6">
                                <p className="text-gray-600">
                                    Are you sure you want to remove <span className="font-semibold">"{documentToRemove?.name}"</span> from this case library?
                                </p>
                                <p className="text-sm text-gray-500 mt-2">
                                    This will only remove the link to this case. The document will remain in your documents list.
                                </p>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowRemoveModal(false)}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmRemoveDocument}
                                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                                >
                                    Remove
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Court Details Modal */}
            <CourtDetailsModal
                isOpen={showCourtModal}
                onClose={() => setShowCourtModal(false)}
                onSave={handleSaveCourtDetails}
                initialData={caseData.courtInfo && caseData.courtInfo.length > 0 ? caseData.courtInfo[caseData.courtInfo.length - 1] : null}
                mode={modalMode}
            />

            {/* Update Opposing Counsel Modal */}
            <UpdateOpposingCounselModal
                isOpen={showCounselModal}
                onClose={() => setShowCounselModal(false)}
                onSave={handleUpdateCounsel}
                isLoading={isAssigning}
            />

            {/* Share Case Link Modal */}
            <ShareCaseLinkModal
                isOpen={showShareLinkModal}
                onClose={() => setShowShareLinkModal(false)}
                shareToken={caseData?.shareToken}
            />

            {/* Client Report Modal */}
            <ClientReportModal
                isOpen={showClientReportModal}
                onClose={() => setShowClientReportModal(false)}
                onSave={handlePostClientReport}
                isLoading={isAssigning}
            />

        </div >
    );
};

export default CaseDetails;
