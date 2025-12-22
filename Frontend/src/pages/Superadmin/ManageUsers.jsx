import React, { useState, useEffect } from 'react';
import { UserPlus, Search, Filter, MoreVertical, Trash2, Edit, Check, Key, ChevronLeft, ChevronRight } from 'lucide-react';
import CreateUserForm from '../../components/Superadmin/CreateUserForm';
import EditUserForm from '../../components/Superadmin/EditUserForm';
import ChangePasswordForm from '../../components/Superadmin/ChangePasswordForm';
import DeleteUserModal from '../../components/Superadmin/DeleteUserModal';

const ManageUsers = () => {
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [showFilterDropdown, setShowFilterDropdown] = useState(false);
    const [selectedRole, setSelectedRole] = useState('All');

    // Action states
    const [editingUser, setEditingUser] = useState(null);
    const [changingPasswordUser, setChangingPasswordUser] = useState(null);
    const [deletingUser, setDeletingUser] = useState(null);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 50;

    // Action dropdown state
    const [activeActionDropdown, setActiveActionDropdown] = useState(null);

    const roles = ['All', 'Manager', 'HOC', 'Lawyer', 'Admin', 'Paralegal', 'Superadmin'];

    const roleColors = {
        'Superadmin': 'bg-red-100 text-red-700',
        'Manager': 'bg-blue-100 text-blue-700',
        'HOC': 'bg-purple-100 text-purple-700',
        'Lawyer': 'bg-green-100 text-green-700',
        'Admin': 'bg-orange-100 text-orange-700',
        'Paralegal': 'bg-teal-100 text-teal-700',
    };

    const fetchUsers = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/api/auth/users', {
                headers: {
                    'x-auth-token': token
                }
            });
            const data = await response.json();
            if (response.ok) {
                setUsers(data);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (activeActionDropdown && !event.target.closest('.action-dropdown-container')) {
                setActiveActionDropdown(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [activeActionDropdown]);

    const handleUserCreated = (newUser) => {
        setUsers([...users, newUser]);
        setShowCreateModal(false);
    };

    const handleUserUpdated = (updatedUser) => {
        setUsers(users.map(user => user._id === updatedUser._id ? updatedUser : user));
        setEditingUser(null);
    };

    const handlePasswordChanged = () => {
        setChangingPasswordUser(null);
    };

    const handleUserDeleted = (deletedUserId) => {
        setUsers(users.filter(user => user._id !== deletedUserId));
        setDeletingUser(null);
    };

    const filteredUsers = users.filter(user => {
        const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.role.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesRole = selectedRole === 'All' || user.role === selectedRole;

        return matchesSearch && matchesRole;
    });

    // Pagination logic
    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage);

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    const toggleActionDropdown = (userId, e) => {
        e.stopPropagation();
        setActiveActionDropdown(activeActionDropdown === userId ? null : userId);
    };

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Manage Users</h2>
                    <p className="text-gray-600">View and manage system users.</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <UserPlus className="w-5 h-5" />
                    Add New User
                </button>
            </div>

            {/* Filters and Search */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search users..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 text-black pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>

                <div className="relative">
                    <button
                        onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                        className={`flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors ${selectedRole !== 'All' ? 'border-blue-500 text-blue-600 bg-blue-50' : 'border-gray-300 text-gray-700'}`}
                    >
                        <Filter className="w-5 h-5" />
                        {selectedRole === 'All' ? 'Filter Role' : selectedRole}
                    </button>

                    {showFilterDropdown && (
                        <>
                            <div
                                className="fixed inset-0 z-10"
                                onClick={() => setShowFilterDropdown(false)}
                            ></div>
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 z-20 py-1">
                                {roles.map((role) => (
                                    <button
                                        key={role}
                                        onClick={() => {
                                            setSelectedRole(role);
                                            setShowFilterDropdown(false);
                                            setCurrentPage(1); // Reset to first page on filter change
                                        }}
                                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center justify-between"
                                    >
                                        {role}
                                        {selectedRole === role && <Check className="w-4 h-4 text-blue-600" />}
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-gray-700">Name</th>
                                <th className="px-6 py-4 font-semibold text-gray-700">Email</th>
                                <th className="px-6 py-4 font-semibold text-gray-700">Role</th>
                                <th className="px-6 py-4 font-semibold text-gray-700">Status</th>
                                <th className="px-6 py-4 font-semibold text-gray-700 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {isLoading ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500">Loading users...</td>
                                </tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500">No users found.</td>
                                </tr>
                            ) : (
                                paginatedUsers.map((user) => (
                                    <tr key={user._id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
                                                    {user.name.charAt(0)}
                                                </div>
                                                <span className="font-medium text-gray-900">{user.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">{user.email}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${roleColors[user.role] || 'bg-gray-100 text-gray-700'}`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                                Active
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right relative action-dropdown-container">
                                            <button
                                                onClick={(e) => toggleActionDropdown(user._id, e)}
                                                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
                                            >
                                                <MoreVertical className="w-5 h-5" />
                                            </button>

                                            {activeActionDropdown === user._id && (
                                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 z-30 py-1 text-left">
                                                    <button
                                                        onClick={() => {
                                                            setEditingUser(user);
                                                            setActiveActionDropdown(null);
                                                        }}
                                                        className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                        Edit User
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setChangingPasswordUser(user);
                                                            setActiveActionDropdown(null);
                                                        }}
                                                        className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                                    >
                                                        <Key className="w-4 h-4" />
                                                        Change Password
                                                    </button>
                                                    <div className="border-t border-gray-100 my-1"></div>
                                                    <button
                                                        onClick={() => {
                                                            setDeletingUser(user);
                                                            setActiveActionDropdown(null);
                                                        }}
                                                        className="w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                        Delete User
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50">
                        <div className="text-sm text-gray-500">
                            Showing <span className="font-medium">{startIndex + 1}</span> to <span className="font-medium">{Math.min(startIndex + itemsPerPage, filteredUsers.length)}</span> of <span className="font-medium">{filteredUsers.length}</span> users
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="p-2 border border-gray-300 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                <button
                                    key={page}
                                    onClick={() => handlePageChange(page)}
                                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${currentPage === page ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-white border border-transparent hover:border-gray-300'}`}
                                >
                                    {page}
                                </button>
                            ))}
                            <button
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className="p-2 border border-gray-300 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Create User Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="w-full max-w-2xl">
                        <CreateUserForm
                            onSuccess={handleUserCreated}
                            onCancel={() => setShowCreateModal(false)}
                        />
                    </div>
                </div>
            )}

            {/* Edit User Modal */}
            {editingUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="w-full max-w-2xl">
                        <EditUserForm
                            user={editingUser}
                            onSuccess={handleUserUpdated}
                            onCancel={() => setEditingUser(null)}
                        />
                    </div>
                </div>
            )}

            {/* Change Password Modal */}
            {changingPasswordUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="w-full max-w-2xl">
                        <ChangePasswordForm
                            user={changingPasswordUser}
                            onSuccess={handlePasswordChanged}
                            onCancel={() => setChangingPasswordUser(null)}
                        />
                    </div>
                </div>
            )}

            {/* Delete User Modal */}
            {deletingUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="w-full max-w-2xl">
                        <DeleteUserModal
                            user={deletingUser}
                            onSuccess={handleUserDeleted}
                            onCancel={() => setDeletingUser(null)}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageUsers;
