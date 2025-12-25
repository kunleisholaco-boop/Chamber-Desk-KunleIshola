import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, User, Calendar, Briefcase, MapPin, Scale, FileText,
    Users, AlertCircle, CheckCircle, Building, FolderOpen, Plus, Trash2, Download,
    Image as ImageIcon, File, Video, Music, X, UserPlus, MessageCircle, ChevronRight
} from 'lucide-react';
import axios from 'axios';
import LoadingSpinner from '../../components/AdminOfficer/LoadingSpinner';
import CaseReports from '../../components/AdminOfficer/CaseReports';
import DocumentSelectorDrawer from '../../components/DocumentSelectorDrawer';
import ClientReportModal from '../../components/AdminOfficer/ClientReportModal';
import OpposingCounselSection from '../../components/AdminOfficer/OpposingCounselSection';
import API_BASE_URL from '../../config/api';

const LawyerCaseDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [caseData, setCaseData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [showDocumentDrawer, setShowDocumentDrawer] = useState(false);
    const [caseDocuments, setCaseDocuments] = useState([]);
    const [loadingDocuments, setLoadingDocuments] = useState(false);
    const [showRemoveModal, setShowRemoveModal] = useState(false);
    const [documentToRemove, setDocumentToRemove] = useState(null);
    const [showClientReportModal, setShowClientReportModal] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);

    // Paralegal assignment states
    const [showParalegalModal, setShowParalegalModal] = useState(false);
    const [paralegalUsers, setParalegalUsers] = useState([]);
    const [selectedParalegals, setSelectedParalegals] = useState([]);

    useEffect(() => {
        fetchCaseDetails();
        fetchCaseDocuments();
        fetchParalegals();
    }, [id]);

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
                setSelectedParalegals(data.assignedParalegals?.map(p => p._id) || []);
            } else {
                console.error('Failed to fetch case details');
            }
        } catch (err) {
            console.error('Error fetching case details:', err);
        } finally {
            setIsLoading(false);
        }
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

    const fetchParalegals = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/api/users/paralegals`, {
                headers: { 'x-auth-token': token }
            });

            if (response.ok) {
                const data = await response.json();
                setParalegalUsers(data);
            }
        } catch (err) {
            console.error('Error fetching paralegals:', err);
        }
    };

    const handleAssignParalegals = async () => {
        setIsUpdating(true);
        setMessage({ type: '', text: '' });

        try {
            const token = localStorage.getItem('token');
            const currentCount = caseData.assignedParalegals?.length || 0;
            const newCount = selectedParalegals.length;

            const response = await fetch(`${API_BASE_URL}/api/cases/${id}/assign-paralegals`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token
                },
                body: JSON.stringify({ paralegalIds: selectedParalegals })
            });

            if (response.ok) {
                let successMessage = 'Paralegals updated successfully!';
                if (newCount === 0) successMessage = 'Paralegals removed successfully!';
                else if (newCount > currentCount) successMessage = 'Paralegals assigned successfully!';
                else if (newCount < currentCount) successMessage = 'Paralegals removed successfully!';

                setMessage({ type: 'success', text: successMessage });
                setShowParalegalModal(false);
                setTimeout(() => {
                    fetchCaseDetails();
                }, 500);
            } else {
                const data = await response.json();
                setMessage({ type: 'error', text: data.msg || 'Failed to update paralegals' });
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'Error updating paralegals' });
        } finally {
            setIsUpdating(false);
        }
    };

    const handlePostClientReport = async ({ subject, content }) => {
        setIsUpdating(true);
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
            setIsUpdating(false);
        }
    };

    const toggleParalegal = (paralegalId) => {
        setSelectedParalegals(prev =>
            prev.includes(paralegalId)
                ? prev.filter(id => id !== paralegalId)
                : [...prev, paralegalId]
        );
    };

    const handleRemoveParalegal = async (paralegalId) => {
        setIsUpdating(true);
        setMessage({ type: '', text: '' });

        try {
            const token = localStorage.getItem('token');
            const updatedParalegals = caseData.assignedParalegals
                .filter(p => p._id !== paralegalId)
                .map(p => p._id);

            const response = await fetch(`${API_BASE_URL}/api/cases/${id}/assign-paralegals`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token
                },
                body: JSON.stringify({ paralegalIds: updatedParalegals })
            });

            if (response.ok) {
                setMessage({ type: 'success', text: 'Paralegal removed successfully!' });
                fetchCaseDetails();
            } else {
                const data = await response.json();
                setMessage({ type: 'error', text: data.msg || 'Failed to remove paralegal' });
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'Error removing paralegal' });
        } finally {
            setIsUpdating(false);
        }
    };

    const handleAddDocumentsToCase = async (selectedDocs) => {
        try {
            const token = localStorage.getItem('token');

            // Link each document to the case
            for (const doc of selectedDocs) {
                await axios.put(
                    `${API_BASE_URL}/api/documents/${doc._id}/link-to-case`,
                    { caseId: id },
                    { headers: { 'x-auth-token': token } }
                );
            }

            // Refresh the case documents to get the full document details
            await fetchCaseDocuments();
            setShowDocumentDrawer(false);

            // Show success message
            console.log(`${selectedDocs.length} document(s) added to case library`);
        } catch (error) {
            console.error('Error adding documents to case:', error);
            alert('Failed to add documents to case');
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

    const getFileIcon = (type) => {
        if (!type) return <File className="w-6 h-6 text-gray-500" />;
        const t = type.toLowerCase();
        if (['jpg', 'jpeg', 'png', 'gif'].includes(t)) return <ImageIcon className="w-6 h-6 text-green-500" />;
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
        <div className="p-6">
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
            </div>

            {/* Quick Actions */}
            <div className="mb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <button
                        onClick={() => setShowClientReportModal(true)}
                        className="bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl p-6 shadow-md hover:shadow-lg transition-all flex flex-col items-center gap-3"
                    >
                        <div className="p-3 bg-white/20 rounded-lg"><FileText className="w-6 h-6" /></div>
                        <span className="font-semibold text-sm text-center">Client Report</span>
                    </button>

                    <button
                        onClick={() => setShowDocumentDrawer(true)}
                        className="bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl p-6 shadow-md hover:shadow-lg transition-all flex flex-col items-center gap-3"
                    >
                        <div className="p-3 bg-white/20 rounded-lg"><Plus className="w-6 h-6" /></div>
                        <span className="font-semibold text-sm text-center">Upload Document</span>
                    </button>

                    <button
                        onClick={() => setShowParalegalModal(true)}
                        className="bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-xl p-6 shadow-md hover:shadow-lg transition-all flex flex-col items-center gap-3"
                    >
                        <div className="p-3 bg-white/20 rounded-lg"><UserPlus className="w-6 h-6" /></div>
                        <span className="font-semibold text-sm text-center">Assign Paralegal</span>
                    </button>

                    <button
                        onClick={() => navigate(`/lawyer/cases`)}
                        className="bg-gradient-to-br from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white rounded-xl p-6 shadow-md hover:shadow-lg transition-all flex flex-col items-center gap-3"
                    >
                        <div className="p-3 bg-white/20 rounded-lg"><FolderOpen className="w-6 h-6" /></div>
                        <span className="font-semibold text-sm text-center">All Cases</span>
                    </button>
                </div>
            </div>

            {/* Message Alert */}
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
                        <div className="flex flex-col items-center text-center lg:border-r lg:border-gray-200 lg:pr-6">
                            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mb-3 shadow-xl border-4 border-gray-700">
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
                                <Briefcase className="w-4 h-4 text-green-400" />
                                Case Overview
                            </h4>
                            <div className="space-y-3">
                                <div>
                                    <p className="text-xs text-black mb-1">Case Type</p>
                                    <span className="inline-block px-2 py-1 text-xs bg-blue-500 text-white rounded-full">
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
                                    <p className="text-xs text-black mb-1">Assigned Paralegals</p>
                                    {caseData.assignedParalegals && caseData.assignedParalegals.length > 0 ? (
                                        <div className="flex flex-wrap gap-1">
                                            {caseData.assignedParalegals.map((paralegal, idx) => (
                                                <span key={idx} className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-green-500 text-white rounded-full">
                                                    {paralegal.name}
                                                    <button
                                                        onClick={() => handleRemoveParalegal(paralegal._id)}
                                                        className="ml-1 hover:bg-green-600 rounded-full p-0.5 transition-colors"
                                                        title="Remove paralegal"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-500 italic">No paralegals assigned</p>
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
                            <div className="flex flex-col items-center text-center lg:border-r lg:border-gray-200 lg:pr-6">
                                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-green-600 flex items-center justify-center mb-3 shadow-xl border-4 border-gray-700">
                                    <span className="text-4xl font-bold text-white">
                                        {caseData.client.name.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                                <h3 className="text-xl font-bold text-black mb-1">{caseData.client.name}</h3>
                                <p className="text-green-600 text-xs font-medium">Active Client</p>
                            </div>

                            {/* Details Section */}
                            <div className="flex-1">
                                <h4 className="text-base font-semibold text-black mb-3 flex items-center gap-2">
                                    <User className="w-4 h-4 text-blue-400" />
                                    Client Details
                                </h4>
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-xs text-gray-600 mb-1">Email Address</p>
                                        <p className="text-sm font-medium text-black">{caseData.client.email}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-600 mb-1">Phone Number</p>
                                        <p className="text-sm font-medium text-black">{caseData.client.phone || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-600 mb-1">Address</p>
                                        <p className="text-sm font-medium text-black">{caseData.client.address || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-600 mb-1">Occupation</p>
                                        <p className="text-sm font-medium text-black">{caseData.client.occupation || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Case Details */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Case Details</h3>

                <div className="space-y-4">
                    <div>
                        <p className="text-sm font-semibold text-gray-700 mb-2">Date Issue Started</p>
                        <p className="text-sm text-gray-900">{formatDate(caseData.dateIssueStarted)}</p>
                    </div>

                    <div>
                        <p className="text-sm font-semibold text-gray-700 mb-2">Summary of Issue</p>
                        <p className="text-sm text-gray-900 whitespace-pre-wrap">{caseData.summary || 'N/A'}</p>
                    </div>

                    <div>
                        <p className="text-sm font-semibold text-gray-700 mb-2">Expected Outcome / Client Objective</p>
                        <p className="text-sm text-gray-900">{caseData.clientObjective || 'N/A'}</p>
                    </div>

                    <OpposingCounselSection
                        opposingCounselHistory={caseData.opposingCounselHistory}
                        onUpdateClick={null}
                        formatDate={formatDate}
                        readOnly={true}
                    />
                </div>
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

            {/* Court Information (Read Only) */}
            {caseData.inCourt && caseData.courtInfo && caseData.courtInfo.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    {/* Current Court Status */}
                    <div className="bg-white rounded-xl shadow-sm border border-green-100 p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-2">
                                <Scale className="w-5 h-5 text-green-600" />
                                <h3 className="text-lg font-semibold text-gray-900">Current Court Status</h3>
                                <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded font-medium">
                                    {caseData.courtInfo.length === 1 ? '1st Court Date' :
                                        caseData.courtInfo.length === 2 ? '2nd Court Date' :
                                            caseData.courtInfo.length === 3 ? '3rd Court Date' :
                                                `${caseData.courtInfo.length}th Court Date`} (Current)
                                </span>
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
                    {caseData.courtInfo.length > 1 ? (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Court History</h3>
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
                        </div>
                    ) : (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center justify-center">
                            <div className="text-center">
                                <Scale className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                                <p className="text-sm text-gray-500">No previous court dates</p>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-2">
                            <Scale className="w-5 h-5 text-gray-400" />
                            <h3 className="text-lg font-semibold text-gray-900">Court Information</h3>
                        </div>
                    </div>
                    <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                        <Scale className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">This case is not currently in court</p>
                    </div>
                </div>
            )}

            {/* Case Reports & Updates and Case Library - Side by Side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Case Reports Section */}
                <div>
                    <CaseReports caseId={id} />
                </div>

                {/* Case Library Section */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <FolderOpen className="w-5 h-5 text-green-600" />
                            <h3 className="text-lg font-semibold text-gray-900">Case Library</h3>
                            <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">
                                {caseDocuments.length} {caseDocuments.length === 1 ? 'Document' : 'Documents'}
                            </span>
                        </div>
                        <button
                            onClick={() => setShowDocumentDrawer(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
                        >
                            <Plus size={20} />
                            Add Files
                        </button>
                    </div>

                    {loadingDocuments ? (
                        <div className="flex justify-center items-center h-32">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                        </div>
                    ) : caseDocuments.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-32 text-gray-500">
                            <FolderOpen className="w-12 h-12 text-gray-300 mb-2" />
                            <p>No documents in case library</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-3 max-h-[400px] overflow-y-auto pr-2">
                            {caseDocuments.map((doc) => (
                                <div key={doc._id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                                    <div className="flex items-start gap-3">
                                        <div className="flex-shrink-0">
                                            {getFileIcon(doc.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 truncate">{doc.name}</p>
                                            <p className="text-xs text-gray-500 mt-1">{formatSize(doc.size)} • {new Date(doc.createdAt).toLocaleDateString()}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <a
                                                href={doc.url}
                                                download
                                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                            >
                                                <Download className="w-4 h-4" />
                                            </a>
                                            <button
                                                onClick={() => handleRemoveDocument(doc)}
                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Client Reports & Discussions Section */}
            {caseData.clientReports && caseData.clientReports.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
                    <div className="flex items-center gap-2 mb-4">
                        <FileText className="w-5 h-5 text-green-600" />
                        <h3 className="text-lg font-semibold text-gray-900">Client Reports & Discussions</h3>
                    </div>
                    <div className="space-y-3">
                        {[...caseData.clientReports].reverse().map((report) => (
                            <div
                                key={report._id}
                                onClick={() => navigate(`/lawyer/cases/${id}/report/${report._id}`)}
                                className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100 rounded-lg p-4 hover:shadow-md transition-all cursor-pointer group"
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-gray-900 group-hover:text-green-700 transition-colors">
                                            {report.subject}
                                        </h4>
                                        <p className="text-xs text-gray-500 mt-1">
                                            Posted {formatDate(report.createdAt)}
                                        </p>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-green-600 transition-colors" />
                                </div>

                                <p className="text-sm text-gray-700 mb-3 line-clamp-2">
                                    {report.content.length > 100 ? report.content.substring(0, 100) + '...' : report.content}
                                </p>

                                <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-1 text-xs text-gray-600 bg-white px-2 py-1 rounded-full">
                                        <MessageCircle className="w-3 h-3" />
                                        <span>{report.replies?.length || 0} {report.replies?.length === 1 ? 'reply' : 'replies'}</span>
                                    </div>
                                    {report.replies && report.replies.some(r => r.authorType === 'client') && (
                                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
                                            Client replied
                                        </span>
                                    )}
                                    <span className="text-xs text-green-600 font-medium group-hover:underline ml-auto">
                                        View Thread →
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Paralegal Assignment Modal */}
            {showParalegalModal && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6">
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                                    <UserPlus size={24} />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900">Assign Paralegals</h3>
                            </div>
                            <button
                                onClick={() => setShowParalegalModal(false)}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="mb-6">
                            <p className="text-sm text-gray-600 mb-4">Select paralegals to assign to this case:</p>
                            <div className="space-y-2 max-h-96 overflow-y-auto">
                                {paralegalUsers.map((paralegal) => (
                                    <label
                                        key={paralegal._id}
                                        className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedParalegals.includes(paralegal._id)}
                                            onChange={() => toggleParalegal(paralegal._id)}
                                            className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                                        />
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-gray-900">{paralegal.name}</p>
                                            <p className="text-xs text-gray-500">{paralegal.email}</p>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowParalegalModal(false)}
                                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAssignParalegals}
                                disabled={isUpdating}
                                className="flex-1 px-4 py-2.5 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isUpdating ? 'Assigning...' : 'Assign Paralegals'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Client Report Modal */}
            <ClientReportModal
                isOpen={showClientReportModal}
                onClose={() => setShowClientReportModal(false)}
                onSave={handlePostClientReport}
                isLoading={isUpdating}
            />

            {/* Document Selector Drawer */}
            {showDocumentDrawer && (
                <DocumentSelectorDrawer
                    isOpen={showDocumentDrawer}
                    onClose={() => setShowDocumentDrawer(false)}
                    onSelectDocuments={handleAddDocumentsToCase}

                />
            )}

            {/* Remove Document Confirmation Modal */}
            {showRemoveModal && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-red-50 text-red-600 rounded-lg">
                                <AlertCircle size={24} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900">Remove Document</h3>
                        </div>
                        <p className="text-gray-600 mb-6">
                            Are you sure you want to remove "{documentToRemove?.fileName}" from this case library?
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setShowRemoveModal(false);
                                    setDocumentToRemove(null);
                                }}
                                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmRemoveDocument}
                                className="flex-1 px-4 py-2.5 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors"
                            >
                                Remove
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LawyerCaseDetails;
