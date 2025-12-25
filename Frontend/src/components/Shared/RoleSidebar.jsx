import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LogOut, Scale } from 'lucide-react';

const RoleSidebar = ({ role = 'admin', navigationItems = [], unreadNotifications = 0, onNavigate }) => {
    const location = useLocation();
    const navigate = useNavigate();

    // Color scheme mapping based on role
    const colorSchemes = {
        admin: {
            bg: 'bg-orange-900',
            border: 'border-orange-800',
            text: 'text-orange-400',
            textLight: 'text-orange-200',
            active: 'bg-orange-600',
            hover: 'hover:bg-orange-800',
            portalName: 'Admin Officer Portal'
        },
        hoc: {
            bg: 'bg-purple-900',
            border: 'border-purple-800',
            text: 'text-purple-400',
            textLight: 'text-purple-200',
            active: 'bg-purple-600',
            hover: 'hover:bg-purple-800',
            portalName: 'Head of Chambers Portal'
        },
        lawyer: {
            bg: 'bg-green-900',
            border: 'border-green-800',
            text: 'text-green-400',
            textLight: 'text-green-200',
            active: 'bg-green-600',
            hover: 'hover:bg-green-800',
            portalName: 'Lawyer Portal'
        }
    };

    const colors = colorSchemes[role] || colorSchemes.admin;

    const handleLogout = () => {
        // Clear all authentication data
        localStorage.removeItem('token');
        localStorage.removeItem('user');

        // Use window.location.href for a full page reload
        // This clears the React state and prevents back button navigation
        window.location.href = '/login';
    };

    const handleNavigation = (path) => {
        navigate(path);
        if (onNavigate) onNavigate();
    };

    const isActive = (path) => {
        if (path === `/${role}`) {
            return location.pathname === `/${role}` || location.pathname === `/${role}/`;
        }
        return location.pathname.startsWith(path);
    };

    const NavItem = ({ icon: Icon, label, path, badge }) => (
        <button
            onClick={() => handleNavigation(path)}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors w-full relative ${isActive(path)
                ? `${colors.active} text-white`
                : `${colors.textLight} hover:text-white ${colors.hover}`
                }`}
        >
            <Icon className="w-5 h-5" />
            {label}
            {badge > 0 && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {badge > 9 ? '9+' : badge}
                </span>
            )}
        </button>
    );

    return (
        <div className={`w-64 ${colors.bg} text-white flex flex-col h-screen fixed left-0 top-0`}>
            <div className={`p-6 border-b ${colors.border}`}>
                <h1 className="text-xl font-bold flex items-center gap-2">
                    <Scale className={`w-6 h-6 ${colors.text}`} />
                    Chamber Desk
                </h1>
                <p className={`text-xs ${colors.text} mt-1`}>{colors.portalName}</p>
            </div>

            <nav className="p-4 space-y-2 flex-1">
                {navigationItems.map((item, index) => (
                    <NavItem
                        key={index}
                        icon={item.icon}
                        label={item.label}
                        path={item.path}
                        badge={item.badge}
                    />
                ))}
            </nav>

            <div className={`p-4 border-t ${colors.border} space-y-2`}>
                <button
                    onClick={() => handleNavigation(`/${role}/support`)}
                    className={`flex items-center gap-3 px-4 py-3 ${colors.textLight} hover:text-white ${colors.hover} transition-colors w-full rounded-lg`}
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Reach Tech Support
                </button>
                <button
                    onClick={handleLogout}
                    className={`flex items-center gap-3 px-4 py-3 ${colors.textLight} hover:text-red-400 transition-colors w-full rounded-lg`}
                >
                    <LogOut className="w-5 h-5" />
                    Sign Out
                </button>
            </div>
        </div>
    );
};

export default RoleSidebar;
