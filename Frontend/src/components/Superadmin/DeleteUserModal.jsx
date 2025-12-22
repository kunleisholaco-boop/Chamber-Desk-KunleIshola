import React, { useState } from 'react';
import { Trash2, AlertTriangle, X } from 'lucide-react';
import API_BASE_URL from '../../../config/api';

const DeleteUserModal = ({ user, onSuccess, onCancel }) => {
    const [confirmationText, setConfirmationText] = useState('');
    const [message, setMessage] = useState({ type: '', text: '' });
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage({ type: '', text: '' });

        if (confirmationText !== user.name.toUpperCase()) {
            setMessage({ type: 'error', text: 'Name does not match.' });
            setIsLoading(false);
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/api/auth/users/${user._id}`, {
                method: 'DELETE',
                headers: {
                    'x-auth-token': token
                }
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.msg || 'Failed to delete user');
            }

            setMessage({ type: 'success', text: 'User deleted successfully!' });
            setTimeout(() => {
                onSuccess(user._id);
            }, 1000);

        } catch (err) {
            setMessage({ type: 'error', text: err.message });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-red-50">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-100 rounded-lg text-red-600">
                        <Trash2 className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Delete User</h2>
                        <p className="text-sm text-red-600">This action cannot be undone.</p>
                    </div>
                </div>
                <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 transition-colors">
                    <X className="w-6 h-6" />
                </button>
            </div>

            {message.text && (
                <div className={`mx-6 mt-6 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex gap-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-yellow-800">
                        You are about to delete <strong>{user.name}</strong>. All data associated with this user will be permanently removed.
                    </p>
                </div>

                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Type <span className="font-mono bg-gray-100 px-1 rounded">{user.name.toUpperCase()}</span> to confirm
                    </label>
                    <input
                        type="text"
                        value={confirmationText}
                        onChange={(e) => setConfirmationText(e.target.value)}
                        placeholder="Type user name in CAPS"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-black"
                        required
                    />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isLoading || confirmationText !== user.name.toUpperCase()}
                        className="px-6 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 focus:ring-4 focus:ring-red-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {isLoading ? 'Deleting...' : 'Delete User'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default DeleteUserModal;
