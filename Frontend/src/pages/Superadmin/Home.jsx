import React, { useState, useEffect } from 'react';
import { Users, Briefcase, Ticket, Bell, UserPlus, Shield, MessageSquare, BellRing, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const StatCard = ({ title, value, icon: Icon, color }) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between">
            <div>
                <p className="text-sm font-medium text-gray-500">{title}</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-1">{value}</h3>
            </div>
            <div className={`p-3 rounded-lg ${color}`}>
                <Icon className="w-6 h-6 text-white" />
            </div>
        </div>
    </div>
);

const RecentCard = ({ title, icon: Icon, data, emptyMessage, onViewMore }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
                <Icon className="w-5 h-5 text-gray-700" />
                <h3 className="text-lg font-bold text-gray-900">{title}</h3>
            </div>
            <button
                onClick={onViewMore}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
            >
                View More
                <ChevronRight className="w-4 h-4" />
            </button>
        </div>
        <div className="space-y-3">
            {data.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">{emptyMessage}</p>
            ) : (
                data.map((item, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                        {item.content}
                    </div>
                ))
            )}
        </div>
    </div>
);

const Home = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState([
        { title: 'Total Users', value: '...', icon: Users, color: 'bg-blue-500' },
        { title: 'Total Roles', value: '...', icon: Briefcase, color: 'bg-purple-500' },
        { title: 'Support Tickets', value: '...', icon: Ticket, color: 'bg-orange-500' },
    ]);

    const [recentUsers, setRecentUsers] = useState([]);
    const [recentRoles, setRecentRoles] = useState([]);
    const [recentTickets, setRecentTickets] = useState([]);
    const [recentNotifications, setRecentNotifications] = useState([]);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const token = localStorage.getItem('token');

                // Fetch users
                const usersResponse = await fetch(`${API_BASE_URL}/api/auth/users', {
                    headers: { 'x-auth-token': token }
                });
                const users = await usersResponse.json();

                // Fetch support tickets
                const ticketsResponse = await fetch(`${API_BASE_URL}/api/support/all', {
                    headers: { 'x-auth-token': token }
                });
                const tickets = await ticketsResponse.json();

                if (usersResponse.ok) {
                    const totalUsers = users.length;
                    const uniqueRoles = new Set(users.map(user => user.role)).size;
                    const totalTickets = ticketsResponse.ok ? tickets.length : 0;

                    setStats([
                        { title: 'Total Users', value: totalUsers, icon: Users, color: 'bg-blue-500' },
                        { title: 'Total Roles', value: uniqueRoles, icon: Briefcase, color: 'bg-purple-500' },
                        { title: 'Support Tickets', value: totalTickets, icon: Ticket, color: 'bg-orange-500' },
                    ]);

                    // Set recent users (last 5)
                    const sortedUsers = [...users].sort((a, b) =>
                        new Date(b.createdAt) - new Date(a.createdAt)
                    ).slice(0, 5);
                    setRecentUsers(sortedUsers.map(user => ({
                        content: (
                            <>
                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                    <UserPlus className="w-5 h-5 text-blue-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                                    <p className="text-xs text-gray-400 mt-1">
                                        {new Date(user.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                            </>
                        )
                    })));

                    // Set recent roles (unique roles with counts)
                    const roleMap = {};
                    users.forEach(user => {
                        if (!roleMap[user.role]) {
                            roleMap[user.role] = { count: 0, lastAdded: user.createdAt };
                        }
                        roleMap[user.role].count++;
                        if (new Date(user.createdAt) > new Date(roleMap[user.role].lastAdded)) {
                            roleMap[user.role].lastAdded = user.createdAt;
                        }
                    });
                    const rolesArray = Object.entries(roleMap)
                        .sort((a, b) => new Date(b[1].lastAdded) - new Date(a[1].lastAdded))
                        .slice(0, 5);
                    setRecentRoles(rolesArray.map(([role, data]) => ({
                        content: (
                            <>
                                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                                    <Shield className="w-5 h-5 text-purple-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900">{role}</p>
                                    <p className="text-xs text-gray-500">{data.count} user{data.count !== 1 ? 's' : ''}</p>
                                    <p className="text-xs text-gray-400 mt-1">
                                        Last added: {new Date(data.lastAdded).toLocaleDateString()}
                                    </p>
                                </div>
                            </>
                        )
                    })));
                }

                if (ticketsResponse.ok) {
                    // Set recent tickets (last 5)
                    const sortedTickets = [...tickets]
                        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                        .slice(0, 5);
                    setRecentTickets(sortedTickets.map(ticket => ({
                        content: (
                            <>
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${ticket.type === 'Complaint' ? 'bg-red-100' : 'bg-green-100'
                                    }`}>
                                    <MessageSquare className={`w-5 h-5 ${ticket.type === 'Complaint' ? 'text-red-600' : 'text-green-600'
                                        }`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">{ticket.title}</p>
                                    <p className="text-xs text-gray-500">{ticket.type} • {ticket.status}</p>
                                    <p className="text-xs text-gray-400 mt-1">
                                        {new Date(ticket.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                            </>
                        )
                    })));
                }

                // Fetch notifications
                const notificationsResponse = await fetch(`${API_BASE_URL}/api/notifications', {
                    headers: { 'x-auth-token': token }
                });
                const notifications = await notificationsResponse.json();

                if (notificationsResponse.ok) {
                    // Set recent notifications (last 5)
                    const sortedNotifications = [...notifications]
                        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                        .slice(0, 5);
                    setRecentNotifications(sortedNotifications.map(notification => ({
                        content: (
                            <>
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${notification.isRead ? 'bg-gray-100' : 'bg-blue-100'
                                    }`}>
                                    <BellRing className={`w-5 h-5 ${notification.isRead ? 'text-gray-600' : 'text-blue-600'
                                        }`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className={`text-sm text-gray-900 ${!notification.isRead ? 'font-medium' : ''}`}>
                                        {notification.message}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">
                                        {new Date(notification.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                            </>
                        )
                    })));
                }

            } catch (error) {
                console.error('Error fetching stats:', error);
            }
        };

        fetchStats();
    }, []);

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
                <p className="text-gray-600">Welcome back, Superadmin. Here's what's happening today.</p>
            </div>

            {/* Stats Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {stats.map((stat, index) => (
                    <StatCard key={index} {...stat} />
                ))}
            </div>

            {/* Recent Section */}
            <div className="mb-8">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h3>

                {/* First Row: Recent Users and Recent Roles */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <RecentCard
                        title="Recent Users"
                        icon={UserPlus}
                        data={recentUsers}
                        emptyMessage="No users yet"
                        onViewMore={() => navigate('/superadmin/users')}
                    />
                    <RecentCard
                        title="Recent Roles"
                        icon={Shield}
                        data={recentRoles}
                        emptyMessage="No roles yet"
                        onViewMore={() => navigate('/superadmin/users')}
                    />
                </div>

                {/* Second Row: Recent Tickets and Recent Notifications */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <RecentCard
                        title="Recent Tickets"
                        icon={MessageSquare}
                        data={recentTickets}
                        emptyMessage="No tickets yet"
                        onViewMore={() => navigate('/superadmin/support-tickets')}
                    />
                    <RecentCard
                        title="Recent Notifications"
                        icon={BellRing}
                        data={recentNotifications}
                        emptyMessage="No notifications yet"
                        onViewMore={() => navigate('/superadmin/notifications')}
                    />
                </div>
            </div>

            {/* System Status */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">System Status</h3>
                <div className="flex items-center gap-2 text-green-600">
                    <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium">All systems operational</span>
                </div>
            </div>
        </div>
    );
};

export default Home;
