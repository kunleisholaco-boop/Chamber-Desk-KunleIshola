import React, { useState, useEffect } from 'react';
import { Bell, Check, Trash2, Filter } from 'lucide-react';
import axios from 'axios';
import API_BASE_URL from '../../../config/api';

const SuperadminNotifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // 'all', 'unread', 'user', 'ticket'

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_BASE_URL}/api/notifications', {
                headers: { 'x-auth-token': token }
            });
            setNotifications(res.data);
        } catch (err) {
            console.error('Error fetching notifications:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsRead = async (notificationId) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(`${API_BASE_URL}/api/notifications/${notificationId}/read`, {}, {
                headers: { 'x-auth-token': token }
            });
            setNotifications(notifications.map(n =>
                n._id === notificationId ? { ...n, read: true } : n
            ));
        } catch (err) {
            console.error('Error marking notification as read:', err);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(`${API_BASE_URL}/api/notifications/read-all', {}, {
                headers: { 'x-auth-token': token }
            });
            setNotifications(notifications.map(n => ({ ...n, read: true })));
        } catch (err) {
            console.error('Error marking all as read:', err);
        }
    };

    const handleClearAll = async () => {
        if (!window.confirm('Are you sure you want to clear all notifications?')) return;

        try {
            const token = localStorage.getItem('token');
            // Delete all notifications one by one (you may want to add a bulk delete endpoint)
            for (const notification of notifications) {
                await axios.delete(`${API_BASE_URL}/api/notifications/${notification._id}`, {
                    headers: { 'x-auth-token': token }
                });
            }
            setNotifications([]);
        } catch (err) {
            console.error('Error clearing notifications:', err);
        }
    };

    const getNotificationIcon = (type) => {
        const iconClass = "w-5 h-5";
        if (type.includes('user')) return <Bell className={iconClass} />;
        if (type.includes('ticket') || type.includes('support')) return <Bell className={iconClass} />;
        return <Bell className={iconClass} />;
    };

    const getNotificationColor = (type) => {
        if (type.includes('user_created')) return 'bg-green-100 text-green-700';
        if (type.includes('user_deleted')) return 'bg-red-100 text-red-700';
        if (type.includes('user_role')) return 'bg-blue-100 text-blue-700';
        if (type.includes('user_name') || type.includes('user_email')) return 'bg-yellow-100 text-yellow-700';
        if (type.includes('user_password')) return 'bg-purple-100 text-purple-700';
        if (type.includes('complaint')) return 'bg-red-100 text-red-700';
        if (type.includes('feature')) return 'bg-purple-100 text-purple-700';
        if (type.includes('ticket_status')) return 'bg-orange-100 text-orange-700';
        return 'bg-gray-100 text-gray-700';
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const filteredNotifications = notifications.filter(n => {
        if (filter === 'unread') return !n.read;
        if (filter === 'user') return n.type.includes('user');
        if (filter === 'ticket') return n.type.includes('ticket') || n.type.includes('support');
        return true;
    });

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <div className="p-8">
            <div className="mb-8">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
                        <p className="text-gray-600 mt-1">
                            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
                        </p>
                    </div>
                    <div className="flex gap-3">
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllAsRead}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                <Check size={18} />
                                Mark All Read
                            </button>
                        )}
                        {notifications.length > 0 && (
                            <button
                                onClick={handleClearAll}
                                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                            >
                                <Trash2 size={18} />
                                Clear All
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="mb-6 flex gap-3">
                <button
                    onClick={() => setFilter('all')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === 'all'
                            ? 'bg-orange-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                >
                    All ({notifications.length})
                </button>
                <button
                    onClick={() => setFilter('unread')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === 'unread'
                            ? 'bg-orange-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                >
                    Unread ({unreadCount})
                </button>
                <button
                    onClick={() => setFilter('user')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === 'user'
                            ? 'bg-orange-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                >
                    User Management
                </button>
                <button
                    onClick={() => setFilter('ticket')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === 'ticket'
                            ? 'bg-orange-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                >
                    Support Tickets
                </button>
            </div>

            {/* Notifications List */}
            {loading ? (
                <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
                </div>
            ) : filteredNotifications.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                    <Bell size={48} className="mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-500 text-lg">No notifications to display</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredNotifications.map(notification => (
                        <div
                            key={notification._id}
                            className={`bg-white rounded-xl shadow-sm border transition-all ${notification.read
                                    ? 'border-gray-100'
                                    : 'border-orange-200 bg-orange-50/30'
                                }`}
                        >
                            <div className="p-4 flex items-start gap-4">
                                <div className={`p-3 rounded-lg ${getNotificationColor(notification.type)}`}>
                                    {getNotificationIcon(notification.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-gray-900 font-medium">{notification.message}</p>
                                    <p className="text-sm text-gray-500 mt-1">{formatDate(notification.createdAt)}</p>
                                </div>
                                {!notification.read && (
                                    <button
                                        onClick={() => handleMarkAsRead(notification._id)}
                                        className="flex items-center gap-1 px-3 py-1 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                                    >
                                        <Check size={14} />
                                        Mark Read
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default SuperadminNotifications;
