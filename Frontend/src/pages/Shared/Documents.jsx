import React, { useState, useEffect, useRef } from 'react';
import {
    FileText, Image as ImageIcon, Upload, Share2, Trash2,
    Folder, Search, Grid, List as ListIcon,
    File, Download, X, ArrowUpDown, Info, Check,
    Video, Music, PieChart, Users, FileDigit, CheckCircle, AlertCircle, FolderPlus
} from 'lucide-react';
import axios from 'axios';
import { useLocation } from 'react-router-dom';
import API_BASE_URL from '../../config/api';

const Documents = () => {
    // Get user role from localStorage for dynamic theming
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userRole = user.role || 'Admin';
    const rolePrefix = userRole === 'HOC' ? '/hoc' : '/admin';
    const primaryColor = userRole === 'HOC' ? 'purple' : 'orange';

    const location = useLocation();
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('grid');
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadingFileName, setUploadingFileName] = useState('');
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDoc, setSelectedDoc] = useState(null);
    const [showShareModal, setShowShareModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [users, setUsers] = useState([]);
    const [shareSearch, setShareSearch] = useState('');
    const [selectedUserIds, setSelectedUserIds] = useState([]);
    const [activeTab, setActiveTab] = useState('my-documents');
    const [sortBy, setSortBy] = useState('date');
    const [filterByType, setFilterByType] = useState('all');
    const [message, setMessage] = useState({ type: '', text: '' });
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [confirmAction, setConfirmAction] = useState('');
    const [confirmData, setConfirmData] = useState(null);
    const [showAddToCaseModal, setShowAddToCaseModal] = useState(false);
    const [cases, setCases] = useState([]);
    const [selectedCaseIds, setSelectedCaseIds] = useState([]);
    const [caseSearch, setCaseSearch] = useState('');
    const fileInputRef = useRef(null);

    // Check for navigation state to set active tab (e.g., from notifications)
    useEffect(() => {
        if (location.state?.activeTab) {
            setActiveTab(location.state.activeTab === 'shared' ? 'shared-with-me' : location.state.activeTab);
        }
    }, [location]);

    // Get current user ID from token
    const getCurrentUserId = () => {
        const token = localStorage.getItem('token');
        if (!token) return null;
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.user.id;
        } catch {
            return null;
        }
    };

    const fetchDocuments = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setLoading(false);
                return;
            }
            const res = await axios.get(`${API_BASE_URL}/api/documents`, {
                headers: { 'x-auth-token': token }
            });
            setDocuments(res.data);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching documents:', err);
            setLoading(false);
        }
    };

    const fetchUsers = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_BASE_URL}/api/users`, {
                headers: { 'x-auth-token': token }
            });
            setUsers(res.data);
        } catch (err) {
            console.error('Error fetching users:', err);
        }
    };

    const fetchCases = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_BASE_URL}/api/cases`, {
                headers: { 'x-auth-token': token }
            });

            // Filter cases based on role
            let filteredCases = res.data;

            // Only Lawyers and Paralegals see filtered cases
            if (user.role === 'Lawyer' || user.role === 'Paralegal') {
                filteredCases = res.data.filter(caseItem =>
                    caseItem.assignedTo &&
                    (typeof caseItem.assignedTo === 'string'
                        ? caseItem.assignedTo === user.id
                        : caseItem.assignedTo._id === user.id)
                );
            }
            // Admin, HOC, Manager see all cases

            setCases(filteredCases);
        } catch (err) {
            console.error('Error fetching cases:', err);
        }
    };

    useEffect(() => {
        fetchDocuments();
        fetchCases();
    }, []);

    // Statistics Calculation
    const getStats = () => {
        const currentUserId = getCurrentUserId();
        const myDocs = documents.filter(doc => doc.uploadedBy?._id === currentUserId);
        const sharedDocs = documents.filter(doc =>
            doc.uploadedBy?._id !== currentUserId &&
            doc.sharedWith?.some(user => user._id === currentUserId)
        );

        const totalPdfs = documents.filter(doc => doc.type === 'pdf').length;
        const totalDocs = documents.filter(doc => ['doc', 'docx'].includes(doc.type)).length;
        const totalImages = documents.filter(doc => ['jpg', 'jpeg', 'png', 'gif'].includes(doc.type)).length;
        const totalVideos = documents.filter(doc => ['mp4', 'mov', 'avi'].includes(doc.type)).length;
        const totalAudio = documents.filter(doc => ['mp3', 'wav'].includes(doc.type)).length;
        const totalExcel = documents.filter(doc => ['xls', 'xlsx'].includes(doc.type)).length;
        const totalPowerPoint = documents.filter(doc => ['ppt', 'pptx'].includes(doc.type)).length;
        const totalZip = documents.filter(doc => doc.type === 'zip').length;

        return {
            total: documents.length,
            myDocs: myDocs.length,
            shared: sharedDocs.length,
            pdfs: totalPdfs,
            docs: totalDocs,
            images: totalImages,
            videos: totalVideos,
            audio: totalAudio,
            excel: totalExcel,
            powerpoint: totalPowerPoint,
            zip: totalZip
        };
    };

    const stats = getStats();

    const handleFileUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        setUploading(true);
        setShowUploadModal(true);
        const token = localStorage.getItem('token');

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            setUploadingFileName(`Uploading ${i + 1}/${files.length}: ${file.name}`);
            setUploadProgress(0);

            const formData = new FormData();
            formData.append('file', file);

            try {
                await axios.post(`${API_BASE_URL}/api/documents/upload`, formData, {
                    headers: {
                        'x-auth-token': token,
                        'Content-Type': 'multipart/form-data'
                    },
                    onUploadProgress: (progressEvent) => {
                        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        setUploadProgress(percentCompleted);
                    }
                });
            } catch (err) {
                console.error(`Error uploading ${file.name}:`, err);
                setMessage({ type: 'error', text: `Failed to upload ${file.name}` });
                setTimeout(() => setMessage({ type: '', text: '' }), 3000);
            }
        }

        setShowUploadModal(false);
        setUploading(false);
        setUploadProgress(0);
        fetchDocuments();
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleDelete = (id, e) => {
        e.stopPropagation();
        setConfirmAction('delete');
        setConfirmData({ id });
        setShowConfirmModal(true);
    };

    const confirmActionHandler = async () => {
        if (confirmAction === 'delete') {
            try {
                const token = localStorage.getItem('token');
                await axios.delete(`${API_BASE_URL}/api/documents/${confirmData.id}`, {
                    headers: { 'x-auth-token': token }
                });
                setDocuments(documents.filter(doc => doc._id !== confirmData.id));
                setMessage({ type: 'success', text: 'Document deleted successfully' });
                setTimeout(() => setMessage({ type: '', text: '' }), 3000);
            } catch (err) {
                console.error('Error deleting document:', err);
                setMessage({ type: 'error', text: 'Delete failed' });
                setTimeout(() => setMessage({ type: '', text: '' }), 3000);
            }
        } else if (confirmAction === 'unshare') {
            try {
                const token = localStorage.getItem('token');
                await axios.put(`${API_BASE_URL}/api/documents/${confirmData.docId}/unshare`,
                    { userId: confirmData.userId },
                    { headers: { 'x-auth-token': token } }
                );
                fetchDocuments();
                setMessage({ type: 'success', text: 'Document unshared successfully' });
                setTimeout(() => setMessage({ type: '', text: '' }), 3000);
                setShowShareModal(false);
            } catch (err) {
                console.error('Error unsharing document:', err);
                setMessage({ type: 'error', text: 'Unshare failed' });
                setTimeout(() => setMessage({ type: '', text: '' }), 3000);
            }
        }
        setShowConfirmModal(false);
        setConfirmAction('');
        setConfirmData(null);
    };

    const toggleUserSelection = (userId) => {
        if (selectedUserIds.includes(userId)) {
            setSelectedUserIds(selectedUserIds.filter(id => id !== userId));
        } else {
            setSelectedUserIds([...selectedUserIds, userId]);
        }
    };

    const handleShareSubmit = async () => {
        if (selectedUserIds.length === 0) return;

        try {
            const token = localStorage.getItem('token');
            await axios.put(`${API_BASE_URL}/api/documents/${selectedDoc._id}/share`,
                { userIds: selectedUserIds },
                { headers: { 'x-auth-token': token } }
            );
            setShowShareModal(false);
            setSelectedUserIds([]);
            fetchDocuments();
            setMessage({ type: 'success', text: 'Document shared successfully!' });
            setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        } catch (err) {
            console.error('Error sharing document:', err);
            setMessage({ type: 'error', text: 'Failed to share document' });
            setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        }
    };

    const handleUnshare = (docId, userId) => {
        setConfirmAction('unshare');
        setConfirmData({ docId, userId });
        setShowConfirmModal(true);
    };

    const handleAddToCaseClick = (doc) => {
        setSelectedDoc(doc);
        setSelectedCaseIds([]);
        setCaseSearch('');
        setShowAddToCaseModal(true);
    };

    const toggleCaseSelection = (caseId) => {
        if (selectedCaseIds.includes(caseId)) {
            setSelectedCaseIds(selectedCaseIds.filter(id => id !== caseId));
        } else {
            setSelectedCaseIds([...selectedCaseIds, caseId]);
        }
    };

    const handleAddToCase = async () => {
        if (selectedCaseIds.length === 0) {
            setMessage({ type: 'error', text: 'Please select at least one case' });
            return;
        }

        try {
            const token = localStorage.getItem('token');
            for (const caseId of selectedCaseIds) {
                await axios.put(
                    `${API_BASE_URL}/api/documents/${selectedDoc._id}/link-to-case`,
                    { caseId },
                    { headers: { 'x-auth-token': token } }
                );
            }
            setMessage({
                type: 'success',
                text: `Document added to ${selectedCaseIds.length} case(s)`
            });
            setShowAddToCaseModal(false);
            setSelectedCaseIds([]);
            fetchDocuments();
        } catch (err) {
            console.error('Error adding to case:', err);
            setMessage({ type: 'error', text: 'Failed to add document to case' });
        }
    };

    const getFileIcon = (type) => {
        const t = type.toLowerCase();
        if (['jpg', 'jpeg', 'png', 'gif'].includes(t)) return <ImageIcon className="w-8 h-8 text-purple-500" />;
        if (['pdf'].includes(t)) return <FileText className="w-8 h-8 text-red-500" />;
        if (['doc', 'docx'].includes(t)) return <FileText className="w-8 h-8 text-blue-500" />;
        if (['ppt', 'pptx'].includes(t)) return <FileText className="w-8 h-8 text-orange-500" />;
        if (['xls', 'xlsx'].includes(t)) return <FileText className="w-8 h-8 text-green-500" />;
        if (['mp4', 'mov', 'avi'].includes(t)) return <Video className="w-8 h-8 text-pink-500" />;
        if (['mp3', 'wav'].includes(t)) return <Music className="w-8 h-8 text-yellow-500" />;
        return <File className="w-8 h-8 text-gray-500" />;
    };

    const formatSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const handleDownload = (doc, e) => {
        e.stopPropagation();
        window.open(doc.url, '_blank', 'noopener,noreferrer');
    };

    const handleCardClick = (doc) => {
        const previewableTypes = ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'mp4', 'mov', 'avi', 'mp3', 'wav'];
        if (previewableTypes.includes(doc.type.toLowerCase())) {
            setSelectedDoc(doc);
            setShowPreviewModal(true);
        } else {
            setSelectedDoc(doc);
            setShowDetailsModal(true);
        }
    };

    const getFilteredDocuments = () => {
        const currentUserId = getCurrentUserId();
        let filtered = documents;

        if (activeTab === 'my-documents') {
            filtered = documents.filter(doc => doc.uploadedBy?._id === currentUserId);
        } else {
            filtered = documents.filter(doc =>
                doc.uploadedBy?._id !== currentUserId &&
                doc.sharedWith?.some(user => user._id === currentUserId)
            );
        }

        filtered = filtered.filter(doc =>
            doc.name.toLowerCase().includes(searchTerm.toLowerCase())
        );

        if (filterByType !== 'all') {
            filtered = filtered.filter(doc => {
                const type = doc.type.toLowerCase();
                if (filterByType === 'doc') return ['doc', 'docx'].includes(type);
                if (filterByType === 'xls') return ['xls', 'xlsx'].includes(type);
                if (filterByType === 'ppt') return ['ppt', 'pptx'].includes(type);
                if (filterByType === 'img') return ['jpg', 'jpeg', 'png', 'gif'].includes(type);
                if (filterByType === 'video') return ['mp4', 'mov', 'avi'].includes(type);
                if (filterByType === 'audio') return ['mp3', 'wav'].includes(type);
                return type === filterByType;
            });
        }

        switch (sortBy) {
            case 'name':
                filtered.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'date':
                filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                break;
            case 'size':
                filtered.sort((a, b) => b.size - a.size);
                break;
            default:
                break;
        }

        return filtered;
    };

    const filteredDocuments = getFilteredDocuments();

    return (
        <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
            {/* Header & Upload */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Documents</h1>
                    <p className="text-gray-500">Manage and share your files securely</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => fileInputRef.current.click()}
                        disabled={uploading}
                        className={`flex items-center gap-2 px-6 py-2.5 bg-${primaryColor}-600 text-white font-semibold rounded-lg hover:bg-${primaryColor}-700 transition-colors disabled:opacity-50`}
                    >
                        {uploading ? 'Uploading...' : <><Upload size={20} /> Upload Files</>}
                    </button>
                    <input
                        type="file"
                        multiple
                        ref={fileInputRef}
                        className="hidden"
                        onChange={handleFileUpload}
                    />
                </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                        <Folder size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">My Documents</p>
                        <p className="text-xl font-bold text-gray-800">{stats.total}</p>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
                        <Users size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Shared With Me</p>
                        <p className="text-xl font-bold text-gray-800">{stats.shared}</p>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="p-3 bg-red-50 text-red-600 rounded-lg">
                        <FileText size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">PDFs</p>
                        <p className="text-xl font-bold text-gray-800">{stats.pdfs}</p>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                        <FileDigit size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Word Docs</p>
                        <p className="text-xl font-bold text-gray-800">{stats.docs}</p>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="p-3 bg-green-50 text-green-600 rounded-lg">
                        <PieChart size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Excel Files</p>
                        <p className="text-xl font-bold text-gray-800">{stats.excel}</p>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="p-3 bg-red-50 text-red-400 rounded-lg">
                        <FileText size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">PowerPoint</p>
                        <p className="text-xl font-bold text-gray-800">{stats.powerpoint}</p>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
                        <ImageIcon size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Images</p>
                        <p className="text-xl font-bold text-gray-800">{stats.images}</p>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="p-3 bg-pink-50 text-pink-600 rounded-lg">
                        <Video size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Videos</p>
                        <p className="text-xl font-bold text-gray-800">{stats.videos}</p>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="p-3 bg-yellow-50 text-yellow-600 rounded-lg">
                        <Music size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Audio</p>
                        <p className="text-xl font-bold text-gray-800">{stats.audio}</p>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
                        <Folder size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">ZIP Files</p>
                        <p className="text-xl font-bold text-gray-800">{stats.zip}</p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-4 border-b border-gray-200">
                <button
                    onClick={() => setActiveTab('my-documents')}
                    className={`px-4 py-2 font-medium transition-colors relative ${activeTab === 'my-documents'
                        ? `text-${primaryColor}-600 border-b-2 border-${primaryColor}-600`
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    My Documents
                </button>
                <button
                    onClick={() => setActiveTab('shared-with-me')}
                    className={`px-4 py-2 font-medium transition-colors relative ${activeTab === 'shared-with-me'
                        ? `text-${primaryColor}-600 border-b-2 border-${primaryColor}-600`
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    Shared with Me
                </button>
            </div>

            {/* Search and Controls */}
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search documents..."
                        className={`w-full text-black pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-${primaryColor}-500`}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
                    <div className="flex items-center gap-2">
                        <File size={18} className="text-gray-500 hidden sm:block" />
                        <select
                            value={filterByType}
                            onChange={(e) => setFilterByType(e.target.value)}
                            className={`w-full sm:w-auto px-3 py-2 text-black border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-${primaryColor}-500 text-sm`}
                        >
                            <option value="all">All Files</option>
                            <option value="pdf">PDF</option>
                            <option value="doc">Word (DOC/DOCX)</option>
                            <option value="xls">Excel (XLS/XLSX)</option>
                            <option value="ppt">PowerPoint</option>
                            <option value="img">Images (JPG/PNG/GIF)</option>
                            <option value="video">Video (MP4)</option>
                            <option value="audio">Audio (MP3)</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-2">
                        <ArrowUpDown size={18} className="text-gray-500 hidden sm:block" />
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className={`w-full sm:w-auto px-3 py-2 text-black border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-${primaryColor}-500 text-sm`}
                        >
                            <option value="date">Date Uploaded</option>
                            <option value="name">Alphabetically</option>
                            <option value="size">File Size</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? `bg-white shadow-sm text-${primaryColor}-600` : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <Grid size={20} />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded-md transition-all ${viewMode === 'list' ? `bg-white shadow-sm text-${primaryColor}-600` : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <ListIcon size={20} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Message Display */}
            {message.text && (
                <div className={`flex items-center gap-3 p-4 rounded-lg border ${message.type === 'success'
                    ? 'bg-green-50 border-green-200 text-green-800'
                    : 'bg-red-50 border-red-200 text-red-800'
                    }`}>
                    {message.type === 'success' ? (
                        <CheckCircle size={20} />
                    ) : (
                        <AlertCircle size={20} />
                    )}
                    <span className="font-medium">{message.text}</span>
                    <button
                        onClick={() => setMessage({ type: '', text: '' })}
                        className="ml-auto text-gray-400 hover:text-gray-600"
                    >
                        <X size={16} />
                    </button>
                </div>
            )}

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className={`animate-spin rounded-full h-12 w-12 border-b-2 border-${primaryColor}-600`}></div>
                </div>
            ) : filteredDocuments.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                    <Folder size={64} className="text-gray-300 mb-4" />
                    <p className="text-lg">No documents found</p>
                    <p className="text-sm">
                        {activeTab === 'my-documents'
                            ? 'Upload a file to get started'
                            : 'No documents have been shared with you yet'}
                    </p>
                </div>
            ) : (
                <>
                    {viewMode === 'grid' ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {filteredDocuments.map(doc => (
                                <div
                                    key={doc._id}
                                    onClick={() => handleCardClick(doc)}
                                    className="group bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer"
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="p-3 bg-gray-50 rounded-lg">
                                            {getFileIcon(doc.type)}
                                        </div>
                                    </div>
                                    <h3 className="font-medium text-gray-800 truncate mb-1" title={doc.name}>{doc.name}</h3>
                                    <p className="text-xs text-gray-500 mb-4">{formatSize(doc.size)} • {new Date(doc.createdAt).toLocaleDateString()}</p>

                                    <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                                        <div className="flex gap-2">
                                            {activeTab === 'my-documents' && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setSelectedDoc(doc); fetchUsers(); setShowShareModal(true); }}
                                                    className={`p-2 hover:bg-${primaryColor}-50 text-gray-500 hover:text-${primaryColor}-600 rounded-lg transition-colors`}
                                                    title="Share"
                                                >
                                                    <Share2 size={18} />
                                                </button>
                                            )}
                                            <button
                                                onClick={(e) => handleDownload(doc, e)}
                                                className="p-2 hover:bg-green-50 text-gray-500 hover:text-green-600 rounded-lg transition-colors"
                                                title="Download"
                                            >
                                                <Download size={18} />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setSelectedDoc(doc); setShowDetailsModal(true); }}
                                                className="p-2 hover:bg-blue-50 text-gray-500 hover:text-blue-600 rounded-lg transition-colors"
                                                title="Details"
                                            >
                                                <Info size={18} />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleAddToCaseClick(doc); }}
                                                className="p-2 hover:bg-purple-50 text-gray-500 hover:text-purple-600 rounded-lg transition-colors"
                                                title="Add to Case"
                                            >
                                                <FolderPlus size={18} />
                                            </button>
                                        </div>
                                        {activeTab === 'my-documents' && (
                                            <button
                                                onClick={(e) => handleDelete(doc._id, e)}
                                                className="p-2 hover:bg-red-50 text-gray-500 hover:text-red-600 rounded-lg transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 text-gray-500 text-sm">
                                    <tr>
                                        <th className="px-6 py-4 font-medium">Name</th>
                                        <th className="px-6 py-4 font-medium">Size</th>
                                        <th className="px-6 py-4 font-medium">Uploaded By</th>
                                        <th className="px-6 py-4 font-medium">Date</th>
                                        <th className="px-6 py-4 font-medium text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredDocuments.map(doc => (
                                        <tr
                                            key={doc._id}
                                            onClick={() => handleCardClick(doc)}
                                            className="hover:bg-gray-50 transition-colors cursor-pointer"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    {getFileIcon(doc.type)}
                                                    <span className="font-medium text-gray-800">{doc.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-gray-500 text-sm">{formatSize(doc.size)}</td>
                                            <td className="px-6 py-4 text-gray-500 text-sm">{doc.uploadedBy?.name || 'Unknown'}</td>
                                            <td className="px-6 py-4 text-gray-500 text-sm">{new Date(doc.createdAt).toLocaleDateString()}</td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {activeTab === 'my-documents' && (
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); setSelectedDoc(doc); fetchUsers(); setShowShareModal(true); }}
                                                            className={`p-2 hover:bg-${primaryColor}-50 text-gray-400 hover:text-${primaryColor}-600 rounded-lg`}
                                                        >
                                                            <Share2 size={18} />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={(e) => handleDownload(doc, e)}
                                                        className="p-2 hover:bg-green-50 text-gray-400 hover:text-green-600 rounded-lg"
                                                    >
                                                        <Download size={18} />
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setSelectedDoc(doc); setShowDetailsModal(true); }}
                                                        className="p-2 hover:bg-blue-50 text-gray-400 hover:text-blue-600 rounded-lg"
                                                    >
                                                        <Info size={18} />
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleAddToCaseClick(doc); }}
                                                        className="p-2 hover:bg-purple-50 text-gray-400 hover:text-purple-600 rounded-lg"
                                                        title="Add to Case"
                                                    >
                                                        <FolderPlus size={18} />
                                                    </button>
                                                    {activeTab === 'my-documents' && (
                                                        <button
                                                            onClick={(e) => handleDelete(doc._id, e)}
                                                            className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-lg"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}

            {/* Upload Progress Modal */}
            {showUploadModal && (
                <div className="fixed inset-0 bg-[#000000]/60 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">Uploading Document</h3>
                        <div className="mb-4">
                            <p className="text-sm text-gray-600 mb-2 truncate" title={uploadingFileName}>
                                {uploadingFileName}
                            </p>
                            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                                <div
                                    className={`bg-${primaryColor}-600 h-full transition-all duration-300 ease-out rounded-full`}
                                    style={{ width: `${uploadProgress}%` }}
                                ></div>
                            </div>
                            <p className="text-sm text-gray-600 mt-2 text-center font-semibold">
                                {uploadProgress}%
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Share Modal */}
            {showShareModal && (
                <div className="fixed inset-0 bg-[#000000]/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 flex flex-col max-h-[90vh]">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-gray-800">Share "{selectedDoc?.name}"</h3>
                            <button onClick={() => setShowShareModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="mb-4">
                            <input
                                type="text"
                                placeholder="Search users by name or email..."
                                className={`w-full text-black px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-${primaryColor}-500`}
                                value={shareSearch}
                                onChange={(e) => setShareSearch(e.target.value)}
                            />
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-2 mb-6 pr-2">
                            {users.filter(u =>
                                (u.name.toLowerCase().includes(shareSearch.toLowerCase()) ||
                                    u.email.toLowerCase().includes(shareSearch.toLowerCase())) &&
                                u._id !== getCurrentUserId()
                            ).map(user => {
                                const isSelected = selectedUserIds.includes(user._id);
                                const isAlreadyShared = selectedDoc.sharedWith.some(u => u._id === user._id);
                                return (
                                    <div
                                        key={user._id}
                                        className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${isSelected ? `bg-${primaryColor}-50 border border-${primaryColor}-200` : 'hover:bg-gray-50 border border-transparent'
                                            }`}
                                        onClick={() => !isAlreadyShared && toggleUserSelection(user._id)}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${isSelected ? `bg-${primaryColor}-600 text-white` : `bg-${primaryColor}-100 text-${primaryColor}-600`
                                                }`}>
                                                {isSelected ? <Check size={16} /> : user.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-800">{user.name}</p>
                                                <p className="text-xs text-gray-500">{user.email}</p>
                                            </div>
                                        </div>
                                        {isAlreadyShared && (
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full">Shared</span>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleUnshare(selectedDoc._id, user._id); }}
                                                    className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-lg hover:bg-red-200 transition-colors"
                                                    title="Unshare"
                                                >
                                                    Unshare
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                        <div className="flex gap-3 pt-4 border-t border-gray-100">
                            <button
                                onClick={() => setShowShareModal(false)}
                                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleShareSubmit}
                                disabled={selectedUserIds.length === 0}
                                className={`flex-1 px-4 py-2 bg-${primaryColor}-600 text-white rounded-lg hover:bg-${primaryColor}-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                                Share ({selectedUserIds.length})
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Details Modal */}
            {showDetailsModal && selectedDoc && (
                <div className="fixed inset-0 bg-[#000000]/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-gray-800">File Details</h3>
                            <button onClick={() => setShowDetailsModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center justify-center p-6 bg-gray-50 rounded-xl mb-6">
                                {getFileIcon(selectedDoc.type)}
                            </div>
                            <div className="grid grid-cols-3 gap-4 text-sm">
                                <div className="text-gray-500">Name</div>
                                <div className="col-span-2 font-medium text-gray-900 break-all">{selectedDoc.name}</div>
                                <div className="text-gray-500">Type</div>
                                <div className="col-span-2 font-medium text-gray-900 uppercase">{selectedDoc.type}</div>
                                <div className="text-gray-500">Size</div>
                                <div className="col-span-2 font-medium text-gray-900">{formatSize(selectedDoc.size)}</div>
                                <div className="text-gray-500">Uploaded By</div>
                                <div className="col-span-2 font-medium text-gray-900">{selectedDoc.uploadedBy?.name || 'Unknown'}</div>
                                <div className="text-gray-500">Date</div>
                                <div className="col-span-2 font-medium text-gray-900">{new Date(selectedDoc.createdAt).toLocaleString()}</div>
                            </div>
                        </div>
                        <div className="mt-8">
                            <button
                                onClick={() => setShowDetailsModal(false)}
                                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Preview Modal */}
            {showPreviewModal && selectedDoc && (
                <div className="fixed inset-0 bg-[#000000]/90 flex items-center justify-center z-50 p-4">
                    <div className="relative w-full max-w-5xl h-[85vh] bg-black rounded-lg overflow-hidden flex flex-col">
                        <div className="flex justify-between items-center p-4 bg-black/50 absolute top-0 left-0 right-0 z-10">
                            <h3 className="text-white font-medium truncate pr-4">{selectedDoc.name}</h3>
                            <button onClick={() => setShowPreviewModal(false)} className="text-white/80 hover:text-white bg-black/20 hover:bg-black/40 rounded-full p-2 transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="flex-1 flex items-center justify-center bg-black overflow-hidden">
                            {['jpg', 'jpeg', 'png', 'gif'].includes(selectedDoc.type.toLowerCase()) && (
                                <img src={selectedDoc.url} alt={selectedDoc.name} className="max-w-full max-h-full object-contain" />
                            )}
                            {['mp4', 'mov', 'avi'].includes(selectedDoc.type.toLowerCase()) && (
                                <video src={selectedDoc.url} controls className="max-w-full max-h-full" />
                            )}
                            {['mp3', 'wav'].includes(selectedDoc.type.toLowerCase()) && (
                                <div className="w-full max-w-md bg-gray-900 p-8 rounded-xl flex flex-col items-center">
                                    <Music size={64} className="text-orange-500 mb-6" />
                                    <audio src={selectedDoc.url} controls className="w-full" />
                                </div>
                            )}
                            {['pdf'].includes(selectedDoc.type.toLowerCase()) && (
                                <iframe src={selectedDoc.url} className="w-full h-full border-0" title="PDF Preview" />
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Confirmation Modal */}
            {showConfirmModal && (
                <div className="fixed inset-0 bg-[#000000]/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-gray-800">
                                {confirmAction === 'delete' ? 'Delete Document' : 'Unshare Document'}
                            </h3>
                            <button onClick={() => setShowConfirmModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="mb-6">
                            <p className="text-gray-600">
                                {confirmAction === 'delete'
                                    ? 'Are you sure you want to delete this document? This action cannot be undone.'
                                    : 'Are you sure you want to unshare this document with this user?'
                                }
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowConfirmModal(false)}
                                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmActionHandler}
                                className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors ${confirmAction === 'delete'
                                    ? 'bg-red-600 hover:bg-red-700'
                                    : `bg-${primaryColor}-600 hover:bg-${primaryColor}-700`
                                    }`}
                            >
                                {confirmAction === 'delete' ? 'Delete' : 'Unshare'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add to Case Modal */}
            {showAddToCaseModal && (
                <div className="fixed inset-0 bg-[#000000]/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 flex flex-col max-h-[90vh]">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-gray-800">Add "{selectedDoc?.name}" to Case</h3>
                            <button onClick={() => setShowAddToCaseModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="mb-4">
                            <input
                                type="text"
                                placeholder="Search cases by title..."
                                className="w-full text-black px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-${primaryColor}-500"
                                value={caseSearch}
                                onChange={(e) => setCaseSearch(e.target.value)}
                            />
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-2 mb-6 pr-2">
                            {cases.filter(c =>
                                c.caseTitle.toLowerCase().includes(caseSearch.toLowerCase())
                            ).map(caseItem => {
                                const isSelected = selectedCaseIds.includes(caseItem._id);
                                return (
                                    <div
                                        key={caseItem._id}
                                        className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${isSelected ? 'bg-purple-50 border border-purple-200' : 'hover:bg-gray-50 border border-transparent'
                                            }`}
                                        onClick={() => toggleCaseSelection(caseItem._id)}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${isSelected ? 'bg-purple-600 text-white' : 'bg-purple-100 text-purple-600'
                                                }`}>
                                                {isSelected ? <Check size={16} /> : caseItem.caseTitle.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-800">{caseItem.caseTitle}</p>
                                                <p className="text-xs text-gray-500">{caseItem.caseType}</p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="flex gap-3 pt-4 border-t border-gray-100">
                            <button
                                onClick={() => setShowAddToCaseModal(false)}
                                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddToCase}
                                disabled={selectedCaseIds.length === 0}
                                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Add to Case ({selectedCaseIds.length})
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Documents;

