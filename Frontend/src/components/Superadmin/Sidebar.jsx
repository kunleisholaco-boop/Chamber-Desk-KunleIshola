import { UserPlus, Users, LogOut, Scale, Home, Ticket, Bell } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';

const Sidebar = () => {
    const location = useLocation();
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        fetchUnreadCount();
        // Poll for new notifications every 30 seconds
        const interval = setInterval(fetchUnreadCount, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchUnreadCount = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_BASE_URL}/api/notifications', {
                headers: { 'x-auth-token': token }
            });
            const unread = res.data.filter(n => !n.read).length;
            setUnreadCount(unread);
        } catch (err) {
            console.error('Error fetching notifications:', err);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
    };

    const isActive = (path) => {
        return location.pathname === path ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800';
    };

    return (
        <div className="w-64 bg-slate-900 text-white hidden md:flex md:flex-col fixed left-0 top-0 h-screen flex-shrink-0">
            <div className="p-6 border-b border-slate-800 flex-shrink-0">
                <h1 className="text-xl font-bold flex items-center gap-2">
                    <Scale className="w-6 h-6 text-blue-400" />
                    Chamber Desk
                </h1>
                <p className="text-xs text-slate-400 mt-1">Superadmin Portal</p>
            </div>
            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                <Link to="/superadmin" className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive('/superadmin')}`}>
                    <Home size={20} />
                    <span>Home</span>
                </Link>
                <Link to="/superadmin/users" className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive('/superadmin/users')}`}>
                    <Users size={20} />
                    <span>Manage Users</span>
                </Link>
                <Link to="/superadmin/support-tickets" className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive('/superadmin/support-tickets')}`}>
                    <Ticket size={20} />
                    <span>Support Tickets</span>
                </Link>
                <Link to="/superadmin/notifications" className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive('/superadmin/notifications')} relative`}>
                    <Bell size={20} />
                    <span>Notifications</span>
                    {unreadCount > 0 && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-red-500 text-white text-xs font-bold rounded-full">
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                    )}
                </Link>
            </nav>
            <div className="p-4 border-t border-slate-800 flex-shrink-0">
                <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-red-400 transition-colors w-full">
                    <LogOut size={20} />
                    <span>Sign Out</span>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;

