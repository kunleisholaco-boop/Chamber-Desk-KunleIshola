import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Briefcase, Calendar, Lock, Scale, MessageSquare, Bell } from 'lucide-react';
import axios from 'axios';
import API_BASE_URL from '../../config/api';

const ClientPortalSidebar = ({ shareToken, onLogout, onNavigate }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        fetchUnreadCount();
        // Poll for updates every 30 seconds
        const interval = setInterval(fetchUnreadCount, 30000);
        return () => clearInterval(interval);
    }, [shareToken]);

    const fetchUnreadCount = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/api/client-portal/${shareToken}/notifications/unread-count`);
            setUnreadCount(res.data.count || 0);
        } catch (err) {
            console.error('Error fetching unread count:', err);
        }
    };

    const handleNavigation = (path) => {
        navigate(path);
        if (onNavigate) onNavigate();
    };

    const isActive = (path) => {
        return location.pathname === path;
    };

    const NavItem = ({ icon: Icon, label, path, badge }) => (
        <button
            onClick={() => handleNavigation(path)}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors w-full ${isActive(path)
                ? 'bg-gray-800 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
        >
            <Icon className="w-5 h-5" />
            <span className="font-medium flex-1 text-left">{label}</span>
            {badge > 0 && (
                <span className="bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {badge}
                </span>
            )}
        </button>
    );

    return (
        <div className="w-64 bg-black text-white flex flex-col h-screen fixed left-0 top-0 z-50">
            {/* Header */}
            <div className="p-6 border-b border-gray-800">
                <h1 className="text-xl font-bold flex items-center gap-2 text-white">
                    <Scale className="w-6 h-6 text-orange-500" />
                    Chamber Desk
                </h1>
                <p className="text-xs text-gray-500 mt-1 pl-8">Client Portal</p>
            </div>

            {/* Navigation */}
            <nav className="p-4 space-y-2 flex-1">
                <NavItem
                    icon={LayoutDashboard}
                    label="Overview"
                    path={`/client-portal/${shareToken}`}
                />
                <NavItem
                    icon={Briefcase}
                    label="Cases"
                    path={`/client-portal/${shareToken}/cases`}
                />
                <NavItem
                    icon={Calendar}
                    label="Meetings"
                    path={`/client-portal/${shareToken}/meetings`}
                />
                <NavItem
                    icon={Bell}
                    label="Notifications"
                    path={`/client-portal/${shareToken}/notifications`}
                    badge={unreadCount}
                />
                <NavItem
                    icon={MessageSquare}
                    label="Complaints"
                    path={`/client-portal/${shareToken}/complaints`}
                />
            </nav>

            {/* Footer / Logout */}
            <div className="p-4 border-t border-gray-800">
                <button
                    onClick={onLogout}
                    className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-red-400 hover:bg-gray-800 transition-colors w-full rounded-lg"
                >
                    <Lock className="w-5 h-5" />
                    <span className="font-medium">Lock Portal</span>
                </button>
            </div>
        </div>
    );
};

export default ClientPortalSidebar;
