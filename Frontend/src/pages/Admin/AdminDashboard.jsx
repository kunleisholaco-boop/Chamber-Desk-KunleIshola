import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu, X, Bell } from 'lucide-react';
import AdminSidebar from '../../components/AdminOfficer/AdminSidebar';

const AdminDashboard = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [unreadNotifications, setUnreadNotifications] = useState(0);

    useEffect(() => {
        fetchUnreadCount();
        // Optional: Poll every minute for new notifications
        const interval = setInterval(fetchUnreadCount, 60000);
        return () => clearInterval(interval);
    }, []);

    const fetchUnreadCount = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/api/notifications/unread-count', {
                headers: { 'x-auth-token': token }
            });
            if (res.ok) {
                const data = await res.json();
                setUnreadNotifications(data.count);
            }
        } catch (err) {
            console.error('Error fetching unread count:', err);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Sidebar - Desktop (Fixed) */}
            <div className="hidden md:block">
                <AdminSidebar
                    unreadNotifications={unreadNotifications}
                />
            </div>

            {/* Sidebar - Mobile */}
            {sidebarOpen && (
                <div className="fixed inset-0 bg-[#000000]/60 z-40 md:hidden" onClick={() => setSidebarOpen(false)}>
                    <div className="w-64 h-full" onClick={(e) => e.stopPropagation()}>
                        <div className="relative h-full">
                            <button
                                onClick={() => setSidebarOpen(false)}
                                className="absolute top-4 right-4 p-2 text-white hover:bg-orange-800 rounded-lg z-50"
                            >
                                <X className="w-6 h-6" />
                            </button>
                            <AdminSidebar
                                unreadNotifications={unreadNotifications}
                                onNavigate={() => setSidebarOpen(false)}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content - Add left margin for fixed sidebar on desktop */}
            <div className="md:ml-64">
                {/* Header - Mobile */}
                <header className="bg-white shadow-sm p-4 flex justify-between items-center md:hidden">
                    <button onClick={() => setSidebarOpen(true)} className="p-2 text-gray-600">
                        <Menu className="w-6 h-6" />
                    </button>
                    <h1 className="font-bold text-black text-lg">Chamber Desk</h1>
                    <button
                        onClick={() => window.location.href = '/admin/notifications'}
                        className="relative p-2 text-gray-600"
                        title="Notifications"
                    >
                        <Bell className="w-6 h-6" />
                        {unreadNotifications > 0 && (
                            <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                                {unreadNotifications > 9 ? '9+' : unreadNotifications}
                            </span>
                        )}
                    </button>
                </header>

                {/* Content Area - Renders child routes */}
                <div className="p-8 max-w-7xl mx-auto">
                    <Outlet />
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
