import React, { useState, useEffect } from 'react';
import { X, Briefcase } from 'lucide-react';
import API_BASE_URL from '../../../config/api';

const AttachCaseModal = ({ isOpen, onClose, onAttach, taskId }) => {
    const [cases, setCases] = useState([]);
    const [selectedCaseId, setSelectedCaseId] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchCases();
        }
    }, [isOpen]);

    const fetchCases = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/api/cases', {
                headers: { 'x-auth-token': token }
            });
            if (response.ok) {
                const data = await response.json();
                setCases(data);
            }
        } catch (err) {
            console.error('Error fetching cases:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedCaseId) return;

        setIsSubmitting(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/api/tasks/${taskId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token
                },
                body: JSON.stringify({ caseId: selectedCaseId })
            });

            if (response.ok) {
                onAttach();
                onClose();
                setSelectedCaseId('');
            }
        } catch (err) {
            console.error('Error attaching case:', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
                <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Briefcase className="w-5 h-5 text-orange-600" />
                        <h3 className="text-lg font-bold text-gray-900">Attach Case to Task</h3>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Select a Case
                        </label>
                        {isLoading ? (
                            <div className="flex justify-center items-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
                            </div>
                        ) : (
                            <select
                                value={selectedCaseId}
                                onChange={(e) => setSelectedCaseId(e.target.value)}
                                required
                                className="w-full px-3 py-2 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                            >
                                <option value="">Choose a case...</option>
                                {cases.map(c => (
                                    <option key={c._id} value={c._id}>
                                        {c.caseTitle}
                                    </option>
                                ))}
                            </select>
                        )}
                        {cases.length === 0 && !isLoading && (
                            <p className="text-sm text-gray-500 mt-2">No cases available</p>
                        )}
                    </div>

                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || !selectedCaseId}
                            className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? 'Attaching...' : 'Attach Case'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AttachCaseModal;
