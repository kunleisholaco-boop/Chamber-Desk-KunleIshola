import { Home, FileText, DollarSign, FolderOpen, Bell, LogOut, Headphones, Users } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';

const HOCSidebar = () => {
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
        return location.pathname === path ? 'bg-purple-600 text-white' : 'text-purple-200 hover:text-white hover:bg-purple-800';
    };

    return (
        <div className="w-64 bg-purple-900 text-white flex flex-col h-screen fixed left-0 top-0">
            <div className="p-6 border-b border-purple-800">
                <h1 className="text-xl font-bold flex items-center gap-2">
                    <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                    </svg>
                    Chamber Desk
                </h1>
                <p className="text-xs text-purple-400 mt-1">Head of Chambers Portal</p>
            </div>

            <nav className="p-4 space-y-2 flex-1">
                <Link to="/hoc" className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive('/hoc')}`}>
                    <Home size={20} />
                    <span>Home</span>
                </Link>
                <Link to="/hoc/clients" className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive('/hoc/clients')}`}>
                    <Users size={20} />
                    <span>Clients</span>
                </Link>
                <Link to="/hoc/cases" className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive('/hoc/cases')}`}>
                    <FileText size={20} />
                    <span>Cases</span>
                </Link>
                <Link to="/hoc/funds" className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive('/hoc/funds')}`}>
                    <DollarSign size={20} />
                    <span>Funds</span>
                </Link>
                <Link to="/hoc/documents" className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive('/hoc/documents')}`}>
                    <FolderOpen size={20} />
                    <span>Documents</span>
                </Link>
                <Link to="/hoc/notifications" className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive('/hoc/notifications')} relative`}>
                    <Bell size={20} />
                    <span>Notifications</span>
                    {unreadCount > 0 && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-red-500 text-white text-xs font-bold rounded-full">
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                    )}
                </Link>
            </nav>

            <div className="p-4 border-t border-purple-800 space-y-2">
                <Link to="/hoc/support" className="flex items-center gap-3 px-4 py-3 text-purple-200 hover:text-white hover:bg-purple-800 rounded-lg transition-colors w-full">
                    <Headphones size={20} />
                    <span>Reach Tech Support</span>
                </Link>
                <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 text-purple-200 hover:text-red-400 transition-colors w-full rounded-lg">
                    <LogOut size={20} />
                    <span>Sign Out</span>
                </button>
            </div>
        </div>
    );
};

export default HOCSidebar;
