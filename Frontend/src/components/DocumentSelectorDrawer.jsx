import React, { useState, useEffect, useRef } from 'react';
import {
    X, Search, Upload, Check, FileText, Image as ImageIcon,
    File, Video, Music, Folder
} from 'lucide-react';
import axios from 'axios';

const DocumentSelectorDrawer = ({ isOpen, onClose, onSelectDocuments, caseId, actionLabel }) => {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('my-documents');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDocIds, setSelectedDocIds] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            fetchDocuments();
        }
    }, [isOpen]);

    const fetchDocuments = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_BASE_URL}/api/documents', {
                headers: { 'x-auth-token': token }
            });
            setDocuments(res.data);
        } catch (err) {
            console.error('Error fetching documents:', err);
        }
        setLoading(false);
    };

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

        return filtered;
    };

    const toggleDocumentSelection = (docId) => {
        if (selectedDocIds.includes(docId)) {
            setSelectedDocIds(selectedDocIds.filter(id => id !== docId));
        } else {
            setSelectedDocIds([...selectedDocIds, docId]);
        }
    };

    const handleFileUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        setUploading(true);
        const token = localStorage.getItem('token');

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            setUploadProgress(Math.round(((i + 1) / files.length) * 100));

            const formData = new FormData();
            formData.append('file', file);
            if (caseId) {
                formData.append('caseId', caseId);
            }

            try {
                await axios.post(`${API_BASE_URL}/api/documents/upload', formData, {
                    headers: {
                        'x-auth-token': token,
                        'Content-Type': 'multipart/form-data'
                    }
                });
            } catch (err) {
                console.error(`Error uploading ${file.name}:`, err);
            }
        }

        setUploading(false);
        setUploadProgress(0);
        fetchDocuments();
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleConfirm = () => {
        const selectedDocs = documents.filter(doc => selectedDocIds.includes(doc._id));
        if (typeof onSelectDocuments === 'function') {
            onSelectDocuments(selectedDocs);
            setSelectedDocIds([]);
            onClose();
        } else {
            console.error('onSelectDocuments is not a function:', onSelectDocuments);
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

    const filteredDocuments = getFilteredDocuments();

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 z-40 transition-opacity"
                onClick={onClose}
            />

            {/* Drawer */}
            <div className="fixed right-0 top-0 h-full w-full md:w-2/3 lg:w-1/2 bg-white shadow-2xl z-50 flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">Select Documents</h2>
                        <p className="text-sm text-gray-500 mt-1">Choose existing files or upload new ones</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X size={24} className="text-gray-500" />
                    </button>
                </div>

                {/* Upload Section */}
                <div className="p-6 border-b border-gray-200 bg-gray-50">
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
                    >
                        {uploading ? (
                            <>Uploading... {uploadProgress}%</>
                        ) : (
                            <>
                                <Upload size={20} />
                                Upload New Documents
                            </>
                        )}
                    </button>
                    <input
                        type="file"
                        multiple
                        ref={fileInputRef}
                        className="hidden"
                        onChange={handleFileUpload}
                    />
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-4 px-6 pt-4 border-b border-gray-200">
                    <button
                        onClick={() => setActiveTab('my-documents')}
                        className={`px-4 py-2 font-medium transition-colors relative ${activeTab === 'my-documents'
                            ? 'text-orange-600 border-b-2 border-orange-600'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        My Documents
                    </button>
                    <button
                        onClick={() => setActiveTab('shared-with-me')}
                        className={`px-4 py-2 font-medium transition-colors relative ${activeTab === 'shared-with-me'
                            ? 'text-orange-600 border-b-2 border-orange-600'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        Shared with Me
                    </button>
                </div>

                {/* Search */}
                <div className="p-6 border-b border-gray-200">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search documents..."
                            className="w-full text-black pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Documents List */}
                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="flex justify-center items-center h-64">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
                        </div>
                    ) : filteredDocuments.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                            <Folder size={64} className="text-gray-300 mb-4" />
                            <p className="text-lg">No documents found</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {filteredDocuments.map(doc => {
                                const isSelected = selectedDocIds.includes(doc._id);
                                return (
                                    <div
                                        key={doc._id}
                                        onClick={() => toggleDocumentSelection(doc._id)}
                                        className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all ${isSelected
                                            ? 'border-orange-500 bg-orange-50'
                                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                            }`}
                                    >
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${isSelected ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-400'
                                            }`}>
                                            {isSelected ? <Check size={16} /> : null}
                                        </div>
                                        <div className="flex-shrink-0">
                                            {getFileIcon(doc.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-gray-800 truncate">{doc.name}</p>
                                            <p className="text-xs text-gray-500">{formatSize(doc.size)} • {new Date(doc.createdAt).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-200 bg-gray-50">
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleConfirm}
                            disabled={selectedDocIds.length === 0}
                            className="flex-1 px-4 py-3 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {actionLabel || (caseId ? 'Add to Case' : 'Select')} ({selectedDocIds.length})
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default DocumentSelectorDrawer;
