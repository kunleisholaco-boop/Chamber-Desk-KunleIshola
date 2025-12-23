import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle, AlertCircle, Upload, Plus, X } from 'lucide-react';
import Alert from '../Alert';
import API_BASE_URL from '../../config/api';

const AddCaseForm = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const clientId = searchParams.get('clientId');

    // Get user role from localStorage
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userRole = user.role || 'Admin';
    const rolePrefix = userRole === 'HOC' ? '/hoc' : '/admin';

    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [clientName, setClientName] = useState('');
    const [allClients, setAllClients] = useState([]);
    const [selectedClient, setSelectedClient] = useState('');
    const [inCourt, setInCourt] = useState(false);

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
        if (clientId) {
            fetchClientName();
        } else {
            // If no clientId, fetch all clients for dropdown
            fetchAllClients();
        }
    }, [clientId]);

    const fetchClientName = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/api/clients/${clientId}`, {
                headers: { 'x-auth-token': token }
            });

            if (response.ok) {
                const data = await response.json();
                setClientName(data.name);
            }
        } catch (err) {
            console.error('Error fetching client:', err);
        }
    };

    const fetchAllClients = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/api/clients`, {
                headers: { 'x-auth-token': token }
            });

            if (response.ok) {
                const data = await response.json();
                setAllClients(data);
            }
        } catch (err) {
            console.error('Error fetching clients:', err);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value
        });

        if (name === 'inCourt') {
            setInCourt(checked);
        }
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
        setIsLoading(true);
        setMessage({ type: '', text: '' });

        // Use clientId from URL if present, otherwise use selectedClient from dropdown
        const finalClientId = clientId || selectedClient;

        if (!finalClientId) {
            setMessage({ type: 'error', text: 'Please select a client' });
            setIsLoading(false);
            return;
        }

        try {
            const token = localStorage.getItem('token');

            const caseData = {
                clientId: finalClientId,
                ...formData
            };

            const response = await fetch(`${API_BASE_URL}/api/cases`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token
                },
                body: JSON.stringify(caseData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.msg || 'Failed to create case');
            }

            setMessage({ type: 'success', text: 'Case created successfully!' });

            // Navigate appropriately based on where user came from
            setTimeout(() => {
                if (clientId) {
                    navigate(`${rolePrefix}/clients/${clientId}`);
                } else {
                    navigate(`${rolePrefix}/cases`);
                }
            }, 1500);

        } catch (err) {
            setMessage({ type: 'error', text: err.message });
        } finally {
            setIsLoading(false);
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

    return (
        <div className='p-6'>
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={() => navigate(clientId ? `${rolePrefix}/clients/${clientId}` : `${rolePrefix}/cases`)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Add New Case</h2>
                    {clientName && (
                        <p className="text-sm text-gray-600 mt-1">For client: {clientName}</p>
                    )}
                </div>
            </div>

            <Alert
                type={message.type}
                message={message.text}
            />

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Client Selection - Only show when adding from Cases page (no clientId) */}
                {!clientId && (
                    <div className="bg-orange-50 rounded-xl shadow-sm border border-orange-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Client</h3>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Which client does this case belong to? *
                            </label>
                            <select
                                value={selectedClient}
                                onChange={(e) => setSelectedClient(e.target.value)}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-black"
                                required
                            >
                                <option value="">Select a client</option>
                                {allClients.map((client) => (
                                    <option key={client._id} value={client._id}>
                                        {client.name} - {client.email}
                                    </option>
                                ))}
                            </select>
                            <p className="text-xs text-gray-600 mt-2">
                                Select the client this case is for from the dropdown above
                            </p>
                        </div>
                    </div>
                )}

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
                                    min={new Date().toISOString().split('T')[0]}
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
                        onClick={() => navigate(clientId ? `${rolePrefix}/clients/${clientId}` : `${rolePrefix}/cases`)}
                        className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className={`flex-1 px-4 py-2.5 text-white font-semibold rounded-lg transition-colors ${isLoading ? 'bg-orange-400 cursor-not-allowed' : 'bg-orange-600 hover:bg-orange-700'
                            }`}
                    >
                        {isLoading ? 'Creating Case...' : 'Create Case'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AddCaseForm;
