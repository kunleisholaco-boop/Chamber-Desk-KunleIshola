import React, { useState, useEffect } from 'react';
import { Radio, Calendar, User, X, MessageSquare } from 'lucide-react';
import LoadingSpinner from '../../components/AdminOfficer/LoadingSpinner';
import API_BASE_URL from '../../config/api';

const Broadcast = () => {
    // Get user role from localStorage
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userRole = user.role || 'Admin';
    const rolePrefix = userRole === 'HOC' ? '/hoc' : '/admin';
    const primaryColor = userRole === 'HOC' ? 'purple' : 'orange';

    const [broadcasts, setBroadcasts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedBroadcast, setSelectedBroadcast] = useState(null);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        fetchBroadcasts();
    }, []);

    const fetchBroadcasts = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/api/broadcasts`, {
                headers: { 'x-auth-token': token }
            });
            if (response.ok) {
                const data = await response.json();
                setBroadcasts(data);
            }
        } catch (err) {
            console.error('Error fetching broadcasts:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleBroadcastClick = (broadcast) => {
        setSelectedBroadcast(broadcast);
        setShowModal(true);
    };

    if (isLoading) return <LoadingSpinner message="Loading broadcasts..." />;

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Radio className={`w-6 h-6 text-${primaryColor}-600`} />
                    Broadcast Messages
                </h1>
                <p className="text-gray-600 mt-1">View important announcements and updates from management</p>
            </div>

            <div className="grid gap-4">
                {broadcasts.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-sm p-8 text-center border border-gray-200">
                        <Radio className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <h3 className="text-lg font-medium text-gray-900">No Broadcasts</h3>
                        <p className="text-gray-500">There are no broadcast messages at this time.</p>
                    </div>
                ) : (
                    broadcasts.map((broadcast) => (
                        <div
                            key={broadcast._id}
                            onClick={() => handleBroadcastClick(broadcast)}
                            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer group"
                        >
                            <div className="flex justify-between items-start mb-3">
                                <h3 className={`text-lg font-semibold text-gray-900 group-hover:text-${primaryColor}-600 transition-colors`}>
                                    {broadcast.title}
                                </h3>
                                <span className="text-xs text-gray-500 flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-full">
                                    <Calendar className="w-3 h-3" />
                                    {new Date(broadcast.createdAt).toLocaleDateString(undefined, {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric'
                                    })}
                                </span>
                            </div>
                            <p className="text-gray-600 line-clamp-2 mb-4">
                                {broadcast.message}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                <User className="w-3 h-3" />
                                <span>Sent by: {broadcast.sender?.name || 'Unknown Sender'}</span>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Broadcast Details Modal */}
            {showModal && selectedBroadcast && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-gray-200 flex justify-between items-start bg-gray-50">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">{selectedBroadcast.title}</h2>
                                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                                    <span className="flex items-center gap-1">
                                        <User className="w-4 h-4" />
                                        {selectedBroadcast.sender?.name}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Calendar className="w-4 h-4" />
                                        {new Date(selectedBroadcast.createdAt).toLocaleString(undefined, {
                                            weekday: 'long',
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowModal(false)}
                                className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                            >
                                <X className="w-6 h-6 text-gray-500" />
                            </button>
                        </div>
                        <div className="p-8 overflow-y-auto max-h-[60vh]">
                            <div className="prose max-w-none text-gray-800 whitespace-pre-wrap leading-relaxed">
                                {selectedBroadcast.message}
                            </div>
                        </div>
                        <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Broadcast;
