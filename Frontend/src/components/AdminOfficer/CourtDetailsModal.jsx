import React, { useState, useEffect } from 'react';
import { X, Scale, Calendar, MapPin, FileText, User } from 'lucide-react';

const CourtDetailsModal = ({ isOpen, onClose, onSave, initialData, mode = 'add' }) => {
    const [formData, setFormData] = useState({
        courtName: '',
        courtLocation: '',
        caseNumber: '',
        presidingJudge: '',
        nextCourtDate: '',
        previousOrders: ''
    });

    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (initialData) {
            setFormData({
                courtName: initialData.courtName || '',
                courtLocation: initialData.courtLocation || '',
                caseNumber: initialData.caseNumber || '',
                presidingJudge: initialData.presidingJudge || '',
                nextCourtDate: initialData.nextCourtDate ? new Date(initialData.nextCourtDate).toISOString().split('T')[0] : '',
                previousOrders: initialData.previousOrders || ''
            });
        } else {
            setFormData({
                courtName: '',
                courtLocation: '',
                caseNumber: '',
                presidingJudge: '',
                nextCourtDate: '',
                previousOrders: ''
            });
        }
    }, [initialData, isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        await onSave(formData);
        setIsLoading(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-[#000000]/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center p-6 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                            <Scale size={24} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">
                            {mode === 'edit' ? 'Edit Court Details' : 'Add New Court Update'}
                        </h3>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Court Name *
                            </label>
                            <div className="relative">
                                <Scale className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    name="courtName"
                                    value={formData.courtName}
                                    onChange={handleChange}
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-black"
                                    placeholder="e.g. High Court of Lagos State"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Court Location *
                            </label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    name="courtLocation"
                                    value={formData.courtLocation}
                                    onChange={handleChange}
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-black"
                                    placeholder="e.g. Ikeja"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Case Number *
                            </label>
                            <div className="relative">
                                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    name="caseNumber"
                                    value={formData.caseNumber}
                                    onChange={handleChange}
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-black"
                                    placeholder="e.g. SUIT NO: ID/123/2023"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Presiding Judge
                            </label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    name="presidingJudge"
                                    value={formData.presidingJudge}
                                    onChange={handleChange}
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-black"
                                    placeholder="e.g. Hon. Justice A.B. Smith"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Next Court Date
                            </label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="date"
                                    name="nextCourtDate"
                                    value={formData.nextCourtDate}
                                    onChange={handleChange}
                                    onClick={(e) => e.target.showPicker?.()}
                                    min={new Date().toISOString().split('T')[0]}
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-black"
                                />
                            </div>
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Previous Court Orders / Notes
                            </label>
                            <textarea
                                name="previousOrders"
                                value={formData.previousOrders}
                                onChange={handleChange}
                                rows="4"
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-black"
                                placeholder="Enter any previous court orders or important notes..."
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex-1 px-4 py-2.5 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Saving...' : (mode === 'edit' ? 'Save Changes' : 'Update Status')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CourtDetailsModal;
