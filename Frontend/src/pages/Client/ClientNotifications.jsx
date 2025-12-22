import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle, XCircle, Briefcase, AlertCircle, Calendar, ArrowRight, MessageSquare, Trash2, UserPlus, UserCheck, DollarSign, Users, CheckSquare } from 'lucide-react';
import axios from 'axios';
import { useNavigate, useOutletContext } from 'react-router-dom';
import API_BASE_URL from '../../../config/api';

const ClientNotifications = () => {
    const navigate = useNavigate();
    const { shareToken } = useOutletContext();
    const [notifications, setNotifications] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [showUnreadOnly, setShowUnreadOnly] = useState(false);
    const [datesWithUnread, setDatesWithUnread] = useState([]);

    useEffect(() => {
        fetchNotifications();
    }, [shareToken, selectedDate]);

    useEffect(() => {
        if (shareToken) {
            fetchDatesWithUnread();
        }
    }, [shareToken]);

    const fetchNotifications = async () => {
        if (!shareToken) return;
        setIsLoading(true);
        try {
            const res = await axios.get(`${API_BASE_URL}/api/client-portal/${shareToken}/notifications?date=${selectedDate}`);
            setNotifications(res.data);
        } catch (err) {
            console.error('Error fetching notifications:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchDatesWithUnread = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/api/client-portal/${shareToken}/notifications/unread-dates`);
            setDatesWithUnread(res.data.dates || []);
        } catch (err) {
            console.error('Error fetching unread dates:', err);
        }
    };

    const markAsRead = async (notificationId) => {
        try {
            await axios.put(`${API_BASE_URL}/api/client-portal/${shareToken}/notifications/${notificationId}/read`);
            setNotifications(notifications.map(notif =>
                notif._id === notificationId ? { ...notif, read: true } : notif
            ));
            // Refresh unread dates
            fetchDatesWithUnread();
        } catch (err) {
            console.error('Error marking notification as read:', err);
        }
    };

    const markAllAsRead = async () => {
        try {
            await axios.put(`${API_BASE_URL}/api/client-portal/${shareToken}/notifications/read-all`);
            setNotifications(notifications.map(notif => ({ ...notif, read: true })));
            // Refresh unread dates
            fetchDatesWithUnread();
        } catch (err) {
            console.error('Error marking all as read:', err);
        }
    };

    const handleAction = (notification) => {
        if (!notification.relatedEntity) return;

        const { entityType, entityId } = notification.relatedEntity;

        // Mark as read when action is taken
        if (!notification.read) {
            markAsRead(notification._id);
        }

        switch (entityType) {
            case 'Case':
                navigate(`/client-portal/${shareToken}/case/${entityId}`);
                break;
            case 'Meeting':
                navigate(`/client-portal/${shareToken}/meetings`);
                break;
            case 'ClientComplaint':
                navigate(`/client-portal/${shareToken}/complaints/${entityId}`);
                break;
            default:
                break;
        }
    };

    const getNotificationIcon = (notification) => {
        const type = notification.type;
        const entityType = notification.relatedEntity?.entityType;

        if (entityType === 'Meeting') {
            return <Calendar className="w-5 h-5 text-blue-600" />;
        }

        switch (type) {
            case 'client_case_created':
            case 'client_case_assigned':
            case 'client_case_status_changed':
            case 'client_court_update':
            case 'client_parties_added':
            case 'client_opposing_counsel_updated':
            case 'client_report_added':
                return <Briefcase className="w-5 h-5 text-purple-600" />;
            case 'client_meeting_rsvp_accepted':
                return <CheckCircle className="w-5 h-5 text-green-600" />;
            case 'client_meeting_rsvp_declined':
                return <XCircle className="w-5 h-5 text-red-600" />;
            case 'client_meeting_cancelled':
                return <XCircle className="w-5 h-5 text-orange-600" />;
            case 'client_complaint_created':
            case 'client_complaint_reply':
            case 'client_complaint_status_changed':
                return <MessageSquare className="w-5 h-5 text-orange-600" />;
            default:
                return <Bell className="w-5 h-5 text-gray-600" />;
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

        if (diffInHours < 1) return 'Just now';
        if (diffInHours < 24) return `${diffInHours}h ago`;
        if (diffInHours < 48) return 'Yesterday';
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Notifications</h2>

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Calendar className="absolute text-black left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            onClick={(e) => e.target.showPicker && e.target.showPicker()}
                            className="pl-9 text-black pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
                        />
                    </div>
                    <button
                        onClick={() => setShowUnreadOnly(!showUnreadOnly)}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${showUnreadOnly
                            ? 'bg-purple-600 text-white hover:bg-purple-700'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        {showUnreadOnly ? 'Show All' : 'Unread'}
                    </button>
                    <button
                        onClick={markAllAsRead}
                        className="text-sm text-purple-600 hover:text-purple-700 font-medium whitespace-nowrap"
                    >
                        Mark all as read
                    </button>
                </div>
            </div>

            {/* Dates with Unread Notifications */}
            {datesWithUnread.length > 0 && (
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 mb-6">
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                            <Bell className="w-4 h-4 text-purple-600" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-sm font-semibold text-gray-900 mb-2">Dates with Unread Notifications</h3>
                            <p className="text-xs text-gray-600 mb-3">Click on a date to jump directly to unread notifications</p>
                            <div className="flex flex-wrap gap-2">
                                {datesWithUnread.map((date, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setSelectedDate(date)}
                                        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${selectedDate === date
                                            ? 'bg-purple-600 text-white shadow-sm'
                                            : 'bg-white text-gray-700 hover:bg-purple-100 border border-purple-200'
                                            }`}
                                    >
                                        {new Date(date).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric'
                                        })}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="divide-y divide-gray-200">
                    {isLoading ? (
                        <div className="p-8 text-center text-gray-500">
                            Loading notifications...
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="p-8 text-center">
                            <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500">No notifications for this date</p>
                            <p className="text-sm text-gray-400 mt-1">
                                Try selecting a different date to see past activity
                            </p>
                        </div>
                    ) : (
                        notifications
                            .filter(notification => !showUnreadOnly || !notification.read)
                            .map((notification) => (
                                <div
                                    key={notification._id}
                                    className={`p-6 hover:bg-gray-50 transition-colors ${!notification.read ? 'bg-purple-50/50' : ''}`}
                                >
                                    <div className="flex gap-4 items-start">
                                        <div className="flex-shrink-0 p-2 bg-white rounded-lg shadow-sm border border-gray-100 mt-1">
                                            {getNotificationIcon(notification)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start gap-4">
                                                <div>
                                                    <p className={`text-sm text-gray-900 ${!notification.read ? 'font-semibold' : 'font-medium'}`}>
                                                        {notification.message}
                                                    </p>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        {formatDate(notification.createdAt)}
                                                    </p>
                                                </div>
                                                {!notification.read && (
                                                    <div className="w-2 h-2 bg-purple-600 rounded-full mt-2 flex-shrink-0"></div>
                                                )}
                                            </div>

                                            {notification.relatedEntity && (
                                                <button
                                                    onClick={() => handleAction(notification)}
                                                    className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-purple-600 hover:text-purple-700 transition-colors"
                                                >
                                                    View Details <ArrowRight className="w-3 h-3" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default ClientNotifications;
