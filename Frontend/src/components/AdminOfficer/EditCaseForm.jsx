import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle, AlertCircle, Plus, X } from 'lucide-react';
import LoadingSpinner from '../../components/AdminOfficer/LoadingSpinner';
import API_BASE_URL from '../../../config/api';

const EditCaseForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    // Get user role from localStorage
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userRole = user.role || 'Admin';
    const rolePrefix = userRole === 'HOC' ? '/hoc' : '/admin';

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [clientName, setClientName] = useState('');

    const [formData, setFormData] = useState({
        // Case Category
        caseType: '',
        subCategory: '',

        // Case Details
        caseTitle: '',
        summary: '',
        dateIssueStarted: '',
        clientObjective: '',

        // Parties Involved
        parties: [{ name: '', role: '', address: '', contact: '' }],

        // Opposing Counsel
        opposingCounsel: '',

        // Witnesses
        witnesses: [{ name: '', contact: '', relationship: '' }],

        // Court Information
        inCourt: false,
        courtName: '',
        courtLocation: '',
        caseNumber: '',
        presidingJudge: '',
        nextCourtDate: '',
        previousOrders: ''
    });

    useEffect(() => {
        fetchCaseDetails();
    }, [id]);

    const fetchCaseDetails = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/api/cases/${id}`, {
                headers: { 'x-auth-token': token }
            });

            if (response.ok) {
                const data = await response.json();

                // Format dates for input fields
                const formattedDateIssueStarted = data.dateIssueStarted
                    ? new Date(data.dateIssueStarted).toISOString().split('T')[0]
                    : '';

                // Handle court info (it's an array in backend, we want the latest)
                let currentCourtInfo = {};
                let hasCourtInfo = false;

                if (Array.isArray(data.courtInfo) && data.courtInfo.length > 0) {
                    currentCourtInfo = data.courtInfo[data.courtInfo.length - 1];
                    hasCourtInfo = true;
                } else if (data.courtInfo && typeof data.courtInfo === 'object' && !Array.isArray(data.courtInfo)) {
                    // Fallback for legacy data if any
                    currentCourtInfo = data.courtInfo;
                    hasCourtInfo = true;
                }

                const formattedNextCourtDate = currentCourtInfo.nextCourtDate
                    ? new Date(currentCourtInfo.nextCourtDate).toISOString().split('T')[0]
                    : '';

                setFormData({
                    caseType: data.caseType || '',
                    subCategory: data.subCategory || '',
                    caseTitle: data.caseTitle || '',
                    summary: data.summary || '',
                    dateIssueStarted: formattedDateIssueStarted,
                    clientObjective: data.clientObjective || '',
                    parties: data.parties || [{ name: '', role: '', address: '', contact: '' }],
                    opposingCounsel: data.opposingCounsel || '',
                    witnesses: data.witnesses || [{ name: '', contact: '', relationship: '' }],
                    inCourt: data.inCourt || hasCourtInfo, // Use hasCourtInfo as fallback
                    courtName: currentCourtInfo.courtName || '',
                    courtLocation: currentCourtInfo.courtLocation || '',
                    caseNumber: currentCourtInfo.caseNumber || '',
                    presidingJudge: currentCourtInfo.presidingJudge || '',
                    nextCourtDate: formattedNextCourtDate,
                    previousOrders: currentCourtInfo.previousOrders || ''
                });

                if (data.client) {
                    setClientName(data.client.name);
                }
            } else {
                setMessage({ type: 'error', text: 'Failed to fetch case details' });
            }
        } catch (err) {
            console.error('Error fetching case:', err);
            setMessage({ type: 'error', text: 'Error fetching case details' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value
        });
    };

    const handlePartyChange = (index, field, value) => {
        const newParties = [...formData.parties];
        newParties[index][field] = value;
        setFormData({ ...formData, parties: newParties });
    };

    const addParty = () => {
        setFormData({
            ...formData,
            parties: [...formData.parties, { name: '', role: '', address: '', contact: '' }]
        });
    };

    const removeParty = (index) => {
        const newParties = formData.parties.filter((_, i) => i !== index);
        setFormData({ ...formData, parties: newParties });
    };

    const handleWitnessChange = (index, field, value) => {
        const newWitnesses = [...formData.witnesses];
        newWitnesses[index][field] = value;
        setFormData({ ...formData, witnesses: newWitnesses });
    };

    const addWitness = () => {
        setFormData({
            ...formData,
            witnesses: [...formData.witnesses, { name: '', contact: '', relationship: '' }]
        });
    };

    const removeWitness = (index) => {
        const newWitnesses = formData.witnesses.filter((_, i) => i !== index);
        setFormData({ ...formData, witnesses: newWitnesses });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        setMessage({ type: '', text: '' });

        try {
            const token = localStorage.getItem('token');

            const submissionData = {
                ...formData,
                courtInfo: formData.inCourt ? {
                    courtName: formData.courtName,
                    courtLocation: formData.courtLocation,
                    caseNumber: formData.caseNumber,
                    presidingJudge: formData.presidingJudge,
                    nextCourtDate: formData.nextCourtDate,
                    previousOrders: formData.previousOrders
                } : null
            };

            const response = await fetch(`${API_BASE_URL}/api/cases/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token
                },
                body: JSON.stringify(submissionData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.msg || 'Failed to update case');
            }

            setMessage({ type: 'success', text: 'Case updated successfully!' });

            // Navigate back to case details after 1.5 seconds
            setTimeout(() => {
                navigate(`${rolePrefix}/cases/${id}`);
            }, 1500);

        } catch (err) {
            setMessage({ type: 'error', text: err.message });
        } finally {
            setIsSaving(false);
        }
    };

    const caseTypes = [
        'Criminal',
        'Civil',
        'Corporate/Commercial',
        'Real Estate',
        'Family Law',
        'Employment/Labour',
        'Intellectual Property',
        'Immigration',
        'Banking & Finance',
        'Litigation / ADR',
        'Others'
    ];

    if (isLoading) {
        return <LoadingSpinner message="Loading case details..." />;
    }

    return (
        <div>
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={() => navigate(`${rolePrefix}/cases/${id}`)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Edit Case</h2>
                    {clientName && (
                        <p className="text-sm text-gray-600 mt-1">Client: {clientName}</p>
                    )}
                </div>
            </div>

            {message.text && (
                <div className={`mb-6 p-4 rounded-lg flex items-start gap-3 ${message.type === 'success'
                    ? 'bg-green-50 text-green-800 border border-green-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                    }`}>
                    {message.type === 'success' ? (
                        <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    ) : (
                        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    )}
                    <p className="text-sm">{message.text}</p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Case Category */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Case Category</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Type of Case / Practice Area *</label>
                            <select
                                name="caseType"
                                value={formData.caseType}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-black"
                                required
                            >
                                <option value="">Select Case Type</option>
                                {caseTypes.map(type => (
                                    <option key={type} value={type}>{type}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Sub-category</label>
                            <input
                                type="text"
                                name="subCategory"
                                value={formData.subCategory}
                                onChange={handleChange}
                                placeholder="e.g., divorce, tenancy dispute, assault"
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-black"
                            />
                        </div>
                    </div>
                </div>

                {/* Case Details */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Case Details</h3>
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Case Title *</label>
                            <input
                                type="text"
                                name="caseTitle"
                                value={formData.caseTitle}
                                onChange={handleChange}
                                placeholder="e.g., John Doe vs ABC Ltd"
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-black"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Summary of the Issue / Problem Description *</label>
                            <textarea
                                name="summary"
                                value={formData.summary}
                                onChange={handleChange}
                                rows="4"
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-black"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Date Issue Started *</label>
                                <input
                                    type="date"
                                    name="dateIssueStarted"
                                    value={formData.dateIssueStarted}
                                    onChange={handleChange}
                                    onClick={(e) => e.target.showPicker?.()}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-black"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Expected Outcome / Client Objective *</label>
                                <input
                                    type="text"
                                    name="clientObjective"
                                    value={formData.clientObjective}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-black"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Opposing Counsel (if known)</label>
                            <input
                                type="text"
                                name="opposingCounsel"
                                value={formData.opposingCounsel}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-black"
                            />
                        </div>
                    </div>
                </div>

                {/* Parties Involved */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Parties Involved</h3>
                        <button
                            type="button"
                            onClick={addParty}
                            className="flex items-center gap-2 px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm"
                        >
                            <Plus className="w-4 h-4" />
                            Add Party
                        </button>
                    </div>

                    <div className="space-y-4">
                        {formData.parties.map((party, index) => (
                            <div key={index} className="border border-gray-200 rounded-lg p-4 relative">
                                {formData.parties.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => removeParty(index)}
                                        className="absolute top-2 right-2 p-1 text-red-600 hover:bg-red-50 rounded"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Name</label>
                                        <input
                                            type="text"
                                            value={party.name}
                                            onChange={(e) => handlePartyChange(index, 'name', e.target.value)}
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-black"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Role</label>
                                        <input
                                            type="text"
                                            value={party.role}
                                            onChange={(e) => handlePartyChange(index, 'role', e.target.value)}
                                            placeholder="e.g., Defendant, Plaintiff"
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-black"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Address</label>
                                        <input
                                            type="text"
                                            value={party.address}
                                            onChange={(e) => handlePartyChange(index, 'address', e.target.value)}
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-black"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Contact</label>
                                        <input
                                            type="text"
                                            value={party.contact}
                                            onChange={(e) => handlePartyChange(index, 'contact', e.target.value)}
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-black"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Witnesses */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Witness Information</h3>
                        <button
                            type="button"
                            onClick={addWitness}
                            className="flex items-center gap-2 px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm"
                        >
                            <Plus className="w-4 h-4" />
                            Add Witness
                        </button>
                    </div>

                    <div className="space-y-4">
                        {formData.witnesses.map((witness, index) => (
                            <div key={index} className="border border-gray-200 rounded-lg p-4 relative">
                                {formData.witnesses.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => removeWitness(index)}
                                        className="absolute top-2 right-2 p-1 text-red-600 hover:bg-red-50 rounded"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Name</label>
                                        <input
                                            type="text"
                                            value={witness.name}
                                            onChange={(e) => handleWitnessChange(index, 'name', e.target.value)}
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-black"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Contact</label>
                                        <input
                                            type="text"
                                            value={witness.contact}
                                            onChange={(e) => handleWitnessChange(index, 'contact', e.target.value)}
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-black"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Relationship</label>
                                        <input
                                            type="text"
                                            value={witness.relationship}
                                            onChange={(e) => handleWitnessChange(index, 'relationship', e.target.value)}
                                            placeholder="e.g., Eyewitness, Expert"
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-black"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Court Information */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Court / Legal Information</h3>

                    <div className="mb-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                name="inCourt"
                                checked={formData.inCourt}
                                onChange={handleChange}
                                className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                            />
                            <span className="text-sm font-semibold text-gray-700">Is the matter already in court?</span>
                        </label>
                    </div>

                    {formData.inCourt && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Court Name *</label>
                                <input
                                    type="text"
                                    name="courtName"
                                    value={formData.courtName}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-black"
                                    required={formData.inCourt}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Court Location *</label>
                                <input
                                    type="text"
                                    name="courtLocation"
                                    value={formData.courtLocation}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-black"
                                    required={formData.inCourt}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Case Number *</label>
                                <input
                                    type="text"
                                    name="caseNumber"
                                    value={formData.caseNumber}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-black"
                                    required={formData.inCourt}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Presiding Judge</label>
                                <input
                                    type="text"
                                    name="presidingJudge"
                                    value={formData.presidingJudge}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-black"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Next Court Date</label>
                                <input
                                    type="date"
                                    name="nextCourtDate"
                                    value={formData.nextCourtDate}
                                    onChange={handleChange}
                                    onClick={(e) => e.target.showPicker?.()}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-black"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Previous Court Orders (if any)</label>
                                <textarea
                                    name="previousOrders"
                                    value={formData.previousOrders}
                                    onChange={handleChange}
                                    rows="3"
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-black"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Submit Buttons */}
                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={() => navigate(`${rolePrefix}/cases/${id}`)}
                        className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isSaving}
                        className={`flex-1 px-4 py-2.5 text-white font-semibold rounded-lg transition-colors ${isSaving ? 'bg-orange-400 cursor-not-allowed' : 'bg-orange-600 hover:bg-orange-700'
                            }`}
                    >
                        {isSaving ? 'Saving Changes...' : 'Save Changes'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default EditCaseForm;
