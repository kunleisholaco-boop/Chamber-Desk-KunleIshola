import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ArrowLeft } from 'lucide-react';

// This component mirrors the style of AddClientForm.jsx but is for creating a fund requisition.
// It will be used as a full page (e.g., routed to /admin/funds/request) instead of a modal.

const FundRequisitionForm = () => {
    const navigate = useNavigate();

    // Detect if we're in HOC or Admin context
    const isHOC = window.location.pathname.includes('/hoc/');
    const themeColor = isHOC ? 'purple' : 'orange';

    // Form state
    const [requisitionType, setRequisitionType] = useState(''); // Type of Expense
    const [selectedCase, setSelectedCase] = useState('');
    const [selectedClient, setSelectedClient] = useState('');
    const [urgency, setUrgency] = useState('Normal');
    const [purpose, setPurpose] = useState('');
    const [amount, setAmount] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // Data for dropdowns
    const [cases, setCases] = useState([]);
    const [clients, setClients] = useState([]);

    useEffect(() => {
        fetchCases();
        fetchClients();
    }, []);

    const fetchCases = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/api/cases', {
                headers: { 'x-auth-token': token }
            });
            if (res.ok) {
                const data = await res.json();

                if (isHOC) {
                    const user = JSON.parse(localStorage.getItem('user'));
                    const userId = user?.id;
                    const assignedCases = data.filter(caseItem =>
                        caseItem.assignedTo && (
                            (typeof caseItem.assignedTo === 'string' && caseItem.assignedTo === userId) ||
                            (caseItem.assignedTo._id === userId)
                        )
                    );
                    setCases(assignedCases);
                } else {
                    setCases(data);
                }
            }
        } catch (err) {
            console.error('Error fetching cases', err);
        }
    };

    const fetchClients = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/api/clients', {
                headers: { 'x-auth-token': token }
            });
            if (res.ok) {
                const data = await res.json();
                setClients(data);
            }
        } catch (err) {
            console.error('Error fetching clients', err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setMessage({ type: '', text: '' });

        const payload = {
            type: requisitionType,
            caseId: selectedCase || undefined,
            clientId: selectedClient || undefined,
            urgency,
            purpose,
            amount: Number(amount)
        };

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/api/funds', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                setMessage({ type: 'success', text: 'Fund requisition created successfully!' });
                // Redirect back to list after a short delay
                const redirectPath = isHOC ? '/hoc/funds' : '/admin/funds';
                setTimeout(() => navigate(redirectPath), 1500);
            } else {
                const errData = await res.json();
                setMessage({ type: 'error', text: errData.msg || 'Failed to create requisition' });
            }
        } catch (err) {
            setMessage({ type: 'error', text: err.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Helper to decide whether to show extra selector fields
    const showCasePicker = requisitionType === 'Case-Related' || requisitionType === 'Court Filing';
    const showClientPicker = requisitionType === 'Client Meeting';

    return (
        <div className={isHOC ? 'p-6' : ''}>
            <div className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-lg">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center text-gray-600 hover:text-gray-800 mb-4"
                >
                    <ArrowLeft className="w-5 h-5 mr-1" />
                    Back
                </button>

                <h2 className="text-2xl font-bold text-gray-900 mb-6">Request Funds</h2>

                {message.text && (
                    <div className={`mb-4 p-3 rounded ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* 1. Requisition Type */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Requisition Type (Type of Expense)</label>
                        <select
                            value={requisitionType}
                            onChange={(e) => setRequisitionType(e.target.value)}
                            className={`w-full text-black border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-${themeColor}-500`}
                            required
                        >
                            <option value="">Select expense type…</option>
                            <option value="Case-Related">Case-Related</option>
                            <option value="Court Filing">Court Filing</option>
                            <option value="Client Meeting">Client Meeting</option>
                            <option value="Logistics / Transport">Logistics / Transport</option>
                            <option value="Investigation / Research">Investigation / Research</option>
                            <option value="Office Supplies">Office Supplies</option>
                            <option value="Administrative">Administrative</option>
                        </select>
                    </div>

                    {/* Conditional Case Picker */}
                    {showCasePicker && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Select Case</label>
                            <select
                                value={selectedCase}
                                onChange={(e) => setSelectedCase(e.target.value)}
                                className={`w-full text-black border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-${themeColor}-500`}
                                required
                            >
                                <option value="">Select a case…</option>
                                {cases.map((c) => (
                                    <option key={c._id} value={c._id}>
                                        {c.caseTitle || c.title || c._id}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Conditional Client Picker */}
                    {showClientPicker && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Select Client</label>
                            <select
                                value={selectedClient}
                                onChange={(e) => setSelectedClient(e.target.value)}
                                className={`w-full text-black border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-${themeColor}-500`}
                                required
                            >
                                <option value="">Select a client…</option>
                                {clients.map((c) => (
                                    <option key={c._id} value={c._id}>
                                        {c.name} ({c.email})
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* 2. Urgency Level */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Urgency Level</label>
                        <select
                            value={urgency}
                            onChange={(e) => setUrgency(e.target.value)}
                            className={`w-full text-black border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-${themeColor}-500`}
                        >
                            <option value="Normal">Normal</option>
                            <option value="Urgent">Urgent</option>
                            <option value="Very Urgent">Very Urgent</option>
                        </select>
                    </div>

                    {/* 3. Purpose of Requisition */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Purpose of Requisition</label>
                        <textarea
                            value={purpose}
                            onChange={(e) => setPurpose(e.target.value)}
                            rows={4}
                            className={`w-full text-black border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-${themeColor}-500`}
                            placeholder="Explain why the funds are needed..."
                            required
                        />
                    </div>

                    {/* 4. Amount Needed */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Amount Needed (₦)</label>
                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className={`w-full border text-black border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-${themeColor}-500`}
                            required
                        />
                    </div>

                    {/* Notice */}
                    <p className="text-sm text-gray-600 italic">
                        Please note: funds will be disbursed to the Admin Officer 24 hrs after approval.
                    </p>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className={`flex items-center justify-center w-full py-2.5 bg-${themeColor}-600 text-white font-semibold rounded-lg hover:bg-${themeColor}-700 transition-colors disabled:opacity-50`}
                    >
                        {isSubmitting ? 'Submitting...' : <><Plus className="w-5 h-5 mr-2" />Submit Request</>}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default FundRequisitionForm;
