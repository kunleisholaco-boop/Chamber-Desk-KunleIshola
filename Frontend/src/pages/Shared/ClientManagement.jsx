import React, { useState, useEffect } from 'react';
import { UserPlus, Search, Filter, Users, UserCheck, UserX } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../../components/AdminOfficer/LoadingSpinner';
import API_BASE_URL from '../../config/api';

const ClientManagement = () => {
    const navigate = useNavigate();
    const [clients, setClients] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('All');
    const [filterStatus, setFilterStatus] = useState('All');

    // Get user role for conditional rendering
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userRole = user.role; // 'Admin', 'HOC', 'Manager', etc.

    useEffect(() => {
        fetchClients();
    }, []);

    const fetchClients = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/api/clients`, {
                headers: {
                    'x-auth-token': token
                }
            });

            if (response.ok) {
                const data = await response.json();
                setClients(data);
            }
        } catch (err) {
            console.error('Error fetching clients:', err);
        } finally {
            setIsLoading(false);
        }
    };

    // Calculate client stats
    const totalClients = clients.length;
    const activeClients = clients.filter(c => c.status === 'Active').length;
    const inactiveClients = clients.filter(c => c.status === 'Inactive').length;

    // Filter and search clients
    const filteredClients = clients.filter(client => {
        const matchesSearch = client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            client.phone.includes(searchQuery);

        const matchesFilter = filterType === 'All' || client.clientType === filterType;
        const matchesStatus = filterStatus === 'All' || client.status === filterStatus;

        return matchesSearch && matchesFilter && matchesStatus;
    });

    // Get first letter of name for avatar
    const getInitial = (name) => {
        return name ? name.charAt(0).toUpperCase() : '?';
    };

    // Get color for client type badge
    const getClientTypeColor = (type) => {
        const colors = {
            'Individual': 'bg-blue-100 text-blue-800',
            'Corporate Organization': 'bg-purple-100 text-purple-800',
            'Government Agency': 'bg-green-100 text-green-800'
        };
        return colors[type] || 'bg-gray-100 text-gray-800';
    };

    // Abbreviate long client type names for badge
    const getClientTypeLabel = (type) => {
        const labels = {
            'Individual': 'Individual',
            'Corporate Organization': 'Corporate',
            'Government Agency': 'Gov. Agency'
        };
        return labels[type] || type;
    };

    // Get color for avatar circle
    const getAvatarColor = (name) => {
        const colors = userRole === 'Admin' ? [
            'bg-orange-500',
            'bg-blue-500',
            'bg-green-500',
            'bg-purple-500',
            'bg-pink-500',
            'bg-indigo-500',
            'bg-red-500',
            'bg-yellow-500'
        ] : [
            'bg-purple-500',
            'bg-blue-500',
            'bg-green-500',
            'bg-indigo-500',
            'bg-pink-500',
            'bg-violet-500',
            'bg-red-500',
            'bg-yellow-500'
        ];
        const index = name ? name.charCodeAt(0) % colors.length : 0;
        return colors[index];
    };

    const getBasePath = () => {
        return userRole === 'Admin' ? '/admin' : userRole === 'HOC' ? '/hoc' : '/dashboard';
    };

    const getPrimaryColor = () => {
        return userRole === 'Admin' ? 'orange' : 'purple';
    };

    const primaryColor = getPrimaryColor();

    return (
        <div className={userRole === 'HOC' ? 'p-6' : ''}>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Client Management</h2>
                {/* Admin-only: Add New Client Button */}
                {userRole === 'Admin' && (
                    <button
                        onClick={() => navigate('/admin/clients/add')}
                        className="px-6 py-2.5 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2"
                    >
                        <UserPlus className="w-5 h-5" />
                        Add New Client
                    </button>
                )}
            </div>

            {/* Stats Counters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                {/* Total Clients */}
                <div className={`bg-gradient-to-br from-${primaryColor}-50 to-${primaryColor}-100 rounded-xl p-6 border border-${primaryColor}-200`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className={`text-sm font-medium text-${primaryColor}-600 mb-1`}>Total Clients</p>
                            <p className={`text-3xl font-bold text-${primaryColor}-900`}>{totalClients}</p>
                        </div>
                        <div className={`p-3 bg-${primaryColor}-500 rounded-lg`}>
                            <Users className="w-6 h-6 text-white" />
                        </div>
                    </div>
                </div>

                {/* Active Clients */}
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-green-600 mb-1">Active Clients</p>
                            <p className="text-3xl font-bold text-green-900">{activeClients}</p>
                        </div>
                        <div className="p-3 bg-green-500 rounded-lg">
                            <UserCheck className="w-6 h-6 text-white" />
                        </div>
                    </div>
                </div>

                {/* Inactive Clients */}
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600 mb-1">Inactive Clients</p>
                            <p className="text-3xl font-bold text-gray-900">{inactiveClients}</p>
                        </div>
                        <div className="p-3 bg-gray-500 rounded-lg">
                            <UserX className="w-6 h-6 text-white" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Search and Filter Bar */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Search Bar */}
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by name, email, or phone..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={`w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-${primaryColor}-500 focus:border-transparent text-black`}
                        />
                    </div>

                    {/* Filter by Type Dropdown */}
                    <div className="relative">
                        <Filter className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            className={`pl-10 pr-8 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-${primaryColor}-500 focus:border-transparent text-black appearance-none bg-white min-w-[200px]`}
                        >
                            <option value="All">All Client Types</option>
                            <option value="Individual">Individual</option>
                            <option value="Corporate Organization">Corporate Organization</option>
                            <option value="Government Agency">Government Agency</option>
                        </select>
                    </div>

                    {/* Filter by Status Dropdown */}
                    <div className="relative">
                        <Filter className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className={`pl-10 pr-8 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-${primaryColor}-500 focus:border-transparent text-black appearance-none bg-white min-w-[200px]`}
                        >
                            <option value="All">All Statuses</option>
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Clients Grid */}
            {isLoading ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
                    <LoadingSpinner message="Loading clients..." />
                </div>
            ) : filteredClients.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                    <p className="text-gray-500">
                        {searchQuery || filterType !== 'All'
                            ? 'No clients found matching your search criteria'
                            : 'No clients added yet'}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredClients.map((client) => (
                        <div
                            key={client._id}
                            onClick={() => navigate(`${getBasePath()}/clients/${client._id}`)}
                            className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow cursor-pointer relative"
                        >
                            {/* Status Badge - Top Left */}
                            <div className="absolute top-4 left-4">
                                <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${client.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                    }`}>
                                    {client.status}
                                </span>
                            </div>

                            {/* Client Type Badge - Top Right */}
                            <div className="absolute top-4 right-4">
                                <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${getClientTypeColor(client.clientType)}`}>
                                    {getClientTypeLabel(client.clientType)}
                                </span>
                            </div>

                            {/* Centered Content */}
                            <div className="flex flex-col items-center text-center pt-8">
                                {/* Avatar Circle */}
                                <div className={`w-16 h-16 rounded-full ${getAvatarColor(client.name)} flex items-center justify-center mb-4`}>
                                    <span className="text-white font-bold text-2xl">
                                        {getInitial(client.name)}
                                    </span>
                                </div>

                                {/* Client Info */}
                                <h3 className="font-semibold text-gray-900 text-lg mb-2">
                                    {client.name}
                                </h3>
                                <p className="text-sm text-gray-600 mb-1 break-all px-2">
                                    {client.email}
                                </p>
                                <p className="text-sm text-gray-600">
                                    {client.phone}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Results Count */}
            {!isLoading && filteredClients.length > 0 && (
                <div className="mt-6 text-center text-sm text-gray-600">
                    Showing {filteredClients.length} of {clients.length} client{clients.length !== 1 ? 's' : ''}
                </div>
            )}
        </div>
    );
};

export default ClientManagement;
