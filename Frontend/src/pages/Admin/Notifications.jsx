import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle, XCircle, DollarSign, Users, Briefcase, AlertCircle, UserCheck, Calendar, ArrowRight, CheckSquare, MessageSquare, UserPlus, Trash2 } from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import API_BASE_URL from '../../../config/api';

const Notifications = () => {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [showUnreadOnly, setShowUnreadOnly] = useState(false);
    const [datesWithUnread, setDatesWithUnread] = useState([]);

    useEffect(() => {
        fetchNotifications();
    }, [selectedDate]);

    useEffect(() => {
        fetchDatesWithUnread();
    }, []);

    const fetchNotifications = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_BASE_URL}/api/notifications?date=${selectedDate}`, {
                headers: { 'x-auth-token': token }
            });
            setNotifications(res.data);
        } catch (err) {
            console.error('Error fetching notifications:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchDatesWithUnread = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_BASE_URL}/api/notifications/unread-dates', {
                headers: { 'x-auth-token': token }
            });
            setDatesWithUnread(res.data.dates || []);
        } catch (err) {
            console.error('Error fetching unread dates:', err);
        }
    };

    const markAsRead = async (notificationId) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(`${API_BASE_URL}/api/notifications/${notificationId}/read`, {}, {
                headers: { 'x-auth-token': token }
            });

            setNotifications(notifications.map(notif =>
                notif._id === notificationId ? { ...notif, read: true } : notif
            ));
        } catch (err) {
            console.error('Error marking notification as read:', err);
        }
    };

    const markAllAsRead = async () => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(`${API_BASE_URL}/api/notifications/read-all', {}, {
                headers: { 'x-auth-token': token }
            });

            setNotifications(notifications.map(notif => ({ ...notif, read: true })));
            // Refresh unread dates after marking all as read
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
                navigate(`/admin/cases/${entityId}`);
                break;
            case 'FundRequisition':
                navigate('/admin/funds');
                break;
            case 'Client':
                navigate(`/admin/clients/${entityId}`);
                break;
            case 'Document':
                // Navigate to Documents page and open "Shared with Me" tab
                navigate('/admin/documents', { state: { activeTab: 'shared' } });
                break;
            case 'Meeting':
                navigate('/admin/meetings', { state: { openMeetingId: entityId } });
                break;
            case 'Task':
                navigate(`/admin/tasks/${entityId}`);
                break;
            default:
                break;
        }
    };

    const getNotificationIcon = (notification) => {
        if (notification.relatedEntity?.entityType === 'Meeting') {
            return <Calendar className="w-5 h-5 text-orange-600" />;
        }

        switch (notification.type) {
            case 'fund_approved':
                return <CheckCircle className="w-5 h-5 text-green-600" />;
            case 'fund_rejected':
                return <XCircle className="w-5 h-5 text-red-600" />;
            case 'fund_assigned':
            case 'general':
                return <DollarSign className="w-5 h-5 text-blue-600" />;
            case 'fund_overdue':
                return <AlertCircle className="w-5 h-5 text-orange-600" />;
            case 'client_added':
                return <Users className="w-5 h-5 text-purple-600" />;
            case 'client_status_changed':
                return <UserCheck className="w-5 h-5 text-indigo-600" />;
            case 'case_created':
            case 'case_assigned':
            case 'case_assignment':
            case 'case_status_changed':
                return <Briefcase className="w-5 h-5 text-teal-600" />;
            case 'task_created':
            case 'task_updated':
                return <CheckSquare className="w-5 h-5 text-blue-600" />;
            case 'task_deleted':
            case 'task_subtask_deleted':
                return <Trash2 className="w-5 h-5 text-red-600" />;
            case 'task_comment_added':
            case 'task_reply_added':
                return <MessageSquare className="w-5 h-5 text-purple-600" />;
            case 'task_subtask_added':
                return <CheckSquare className="w-5 h-5 text-green-600" />;
            case 'task_member_added':
                return <UserPlus className="w-5 h-5 text-indigo-600" />;
            case 'meeting_created':
            case 'meeting_updated':
                return <Calendar className="w-5 h-5 text-blue-600" />;
            case 'meeting_rsvp_accepted':
                return <CheckCircle className="w-5 h-5 text-green-600" />;
            case 'meeting_rsvp_declined':
                return <XCircle className="w-5 h-5 text-red-600" />;
            case 'meeting_cancelled':
                return <XCircle className="w-5 h-5 text-orange-600" />;
            case 'client_complaint_created':
            case 'client_complaint_reply':
            case 'client_complaint_status_changed':
                return <MessageSquare className="w-5 h-5 text-red-600" />;
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
        <div>
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
                            className="pl-9 text-black pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                        />
                    </div>
                    <button
                        onClick={() => setShowUnreadOnly(!showUnreadOnly)}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${showUnreadOnly
                            ? 'bg-orange-600 text-white hover:bg-orange-700'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        {showUnreadOnly ? 'Show All' : 'Unread'}
                    </button>
                    <button
                        onClick={markAllAsRead}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium whitespace-nowrap"
                    >
                        Mark all as read
                    </button>
                </div>
            </div>

            {/* Dates with Unread Notifications */}
            {datesWithUnread.length > 0 && (
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6">
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-orange-100 rounded-lg">
                            <Bell className="w-4 h-4 text-orange-600" />
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
                                            ? 'bg-orange-600 text-white shadow-sm'
                                            : 'bg-white text-gray-700 hover:bg-orange-100 border border-orange-200'
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
                                    className={`p-6 hover:bg-gray-50 transition-colors ${!notification.read ? 'bg-blue-50/50' : ''}`}
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
                                                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                                                )}
                                            </div>

                                            {notification.relatedEntity && (
                                                <button
                                                    onClick={() => handleAction(notification)}
                                                    className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
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

export default Notifications;
